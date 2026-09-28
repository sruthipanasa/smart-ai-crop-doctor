import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  initDatabase,
  getAllDetections,
  getDetectionById,
  createDetection,
  deleteDetection,
  clearAllDetections,
  getDatabaseStatus,
  findUserByEmail,
  findUserById,
  createUser,
} from './src/server/db.ts';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  classifyPlantDisease,
  getGeminiCropRecommendations,
  getAgriculturalWeather,
  farmerChatWithGemini,
} from './src/server/aiServices.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'smart-crop-doctor-secure-jwt-secret-key-2025';

// Increase JSON body payload limit for high-resolution leaf image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper: extract authenticated user from Authorization header
function extractUserFromRequest(req: express.Request): { id: number; email: string; name: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
    return decoded;
  } catch {
    return null;
  }
}

// Initialize MySQL database (with graceful fallback if MySQL is not currently running locally)
initDatabase().catch((err) => {
  console.warn('[Server] DB initialization notice:', err.message);
});

// ==========================================
// API ROUTES: AUTHENTICATION
// ==========================================

// Register New User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Required field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }
    if (!confirmPassword) {
      return res.status(400).json({ success: false, error: 'Confirm Password is required.' });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    // 3. Password length validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    // 4. Confirm password matching
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match. Please verify and try again.' });
    }

    // 5. Duplicate email check
    const existingUser = await findUserByEmail(email.trim());
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists. Please log in.' });
    }

    // 6. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. Store user in MySQL / fallback
    const newUser = await createUser(name.trim(), email.trim(), passwordHash);

    // 8. Return success response (never expose password or hash)
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in with your credentials.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration. Please try again.',
      details: error.message,
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Required field validation
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    // 2. Look up user
    const user = await findUserByEmail(email.trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // 3. Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // 4. Generate JWT session token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
      details: error.message,
    });
  }
});

// Verify Current Session
app.get('/api/auth/me', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'Not authenticated or session expired.' });
    }

    const user = await findUserById(authUser.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User record not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid session token.' });
  }
});

// User Logout
app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// API ROUTES
// ==========================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'healthy',
    application: 'Smart AI Crop Doctor',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    services: {
      geminiFreeApi: Boolean(process.env.GEMINI_API_KEY),
      huggingFaceFreeApi: Boolean(process.env.HUGGINGFACE_API_KEY),
      openWeatherFreeApi: Boolean(process.env.OPENWEATHER_API_KEY),
    },
  });
});

// Database Status
app.get('/api/db/status', (req, res) => {
  res.json(getDatabaseStatus());
});

// FEATURE 1: Plant Disease Detection
// Upload image -> Classify with Hugging Face / Gemini Vision -> Save to MySQL -> Return Result
app.post('/api/detect', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to run plant disease detection.',
      });
    }

    const { image, mimeType, cropHint, autoSave = true } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Please upload or provide an image of the plant leaf.',
      });
    }

    // Step 1: Run AI Disease Classification
    const diagnosis = await classifyPlantDisease(image, mimeType || 'image/jpeg', cropHint);

    // Step 2: Auto-save detection result to MySQL / storage
    let savedRecord = null;
    if (autoSave) {
      try {
        savedRecord = await createDetection({
          user_id: authUser.id,
          crop: diagnosis.crop,
          disease: diagnosis.disease,
          confidence: diagnosis.confidence,
          severity: diagnosis.severity,
          symptoms: diagnosis.symptoms.join('; '),
          recommendations: diagnosis.immediateAdvice,
          image_url: image.length > 50000 ? image.substring(0, 50000) : image, // Store thumbnail / preview
          weather_context: 'Scanned via Smart AI Crop Doctor Mobile & Web Hub',
        });
      } catch (dbErr) {
        console.warn('[DB AutoSave Error]', dbErr);
      }
    }

    return res.json({
      success: true,
      diagnosis,
      savedRecord,
      message: 'Plant disease detection completed successfully.',
    });
  } catch (error: any) {
    console.error('Detection API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong during disease detection. Please try again.',
      details: error.message,
    });
  }
});

// FEATURE 2: AI Recommendations
// Crop & Disease -> Google Gemini Free API -> Structured Agricultural Prescription
app.post('/api/recommendations', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to generate AI crop recommendations.',
      });
    }

    const { crop, disease, severity, context } = req.body;

    if (!crop || !disease) {
      return res.status(400).json({
        success: false,
        error: 'Crop and detected disease are required to generate agricultural recommendations.',
      });
    }

    const recommendations = await getGeminiCropRecommendations(crop, disease, severity, context);

    return res.json({
      success: true,
      crop,
      disease,
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Recommendations API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong while generating recommendations. Please try again.',
      details: error.message,
    });
  }
});

// FEATURE 3: Weather Advisory
// Location Query -> OpenWeather Free API -> Agricultural Weather Advice
app.get('/api/weather', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to view agricultural weather advisories.',
      });
    }

    const location = (req.query.location as string) || 'Hyderabad';
    const weatherData = await getAgriculturalWeather(location);

    return res.json({
      success: true,
      data: weatherData,
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve weather advisory. Please try again or check city name.',
      details: error.message,
    });
  }
});

// FEATURE 4: Farmer Chatbot
// Questions -> Google Gemini Free API -> Agricultural Extension Advice
app.post('/api/chat', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to consult with the Farmer Chatbot.',
      });
    }

    const { messages, cropContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message history is required.',
      });
    }

    const reply = await farmerChatWithGemini(messages, cropContext);

    return res.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Farmer chatbot encountered an error. Please try asking again.',
      details: error.message,
    });
  }
});

// FEATURE 5: Detection History / Results (MySQL CRUD)
// Get detections (filtered by authenticated user)
app.get('/api/detections', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to view detection history.',
      });
    }

    const detections = await getAllDetections(authUser.id);
    res.json({
      success: true,
      count: detections.length,
      detections,
      database: getDatabaseStatus(),
    });
  } catch (error: any) {
    console.error('Get detections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve detection history.',
      details: error.message,
    });
  }
});

// Get single detection by ID
app.get('/api/detections/:id', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to view this detection record.',
      });
    }

    const id = parseInt(req.params.id, 10);
    const detection = await getDetectionById(id, authUser.id);
    if (!detection) {
      return res.status(404).json({ success: false, error: 'Detection record not found' });
    }
    res.json({ success: true, detection });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save detection manually
app.post('/api/detections', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to save detection records.',
      });
    }

    const { crop, disease, confidence, severity, symptoms, recommendations, image_url, weather_context } = req.body;

    if (!crop || !disease) {
      return res.status(400).json({ success: false, error: 'Crop and disease are required fields.' });
    }

    const saved = await createDetection({
      user_id: authUser.id,
      crop,
      disease,
      confidence: confidence || 0.9,
      severity: severity || 'Moderate',
      symptoms: symptoms || '',
      recommendations: recommendations || '',
      image_url: image_url || '',
      weather_context: weather_context || '',
    });

    res.status(201).json({ success: true, detection: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete single detection
app.delete('/api/detections/:id', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to delete detection records.',
      });
    }

    const id = parseInt(req.params.id, 10);
    const deleted = await deleteDetection(id, authUser.id);
    res.json({ success: deleted, message: deleted ? 'Record deleted' : 'Record not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all detections for this user
app.delete('/api/detections', async (req, res) => {
  try {
    const authUser = extractUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to clear detection records.',
      });
    }

    await clearAllDetections(authUser.id);
    res.json({ success: true, message: 'All detection records cleared.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// VITE SPA INTEGRATION & STATIC SERVING
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart AI Crop Doctor] Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
