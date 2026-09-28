const { getPool, getStatus } = require('../config/db');

// In-memory fallback dataset for seamless student demo if local MySQL server is not active
let memoryDetections = [
  {
    id: 1,
    crop: 'Tomato',
    disease: 'Late Blight (Phytophthora infestans)',
    confidence: 0.94,
    severity: 'High',
    symptoms: 'Dark water-soaked lesions on foliage, whitish downy sporulation on undersides of leaves.',
    recommendations: 'Apply Copper Hydroxide (2.5g/L). Remove affected leaves. Switch to drip irrigation.',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=400&q=80',
    weather_context: 'High humidity (>85%), 21°C',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 2,
    crop: 'Potato',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 0.89,
    severity: 'Moderate',
    symptoms: 'Concentric rings with target board appearance on older foliage.',
    recommendations: 'Apply Azoxystrobin or Chlorothalonil. Maintain balanced potassium fertility.',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
    weather_context: 'Moderate humidity, 26°C',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 3,
    crop: 'Corn (Maize)',
    disease: 'Common Rust (Puccinia sorghi)',
    confidence: 0.91,
    severity: 'Moderate',
    symptoms: 'Cinnamon brown powdery pustules scattered on leaf surfaces.',
    recommendations: 'Utilize rust-resistant hybrids. Apply triazole fungicide prior to silking if severe.',
    image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
    weather_context: 'Cool night dew with warm days',
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
];

let nextId = 4;

const DetectionModel = {
  async getAll(userId = null) {
    const pool = getPool();
    if (pool && getStatus().isConnected) {
      try {
        if (userId) {
          const [rows] = await pool.query(
            'SELECT * FROM detections WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
            [userId]
          );
          return rows;
        } else {
          const [rows] = await pool.query('SELECT * FROM detections ORDER BY created_at DESC');
          return rows;
        }
      } catch (err) {
        console.error('MySQL query error:', err.message);
      }
    }
    if (userId) {
      return memoryDetections.filter((d) => !d.user_id || d.user_id === userId);
    }
    return memoryDetections;
  },

  async getById(id, userId = null) {
    const pool = getPool();
    if (pool && getStatus().isConnected) {
      try {
        if (userId) {
          const [rows] = await pool.query('SELECT * FROM detections WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId]);
          return rows[0] || null;
        } else {
          const [rows] = await pool.query('SELECT * FROM detections WHERE id = ?', [id]);
          return rows[0] || null;
        }
      } catch (err) {
        console.error('MySQL query error:', err.message);
      }
    }
    return memoryDetections.find((d) => d.id === parseInt(id, 10)) || null;
  },

  async create(data, userId = null) {
    const pool = getPool();
    const newRecord = {
      user_id: userId || data.user_id || null,
      crop: data.crop,
      disease: data.disease,
      confidence: parseFloat(data.confidence) || 0.9,
      severity: data.severity || 'Moderate',
      symptoms: data.symptoms || '',
      recommendations: data.recommendations || '',
      image_url: data.image_url || '',
      weather_context: data.weather_context || '',
      created_at: new Date().toISOString(),
    };

    if (pool && getStatus().isConnected) {
      try {
        const [result] = await pool.query(
          `INSERT INTO detections (user_id, crop, disease, confidence, severity, symptoms, recommendations, image_url, weather_context)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newRecord.user_id,
            newRecord.crop,
            newRecord.disease,
            newRecord.confidence,
            newRecord.severity,
            newRecord.symptoms,
            newRecord.recommendations,
            newRecord.image_url,
            newRecord.weather_context,
          ]
        );
        newRecord.id = result.insertId;
        return newRecord;
      } catch (err) {
        console.error('MySQL insert error:', err.message);
      }
    }

    newRecord.id = nextId++;
    memoryDetections.unshift(newRecord);
    return newRecord;
  },

  async delete(id, userId = null) {
    const pool = getPool();
    if (pool && getStatus().isConnected) {
      try {
        if (userId) {
          await pool.query('DELETE FROM detections WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId]);
        } else {
          await pool.query('DELETE FROM detections WHERE id = ?', [id]);
        }
        return true;
      } catch (err) {
        console.error('MySQL delete error:', err.message);
      }
    }
    const len = memoryDetections.length;
    memoryDetections = memoryDetections.filter((d) => {
      if (d.id !== parseInt(id, 10)) return true;
      if (userId && d.user_id && d.user_id !== userId) return true;
      return false;
    });
    return memoryDetections.length < len;
  },

  async clearAll(userId = null) {
    const pool = getPool();
    if (pool && getStatus().isConnected) {
      try {
        if (userId) {
          await pool.query('DELETE FROM detections WHERE user_id = ?', [userId]);
        } else {
          await pool.query('TRUNCATE TABLE detections');
        }
        return true;
      } catch (err) {
        console.error('MySQL clear error:', err.message);
      }
    }
    if (userId) {
      memoryDetections = memoryDetections.filter((d) => d.user_id !== userId);
    } else {
      memoryDetections = [];
    }
    return true;
  },
};

module.exports = DetectionModel;
