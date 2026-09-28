# Smart AI Crop Doctor 🌾🩺
> **A Lightweight Full-Stack Agriculture Intelligence Platform**
> Built for CSE Final-Year Capstone / AI Vibe Coding Project.

---

## 📋 Executive Overview

**Smart AI Crop Doctor** is a full-stack precision agriculture application designed to help farmers, agronomists, and extension workers identify plant diseases, obtain targeted AI-based treatment prescriptions, monitor microclimate spray safety, interact with an agricultural chatbot, and track historical crop health.

The system is built **100% on free and open-source technologies**, requiring no paid subscriptions, credit cards, or premium tiers.

---

## 🌟 The 5 Core Features

### 1. Plant Disease Detection 📸
- **Technology:** Hugging Face Free Inference API & Google Gemini Vision Pathology Engine.
- **Workflow:** Farmers upload or snap an image of an infected leaf (with optional crop hint). The AI returns the identified crop, disease name, scientific pathogen, severity level, confidence score (0-100%), observable symptoms, and immediate containment steps.
- **Persistence:** Results are auto-saved to the MySQL database.

### 2. AI Recommendations & Prescriptions 🌿
- **Technology:** Google Gemini Free API (`gemini-2.5-flash`).
- **Prescription Structure:**
  - **Immediate Field Protocol:** 3 immediate containment tasks for the next 24 hours.
  - **Organic & Biological Controls:** Preparation, dilution ratio (e.g. Neem Oil 5ml/L), application interval, and efficacy notes.
  - **Chemical Controls:** Recommended active ingredients, precise dosage (g/L or ml/L), pre-harvest withholding period (PHI in days), and personal protective equipment (PPE) guidelines.
  - **Agronomic Prognosis:** Recovery rate percentage, stabilization window, and yield impact risk.
  - **Field Checklist:** Side-by-side DOs and DON'Ts.

### 3. Weather Advisory 🌦️
- **Technology:** OpenWeather Free API (60 calls/min, 1,000 calls/day free tier).
- **Agro-Meteorological Metrics:**
  - **Spraying Safety Index:** Computes whether wind drift or sudden rain wash-off risks pesticide failure.
  - **Fungal Spore Risk Gauge:** Flags high-humidity/temperature thresholds that trigger rapid fungal incubation.
  - **Irrigation Guidance:** Evaluates soil moisture balance to prevent waterlogging or water stress.
  - **5-Day Agricultural Forecast:** Day-by-day temperature range, precipitation chance, and specific farming recommendations.

### 4. Farmer Chatbot Support 💬
- **Technology:** Google Gemini Free API.
- **Role:** Interactive multilingual agronomist extension scientist.
- **Capabilities:** Diagnoses plant symptoms, advises on balanced NPK fertilizer schedules, organic biopesticide preparation, and safe chemical intervals.

### 5. Detection History & Results (MySQL) 🗄️
- **Technology:** MySQL database (`mysql2` connection pool) with resilient in-memory fallback for offline demonstrations.
- **Functionality:**
  - Automatically initializes database and `detections` table upon server startup.
  - Full CRUD capabilities (retrieve, filter by crop, search by pathogen, view detailed diagnosis modal, delete individual record, clear all).
  - One-click CSV export of historical scans for record keeping.

---

## 🧱 Architecture & Project Structure

```
smart-ai-crop-doctor/
├── backend/                         # Standalone Node.js / Express Backend (For Render deploy)
│   ├── src/
│   │   ├── config/db.js             # MySQL connection pool with schema auto-init
│   │   ├── models/detectionModel.js # Detection data access layer
│   │   └── routes/healthRoutes.js   # Health check API
│   ├── server.js                    # Express API entry point (Port 5000)
│   ├── package.json
│   └── .env.example
│
├── frontend/                        # Standalone React / Vite Frontend (For Vercel deploy)
│   ├── src/
│   │   ├── App.jsx                  # Single-Page Agriculture Dashboard
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── src/                             # AI Studio Full-Stack Unified Dev Server
│   ├── server/
│   │   ├── db.ts                    # TypeScript MySQL database engine
│   │   └── aiServices.ts            # Hugging Face, Gemini & OpenWeather integrations
│   ├── App.tsx                      # Production React component
│   ├── main.tsx
│   └── index.css
│
├── server.ts                        # Unified Express + Vite Middleware Dev Server (Port 3000)
├── schema.sql                       # Clean MySQL Database Schema script
├── package.json
├── .env.example
└── README.md
```

---

## 💰 Free & Open-Source Verification Table

| Service / Tool | Purpose | Free Tier Limit | Credit Card Required? |
| :--- | :--- | :--- | :--- |
| **Hugging Face Inference API** | Plant Disease Classification | Free Community Tier | ❌ No |
| **Google Gemini Free API** | Recommendations & Chatbot | 15 RPM / Free Tier | ❌ No |
| **OpenWeather Free API** | Agricultural Weather Advisory | 1,000 calls / day free | ❌ No |
| **MySQL Community Edition** | Persistent Data Storage | Open-Source RDBMS | ❌ No |
| **Render** | Backend Cloud Hosting | 750 free instance hours / month | ❌ No |
| **Vercel** | Frontend Web Hosting | 100GB bandwidth / month free | ❌ No |

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (optional; an internal fallback storage mode is included if local MySQL is inactive)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/smart-ai-crop-doctor.git
cd smart-ai-crop-doctor

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Fill in your free API keys:
```env
# Free Google Gemini API Key: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Free Hugging Face Token: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=your_hf_token_here

# Free OpenWeather API Key: https://home.openweathermap.org/api_keys
OPENWEATHER_API_KEY=your_openweather_api_key_here

# MySQL Configuration (Defaults to localhost:3306)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=smart_ai_crop_doctor
```

### 4. Run Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser to access the full application.

---

## 🌐 Free Cloud Deployment Guide

### A. Deploy Backend to Render (Free Web Service)
1. Push your code to GitHub.
2. Log in to [Render](https://render.com) (Free account, no credit card needed).
3. Click **New > Web Service** and select your repository.
4. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables in the Render dashboard:
   - `GEMINI_API_KEY`
   - `HUGGINGFACE_API_KEY`
   - `OPENWEATHER_API_KEY`
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (Use a free cloud MySQL provider like [Aiven](https://aiven.io) or [TiDB Cloud Free Tier]).

### B. Deploy Frontend to Vercel (Free)
1. Log in to [Vercel](https://vercel.com) with GitHub.
2. Import the repository.
3. Configure settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set Environment Variable:
   - `VITE_API_URL` = `https://your-render-backend-url.onrender.com`
5. Click **Deploy**!

---

## 📜 Academic Attribution
- **Institution:** Computer Science & Engineering Capstone
- **Project Title:** Smart AI Crop Doctor
- **License:** Apache-2.0
