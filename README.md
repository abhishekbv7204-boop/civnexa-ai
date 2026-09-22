# CivNexa AI 🏛️
### Intelligent Civic Grievance Triage, Tracking & Resolution Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)

---

## 📌 Project Overview

**CivNexa AI** is a production-grade, full-stack civic technology web application that connects citizens with municipal municipal authorities. It bridges the gap between public grievance submission and municipal remediation through automated AI triage, multi-language speech interaction, strict Service Level Agreement (SLA) tracking, and two-way verification workflows.

Rather than letting community issues languish in opaque government queues, CivNexa AI transforms every grievance into a trackable, audited case file with geolocation mapping, automated department assignment, and citizen confirmation before closure.

---

## ✨ Key Capabilities & Features

### 1. 🎙️ Multilingual AI Voice Assistant
- Voice-enabled reporting supporting **English**, **Hindi (हिंदी)**, and **Kannada (ಕನ್ನಡ)**.
- Integrated Web Speech recognition with smart natural language understanding (NLU).
- Extracts problem category, landmark, and description directly from voice input.
- 1-click **"Apply to Grievance Form"** pre-fills the complaint submission wizard automatically.

### 2. 🧠 AI Image Verification & Fraud Detection (Google Gemini)
- Inspects uploaded complaint photos using server-side Gemini Vision models.
- Analyzes authenticity, validates whether the photo depicts a genuine civic hazard (e.g. pothole, sewage, damaged pole), and estimates damage severity.
- Detects non-civic photos, internet stock images, or irrelevant uploads to prevent spam.

### 3. 🔍 Smart Duplicate Detection & Clustering
- Automatically checks for existing complaints within a 150-meter radius in the same category.
- Prompts citizens to upvote existing issues rather than fragmenting municipal resources with duplicate tickets.

### 4. ⏱️ SLA Countdown & Automated Escalation Engine
- Dynamic resolution timers based on hazard priority:
  - **Critical**: 24 hours (immediate hazard to life or transit)
  - **High**: 48 hours
  - **Medium**: 72 hours
  - **Low**: 120 hours
- Real-time countdowns alert municipal officers to urgent cases.
- Automatic **Level 1 (Supervisor)** and **Level 2 (Department Head)** escalation when deadlines are breached.

### 5. 🗺️ Interactive Civic GIS Map (Leaflet)
- Interactive, cluster-enabled map displaying civic issues across municipal wards.
- Color-coded hazard markers with instant status filtering (Pending, In Progress, Resolved).
- Geolocation pinpointing with reverse geocoding to address landmarks.

### 6. 🛡️ Municipal Administration Console
- Dedicated authority workflow to triage incoming citizen reports.
- Filter by **Municipal Ward**, **Category**, **Priority**, and **SLA Status**.
- Route and assign complaints to specialized departments (Roads, Solid Waste, Drainage, Electricity, Traffic).
- Upload proof of resolution (photographs and engineering notes) before status changes.

### 8. 🔥 Firebase Authentication & Cloud Firestore Persistence
- **Google Sign-In**: 1-click Google authentication via Firebase Auth with automatic role sync.
- **Cloud Firestore**: Real-time database persistence for citizen complaints and saved issues alongside local JSON caching.
- **Security Rules**: Robust declarative `firestore.rules` enforcing role-based access control and user isolation.

### 9. 🌐 Live Google Search Grounding (Gemini 3.5 Flash)
- **Municipal Policy & Bylaw Retrieval**: Real-time Search Grounding connecting queries to official city notices, waste segregation guidelines, and repair SLAs.
- **Verified Sources & Web Badges**: Displays clickable source links directly in the UI for complete transparency.

### 10. 🗺️ Live Google Maps Grounding (Gemini 3.5 Flash)
- **Geo-Facility Grounding**: Queries Google Maps Grounding to discover nearby BBMP Ward Offices, PWD maintenance depots, and emergency response desks.
- **Interactive Links & Directions**: Displays clickable Google Maps URLs (`groundingChunks.maps.uri`) and user review snippets for immediate route guidance.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Motion (`motion/react`), Lucide React |
| **Mapping** | Leaflet, OpenStreetMap Tile Provider |
| **Backend API** | Node.js, Express 4, TypeScript (`tsx` in dev, `esbuild` in prod) |
| **AI & Vision** | Google Gen AI SDK (`@google/genai`), Gemini 2.5 Flash |
| **Data Storage** | File-backed ACID-compliant JSON datastore (`data/civnexa_data.json`) with pre-seeded wards and grievances |
| **Internationalization** | Trilingual engine supporting English, Hindi, and Kannada |

