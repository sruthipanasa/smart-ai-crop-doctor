import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id?: number;
  name: string;
  email: string;
  password_hash: string;
  created_at?: string;
}

export interface DetectionRecord {
  id?: number;
  user_id?: number | null;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string;
  recommendations: string;
  image_url: string;
  weather_context?: string;
  created_at?: string;
}

// In-memory fallback users (Demo user seeded for quick testing)
let fallbackUsers: UserRecord[] = [
  {
    id: 1,
    name: 'Alex Farmer',
    email: 'farmer@cropdoctor.org',
    password_hash: bcrypt.hashSync('Password123!', 10),
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
];
let nextUserId = 2;

// In-memory & seed storage fallback for seamless demonstration when MySQL daemon is not running
let fallbackDetections: DetectionRecord[] = [
  {
    id: 1,
    user_id: 1,
    crop: 'Tomato',
    disease: 'Late Blight (Phytophthora infestans)',
    confidence: 0.94,
    severity: 'High',
    symptoms: 'Water-soaked irregular dark spots on leaves, whitish downy fungal growth on leaf undersides during high humidity, rapid stem browning.',
    recommendations: 'Apply Copper Hydroxide or Mancozeb fungicide spray at 2.5g/L. Remove and destroy infected foliage immediately. Improve airflow and avoid overhead sprinkler watering.',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=400&q=80',
    weather_context: 'High humidity (>85%), 21°C - optimal fungal incubation conditions',
    created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    crop: 'Potato',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 0.89,
    severity: 'Moderate',
    symptoms: 'Concentric dark brown circular rings (target-board pattern) on older lower leaves, leaf yellowing around necrotic lesions.',
    recommendations: 'Spray Chlorothalonil or Azoxystrobin at recommended dilution. Ensure balanced potassium fertilization and maintain deep mulching around tuber beds.',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
    weather_context: 'Moderate humidity, 26°C with dry spells',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    crop: 'Corn (Maize)',
    disease: 'Common Rust (Puccinia sorghi)',
    confidence: 0.91,
    severity: 'Moderate',
    symptoms: 'Golden-brown to cinnamon-colored powdery pustules scattered on upper and lower surfaces of corn leaves.',
    recommendations: 'Utilize rust-resistant hybrid varieties for the next cycle. Apply Triazole or Strobilurin foliar fungicide if infection occurs prior to silking stage.',
    image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
    weather_context: 'Warm humid days with cool overnight dew (16°C)',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    crop: 'Apple',
    disease: 'Apple Scab (Venturia inaequalis)',
    confidence: 0.88,
    severity: 'Moderate',
    symptoms: 'Olive-green to velvety dark brown lesions on foliage and young developing fruit, causing leaf curling and fruit distortion.',
    recommendations: 'Prune canopy in late winter to maximize sunlight penetration. Apply Captan or sulfur-based organic spray during green tip through petal fall.',
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
    weather_context: 'Spring rain cycle, prolonged leaf wetness > 9 hours',
    created_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    crop: 'Rice',
    disease: 'Healthy Crop (No Disease Detected)',
    confidence: 0.98,
    severity: 'None',
    symptoms: 'Uniform vibrant emerald-green blades, vigorous tillering, no necrotic lesions or fungal sporulation.',
    recommendations: 'Maintain recommended water level of 3-5 cm. Apply split nitrogen top-dressing at panicle initiation with appropriate potassium support.',
    image_url: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=400&q=80',
    weather_context: 'Tropical sunny, 31°C, light breeze',
    created_at: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
  },
];

let nextId = 6;
let pool: mysql.Pool | null = null;
let isConnected = false;
let connectionError: string | null = null;

export async function initDatabase(): Promise<void> {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'smart_ai_crop_doctor';

  try {
    // Step 1: Connect to MySQL server without database to create it if missing
    const tempConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 2000,
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await tempConnection.end();

    // Step 2: Create connection pool with the database
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Step 3: Create users table if not exists
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      );
    `;
    await pool.query(createUsersTableQuery);

    // Step 4: Create detections table if not exists
    const createDetectionsTableQuery = `
      CREATE TABLE IF NOT EXISTS detections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        crop VARCHAR(100) NOT NULL,
        disease VARCHAR(150) NOT NULL,
        confidence FLOAT NOT NULL,
        severity VARCHAR(50) DEFAULT 'Moderate',
        symptoms TEXT,
        recommendations TEXT,
        image_url LONGTEXT,
        weather_context VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_crop (crop),
        INDEX idx_user_id (user_id)
      );
    `;
    await pool.query(createDetectionsTableQuery);

    // Safe migration: add user_id column if detections table already existed without it
    try {
      await pool.query(`ALTER TABLE detections ADD COLUMN user_id INT NULL;`);
    } catch {
      // Column already exists or error ignored
    }

    isConnected = true;
    connectionError = null;
    console.log(`[MySQL] Successfully connected to ${host}:${port}/${database} and initialized tables 'users' and 'detections'.`);
  } catch (err: any) {
    isConnected = false;
    connectionError = err.message || 'MySQL connection failed';
    console.warn(`[MySQL] Note: MySQL server is not connected (${connectionError}).`);
    console.warn(`[MySQL] Active Mode: Seamless in-memory & local storage fallback enabled for demo testing.`);
  }
}

export function getDatabaseStatus() {
  return {
    isConnected,
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    database: process.env.MYSQL_DATABASE || 'smart_ai_crop_doctor',
    type: 'mysql',
    message: 'MySQL Database Storage active',
    error: connectionError,
    totalRecords: fallbackDetections.length,
    totalUsers: fallbackUsers.length,
  };
}

// -------------------------------------------------------------
// USER AUTHENTICATION & MANAGEMENT
// -------------------------------------------------------------
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query<mysql.RowDataPacket[]>(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [normalizedEmail]
      );
      if (rows && rows.length > 0) {
        return rows[0] as UserRecord;
      }
      return null;
    } catch (err) {
      console.error('[MySQL] Query error in findUserByEmail:', err);
    }
  }

  // Fallback
  const found = fallbackUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  return found || null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query<mysql.RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows && rows.length > 0) {
        return rows[0] as UserRecord;
      }
      return null;
    } catch (err) {
      console.error('[MySQL] Query error in findUserById:', err);
    }
  }

  const found = fallbackUsers.find((u) => u.id === id);
  return found || null;
}

export async function createUser(name: string, email: string, passwordHash: string): Promise<UserRecord> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (isConnected && pool) {
    try {
      const [result]: any = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [trimmedName, normalizedEmail, passwordHash]
      );
      return {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[MySQL] Insert error in createUser:', err);
      throw err;
    }
  }

  // Fallback
  const newUser: UserRecord = {
    id: nextUserId++,
    name: trimmedName,
    email: normalizedEmail,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };
  fallbackUsers.push(newUser);
  return newUser;
}

// -------------------------------------------------------------
// DETECTION RECORDS (ASSOCIATED WITH USER)
// -------------------------------------------------------------
export async function getAllDetections(userId?: number | null): Promise<DetectionRecord[]> {
  if (isConnected && pool) {
    try {
      if (userId) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
          'SELECT * FROM detections WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
          [userId]
        );
        return rows as DetectionRecord[];
      }
      const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM detections ORDER BY created_at DESC');
      return rows as DetectionRecord[];
    } catch (err) {
      console.error('[MySQL] Query error in getAllDetections:', err);
    }
  }

  // Fallback
  let results = [...fallbackDetections];
  if (userId) {
    results = results.filter((d) => d.user_id === userId || d.user_id === null || d.user_id === undefined);
  }
  return results.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

export async function getDetectionById(id: number, userId?: number | null): Promise<DetectionRecord | null> {
  if (isConnected && pool) {
    try {
      if (userId) {
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
          'SELECT * FROM detections WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
          [id, userId]
        );
        if (rows && rows.length > 0) {
          return rows[0] as DetectionRecord;
        }
        return null;
      }
      const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM detections WHERE id = ?', [id]);
      if (rows && rows.length > 0) {
        return rows[0] as DetectionRecord;
      }
      return null;
    } catch (err) {
      console.error('[MySQL] Query error in getDetectionById:', err);
    }
  }
  return fallbackDetections.find((d) => d.id === id && (!userId || !d.user_id || d.user_id === userId)) || null;
}

export async function createDetection(record: Omit<DetectionRecord, 'id' | 'created_at'>): Promise<DetectionRecord> {
  const newRecord: DetectionRecord = {
    ...record,
    user_id: record.user_id || null,
    created_at: new Date().toISOString(),
  };

  if (isConnected && pool) {
    try {
      const insertQuery = `
        INSERT INTO detections (user_id, crop, disease, confidence, severity, symptoms, recommendations, image_url, weather_context)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result]: any = await pool.query(insertQuery, [
        newRecord.user_id,
        record.crop,
        record.disease,
        record.confidence,
        record.severity || 'Moderate',
        record.symptoms || '',
        record.recommendations || '',
        record.image_url || '',
        record.weather_context || '',
      ]);
      newRecord.id = result.insertId;
      return newRecord;
    } catch (err) {
      console.error('[MySQL] Insert error in createDetection:', err);
    }
  }

  // Fallback
  newRecord.id = nextId++;
  fallbackDetections.unshift(newRecord);
  return newRecord;
}

export async function deleteDetection(id: number, userId?: number | null): Promise<boolean> {
  if (isConnected && pool) {
    try {
      if (userId) {
        await pool.query('DELETE FROM detections WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId]);
      } else {
        await pool.query('DELETE FROM detections WHERE id = ?', [id]);
      }
      return true;
    } catch (err) {
      console.error('[MySQL] Delete error in deleteDetection:', err);
    }
  }
  const initialLength = fallbackDetections.length;
  fallbackDetections = fallbackDetections.filter((d) => {
    if (d.id !== id) return true;
    if (userId && d.user_id && d.user_id !== userId) return true;
    return false;
  });
  return fallbackDetections.length < initialLength;
}

export async function clearAllDetections(userId?: number | null): Promise<boolean> {
  if (isConnected && pool) {
    try {
      if (userId) {
        await pool.query('DELETE FROM detections WHERE user_id = ?', [userId]);
      } else {
        await pool.query('TRUNCATE TABLE detections');
      }
      return true;
    } catch (err) {
      console.error('[MySQL] Truncate error in clearAllDetections:', err);
    }
  }
  if (userId) {
    fallbackDetections = fallbackDetections.filter((d) => d.user_id !== userId);
  } else {
    fallbackDetections = [];
  }
  return true;
}
