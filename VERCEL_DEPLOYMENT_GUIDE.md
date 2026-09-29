# 🚀 Cineora — Vercel Deployment & Monitoring Guide

This guide explains how to deploy the Cineora web application and cloud API to [Vercel](https://vercel.com) and configure full Vercel Monitoring (Web Analytics, Speed Insights, and Serverless Function Observability).

---

## 🏗 Architecture Overview

Cineora uses a **hybrid edge architecture**:

```
                                  ┌───────────────────────────────┐
                                  │      Vercel Cloud Platform    │
                                  │  ┌─────────────────────────┐  │
                                  │  │   React + Vite SPA      │  │
                                  │  │  (Web Analytics + RUM)  │  │
                                  │  └───────────┬─────────────┘  │
                                  │              │                │
                                  │  ┌───────────▼─────────────┐  │
                                  │  │ Serverless API /api/*   │  │
                                  │  │  - Auth (Login/Register)│  │
                                  │  │  - Profile Switching    │  │
                                  │  │  - Health & Monitoring  │  │
                                  │  │  - Spotify / TMDB Proxy │  │
                                  │  └───────────┬─────────────┘  │
                                  └──────────────┼────────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
                   ▼                             ▼                             ▼
       ┌───────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────────┐
       │     MongoDB Atlas     │   │   Desktop Media Server    │   │  External Cloud APIs    │
       │  (Users, Watchlist,   │   │  (Localtunnel connection) │   │  - TMDB API             │
       │   Devices, History)   │   │  - Local Video/Music      │   │  - Spotify Web API      │
       │                       │   │  - Disk Media Streaming   │   │  - Google Photos API    │
       └───────────────────────┘   └───────────────────────────┘   └─────────────────────────┘
```

1. **Vercel Cloud Edge**: Hosts the React SPA frontend and serverless API endpoints (`/api/auth/*`, `/api/health`, `/api/spotify/*`, `/api/tmdb/*`).
2. **Device Discovery on Login**: When you sign in on Vercel, the API checks MongoDB for your desktop server's registered `tunnelUrl`.
3. **Local Media Streaming**: Heavy media streaming (`/api/stream/:id`) streams directly through your desktop server's secure tunnel URL, keeping your local files on your home machine while enabling worldwide web access.

---

## 📋 Required Environment Variables

Configure these in your Vercel Project Settings under **Settings ➔ Environment Variables**:

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/cineora?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Strong secret string for signing JWT tokens | `generate_with_openssl_rand_hex_32` |
| `NODE_ENV` | Optional | Set runtime mode | `production` |
| `TMDB_API_KEY` | Recommended | TMDB API v3 developer key | `your_tmdb_api_key` |
| `SPOTIFY_CLIENT_ID` | Optional | Spotify developer app Client ID | `your_spotify_client_id` |
| `SPOTIFY_CLIENT_SECRET` | Optional | Spotify developer app Client Secret | `your_spotify_client_secret` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI Chat | `AIzaSy...` |
| `VITE_API_URL` | Optional | Custom API URL (defaults to `/api`) | `/api` |

---

## 🚀 How to Deploy to Vercel

### Method A: Deploy via Vercel Web Dashboard (Recommended)

1. Push your repository to GitHub:
   ```bash
   git push origin development
   ```
2. Open [vercel.com](https://vercel.com) and click **"Add New..." ➔ "Project"**.
3. Select your repository `local-media-server`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: Leave as `./` (or select `frontend` if deploying frontend-only).
   - **Build Command**: `npm run vercel-build` (automatically configured via `vercel.json`).
   - **Output Directory**: `frontend/dist` (automatically configured).
5. In **Environment Variables**, add `MONGO_URI` and `JWT_SECRET` (plus TMDB, Spotify, and Gemini keys if using those features).
6. Click **Deploy**.

---

### Method B: Deploy via Vercel CLI

1. Install the Vercel CLI if not already installed:
   ```bash
   npm install -g vercel
   ```
2. Log in to Vercel:
   ```bash
   vercel login
   ```
3. Deploy to production from the root directory:
   ```bash
   vercel --prod
   ```

---

## 📊 Configuring Vercel Monitoring

### 1. Web Analytics (Real-Time Visitor & Traffic Tracking)
- The `@vercel/analytics` package has been integrated into `frontend/src/App.tsx`.
- **To view metrics:**
  1. Open your project on the [Vercel Dashboard](https://vercel.com).
  2. Navigate to the **"Analytics"** tab.
  3. If not already enabled, click **"Enable Web Analytics"**.
  4. You will see live visitor counts, top pages (`/home`, `/discover`, `/libraries/movies`), referrers, devices, operating systems, and countries.

### 2. Speed Insights (Core Web Vitals & Performance)
- The `@vercel/speed-insights` package has been integrated into `frontend/src/App.tsx`.
- **To view metrics:**
  1. Open your project on the Vercel Dashboard.
  2. Navigate to the **"Speed Insights"** tab.
  3. Click **"Enable Speed Insights"**.
  4. You will receive real-user measurements for:
     - **LCP** (Largest Contentful Paint)
     - **FID / INP** (Interaction to Next Paint)
     - **CLS** (Cumulative Layout Shift)
     - **FCP** (First Contentful Paint)
     - **TTFB** (Time to First Byte)

### 3. Serverless Function Monitoring & Health Check
- A dedicated health check endpoint is active at `/api/health`.
- **Testing the Health Endpoint**:
  ```bash
  curl https://your-cineora-domain.vercel.app/api/health
  ```
  **Response**:
  ```json
  {
    "status": "healthy",
    "service": "cineora-cloud-api",
    "timestamp": "2026-09-29T15:25:00.000Z",
    "uptime": 12.45,
    "database": "connected",
    "environment": "production"
  }
  ```
- **Function Logs & Observability**:
  1. Go to the **"Logs"** tab on your Vercel project page.
  2. Monitor real-time invocation counts, error rates (5xx/4xx), execution durations, and cold starts for `/api/health`, `/api/auth/login`, `/api/spotify/*`, etc.
- **Uptime Monitoring**:
  You can connect `/api/health` to any uptime monitoring service (such as Better Stack, UptimeRobot, or Vercel Cron Jobs) to receive instant notifications if database connectivity is lost.

---

## 🔒 Security Checklist
- [x] Environment files (`.env`) are strictly ignored and never committed to git.
- [x] Production secrets (`MONGO_URI`, `JWT_SECRET`, API keys) must be set in Vercel Project Settings.
- [x] CORS and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) are configured in `vercel.json`.
- [x] All serverless database queries use protected connection reuse (`readyState >= 1`) to prevent connection exhaustion.