---

## 📂 Project Directory Structure

```text
├── data/
│   └── civnexa_data.json       # Pre-seeded database (wards, departments, complaints, users)
├── firebase-applet-config.json  # Firebase client credentials
├── firebase-blueprint.json      # Firestore schema blueprint
├── firestore.rules              # Firestore security access control rules
├── public/                      # Static assets and favicons
├── server/
│   ├── db.ts                    # File-based JSON database engine
│   ├── gemini.ts                # Gemini AI vision, search & maps grounding pipeline
│   └── notifications.ts         # Automated SMS/Email dispatch simulator
├── src/
│   ├── components/              # Modular UI components (Grounding advisors, Map, Header, Badges)
│   ├── context/                 # AuthContext (Firebase Google Auth & local accounts)
│   ├── pages/                   # Application views (Report, Track, GIS Map, Dashboards, Help)
│   ├── services/
│   │   ├── api.ts               # Typed client-side API layer
│   │   └── firebase.ts          # Firebase Auth and Firestore integration
│   ├── types.ts                 # Full domain TypeScript declarations
│   ├── i18n.ts                  # Localization dictionaries (en, hi, kn)
│   ├── App.tsx                  # Root layout & view controller
│   ├── main.tsx                 # Client bootstrap
│   └── index.css                # Tailwind CSS imports
├── index.html                   # HTML entry point with Leaflet styles & meta tags
├── server.ts                    # Express backend server & Vite middleware bridge
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration
├── metadata.json                # Application metadata
├── .env.example                 # Environment variables specification
├── .gitignore                   # Files excluded from Git version control
└── package.json                 # Dependencies and execution scripts
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/civnexa-ai.git
cd civnexa-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file to create a local `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
APP_URL="http://localhost:3000"
```
*(Note: If no Gemini API key is provided, the application will automatically fall back to intelligent heuristic simulation for demo purposes).*

### 4. Start the Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:3000`**.

---

## 🔒 Security & Environment Variables

**NEVER commit your `.env` file to version control.**

CivNexa AI relies on several sensitive credentials to function. To securely configure the app locally without risking exposure on GitHub:

1. Copy `.env.example` to `.env` using `cp .env.example .env`.
2. Open `.env` and fill in your actual API keys (e.g., your Gemini API key and Firebase credentials).
3. The `.env` file is explicitly ignored in `.gitignore`, preventing it from being pushed. 

Always keep your API keys and credentials out of public repositories.

---

## 🔑 Demo Accounts

Use these pre-configured credentials to test different system roles:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Citizen** | `citizen@civnexa.org` | `citizen123` | Submit issues, track personal tickets, rate resolutions, reopen cases |
| **Authority** | `admin@civnexa.org` | `admin123` | Triage queue, assign departments, upload resolution proof, manage SLAs |

*(You can also register a new account instantly via the Register page).*

---

## 🛠️ Available Scripts

- `npm run dev` — Starts the Express backend and Vite frontend concurrently with hot-reloading on port 3000.
- `npm run build` — Builds the production Vite bundle and compiles the Node.js server via `esbuild`.
- `npm start` — Runs the compiled production server from `dist/server.cjs`.
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`) to verify zero type errors.
- `npm run clean` — Deletes previous build artifacts (`dist/`).

---

## 📦 What to Push to GitHub vs What to Ignore

When pushing to your GitHub repository:

### ✅ Files to INCLUDE in your Git Commit:
- All source code in `src/` and `server/`
- `data/civnexa_data.json` (essential for out-of-the-box local database records)
- `public/` assets
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `server.ts`
- `metadata.json`
- `.env.example`
- `.gitignore`
- `README.md`

### ❌ Files to EXCLUDE from your Git Commit (Covered by `.gitignore`):
- `node_modules/` (Never push dependencies; install them via `npm install`)
- `dist/` or `build/` (Compiled production binaries)
- `.env` or `.env.local` (Contains private API keys)
- `*.log` (Debug log outputs)
- `.DS_Store` / `Thumbs.db` (OS system cache files)

---

## 📄 License
This project is open-source and available under the **MIT License**.
