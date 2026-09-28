const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'smart_ai_crop_doctor',
};

let pool = null;
let isConnected = false;

async function initDB() {
  try {
    // Connect to MySQL server without database first to ensure it exists
    const tempConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 3000,
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await tempConn.end();

    // Create pool with database
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createTableQuery = `
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
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createUsersTableQuery);
    await pool.query(createTableQuery);
    isConnected = true;
    console.log(`[MySQL] Successfully connected to database: ${dbConfig.database}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MySQL] Connection warning: ${error.message}`);
    console.warn(`[MySQL] Running with internal fallback data store for offline demo.`);
  }
}

function getPool() {
  return pool;
}

function getStatus() {
  return {
    isConnected,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
  };
}

module.exports = {
  initDB,
  getPool,
  getStatus,
};
