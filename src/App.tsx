/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf,
  AlertTriangle,
  ShieldCheck,
  CloudRain,
  MessageSquare,
  History,
  Sparkles,
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Trash2,
  Download,
  Search,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Calendar,
  ArrowRight,
  Eye,
  AlertCircle,
  HelpCircle,
  FileText,
  Database,
  Layers,
  Send,
  Sliders,
  ChevronDown,
  User,
  Lock,
  Mail,
  LogOut,
  UserPlus,
  LogIn,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export type TabType = 'dashboard' | 'detect' | 'recommendations' | 'weather' | 'chat' | 'history' | 'login' | 'register' | 'landing';

export const PROTECTED_TABS: TabType[] = ['dashboard', 'detect', 'recommendations', 'weather', 'chat', 'history'];
export const PUBLIC_TABS: TabType[] = ['landing', 'login', 'register'];

export const getTabFromPath = (path: string): TabType => {
  const clean = path.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/dashboard') return 'dashboard';
  if (clean === '/detection' || clean === '/detect') return 'detect';
  if (clean === '/recommendations' || clean === '/prescription') return 'recommendations';
  if (clean === '/weather') return 'weather';
  if (clean === '/chatbot' || clean === '/chat') return 'chat';
  if (clean === '/history') return 'history';
  if (clean === '/login' || clean === '/signin') return 'login';
  if (clean === '/register' || clean === '/signup') return 'register';
  return 'landing';
};

export const getPathFromTab = (tab: TabType): string => {
  switch (tab) {
    case 'dashboard':
      return '/dashboard';
    case 'detect':
      return '/detection';
    case 'recommendations':
      return '/recommendations';
    case 'weather':
      return '/weather';
    case 'chat':
      return '/chatbot';
    case 'history':
      return '/history';
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'landing':
    default:
      return '/';
  }
};

// Types
interface DiseaseDiagnosis {
  crop: string;
  disease: string;
  scientificName: string;
  confidence: number;
  severity: 'None (Healthy)' | 'Low' | 'Moderate' | 'High' | 'Severe';
  isHealthy: boolean;
  affectedParts: string[];
  symptoms: string[];
  visualIndicators: string[];
  immediateAdvice: string;
  serviceUsed: string;
}

interface RecommendationData {
  summary: string;
  immediateSteps: string[];
  organicRemedies: Array<{
    title: string;
    preparation: string;
    application: string;
    effectiveness: string;
  }>;
  chemicalControls: Array<{
    name: string;
    dosage: string;
    withholdingPeriod: string;
    safetyNotes: string;
  }>;
  preventivePractices: string[];
  prognosis: {
    recoveryRate: string;
    expectedDuration: string;
    yieldImpact: string;
  };
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
}

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeedKmH: number;
  condition: string;
  description: string;
  icon: string;
  rainProbability: number;
  soilMoistureEstimate: 'Dry' | 'Optimal' | 'Saturated';
  agriculturalAdvisories: {
    sprayingRating: 'Excellent' | 'Favorable' | 'Unfavorable' | 'Hazardous';
    sprayingAdvice: string;
    fungalDiseaseRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
    fungalRiskReason: string;
    irrigationAdvice: string;
    fieldWorkRecommendation: string;
  };
  forecast: Array<{
    day: string;
    tempMin: number;
    tempMax: number;
    condition: string;
    rainChance: number;
    farmingTip: string;
  }>;
  dataSource: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface DetectionHistoryItem {
  id: number;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string;
  recommendations: string;
  image_url: string;
  weather_context?: string;
  created_at: string;
}

// Sample Diseased Leaves for 1-Click Verification / Testing
const SAMPLE_LEAF_IMAGES = [
  {
    name: 'Tomato Late Blight',
    crop: 'Tomato',
    diseaseHint: 'Late Blight',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
    description: 'Dark water-soaked irregular spots on tomato foliage with white mold under leaf',
  },
  {
    name: 'Potato Early Blight',
    crop: 'Potato',
    diseaseHint: 'Early Blight',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    description: 'Concentric circular rings creating target-board lesions on older leaves',
  },
  {
    name: 'Corn Rust (Maize)',
    crop: 'Corn (Maize)',
    diseaseHint: 'Common Rust',
    url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    description: 'Cinnamon powdery pustules scattered across maize leaf blades',
  },
  {
    name: 'Healthy Rice Leaf',
    crop: 'Rice',
    diseaseHint: 'Healthy',
    url: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
    description: 'Vigorous emerald-green leaf blade with pristine veins and zero lesions',
  },
];

export default function App() {
  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [authBannerMessage, setAuthBannerMessage] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('landing');

  // System & DB Status
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);

  // FEATURE 1: Plant Disease Detection States
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_LEAF_IMAGES[0].url);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cropHint, setCropHint] = useState<string>('Tomato');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiseaseDiagnosis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FEATURE 2: AI Recommendations States
  const [recCrop, setRecCrop] = useState<string>('Tomato');
  const [recDisease, setRecDisease] = useState<string>('Late Blight (Phytophthora infestans)');
  const [recSeverity, setRecSeverity] = useState<string>('High');
  const [recContext, setRecContext] = useState<string>('Open field tomato cultivation during humid monsoon period');
  const [isGeneratingRecs, setIsGeneratingRecs] = useState<boolean>(false);
  const [recommendationsData, setRecommendationsData] = useState<RecommendationData | null>(null);
  const [recError, setRecError] = useState<string | null>(null);

  // FEATURE 3: Weather Advisory States
  const [weatherCity, setWeatherCity] = useState<string>('Hyderabad');
  const [searchCityInput, setSearchCityInput] = useState<string>('Hyderabad');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // FEATURE 4: Farmer Chatbot States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Namaste / Hello Farmer! 🌾 I am your **Smart AI Crop Doctor** agricultural specialist.

I can help you diagnose crop conditions, suggest organic biopesticides, compute safe chemical dosages, recommend NPK fertilizer schedules, and guide weather-safe spraying windows.

