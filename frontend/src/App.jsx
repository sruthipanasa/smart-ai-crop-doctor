import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  Calendar,
  ArrowRight,
  Eye,
  AlertCircle,
  HelpCircle,
  FileText,
  Database,
  Layers,
  Send,
  ChevronDown,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SAMPLE_LEAF_IMAGES = [
  {
    name: 'Tomato Late Blight',
    crop: 'Tomato',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
    description: 'Dark water-soaked irregular spots on tomato foliage with white mold under leaf',
  },
  {
    name: 'Potato Early Blight',
    crop: 'Potato',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    description: 'Concentric circular rings creating target-board lesions on older leaves',
  },
  {
    name: 'Corn Rust (Maize)',
    crop: 'Corn (Maize)',
    url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    description: 'Cinnamon powdery pustules scattered across maize leaf blades',
  },
  {
    name: 'Healthy Rice Leaf',
    crop: 'Rice',
    url: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
    description: 'Vigorous emerald-green leaf blade with pristine veins and zero lesions',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState(null);

  // Feature 1: Detection
  const [selectedImage, setSelectedImage] = useState(SAMPLE_LEAF_IMAGES[0].url);
  const [imageFile, setImageFile] = useState(null);
  const [cropHint, setCropHint] = useState('Tomato');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState(null);
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const fileInputRef = useRef(null);

  // Feature 2: AI Recommendations
  const [recCrop, setRecCrop] = useState('Tomato');
  const [recDisease, setRecDisease] = useState('Late Blight (Phytophthora infestans)');
  const [recSeverity, setRecSeverity] = useState('High');
  const [recContext, setRecContext] = useState('Open field tomato cultivation during humid monsoon period');
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [recError, setRecError] = useState(null);

  // Feature 3: Weather Advisory
  const [weatherCity, setWeatherCity] = useState('Hyderabad');
  const [searchCityInput, setSearchCityInput] = useState('Hyderabad');
  const [weatherData, setWeatherData] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Feature 4: Farmer Chatbot
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Namaste & Hello Farmer! 🌾 I am your Smart AI Crop Doctor agricultural assistant. Ask me anything about crop diseases, organic treatments, chemical dosages, or weather-safe spraying windows.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInputMessage, setUserInputMessage] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatScrollRef = useRef(null);

  // Feature 5: Detection History
  const [historyList, setHistoryList] = useState([]);
  const [historyFilterCrop, setHistoryFilterCrop] = useState('All');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [viewHistoryItem, setViewHistoryItem] = useState(null);
  const [historyNotification, setHistoryNotification] = useState(null);

  useEffect(() => {
    fetchHealthAndDbStatus();
    fetchWeather('Hyderabad');
    fetchDetectionHistory();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatSending]);

  const fetchHealthAndDbStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/health`);
      setDbStatus(res.data.database);
    } catch (e) {
      console.warn('Backend offline or initializing');
    }
  };

  const fetchWeather = async (city) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/weather?location=${encodeURIComponent(city)}`);
      if (res.data.success && res.data.data) {
        setWeatherData(res.data.data);
        setWeatherCity(city);
      }
    } catch (err) {
      setWeatherError('Failed to load weather data.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const fetchDetectionHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/detections`);
      if (res.data.success && Array.isArray(res.data.detections)) {
        setHistoryList(res.data.detections);
        if (res.data.database) setDbStatus(res.data.database);
      }
    } catch (err) {
      console.warn('History fetch error', err);
    }
  };

  const handleImageFileChange = (e) => {
    setDetectionError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDetectionError('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDetectionError('File size exceeds 10MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRunDetection = async () => {
    if (!selectedImage) {
      setDetectionError('Please upload or select a leaf photo.');
      return;
    }
    setIsDetecting(true);
    setDetectionError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/detect`, {
        image: selectedImage,
        mimeType: imageFile?.type || 'image/jpeg',
        cropHint,
        autoSave: true,
      });

      if (res.data.success && res.data.diagnosis) {
        setCurrentDiagnosis(res.data.diagnosis);
        setRecCrop(res.data.diagnosis.crop);
        setRecDisease(res.data.diagnosis.disease);
        setRecSeverity(res.data.diagnosis.severity);
        fetchDetectionHistory();
      } else {
        setDetectionError(res.data.error || 'Diagnosis failed. Please try another image.');
      }
    } catch (err) {
      setDetectionError('Network error during detection. Please check backend connection.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGenerateRecommendations = async (c, d) => {
    const cropToUse = c || recCrop;
    const diseaseToUse = d || recDisease;
    if (!cropToUse || !diseaseToUse) return;

    setIsGeneratingRecs(true);
    setRecError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/recommendations`, {
        crop: cropToUse,
        disease: diseaseToUse,
        severity: recSeverity,
        context: recContext,
      });

      if (res.data.success && res.data.recommendations) {
        setRecommendationsData(res.data.recommendations);
      }
    } catch (err) {
      setRecError('Error fetching Gemini AI recommendations.');
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  const handleSendMessage = async (customText) => {
    const text = (customText || userInputMessage).trim();
    if (!text || isChatSending) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setUserInputMessage('');
    setIsChatSending(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        messages: updated.map((m) => ({ role: m.role, text: m.text })),
        cropContext: currentDiagnosis ? `${currentDiagnosis.crop} ${currentDiagnosis.disease}` : undefined,
      });

      if (res.data.success && res.data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            role: 'model',
            text: res.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Unable to reach Gemini Chat service. Please verify your internet connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/api/detections/${id}`);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      setHistoryNotification(`Deleted record #${id}`);
      setTimeout(() => setHistoryNotification(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHistory = historyList.filter((item) => {
    const matchesCrop = historyFilterCrop === 'All' || item.crop.toLowerCase().includes(historyFilterCrop.toLowerCase());
    const matchesSearch =
      !historySearchTerm ||
      item.crop.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      item.disease.toLowerCase().includes(historySearchTerm.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-900">
                Smart AI <span className="text-emerald-600">Crop Doctor</span>
              </div>
              <div className="text-[11px] text-slate-500">Agriculture Intelligence Platform</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'detect', label: 'Disease Detection', icon: Camera },
              { id: 'recommendations', label: 'AI Prescriptions', icon: Sparkles },
              { id: 'weather', label: 'Weather Advisory', icon: CloudRain },
              { id: 'chat', label: 'Farmer Chatbot', icon: MessageSquare },
              { id: 'history', label: 'History (MySQL)', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{dbStatus?.isConnected ? 'MySQL Active' : 'Storage Active'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-green-600 text-white p-8 shadow-md">
              <h1 className="text-3xl font-extrabold">Smart AI Crop Doctor</h1>
              <p className="text-emerald-100 mt-2 max-w-2xl text-sm">
                Plant disease diagnosis with Hugging Face, Gemini AI recommendations, OpenWeather advisory, and MySQL
                results storage.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setActiveTab('detect')}
                  className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50"
                >
                  Scan Leaf Image
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900/40 text-white font-semibold text-sm border border-emerald-400/30"
                >
                  Ask Crop Doctor Chatbot
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Stored Detections</div>
                <div className="text-2xl font-bold mt-1">{historyList.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Inference Status</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">Ready</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Weather Hub</div>
                <div className="text-2xl font-bold mt-1">{weatherData?.temperature || 28}°C</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Database Engine</div>
                <div className="text-sm font-bold text-indigo-700 mt-2">MySQL / Local</div>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 1: DISEASE DETECTION */}
        {activeTab === 'detect' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Camera className="w-6 h-6 text-emerald-600" />
              <span>Plant Disease Detection</span>
            </h2>

            {detectionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {detectionError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center cursor-pointer min-h-[220px] flex flex-col items-center justify-center bg-emerald-50/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  {selectedImage ? (
                    <img src={selectedImage} alt="Leaf preview" className="max-h-52 rounded-lg object-contain" />
                  ) : (
                    <div className="text-slate-500 text-sm">Click to upload leaf image</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Crop Hint:</label>
                  <div className="flex flex-wrap gap-2">
                    {['Tomato', 'Potato', 'Corn (Maize)', 'Rice', 'Apple'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCropHint(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          cropHint === c ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunDetection}
                  disabled={isDetecting || !selectedImage}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-xs"
                >
                  {isDetecting ? 'Classifying Plant Disease...' : 'Run Detection (Hugging Face / Gemini)'}
                </button>

                {/* Samples */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-500 mb-2">Or click sample leaf:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLE_LEAF_IMAGES.map((s, idx) => (
                      <img
                        key={idx}
                        src={s.url}
                        alt={s.name}
                        onClick={() => {
                          setSelectedImage(s.url);
                          setCropHint(s.crop);
                        }}
                        className="w-full h-14 object-cover rounded-lg cursor-pointer border hover:border-emerald-500"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                {currentDiagnosis ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-bold uppercase">{currentDiagnosis.crop}</div>
                      <h3 className="text-xl font-black text-slate-900 mt-1">{currentDiagnosis.disease}</h3>
                      <div className="mt-2 text-xs font-bold text-emerald-700">
                        Confidence: {(currentDiagnosis.confidence * 100).toFixed(0)}% • Severity: {currentDiagnosis.severity}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-700">Symptoms:</div>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                        {currentDiagnosis.symptoms?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                      <strong>Immediate Action: </strong>
                      {currentDiagnosis.immediateAdvice}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('recommendations');
                        handleGenerateRecommendations(currentDiagnosis.crop, currentDiagnosis.disease);
                      }}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                    >
                      Generate Full Gemini AI Prescription
                    </button>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No diagnosis generated yet. Upload a leaf image to begin.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 2: RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span>AI Crop Recommendations</span>
            </h2>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={recCrop}
                onChange={(e) => setRecCrop(e.target.value)}
                placeholder="Crop"
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                value={recDisease}
                onChange={(e) => setRecDisease(e.target.value)}
                placeholder="Disease"
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={() => handleGenerateRecommendations()}
                disabled={isGeneratingRecs}
                className="py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold"
              >
                {isGeneratingRecs ? 'Generating...' : 'Get Gemini Prescription'}
              </button>
            </div>

            {recommendationsData && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <p className="p-4 bg-emerald-50 rounded-xl text-sm text-slate-700">{recommendationsData.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-800 text-sm mb-2">Organic Controls</h4>
                    {recommendationsData.organicRemedies?.map((r, i) => (
                      <div key={i} className="text-xs text-slate-700 mb-2">
                        <strong>{r.title}:</strong> {r.application}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 text-sm mb-2">Chemical Controls</h4>
                    {recommendationsData.chemicalControls?.map((c, i) => (
                      <div key={i} className="text-xs text-slate-700 mb-2">
                        <strong>{c.name}:</strong> Dosage: {c.dosage} (PHI: {c.withholdingPeriod})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEATURE 3: WEATHER */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <CloudRain className="w-6 h-6 text-sky-600" />
              <span>Weather Advisory</span>
            </h2>

            {weatherData && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{weatherData.location}</h3>
                    <div className="text-slate-500 text-xs">{weatherData.description}</div>
                  </div>
                  <div className="text-4xl font-extrabold text-slate-900">{weatherData.temperature}°C</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700">Spraying Rating</div>
                    <div className="text-sm font-extrabold text-emerald-700 mt-1">
                      {weatherData.agriculturalAdvisories?.sprayingRating}
                    </div>
                    <p className="mt-1 text-slate-600">{weatherData.agriculturalAdvisories?.sprayingAdvice}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700">Fungal Infection Risk</div>
                    <div className="text-sm font-extrabold text-amber-700 mt-1">
                      {weatherData.agriculturalAdvisories?.fungalDiseaseRisk}
                    </div>
                    <p className="mt-1 text-slate-600">{weatherData.agriculturalAdvisories?.fungalRiskReason}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700">Irrigation Advice</div>
                    <div className="text-sm font-extrabold text-sky-700 mt-1">
                      {weatherData.soilMoistureEstimate}
                    </div>
                    <p className="mt-1 text-slate-600">{weatherData.agriculturalAdvisories?.irrigationAdvice}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEATURE 4: CHATBOT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <span>Farmer Chatbot</span>
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-[520px] overflow-hidden">
              <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-xl text-xs sm:text-sm ${
                        m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t flex gap-2"
              >
                <input
                  type="text"
                  value={userInputMessage}
                  onChange={(e) => setUserInputMessage(e.target.value)}
                  placeholder="Ask a question about your crops..."
                  className="flex-1 px-3 py-2 border rounded-xl text-sm"
                />
                <button
                  type="submit"
                  disabled={isChatSending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FEATURE 5: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <History className="w-6 h-6 text-indigo-600" />
              <span>Detection History (MySQL)</span>
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Crop</th>
                    <th className="p-3">Disease</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono">#{item.id}</td>
                      <td className="p-3 font-bold">{item.crop}</td>
                      <td className="p-3">{item.disease}</td>
                      <td className="p-3 font-mono">{(item.confidence * 100).toFixed(0)}%</td>
                      <td className="p-3 font-semibold">{item.severity}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
