# VELO AI — Voice-First AI Bike Taxi Booking Platform

VELO AI is an urban bike taxi booking web application inspired by Rapido and Ola, featuring **voice-first AI booking** in English and Tamil as its core differentiator. Built with a dark forest-green aesthetic, electric lime accents, responsive mobile-first UI, real-time map tracking, server-authoritative fare estimation, and role-based access for passengers, bike captains, and administrators.

---

## 🌟 Key Features

### 1. Voice-First Conversational Booking Assistant
- **Bilingual Voice Engine**: Native speech-to-text and text-to-speech supporting **English** and **Tamil** (`ta-IN`).
- **Interactive Visual Feedback**: Audio wave visualizer and glowing microphone with explicit states: `idle`, `listening`, `processing`, `speaking`, and `error`.
- **Intelligent Disambiguation**: Asks clarifying questions for ambiguous destinations (e.g., *"Which railway station do you mean? Chennai Central or Egmore Station?"*).
- **Conversational Context & Commands**:
  - Change destinations on the fly (*"Change drop to Marina Beach"*)
  - Repeat fare breakdown (*"How much is the fare?"*)
  - Check live trip status (*"Where is my driver?"*)
  - Cancel pending ride requests (*"Cancel my ride"*)
- **Safety First**: Never treats ambiguous speech as consent. Requires explicit confirmation (*"Yes, book it"* / *"ஆம், புக் செய்"*) before creating bookings.
- **Dual Mode**: Seamlessly toggle between voice commands and manual keyboard search.

### 2. Real-Time Interactive Maps & Tracking
- **Dark Forest CartoDB/Leaflet Maps**: Custom dark theme with road polyline paths and pulse marker pins.
- **Live Captain Fleet**: Real-time GPS coordinates for online captains nearby (Chennai Central, T. Nagar, Marina Beach, Velachery, Guindy, Airport).
- **Browser Geolocation**: One-click GPS location detection with fallback geocoding.
- **Search Autocomplete**: Pre-indexed transit hubs, IT parks, beaches, and shopping districts across Chennai with English and Tamil aliases.

### 3. Server-Authoritative Fare Engine
- **Transparent Fare Breakdown**:
  - Base fare (first 1.5 km: ₹25)
  - Distance rate (₹11.50 per km)
  - Travel time charge (₹1.50 per min)
  - Night-time multiplier (1.15x between 10:00 PM and 5:00 AM)
  - Peak surge pricing multiplier (1.0x to 2.5x)
  - Minimum fare enforcement (₹35)
- **4-Digit Safety PIN (OTP)**: Randomly generated OTP required by the driver before trip commencement.

### 4. Tri-Role Platform Architecture
- **Passenger (Customer)**: Search routes, talk to voice assistant, track live driver arrival, view digital receipts, rate drivers, configure emergency contacts.
- **Captain (Driver Partner)**: Onboarding status, online/offline switch, live incoming ride requests with sound/visual alerts, OTP verification, earnings telemetry.
- **Operations Admin**: System-wide telemetry (gross revenue, active trips, fleet availability), live trips table, driver license verification approvals, and dynamic fare rule calibration.

### 5. Passenger Safety & Emergency SOS Console
- Emergency SOS modal with direct links to **National Emergency Number (112)**.
- Real-time trip sharing link generator for friends and family.
- Editable emergency contact configuration (e.g. Sister, Parent).
- Simulated rapid dispatch escalation alert to VELO Safety Response Team.
- Prominent safety disclaimer noting simulated vs. physical emergency actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet, Canvas Confetti |
| **Backend** | Node.js, Express, CORS, Express-Rate-Limit, Dotenv |
| **AI & NLP** | OpenAI GPT-4o-mini structured output + Built-in Tamil/English Rule-Based Fallback NLP Engine |
| **Speech APIs** | Web Speech API (`SpeechRecognition`, `webkitSpeechRecognition`, `speechSynthesis`) |
| **Database & Auth** | Supabase PostgreSQL, Row Level Security (RLS) policies, Realtime, In-Memory Local Store |
| **Deployment** | Vercel (Frontend), Render / Railway / Node.js (Backend) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ (tested on v22.19.0)
- **npm** v9+