How can I assist your farm today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInputMessage, setUserInputMessage] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // FEATURE 5: Detection History States
  const [historyList, setHistoryList] = useState<DetectionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyFilterCrop, setHistoryFilterCrop] = useState<string>('All');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');
  const [viewHistoryItem, setViewHistoryItem] = useState<DetectionHistoryItem | null>(null);
  const [historyNotification, setHistoryNotification] = useState<string | null>(null);

  // Initial Data Fetching & Authentication Session Verification
  useEffect(() => {
    const initSession = async () => {
      setIsAuthChecking(true);
      const initialPathTab = getTabFromPath(window.location.pathname);
      const savedToken = localStorage.getItem('crop_doctor_token');

      const handleUnauthenticatedEntry = () => {
        localStorage.removeItem('crop_doctor_token');
        localStorage.removeItem('crop_doctor_user');
        setUser(null);
        setToken(null);
        if (PROTECTED_TABS.includes(initialPathTab)) {
          setAuthBannerMessage('Please sign in or create an account to access this feature.');
          window.history.replaceState({ tab: 'login' }, '', '/login');
          setActiveTab('login');
        } else {
          window.history.replaceState({ tab: initialPathTab }, '', getPathFromTab(initialPathTab));
          setActiveTab(initialPathTab);
        }
      };

      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              setUser(data.user);
              setToken(savedToken);
              fetchDetectionHistory(savedToken);
              fetchWeather('Hyderabad', savedToken);
              const destTab = PUBLIC_TABS.includes(initialPathTab) ? 'dashboard' : initialPathTab;
              window.history.replaceState({ tab: destTab }, '', getPathFromTab(destTab));
              setActiveTab(destTab);
            } else {
              handleUnauthenticatedEntry();
            }
          } else {
            handleUnauthenticatedEntry();
          }
        } catch {
          // If server temporarily unreachable, check cached user
          const savedUser = localStorage.getItem('crop_doctor_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              setUser(parsed);
              setToken(savedToken);
              fetchDetectionHistory(savedToken);
              fetchWeather('Hyderabad', savedToken);
              const destTab = PUBLIC_TABS.includes(initialPathTab) ? 'dashboard' : initialPathTab;
              window.history.replaceState({ tab: destTab }, '', getPathFromTab(destTab));
              setActiveTab(destTab);
            } catch {
              handleUnauthenticatedEntry();
            }
          } else {
            handleUnauthenticatedEntry();
          }
        }
      } else {
        handleUnauthenticatedEntry();
      }
      setIsAuthChecking(false);
    };

    initSession();
    fetchHealthAndDbStatus();
  }, []);

  // Browser Back/Forward navigation listener (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const targetTab = getTabFromPath(window.location.pathname);
      const savedToken = localStorage.getItem('crop_doctor_token');
      // If unauthenticated (no user state and no token in localStorage) and trying to access a protected page
      if (!user && !savedToken && PROTECTED_TABS.includes(targetTab)) {
        window.history.replaceState({ tab: 'landing' }, '', '/');
        setActiveTab('landing');
        setAuthBannerMessage('Authentication required. Please sign in to access protected features.');
      } else {
        setActiveTab(targetTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Protected route guard: auto-redirect unauthenticated users attempting to access protected tabs
  useEffect(() => {
    if (!isAuthChecking && !user && PROTECTED_TABS.includes(activeTab)) {
      setAuthBannerMessage('Please sign in or create an account to access this feature.');
      window.history.replaceState({ tab: 'login' }, '', '/login');
      setActiveTab('login');
    }
  }, [user, activeTab, isAuthChecking]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatSending]);

  const fetchHealthAndDbStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.database);
        setSystemHealthy(true);
      }
    } catch (err) {
      console.warn('Health check warning:', err);
      setSystemHealthy(false);
    }
  };

  const fetchWeather = async (city: string, authToken?: string) => {
    const currentToken = authToken || token || localStorage.getItem('crop_doctor_token');
    if (!currentToken) return;
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(city)}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWeatherData(data.data);
        setWeatherCity(city);
      } else {
        setWeatherError(data.error || 'Failed to fetch weather data.');
      }
    } catch {
      setWeatherError('Weather network error. Please try again.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const fetchDetectionHistory = async (authToken?: string) => {
    setIsLoadingHistory(true);
    try {
      const currentToken = authToken || token || localStorage.getItem('crop_doctor_token');
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const res = await fetch('/api/detections', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.detections)) {
        setHistoryList(data.detections);
        if (data.database) {
          setDbStatus(data.database);
        }
      }
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // -------------------------------------------------------------
  const handleTabClick = (tabId: TabType) => {
    // If user is not authenticated and clicks on any protected core feature
    if (!user && PROTECTED_TABS.includes(tabId)) {
      setAuthBannerMessage('Please sign in or create an account to access this feature.');
      window.history.pushState({ tab: 'login' }, '', '/login');
      setActiveTab('login');
      return;
    }
    setAuthBannerMessage(null);
    window.history.pushState({ tab: tabId }, '', getPathFromTab(tabId));
    setActiveTab(tabId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Required field validation
    if (!loginEmail.trim()) {
      setLoginError('Email address is required.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Password is required.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token && data.user) {
        localStorage.setItem('crop_doctor_token', data.token);
        localStorage.setItem('crop_doctor_user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        setLoginPassword('');
        setLoginError(null);
        setAuthBannerMessage(null);
        fetchDetectionHistory(data.token);
        fetchWeather('Hyderabad', data.token);
        window.history.pushState({ tab: 'dashboard' }, '', '/dashboard');
        setActiveTab('dashboard');
      } else {
        setLoginError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch {
      setLoginError('Network error during login. Please check connection and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    // Required field validation
    if (!regName.trim()) {
      setRegError('Full Name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Email address is required.');
      return;
    }
    if (!regPassword) {
      setRegError('Password is required.');
      return;
    }
    if (!regConfirmPassword) {
      setRegError('Confirm Password is required.');
      return;
    }

    // Valid email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setRegError('Please provide a valid email address (e.g. name@example.com).');
      return;
    }

    // Password validation (min 6 characters)
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    // Confirm password matching
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          confirmPassword: regConfirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess('Registration successful! Redirecting to login...');
        setLoginEmail(regEmail.trim());
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setTimeout(() => {
          setRegSuccess(null);
          window.history.pushState({ tab: 'login' }, '', '/login');
          setActiveTab('login');
        }, 1500);
      } else {
        setRegError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setRegError('Network connection issue during registration. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('crop_doctor_token');
    localStorage.removeItem('crop_doctor_user');
    setUser(null);
    setToken(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError(null);
    setAuthBannerMessage('You have logged out successfully.');
    // Redirect to Landing Page and replace history state so browser Back button cannot navigate back into protected views
    window.history.replaceState({ tab: 'landing' }, '', '/');
    setActiveTab('landing');
  };

  const handleFillDemoCredentials = () => {
    setLoginEmail('farmer@cropdoctor.org');
    setLoginPassword('Password123!');
    setLoginError(null);
  };

  // -------------------------------------------------------------
  // FEATURE 1 HANDLER: Plant Disease Detection
  // -------------------------------------------------------------
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetectionError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Image type
    if (!file.type.startsWith('image/')) {
      setDetectionError('Invalid file type! Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    // Validation: Max size 10MB
    if (file.size > 10 * 1024 * 1024) {
      setDetectionError('File size exceeds 10MB limit! Please upload a smaller photo.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_LEAF_IMAGES[0]) => {
    setSelectedImage(sample.url);
    setImageFile(null);
    setCropHint(sample.crop);
    setDetectionError(null);
  };

  const handleRunDetection = async () => {
    if (!selectedImage) {
      setDetectionError('Please upload or select a plant leaf image first.');
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);

    try {
      const currentToken = token || localStorage.getItem('crop_doctor_token');
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentToken) {
        reqHeaders['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          image: selectedImage,
          mimeType: imageFile?.type || 'image/jpeg',
          cropHint,
          autoSave: true,
        }),
      });

      const data = await res.json();

      if (data.success && data.diagnosis) {
        setCurrentDiagnosis(data.diagnosis);
        // Pre-fill recommendations form
        setRecCrop(data.diagnosis.crop);
        setRecDisease(data.diagnosis.disease);
        setRecSeverity(data.diagnosis.severity);

        // Refresh detection history so the new record shows immediately
        fetchDetectionHistory(currentToken || undefined);
      } else {
        setDetectionError(data.error || 'Unable to classify disease. Please try another image.');
      }
    } catch {
      setDetectionError('Network or server error during detection. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  // -------------------------------------------------------------
  // FEATURE 2 HANDLER: AI Recommendations
  // -------------------------------------------------------------
  const handleGenerateRecommendations = async (overrideCrop?: string, overrideDisease?: string) => {
    const cropToUse = overrideCrop || recCrop;
    const diseaseToUse = overrideDisease || recDisease;

    if (!cropToUse || !diseaseToUse) {
      setRecError('Crop and disease name are required.');
      return;
    }

    setIsGeneratingRecs(true);
    setRecError(null);

    try {
      const currentToken = token || localStorage.getItem('crop_doctor_token');
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentToken) {
        reqHeaders['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          crop: cropToUse,
          disease: diseaseToUse,
          severity: recSeverity,
          context: recContext,
        }),
      });

      const data = await res.json();
      if (data.success && data.recommendations) {
        setRecommendationsData(data.recommendations);
      } else {
        setRecError(data.error || 'Failed to generate AI recommendations.');
      }
    } catch (err) {
      setRecError('Error contacting Google Gemini API. Please check your connection.');
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  const handleTransferToRecommendations = (diag: DiseaseDiagnosis) => {
    setRecCrop(diag.crop);
    setRecDisease(diag.disease);
    setRecSeverity(diag.severity);
    setActiveTab('recommendations');
    handleGenerateRecommendations(diag.crop, diag.disease);
  };

  // -------------------------------------------------------------
  // FEATURE 3 HANDLER: Weather Search
  // -------------------------------------------------------------
  const handleWeatherSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCityInput.trim()) {
      fetchWeather(searchCityInput.trim());
    }
  };

  // -------------------------------------------------------------
  // FEATURE 4 HANDLER: Farmer Chatbot
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || userInputMessage).trim();
    if (!messageText || isChatSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setUserInputMessage('');
    setIsChatSending(true);

    try {
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const currentToken = token || localStorage.getItem('crop_doctor_token');
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentToken) {
        reqHeaders['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          messages: apiMessages,
          cropContext: currentDiagnosis ? `${currentDiagnosis.crop} with ${currentDiagnosis.disease}` : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        const fallbackMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'I apologize, but I encountered a temporary network delay. Please repeat your agriculture question.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Connection problem. Please ensure the backend is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatSending(false);
    }
  };

  // -------------------------------------------------------------
  // FEATURE 5 HANDLER: Delete or Clear History
  // -------------------------------------------------------------
  const handleDeleteHistoryItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const currentToken = token || localStorage.getItem('crop_doctor_token');
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const res = await fetch(`/api/detections/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((item) => item.id !== id));
        setHistoryNotification(`Record #${id} successfully removed from MySQL.`);
        setTimeout(() => setHistoryNotification(null), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all detection records from the database?')) {
      return;
    }
    try {
      const currentToken = token || localStorage.getItem('crop_doctor_token');
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const res = await fetch('/api/detections', { method: 'DELETE', headers });
      if (res.ok) {
        setHistoryList([]);
        setHistoryNotification('All detection history cleared.');
        setTimeout(() => setHistoryNotification(null), 3000);
      }
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  const handleExportCSV = () => {
    if (historyList.length === 0) return;
    const headers = ['ID', 'Crop', 'Disease', 'Confidence', 'Severity', 'Symptoms', 'Immediate Recommendation', 'Date'];
    const rows = historyList.map((item) => [
      item.id,
      `"${item.crop}"`,
      `"${item.disease}"`,
      `${(item.confidence * 100).toFixed(1)}%`,
      `"${item.severity}"`,
      `"${(item.symptoms || '').replace(/"/g, '""')}"`,
      `"${(item.recommendations || '').replace(/"/g, '""')}"`,
      `"${new Date(item.created_at).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_crop_doctor_detections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered History
  const filteredHistory = historyList.filter((item) => {
    const matchesCrop = historyFilterCrop === 'All' || item.crop.toLowerCase().includes(historyFilterCrop.toLowerCase());
    const matchesSearch =
      !historySearchTerm ||
      item.crop.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      item.disease.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      (item.symptoms && item.symptoms.toLowerCase().includes(historySearchTerm.toLowerCase()));
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ============================================================== */}
      {/* HEADER / NAVIGATION BAR                                        */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={() => handleTabClick(user ? 'dashboard' : 'landing')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
                <Leaf className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                    Smart AI <span className="text-emerald-600">Crop Doctor</span>
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-slate-500 font-medium">
                  Agriculture Intelligence Platform
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-1">
              {user && (
                // Authenticated Navigation Only
                [
                  { id: 'dashboard', label: 'Dashboard', icon: Layers },
                  { id: 'detect', label: 'Disease Detection', icon: Camera },
                  { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
                  { id: 'weather', label: 'Weather Advisory', icon: CloudRain },
                  { id: 'chat', label: 'Farmer Chatbot', icon: MessageSquare },
                  { id: 'history', label: 'Detection History', icon: History },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id as any)}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })
              )}
            </nav>

            {/* Right Header: Auth Actions */}
            <div className="flex items-center space-x-2.5">
              {/* Authenticated User Status or Login/Register Links */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-[120px] truncate">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Log out of session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAuthBannerMessage(null);
                      handleTabClick('login');
                    }}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthBannerMessage(null);
                      handleTabClick('register');
                    }}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar - Only for Authenticated Users */}
        {user && (
          <div className="lg:hidden border-t border-slate-100 overflow-x-auto py-2 px-4 flex items-center space-x-2 scrollbar-none">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'detect', label: 'Disease Detection', icon: Camera },
              { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
              { id: 'weather', label: 'Weather Advisory', icon: CloudRain },
              { id: 'chat', label: 'Farmer Chatbot', icon: MessageSquare },
              { id: 'history', label: 'Detection History', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`whitespace-nowrap flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="whitespace-nowrap flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAuthChecking ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Verifying session...</p>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* TAB 1: DASHBOARD / OVERVIEW                                    */}
            {/* ============================================================== */}
            {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 text-white p-6 sm:p-8 shadow-md">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Precision Agriculture • AI Intelligence Platform</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {user ? `Welcome back, ${user.name}!` : 'Protect Your Crops with AI-Powered Intelligence'}
                </h1>
                <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                  Smart AI Crop Doctor combines Hugging Face free plant disease inference, Google Gemini agronomist
                  intelligence, OpenWeather microclimate forecasting, and MySQL persistence into one lightweight tool
                  for farmers and students.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('detect')}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-md hover:bg-emerald-50 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Upload Leaf & Scan Disease</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-900/40 text-white font-semibold text-sm border border-emerald-400/30 hover:bg-emerald-900/60 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Ask Farmer Chatbot</span>
                  </button>
                </div>
              </div>
              {/* Background leaf graphic */}
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                <Leaf className="w-96 h-96" />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Total Scans</span>
                  <History className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{historyList.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Logged in MySQL</div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>AI Diagnostics</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-600">Free Tier</div>
                <div className="text-[11px] text-slate-500 mt-1">Gemini & Hugging Face</div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Weather Advisory</span>
                  <CloudRain className="w-4 h-4 text-sky-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {weatherData ? `${weatherData.temperature}°C` : '28°C'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {weatherData?.location || 'Hyderabad'} • Spray safe
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Database Storage</span>
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900 truncate">
                  MySQL Active
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {dbStatus?.database || 'smart_ai_crop_doctor'} • Online
                </div>
              </div>
            </div>

            {/* Core 5 Features Overview Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <span>The 5 Core Features</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    Core Capabilities
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Feature 1 */}
                <div
                  onClick={() => setActiveTab('detect')}
                  className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Feature 1</div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700">
                        Plant Disease Detection
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Upload or photograph a leaf to classify diseases via Hugging Face free inference API & Gemini
                        Vision heuristics with confidence scores.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-600">
                    <span>Try Leaf Scanner</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Feature 2 */}
                <div
                  onClick={() => setActiveTab('recommendations')}
                  className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Feature 2</div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700">
                        AI Recommendations
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Google Gemini free API generates actionable prescriptions: organic remedies, chemical dosages,
                        dilution ratios, and safety withholding periods.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-amber-600">
                    <span>View Prescriptions</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Feature 3 */}
                <div
                  onClick={() => setActiveTab('weather')}
                  className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CloudRain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Feature 3</div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-sky-700">
                        Weather Advisory
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        OpenWeather free API integration with agro-meteorological advisories: safe pesticide spray
                        windows, fungal spore incubation alerts, and irrigation tips.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-sky-600">
                    <span>Check Spray Advisory</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Feature 4 */}
                <div
                  onClick={() => setActiveTab('chat')}
                  className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Feature 4</div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700">
                        Farmer Chatbot
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Interactive conversational assistant powered by Google Gemini free API. Answers queries on pest
                        control, fertilizers, organic farming in multiple languages.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-purple-600">
                    <span>Start Chat</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Feature 5 */}
                <div
                  onClick={() => setActiveTab('history')}
                  className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Feature 5</div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-700">
                        Detection History (MySQL)
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Stores diagnosis, confidence, and recommendations in MySQL with full export, image previews, and
                        delete controls.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600">
                    <span>View Stored Scans ({historyList.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Detections Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Recent Crop Scans in Database</h3>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                >
                  <span>View All ({historyList.length})</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No detection records found. Click below to run your first crop disease test!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {historyList.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setViewHistoryItem(item);
                        setActiveTab('history');
                      }}
                      className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
                    >
                      <img
                        src={item.image_url || SAMPLE_LEAF_IMAGES[0].url}
                        alt={item.crop}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm truncate">{item.crop}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              item.severity === 'High' || item.severity === 'Severe'
                                ? 'bg-red-100 text-red-700'
                                : item.severity === 'None' || item.severity?.toLowerCase().includes('healthy')
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{item.disease}</p>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                          <span>{(item.confidence * 100).toFixed(0)}% confidence</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: FEATURE 1 - PLANT DISEASE DETECTION                     */}
        {/* ============================================================== */}
        {activeTab === 'detect' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <Camera className="w-6 h-6 text-emerald-600" />
                  <span>Plant Disease Detection</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Upload an image of a diseased or suspect leaf. The AI will classify the disease, compute confidence,
                  and record results to MySQL.
                </p>
              </div>

              {/* Inference Engine Indicator */}
              <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 self-start">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inference: Hugging Face Free API & Gemini Vision</span>
              </div>
            </div>

            {/* Error Banner */}
            {detectionError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <span className="font-bold">Notice: </span>
                  {detectionError}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Upload & Sample Selection */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                    <span>1. Upload Leaf Photo</span>
                    <span className="text-xs text-slate-400 font-normal">Max 10MB (JPEG/PNG/WEBP)</span>
                  </h3>

                  {/* Dropzone / Preview Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative border-2 border-dashed border-emerald-200 hover:border-emerald-500 rounded-xl overflow-hidden p-4 text-center cursor-pointer transition-colors bg-emerald-50/30 flex flex-col items-center justify-center min-h-[260px]"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {selectedImage ? (
                      <div className="relative w-full h-full flex flex-col items-center">
                        <img
                          src={selectedImage}
                          alt="Uploaded Leaf"
                          className="max-h-60 w-auto rounded-lg object-contain shadow-xs border border-slate-200"
                        />
                        <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-medium">
                          <RefreshCw className="w-3 h-3" />
                          <span>Click to change image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            Click to upload or drag & drop leaf image
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Supports high-res mobile & camera uploads</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Crop Hint Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Optional Crop Category Hint:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['Tomato', 'Potato', 'Corn (Maize)', 'Apple', 'Rice', 'Wheat', 'Grape', 'Pepper'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCropHint(c)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center truncate transition-colors ${
                            cropHint === c
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diagnostic Trigger Button */}
                  <button
                    onClick={handleRunDetection}
                    disabled={isDetecting || !selectedImage}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isDetecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing Leaf Pathology & Pathogens...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Run AI Plant Disease Detection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1-Click Sample Test Leaves */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Or Try 1-Click Sample Test Leaves:
                    </h4>
                    <span className="text-[11px] text-slate-400">Verified pathology photos</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {SAMPLE_LEAF_IMAGES.map((sample, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSample(sample)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedImage === sample.url
                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <img
                          src={sample.url}
                          alt={sample.name}
                          className="w-full h-16 rounded-lg object-cover mb-1.5"
                        />
                        <div className="font-bold text-slate-900 text-xs truncate">{sample.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{sample.crop}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Detection Results Card */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Diagnosis & Pathogen Report</span>
                      </h3>
                      {currentDiagnosis && (
                        <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                          MySQL Auto-Saved
                        </span>
                      )}
                    </div>

                    {!currentDiagnosis && !isDetecting && (
                      <div className="py-16 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Eye className="w-7 h-7" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No Diagnosis Yet</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Select a sample leaf image on the left or upload your own leaf photo, then click{' '}
                          <span className="font-semibold text-emerald-700">"Run AI Plant Disease Detection"</span>.
                        </p>
                      </div>
                    )}

                    {isDetecting && (
                      <div className="py-16 text-center space-y-4">
                        <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">Processing Leaf Image...</p>
                          <p className="text-xs text-slate-500">
                            1. Extracting visual symptom patterns
                            <br />
                            2. Querying Hugging Face Plant Inference API & Gemini Vision
                            <br />
                            3. Auto-storing results into MySQL database
                          </p>
                        </div>
                      </div>
                    )}

                    {currentDiagnosis && !isDetecting && (
                      <div className="space-y-5 pt-3">
                        {/* Primary Badge & Disease Name */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Target Crop: {currentDiagnosis.crop}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                currentDiagnosis.isHealthy
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : currentDiagnosis.severity === 'High' || currentDiagnosis.severity === 'Severe'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Severity: {currentDiagnosis.severity}
                            </span>
                          </div>

                          <h2 className="text-xl font-black text-slate-900">{currentDiagnosis.disease}</h2>

                          {currentDiagnosis.scientificName && (
                            <p className="text-xs text-slate-500 italic font-medium">
                              Scientific Pathogen: {currentDiagnosis.scientificName}
                            </p>
                          )}

                          {/* Confidence Gauge */}
                          <div className="pt-2">
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                              <span>Confidence Score</span>
                              <span>{(currentDiagnosis.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  currentDiagnosis.confidence > 0.85
                                    ? 'bg-emerald-500'
                                    : currentDiagnosis.confidence > 0.7
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${currentDiagnosis.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Observable Symptoms */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Observable Symptoms & Field Signs:</span>
                          </h4>
                          <ul className="space-y-1.5">
                            {currentDiagnosis.symptoms.map((sym, i) => (
                              <li
                                key={i}
                                className="text-xs text-slate-700 flex items-start space-x-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                                <span>{sym}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Visual Indicators */}
                        {currentDiagnosis.visualIndicators && currentDiagnosis.visualIndicators.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Visual Pathology Indicators:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {currentDiagnosis.visualIndicators.map((vi, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-100"
                                >
                                  {vi}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Immediate Farmer Advice */}
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                          <span className="font-extrabold flex items-center space-x-1 text-amber-800">
                            <Info className="w-3.5 h-3.5" />
                            <span>Immediate Action:</span>
                          </span>
                          <p>{currentDiagnosis.immediateAdvice}</p>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono">
                          Engine: {currentDiagnosis.serviceUsed}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transfer to Feature 2 */}
                  {currentDiagnosis && (
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleTransferToRecommendations(currentDiagnosis)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Full AI Prescription (Feature 2)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FEATURE 2 - AI RECOMMENDATIONS                          */}
        {/* ============================================================== */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <span>AI Crop Recommendations & Prescriptions</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Powered by the Google Gemini free API. Generates tailored organic and chemical interventions with
                  exact safety withholding periods.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg self-start">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Engine: Google Gemini Free API</span>
              </div>
            </div>

            {/* Config & Input Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Target Crop & Infection Parameters</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Crop Type</label>
                  <input
                    type="text"
                    value={recCrop}
                    onChange={(e) => setRecCrop(e.target.value)}
                    placeholder="e.g. Tomato, Potato, Corn"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Condition / Disease</label>
                  <input
                    type="text"
                    value={recDisease}
                    onChange={(e) => setRecDisease(e.target.value)}
                    placeholder="e.g. Late Blight, Rust, Powdery Mildew"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Observed Severity</label>
                  <select
                    value={recSeverity}
                    onChange={(e) => setRecSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Low">Low (Initial lesion signs)</option>
                    <option value="Moderate">Moderate (Spreading to lower foliage)</option>
                    <option value="High">High (Affecting stems and canopy)</option>
                    <option value="Severe">Severe (Critical yield emergency)</option>
                    <option value="None">None (Preventive Maintenance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Optional Field Context & Soil Notes:
                </label>
                <input
                  type="text"
                  value={recContext}
                  onChange={(e) => setRecContext(e.target.value)}
                  placeholder="e.g. Drip irrigated, clay loam soil, sudden monsoon humidity, flowering stage"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleGenerateRecommendations()}
                  disabled={isGeneratingRecs || !recCrop || !recDisease}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isGeneratingRecs ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Agronomist Prescription...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Gemini Recommendations</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {recError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{recError}</span>
              </div>
            )}

            {/* Prescription Content Display */}
            {recommendationsData ? (
              <div className="space-y-6">
                {/* Executive Summary & Immediate Steps */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        Prescription for {recCrop}
                      </span>
                      <h2 className="text-xl font-black text-slate-900">{recDisease}</h2>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print / Save Advisory</span>
                    </button>
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    {recommendationsData.summary}
                  </p>

                  {/* Immediate Steps */}
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Immediate Field Protocol (Next 24 Hours):</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {recommendationsData.immediateSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-start space-x-2.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Treatment Dual Cards: Organic vs Chemical */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Organic Remedies */}
                  <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                    <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-base border-b border-emerald-100 pb-2">
                      <Leaf className="w-5 h-5 text-emerald-600" />
                      <span>Organic & Biological Controls</span>
                    </div>

                    <div className="space-y-3">
                      {recommendationsData.organicRemedies.map((org, i) => (
                        <div key={i} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                          <div className="font-bold text-emerald-900 text-sm">{org.title}</div>
                          <div className="text-xs text-slate-700 space-y-1">
                            <p>
                              <strong className="text-slate-900">Preparation: </strong>
                              {org.preparation}
                            </p>
                            <p>
                              <strong className="text-slate-900">Application: </strong>
                              {org.application}
                            </p>
                            <p className="text-emerald-700 font-medium">
                              <strong>Efficacy: </strong>
                              {org.effectiveness}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chemical Controls */}
                  <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
                    <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-base border-b border-blue-100 pb-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <span>Chemical Controls & Active Ingredients</span>
                    </div>

                    <div className="space-y-3">
                      {recommendationsData.chemicalControls.map((chem, i) => (
                        <div key={i} className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-950 text-sm">{chem.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              PHI: {chem.withholdingPeriod}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 space-y-1">
                            <p>
                              <strong className="text-slate-900">Dosage Dilution: </strong>
                              {chem.dosage}
                            </p>
                            <p className="text-red-700 font-medium">
                              <strong>Safety & PPE: </strong>
                              {chem.safetyNotes}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prognosis & Do's / Don'ts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Prognosis Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Crop Prognosis & Recovery
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Recovery Rate</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {recommendationsData.prognosis.recoveryRate}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Stabilization Window</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {recommendationsData.prognosis.expectedDuration}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Untreated Yield Risk</span>
                        <span className="font-bold text-red-700 text-sm">
                          {recommendationsData.prognosis.yieldImpact}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Do's and Don'ts */}
                  <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Agronomic Do's & Don'ts Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                        <div className="font-bold text-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>DO:</span>
                        </div>
                        <ul className="space-y-1 text-slate-700">
                          {recommendationsData.dosAndDonts.dos.map((d, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-1.5">
                        <div className="font-bold text-red-800 flex items-center space-x-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>DO NOT:</span>
                        </div>
                        <ul className="space-y-1 text-slate-700">
                          {recommendationsData.dosAndDonts.donts.map((d, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="text-red-600 font-bold">•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Ready to Generate Prescriptions</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the button above to consult Google Gemini free API for structured biological and chemical
                  disease treatment recommendations.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: FEATURE 3 - WEATHER ADVISORY                            */}
        {/* ============================================================== */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <CloudRain className="w-6 h-6 text-sky-600" />
                  <span>Weather Advisory & Agricultural Microclimate</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Powered by the OpenWeather free API. Provides safe chemical spray windows, fungal infection risk, and
                  irrigation timing.
                </p>
              </div>

              {/* City Search Form */}
              <form onSubmit={handleWeatherSearchSubmit} className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchCityInput}
                    onChange={(e) => setSearchCityInput(e.target.value)}
                    placeholder="Search city or farming district..."
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 w-48 sm:w-60 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingWeather}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {isLoadingWeather ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </form>
            </div>

            {/* Quick Agricultural Belt Buttons */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-slate-400 font-bold shrink-0">Popular Farming Regions:</span>
              {['Hyderabad', 'Punjab', 'Iowa', 'Nairobi', 'Central Valley', 'São Paulo', 'London'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSearchCityInput(city);
                    fetchWeather(city);
                  }}
                  className={`px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                    weatherCity.toLowerCase() === city.toLowerCase()
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {weatherError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{weatherError}</span>
              </div>
            )}

            {weatherData && (
              <div className="space-y-6">
                {/* Weather Highlights Card */}
                <div className="bg-gradient-to-br from-sky-700 to-indigo-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sky-200 text-xs font-bold uppercase tracking-wider">
                        <span>Current Agro-Meteorology</span>
                        <span>•</span>
                        <span>{weatherData.dataSource}</span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black">{weatherData.location}</h2>
                      <p className="text-sky-100 text-sm capitalize">{weatherData.description}</p>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-5xl font-black">{weatherData.temperature}°C</div>
                      <div className="text-xs text-sky-200 space-y-1">
                        <div>Feels like: {weatherData.feelsLike}°C</div>
                        <div>Humidity: {weatherData.humidity}%</div>
                        <div>Wind: {weatherData.windSpeedKmH} km/h</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specialized Agricultural Advisories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Spraying Window Rating */}
                  <div
                    className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
                      weatherData.agriculturalAdvisories.sprayingRating === 'Excellent' ||
                      weatherData.agriculturalAdvisories.sprayingRating === 'Favorable'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Spraying Safety Rating
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          weatherData.agriculturalAdvisories.sprayingRating === 'Excellent'
                            ? 'bg-emerald-200 text-emerald-900'
                            : weatherData.agriculturalAdvisories.sprayingRating === 'Favorable'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {weatherData.agriculturalAdvisories.sprayingRating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {weatherData.agriculturalAdvisories.sprayingAdvice}
                    </p>
                  </div>

                  {/* Fungal Infection Risk Gauge */}
                  <div
                    className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
                      weatherData.agriculturalAdvisories.fungalDiseaseRisk === 'Critical' ||
                      weatherData.agriculturalAdvisories.fungalDiseaseRisk === 'High'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Fungal Spore Risk
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          weatherData.agriculturalAdvisories.fungalDiseaseRisk === 'Critical'
                            ? 'bg-red-200 text-red-900'
                            : weatherData.agriculturalAdvisories.fungalDiseaseRisk === 'High'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {weatherData.agriculturalAdvisories.fungalDiseaseRisk} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {weatherData.agriculturalAdvisories.fungalRiskReason}
                    </p>
                  </div>

                  {/* Irrigation Advice */}
                  <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Irrigation Guidance
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                        Moisture: {weatherData.soilMoistureEstimate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {weatherData.agriculturalAdvisories.irrigationAdvice}
                    </p>
                  </div>
                </div>

                {/* 5-Day Farm Forecast */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>5-Day Agriculture & Farming Calendar</span>
                    </h3>
                    <span className="text-xs text-slate-400">Rain chance & actionable farm tasks</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {weatherData.forecast.map((fc, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{fc.day}</div>
                          <div className="text-xs font-extrabold text-slate-900 mt-1">
                            {fc.tempMax}° / <span className="text-slate-400 font-normal">{fc.tempMin}°C</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{fc.condition}</div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-sky-700">
                            <span>Rain chance</span>
                            <span>{fc.rainChance}%</span>
                          </div>
                          <div className="text-[11px] text-slate-600 leading-tight bg-white p-1.5 rounded-md border border-slate-200/60">
                            {fc.farmingTip}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: FEATURE 4 - FARMER CHATBOT                              */}
        {/* ============================================================== */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <span>Farmer Chatbot Support</span>
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Agricultural Extension Scientist powered by the Google Gemini free API. Supports English, Hindi,
                  Telugu, and regional languages.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg self-start">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Multilingual Agronomist</span>
              </div>
            </div>

            {/* Chat Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[580px] overflow-hidden">
              {/* Message Feed */}
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px] opacity-75 font-semibold">
                          <span>{isUser ? 'You (Farmer)' : 'Smart AI Crop Doctor'}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{msg.text}</div>
                      </div>
                    </div>
                  );
                })}

                {isChatSending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 flex items-center space-x-2 border border-slate-200">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Crop Doctor is typing agricultural advisory...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 overflow-x-auto flex items-center space-x-2 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Queries:</span>
                {[
                  'How to treat Late Blight in tomato organically?',
                  'Best NPK fertilizer ratio for flowering stage?',
                  'How to prepare neem oil spray dilution ratio?',
                  'Safe pre-harvest interval after copper fungicide?',
                  'फसल में कीटनाशक छिड़काव का सही समय क्या है?',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 shrink-0 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={userInputMessage}
                  onChange={(e) => setUserInputMessage(e.target.value)}
                  placeholder="Ask a question about crop disease, pesticides, fertilizers, or weather..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
                <button
                  type="submit"
                  disabled={isChatSending || !userInputMessage.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: FEATURE 5 - DETECTION HISTORY (MySQL)                   */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <Database className="w-6 h-6 text-indigo-600" />
                  <span>Detection History & Records</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Persistently stored in MySQL. Automatically created database and detections table.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCSV}
                  disabled={historyList.length === 0}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleClearAllHistory}
                  disabled={historyList.length === 0}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {historyNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{historyNotification}</span>
              </div>
            )}

            {/* Database Status Banner */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900">Database Engine:</span>
                <span className="font-medium text-slate-700">
                  MySQL Database Storage ({dbStatus?.database || 'smart_ai_crop_doctor'})
                </span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500">
                <span>Total Stored Scans: {historyList.length}</span>
                <button
                  onClick={() => fetchDetectionHistory()}
                  className="text-emerald-700 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0">Filter Crop:</span>
                <select
                  value={historyFilterCrop}
                  onChange={(e) => setHistoryFilterCrop(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-hidden"
                >
                  <option value="All">All Crops ({historyList.length})</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Corn">Corn (Maize)</option>
                  <option value="Apple">Apple</option>
                  <option value="Rice">Rice</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder="Search disease, symptoms..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* History Table / List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No matching detection records found</p>
                  <p className="text-xs text-slate-400">Run a disease scan in the Detection tab to log a new diagnosis.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4">Leaf</th>
                        <th className="py-3 px-4">Crop & Condition</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Confidence</th>
                        <th className="py-3 px-4">Logged At</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          onClick={() => setViewHistoryItem(item)}
                        >
                          <td className="py-3 px-4">
                            <img
                              src={item.image_url || SAMPLE_LEAF_IMAGES[0].url}
                              alt={item.crop}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">{item.crop}</div>
                            <div className="text-slate-600 text-xs">{item.disease}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                item.severity === 'High' || item.severity === 'Severe'
                                  ? 'bg-red-100 text-red-800'
                                  : item.severity === 'None' || item.severity?.toLowerCase().includes('healthy')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {(item.confidence * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewHistoryItem(item);
                              }}
                              className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* View Detail Modal */}
            {viewHistoryItem && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Database className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Record #{viewHistoryItem.id} Details
                      </h3>
                    </div>
                    <button
                      onClick={() => setViewHistoryItem(null)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <img
                      src={viewHistoryItem.image_url || SAMPLE_LEAF_IMAGES[0].url}
                      alt={viewHistoryItem.crop}
                      className="w-24 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase">{viewHistoryItem.crop}</div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight">{viewHistoryItem.disease}</h4>
                      <div className="flex items-center space-x-2 pt-1 text-xs">
                        <span className="font-bold text-emerald-700">
                          Confidence: {(viewHistoryItem.confidence * 100).toFixed(1)}%
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">Severity: {viewHistoryItem.severity}</span>
                      </div>
                    </div>
                  </div>

                  {viewHistoryItem.symptoms && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700">Observed Symptoms:</span>
                      <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                        {viewHistoryItem.symptoms}
                      </p>
                    </div>
                  )}

                  {viewHistoryItem.recommendations && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-emerald-800">Stored Agronomist Advice:</span>
                      <p className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 leading-relaxed font-medium">
                        {viewHistoryItem.recommendations}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Logged: {new Date(viewHistoryItem.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        handleTransferToRecommendations({
                          crop: viewHistoryItem.crop,
                          disease: viewHistoryItem.disease,
                          severity: viewHistoryItem.severity as any,
                          confidence: viewHistoryItem.confidence,
                          scientificName: '',
                          isHealthy: viewHistoryItem.severity === 'None',
                          affectedParts: [],
                          symptoms: [viewHistoryItem.symptoms],
                          visualIndicators: [],
                          immediateAdvice: viewHistoryItem.recommendations,
                          serviceUsed: 'MySQL Historical Record',
                        });
                        setViewHistoryItem(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Open Full Prescription
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* AUTHENTICATION: LOGIN VIEW                                     */}
        {/* ============================================================== */}
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto py-6 sm:py-10">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <Leaf className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to Crop Doctor</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Access plant disease diagnostics, AI recommendations, and detection history.
                </p>
              </div>

              {/* Redirect/Protected notice banner */}
              {authBannerMessage && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{authBannerMessage}</span>
                </div>
              )}

              {/* Error alert */}
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. farmer@cropdoctor.org"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials Helper */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Need an account for quick testing?</span>
                  <button
                    type="button"
                    onClick={handleFillDemoCredentials}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    ⚡ Fill Demo Credentials
                  </button>
                </div>
              </div>

              {/* Switch to Register */}
              <div className="text-center pt-2 text-xs text-slate-600">
                <span>Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthBannerMessage(null);
                    setLoginError(null);
                    setActiveTab('register');
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Create Free Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* AUTHENTICATION: REGISTER VIEW                                  */}
        {/* ============================================================== */}
        {activeTab === 'register' && (
          <div className="max-w-md mx-auto py-6 sm:py-10">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                  <UserPlus className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Free Account</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Register to access the full agriculture intelligence platform.
                </p>
              </div>

              {/* Error alert */}
              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Success alert */}
              {regSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Alex Farmer"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. farmer@cropdoctor.org"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register</span>
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegError(null);
                    setRegSuccess(null);
                    setActiveTab('login');
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PUBLIC LANDING VIEW (When not logged in)                       */}
        {/* ============================================================== */}
        {activeTab === 'landing' && (
          <div className="space-y-8 py-4">
            {/* Landing Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-700 text-white p-8 sm:p-12 shadow-lg">
              <div className="relative z-10 max-w-3xl space-y-5">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                  <Leaf className="w-4 h-4" />
                  <span>Precision Agriculture Intelligence</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Smart AI Crop Doctor
                </h1>
                <p className="text-emerald-100 text-base sm:text-lg leading-relaxed">
                  A full-stack agricultural platform providing real-time plant disease classification, AI-driven
                  crop prescriptions, agro-meteorological advisories, and an interactive farmer chatbot.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => {
                      setAuthBannerMessage(null);
                      setActiveTab('register');
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Create Free Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthBannerMessage(null);
                      setActiveTab('login');
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-950/60 text-white font-semibold text-sm border border-emerald-400/30 hover:bg-emerald-950/80 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                <Leaf className="w-96 h-96" />
              </div>
            </div>

            {/* 5 Core Features Preview */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Features Preview</h2>
                <p className="text-xs text-slate-500">Comprehensive precision agronomy tools unlocked upon login.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Feature 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">1. Plant Disease Detection</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Upload leaf photos to classify fungal, bacterial, and pest infections using Hugging Face free vision models with confidence scoring.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                    Vision AI • Real-Time Classification
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">2. AI Recommendations</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Personalized organic biopesticides, chemical dosages, withholding safety periods, and preventative agronomy by Google Gemini.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md inline-block">
                    Google Gemini • Organic & Chemical Prescriptions
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">3. Weather Advisory</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Live meteorological analysis with temperature, humidity, wind speeds, pesticide spray safety windows, and disease fungal flags.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md inline-block">
                    OpenWeather API • Spray Safety Forecasts
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">4. Farmer Chatbot</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      24/7 conversational agricultural chatbot answering questions on crop health, soil preparation, pest management, and fertilizers.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md inline-block">
                    Multilingual • 24/7 Crop Diagnostics
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">5. Detection History</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Isolated per-user scan records stored persistently in MySQL with timestamped classifications, severity tags, and CSV export.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md inline-block">
                    MySQL Persistent Storage • CSV Export
                  </div>
                </div>

                {/* Secure & Free */}
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-base">Protected Student Access</h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Full feature access unlocked with standard account authentication. All data synced securely with your user profile.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-md inline-block">
                    JWT Authentication • Private User Records
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">Smart AI Crop Doctor</span>
            <span>• Precision Agriculture Intelligence Platform</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Free Tier Hugging Face</span>
            <span>•</span>
            <span>Google Gemini</span>
            <span>•</span>
            <span>OpenWeather</span>
            <span>•</span>
            <span>MySQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
