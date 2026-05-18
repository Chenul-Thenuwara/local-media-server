# 🎬 Cineora — Local Media Server

> A self-hosted, cross-platform desktop media hub built on the MERN stack and packaged as an Electron application. Cineora lets you stream your local movies, TV shows, music, and photos from a single beautiful interface — enriched with live metadata from TMDB and Spotify.

[![CI](https://github.com/Chenul-Thenuwara/local-media-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Chenul-Thenuwara/local-media-server/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Electron](https://img.shields.io/badge/Electron-28-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Building for Production](#-building-for-production)
- [Docker Setup](#-docker-setup)
- [Contributing](#-contributing)

---

## 🌟 Overview

Cineora is a **desktop application** that runs a full MERN (MongoDB, Express, React, Node.js) stack locally on your machine. When launched, the Electron shell:

1. Generates a unique persistent **device ID**
2. Opens a **localtunnel** to make your server reachable from other devices
3. Spawns the **Express/Node.js backend** (passing the device ID and tunnel URL)
4. Loads the **React/Vite frontend** in the Electron window

Your local media folders are automatically scanned on startup. Files are matched against TMDB and Spotify for rich metadata (posters, ratings, episode guides, album art) and stored in MongoDB.

---

## ✨ Features

### 🎥 Video
- Stream **movies and TV series** from local storage
- Smart filename parsing detects season/episode numbers (`S01E02`, `1x02`, `E01` formats)
- TMDB-enriched episode guide with season selector, air dates, and synopses
- **4K / HDR / audio codec** badges read from file via FFprobe
- Full-screen video player with seek, volume, and keyboard controls

### 📺 TV Shows
- Per-show episode list sourced from TMDB
- Local file matching by `seasonNumber` / `episodeNumber` stored in DB
- "Available" indicator on episodes you actually own
- Season-level poster and cast carousel

### 🎵 Music
- Local music library with **Spotify enrichment** (album art, duration, genres)
- Expandable full-screen music player (Apple Music-style)
- Mini-player with progress bar while navigating the app
- Spotify Web Playback SDK integration for premium accounts

### 📷 Photos
- Browse and view local photo collections
- Touch/swipe support for photo carousel navigation
- Google Photos integration (OAuth)

### 🔍 Discover / What's New
- **Trending movies & top-rated TV** pulled from TMDB
- **New Spotify album releases** and top tracks
- Tab-based Movies vs Music view with live refresh

### 🤖 AI Chat
- Ask questions about any movie, TV show, or music
- Context-aware media recommendations

### 👥 Multi-User & Admin
- JWT-authenticated multi-user accounts with role separation (`admin` / `user`)
- Profile selection screen on launch
- Admin dashboard: system stats, library management, user management
- Per-device library scoping via `DEVICE_ID`

### ⌚ Watch History & Watchlist
- Automatic watch history tracking per user
- Bookmark titles to a personal watchlist

---

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│              Electron Shell             │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │  main.js    │   │  BrowserWindow  │  │
│  │  (Node.js)  │──▶│  React Frontend │  │
│  └──────┬──────┘   └─────────────────┘  │
│         │ spawns                         │
│  ┌──────▼──────────────────────────┐    │
│  │     Express Backend  :3000      │    │
│  │  ┌──────────────────────────┐   │    │
│  │  │  REST API  /api/*        │   │    │
│  │  │  Scanner Service         │   │    │
│  │  │  TMDB / Spotify Service  │   │    │
│  │  │  Stream Controller       │   │    │
│  │  └──────────┬───────────────┘   │    │
│  └─────────────┼───────────────────┘    │
└───────────────-┼────────────────────────┘
                 │
        ┌────────▼────────┐
        │    MongoDB      │
        │  localhost:27017│
        └─────────────────┘
```

The frontend talks to the backend exclusively via `http://localhost:3000/api`. In production (packaged), the backend also serves the frontend's static `dist/` folder.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Desktop Shell** | Electron 28 |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 3 |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Routing** | React Router DOM v7 |
| **Backend** | Node.js 20, Express 5, TypeScript |
| **Database** | MongoDB 8, Mongoose 9 |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Media Processing** | FFmpeg (fluent-ffmpeg, ffprobe-static) |
| **Metadata APIs** | TMDB API, Spotify Web API |
| **Music Playback** | Spotify Web Playback SDK |
| **Photos** | Google Photos API (OAuth 2.0) |
| **Tunneling** | localtunnel (remote access) |
| **Testing (BE)** | Jest, ts-jest, Supertest |
| **Testing (FE)** | Vitest, Testing Library |
| **CI/CD** | GitHub Actions |
| **Packaging** | electron-builder (NSIS installer for Windows) |

---

## 📁 Project Structure

```
local-media-server/
├── main.js                    # Electron entry point
├── package.json               # Root: Electron + electron-builder config
├── docker-compose.yml         # Docker dev environment
│
├── backend/                   # Express + TypeScript API server
│   ├── src/
│   │   ├── controllers/       # Route handler logic
│   │   │   ├── mediaController.ts
│   │   │   ├── streamController.ts
│   │   │   ├── authController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── historyController.ts
│   │   │   └── ...
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── Media.ts       # Movie/TV/Music/Photo documents
│   │   │   ├── User.ts
│   │   │   ├── Library.ts
│   │   │   └── ...
│   │   ├── routes/            # Express routers
│   │   ├── services/
│   │   │   ├── scannerService.ts   # File system scanner + FFprobe
│   │   │   ├── tmdbService.ts      # TMDB metadata fetcher
│   │   │   └── spotifyService.ts   # Spotify enrichment
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts   # JWT protect middleware
│   │   ├── tests/
│   │   │   └── health.test.ts
│   │   └── index.ts           # App entry, DB connect, startup scan
│   └── package.json
│
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── app/           # Authenticated pages
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── MovieDetail.tsx
│   │   │   │   ├── Search.tsx
│   │   │   │   ├── Notifications.tsx  # What's New (TMDB + Spotify)
│   │   │   │   ├── AiChat.tsx
│   │   │   │   ├── Watchlist.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   ├── GooglePhotos.tsx
│   │   │   │   └── libraries/  # Movies, TV, Music library views
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   └── public/         # Login, Register, Welcome
│   │   ├── components/
│   │   │   ├── media/          # MediaCard, SeasonView, CastCarousel, etc.
│   │   │   ├── player/         # VideoPlayer, MusicPlayer
│   │   │   └── ui/             # Button, Badge, shared UI primitives
│   │   ├── hooks/
│   │   │   └── useSpotifyPlayer.ts
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx   # Sidebar navigation
│   │   └── lib/
│   │       └── api.ts          # Axios instance
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
│
└── media/                     # Default local media directory
```

---

## ✅ Prerequisites

Before you begin, make sure you have installed:

- **Node.js** v20.x or higher — [nodejs.org](https://nodejs.org)
- **npm** v10+
- **MongoDB** running locally on port `27017` (or use Docker)
- **Git**

### Optional (for full feature support)
- **TMDB API Key** — [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) (free)
- **Spotify Developer App** — [developer.spotify.com](https://developer.spotify.com/dashboard) (for music features)
- **Google OAuth Credentials** — for Google Photos integration

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Chenul-Thenuwara/local-media-server.git
cd local-media-server
```

### 2. Install all dependencies

```bash
# Root (Electron)
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your API keys (see [Environment Variables](#-environment-variables) below).

### 4. Start MongoDB

```bash
# Option A: Docker (recommended)
docker run -d -p 27017:27017 --name mongo mongo:latest

# Option B: If MongoDB is installed locally, it starts automatically
```

### 5. Run the application (development)

```bash
# From the project root — starts frontend (Vite), backend (ts-node), and Electron together
npm start
```

This runs:
- **Frontend** dev server at `http://localhost:5173` (Vite HMR)
- **Backend** API server at `http://localhost:3000`
- **Electron** window loading from Vite

> On first launch, the backend will scan all registered library folders and populate MongoDB.

---

## 🔐 Environment Variables

Create `backend/.env` with the following keys:

```env
# ─── Server ───────────────────────────────────────────
PORT=3000

# ─── Database ─────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/lms

# ─── Authentication ───────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here

# ─── TMDB (Movie/TV Metadata) ─────────────────────────
TMDB_API_KEY=your_tmdb_api_key_here

# ─── Spotify ──────────────────────────────────────────
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/auth/callback

# ─── Google Photos (Optional) ─────────────────────────
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-photos/callback

# ─── Device (auto-set by Electron, leave blank for dev) ─
DEVICE_ID=
TUNNEL_URL=
```

### Obtaining API Keys

| Service | Where to get it |
|---|---|
| **TMDB** | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) — free, instant |
| **Spotify** | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) — create an app, copy Client ID & Secret |
| **Google** | [console.cloud.google.com](https://console.cloud.google.com) — enable Photos Library API, create OAuth credentials |

---

## 📜 Available Scripts

### Root

| Command | Description |
|---|---|
| `npm start` | Start Electron app in dev mode (frontend + backend + Electron) |
| `npm run dev:frontend` | Start only the Vite dev server |
| `npm run dev:backend` | Start only the Express backend with nodemon |
| `npm run build` | Build both frontend and backend for production |
| `npm run pack` | Build + package into unpacked Electron app |
| `npm run dist` | Build + create distributable installer (NSIS on Windows) |

### Backend (`cd backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on file changes) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm test` | Run Jest test suite |

### Frontend (`cd frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + build production bundle |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest test suite |
| `npm run preview` | Preview production build locally |

---

## 🌐 API Reference

All endpoints are prefixed with `/api`. JWT token required for protected routes (send as `Authorization: Bearer <token>`).

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Login, returns JWT token |

### Media
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/media` | List all media (filterable by `?type=movie\|tv\|music\|photo`) |
| `GET` | `/api/media/recent` | Recently added media |
| `GET` | `/api/media/tv/:tmdbId/episodes` | All local episodes for a TV show |
| `GET` | `/api/media/:id` | Single media item by MongoDB ID |

### Streaming
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stream/:id` | Stream a media file (supports Range requests) |

### Libraries
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/libraries` | List all user libraries |
| `POST` | `/api/libraries` | Add a new library folder |
| `DELETE` | `/api/libraries/:id` | Remove a library |

### TMDB
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tmdb/trending` | Trending movies |
| `GET` | `/api/tmdb/search` | Search movies/TV (`?type=movie\|tv&orderBy=...`) |
| `GET` | `/api/tmdb/movie/:id` | Movie detail + credits |
| `GET` | `/api/tmdb/tv/:id` | TV show detail + seasons |
| `GET` | `/api/tmdb/tv/:id/season/:num` | Season episode list |

### Spotify
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spotify/new-releases` | New album releases |
| `GET` | `/api/spotify/search` | Search tracks/albums (`?q=...&type=track`) |
| `GET` | `/api/spotify/auth/login` | Begin OAuth flow |
| `GET` | `/api/spotify/auth/callback` | OAuth callback |

### Watchlist & History
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/watchlist` | Get user's watchlist |
| `POST` | `/api/watchlist` | Add item to watchlist |
| `DELETE` | `/api/watchlist/:id` | Remove from watchlist |
| `GET` | `/api/history` | Watch history |
| `POST` | `/api/history` | Record a watch event |

### Admin (admin role required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | System stats (users, media counts, storage) |
| `GET` | `/api/admin/users` | List all users |
| `POST` | `/api/admin/scan` | Trigger manual library scan |

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** with two parallel jobs that run on every push or pull request to `main` or `development`.

```yaml
# .github/workflows/ci.yml
Frontend Job:
  - npm ci
  - npm run lint     # ESLint strict checking
  - npm test         # Vitest unit tests
  - npm run build    # tsc + Vite production build

Backend Job:
  services:
    - MongoDB (mongo:latest container)
  steps:
  - npm ci
  - npm run build    # TypeScript compilation
  - npm test         # Jest + Supertest integration tests
```

Both jobs run on **Node.js 20.x** on `ubuntu-latest`. The backend job spins up a live MongoDB service container so integration tests run against a real database.

---

## 📦 Building for Production

### Windows Installer (NSIS)

```bash
# From the project root
npm run dist
```

This will:
1. Compile the TypeScript backend → `backend/dist/`
2. Build the React frontend → `frontend/dist/`
3. Package everything with `electron-builder` into `dist/`
4. Output a Windows NSIS installer: `dist/Local Media Server Setup x.x.x.exe`

The installer bundles:
- The Electron shell
- Compiled backend (`backend/dist/`)
- Built frontend (`frontend/dist/`)
- All backend `node_modules`

> **Note:** The `backend/.env` file is copied into the packaged app as `resources/.env`. Make sure it contains your production API keys before building.

### Unpacked (for testing)

```bash
npm run pack
```

Outputs an unpacked app directory in `dist/` without creating an installer.

---

## 🐳 Docker Setup

A `docker-compose.yml` is provided for running the backend and MongoDB in containers during development.

```bash
# Start MongoDB + Backend + Frontend in Docker
docker compose up

# Or just MongoDB (recommended for local dev)
docker compose up mongodb
```

Services:
| Service | Port | Description |
|---|---|---|
| `mongodb` | `27017` | MongoDB with persistent volume |
| `backend` | `3000` | Express API server |
| `frontend` | `5173` | Vite dev server |

> The Docker setup mounts your entire `C:\` drive at `/media/c` inside the container, so the backend can scan Windows media folders.

---

## 🗺 How Media Scanning Works

On startup (and on-demand via Admin → Scan), the `scannerService` recursively walks all registered library folders:

1. **Detects file type** by extension (video / music / photo)
2. **For video files**: detects `movie` vs `tv` using filename patterns (`S01E02`, `1x02`, `E01`)
3. **Extracts technical metadata** via FFprobe (resolution, codec, HDR, audio channels)
4. **Fetches TMDB metadata**: strips quality tags from the filename and searches TMDB `/search/multi`
5. **For TV episodes**: parses and stores `seasonNumber` + `episodeNumber` in MongoDB
6. **For music**: searches Spotify for track/album art and duration
7. Saves everything to MongoDB under the user's library

Supported formats:

| Type | Extensions |
|---|---|
| Video | `.mp4` `.mkv` `.avi` `.mov` `.webm` `.m4v` `.flv` |
| Music | `.mp3` `.flac` `.aac` `.m4a` `.ogg` `.wav` `.wma` `.opus` |
| Photo | `.jpg` `.jpeg` `.png` `.gif` `.webp` `.heic` `.bmp` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure all checks pass:
   ```bash
   cd frontend && npm run lint && npm test && npm run build
   cd ../backend && npm run build && npm test
   ```
4. Commit using a clear message: `git commit -m "feat: add your feature"`
5. Push and open a Pull Request against `development`

### Branch Strategy
- `main` — stable, production-ready releases
- `development` — active development, all PRs target this branch

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Built with ❤️ for PUSL3190 — University of Plymouth / NSBM Green University</p>