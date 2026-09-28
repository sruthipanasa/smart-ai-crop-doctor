-- =======================================================
-- Smart AI Crop Doctor - MySQL Database Schema
-- Precision Agriculture Intelligence Platform
-- =======================================================

CREATE DATABASE IF NOT EXISTS `smart_ai_crop_doctor` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `smart_ai_crop_doctor`;

-- Users Table: Secure user authentication records
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detections Table: Stores plant disease classifications, user association, and prescriptions
CREATE TABLE IF NOT EXISTS `detections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `crop` VARCHAR(100) NOT NULL,
  `disease` VARCHAR(150) NOT NULL,
  `confidence` FLOAT NOT NULL,
  `severity` VARCHAR(50) DEFAULT 'Moderate',
  `symptoms` TEXT,
  `recommendations` TEXT,
  `image_url` LONGTEXT,
  `weather_context` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crop (`crop`),
  INDEX idx_user_id (`user_id`),
  INDEX idx_created_at (`created_at`),
  CONSTRAINT `fk_detections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Seed User (Password: Password123! hashed with bcrypt)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`) VALUES
(1, 'Alex Farmer', 'farmer@cropdoctor.org', '$2a$10$wO3P8BqZfT7n4CjWz63fNuP7FvT8t8j9Y.v6uL3kR6L6uG2F8m8eK');

-- Sample Seed Detections linked to the demo user
INSERT INTO `detections` (`user_id`, `crop`, `disease`, `confidence`, `severity`, `symptoms`, `recommendations`, `image_url`, `weather_context`) VALUES
(1, 'Tomato', 'Late Blight (Phytophthora infestans)', 0.94, 'High', 'Dark water-soaked lesions on foliage, whitish downy sporulation on undersides of leaves.', 'Apply Copper Hydroxide (2.5g/L). Remove affected leaves. Switch to drip irrigation.', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=400&q=80', 'High humidity (>85%), 21°C'),
(1, 'Potato', 'Early Blight (Alternaria solani)', 0.89, 'Moderate', 'Concentric rings with target board appearance on older foliage.', 'Apply Azoxystrobin or Chlorothalonil. Maintain balanced potassium fertility.', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80', 'Moderate humidity, 26°C'),
(1, 'Corn (Maize)', 'Common Rust (Puccinia sorghi)', 0.91, 'Moderate', 'Cinnamon brown powdery pustules scattered on leaf surfaces.', 'Utilize rust-resistant hybrids. Apply triazole fungicide prior to silking if severe.', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80', 'Cool night dew with warm days');
