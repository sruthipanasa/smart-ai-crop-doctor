const { getPool, getStatus } = require('../config/db');

// Fallback in-memory store if MySQL is offline
const fallbackUsers = [
  {
    id: 1,
    name: 'Alex Farmer',
    email: 'farmer@cropdoctor.org',
    // Hash for 'Password123!'
    password_hash: '$2a$10$wO3P8BqZfT7n4CjWz63fNuP7FvT8t8j9Y.v6uL3kR6L6uG2F8m8eK',
    created_at: new Date().toISOString(),
  },
];
let nextUserId = 2;

class UserModel {
  static async findByEmail(email) {
    const pool = getPool();
    const status = getStatus();

    if (pool && status.isConnected) {
      try {
        const [rows] = await pool.query(
          'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1',
          [email.toLowerCase().trim()]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[UserModel] MySQL query failed, using memory fallback:', err.message);
      }
    }

    const found = fallbackUsers.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    return found || null;
  }

  static async findById(id) {
    const pool = getPool();
    const status = getStatus();

    if (pool && status.isConnected) {
      try {
        const [rows] = await pool.query(
          'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[UserModel] MySQL query failed, using memory fallback:', err.message);
      }
    }

    const found = fallbackUsers.find((u) => u.id === id);
    if (!found) return null;
    return { id: found.id, name: found.name, email: found.email, created_at: found.created_at };
  }

  static async create(name, email, passwordHash) {
    const pool = getPool();
    const status = getStatus();

    if (pool && status.isConnected) {
      try {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
          [name.trim(), email.toLowerCase().trim(), passwordHash]
        );
        return {
          id: result.insertId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
        };
      } catch (err) {
        console.warn('[UserModel] MySQL insert failed, using memory fallback:', err.message);
      }
    }

    const newUser = {
      id: nextUserId++,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
    fallbackUsers.push(newUser);
    return { id: newUser.id, name: newUser.name, email: newUser.email };
  }
}

module.exports = UserModel;