### 1. Install Dependencies
In the root directory, install server and client packages:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables
Create a `.env` file in the `server` directory (or copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

# Optional: Add your OpenAI API key for GPT-4o reasoning (works with local fallback if empty)
OPENAI_API_KEY=

# Optional: Supabase credentials (in-memory persistent store active if empty)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Start the Platform
In two separate terminals:

**Terminal 1 — Backend Server:**
```bash
cd server
node src/index.js
```
*Server starts at `http://localhost:5000`*

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
```
*Vite dev server starts at `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated End-to-End Test Suite

Run the 25-point comprehensive test suite verifying the complete ride lifecycle:
```bash
node server/test/api.test.js
```
**Test Coverage Includes:**
- System health checks (`/health`)
- Location autocomplete and geocoding (`/api/locations/autocomplete`)
- Server-authoritative fare estimation (`/api/rides/estimate`)
- Bilingual voice AI intent interpretation & disambiguation (`/api/ai/intent`)
- Ride creation, driver acceptance, arriving status, OTP verification, completion, and rating
- Admin telemetry and dynamic fare calibration

---

## 🗄️ Supabase Database Setup & Migrations

The database migration file is located at `supabase/migrations/001_initial_schema.sql` and seed data at `supabase/seed.sql`.

### Tables Created:
1. `profiles`: Customer, driver, and admin profiles with emergency contacts.
2. `vehicles`: Captain bikes (Honda Activa, TVS Apache, Bajaj Pulsar) with helmet status.
3. `driver_profiles`: Captain license, verification status, rating, earnings, and online status.
4. `driver_locations`: Real-time GPS coordinate telemetry.
5. `fare_rules`: City-level configurable fare algorithms and surge rates.
6. `rides`: Full booking lifecycle, pickup/destination coordinates, fares, and OTP.
7. `ride_events`: Audit trail for status transitions.
8. `ratings`: 5-star passenger reviews and feedback.
9. `notifications`: In-app safety and booking alerts.

### Apply Migrations in Supabase:
1. Create a project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and run.
4. Paste the contents of `supabase/seed.sql` to populate sample Chennai captains and fare rules.
5. Copy your project URL and Anon key into `server/.env`.

---

## 📱 Application Routes

| Route | Role | Description |
|---|---|---|
| `/` | Customer | Booking home, animated voice mic, map, autocomplete, fare card |
| `/login` | All | 1-Click test persona switcher (Karthik, Senthil, Admin Velo) + Email Auth |
| `/bookings` | Customer | Past trips, receipts, distance, driver details, ratings |
| `/ride/:id` | Customer | Live tracking, captain details, 4-digit OTP, fast-forward simulation |
| `/driver` | Driver | Online/Offline toggle, earnings, incoming requests, OTP start, complete trip |
| `/admin` | Admin | Platform telemetry, trips monitor, driver license approval, fare rule editor |

---

## 🌐 Production Deployment

### Deploying Frontend to Vercel:
1. Push code to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable `VITE_API_URL` pointing to your deployed backend.

### Deploying Backend to Render / Railway:
1. Create a new Web Service pointing to the `server/` directory.
2. Build command: `npm install`
3. Start command: `node src/index.js`
4. Configure environment variables (`PORT`, `OPENAI_API_KEY`, `SUPABASE_URL`, etc.).

---

## 🛡️ Safety & Reliability Precautions
- **No False Dispatches**: Demo mode is clearly labelled, displaying seeded captains when live dispatch is offline.
- **Explicit Consent Required**: The assistant will never book a ride without verbal confirmation ("Yes, book it" / "ஆம், புக் செய்").
- **OTP Protection**: Drivers cannot start rides without passenger PIN verification.
- **Emergency 112 Direct Access**: The SOS screen provides genuine one-tap emergency calling to 112 alongside simulated platform escalations.
