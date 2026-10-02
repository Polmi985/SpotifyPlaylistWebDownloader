# 🎵 Spotify Playlist Downloader (Web Edition)

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Express](https://img.shields.io/badge/Express-5-000000.svg)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)

**A fast, modern, and minimalist web application for downloading Spotify playlists, albums, and tracks directly to high-quality audio files (MP3 320kbps, WAV, FLAC) in a single ZIP archive.**

[Features](#-features) • [Quick Start](#-quick-start) • [Configuration](#-configuration-env) • [Production](#-production-deployment) • [Project Structure](#-project-structure) • [API Reference](#-api-reference)

</div>

---

## ✨ Features

- 🎧 **Direct Spotify Conversion**: Supports public Spotify **Playlists**, **Albums**, and **Single Tracks** (`open.spotify.com/...` or `spotify:...` URIs).
- 🔊 **Multiple Audio Formats & Bitrates**:
  - **MP3 (320 kbps)**: High-quality audio for phones, cars, and everyday listening.
  - **MP3 (128 kbps)**: Compact export tuned for smaller ZIP files.
  - **WAV**: Uncompressed 16-bit PCM audio.
  - **FLAC**: Studio Lossless audio with archive-grade fidelity.
- ⚡ **Web Application Architecture**: Pure client-server stack (React + Vite + Express 5 in ES Modules) with zero desktop overhead.
- 📦 **One-Click Batch ZIP Packaging**: Automatically packages all converted tracks into a single `.zip` archive.
- 🔄 **Real-time SSE Progress Streaming**: Live Server-Sent Events for real-time progress and logs.
- 🔁 **Smart Retry**: One-click retry mechanism for tracks that failed or timed out during conversion.
- 🎨 **Sleek Dark Theme UI**: Minimalist aesthetic built with Tailwind CSS, Radix UI, and Lucide icons.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Backend API**: [Express 5](https://expressjs.com/), [Node.js](https://nodejs.org/) (ES Modules)
- **Audio Extraction & Processing**: [yt-dlp-exec](https://github.com/microlinkhq/yt-dlp-exec), [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static), [youtubei.js](https://github.com/LuanRT/YouTube.js)
- **Spotify Metadata**: [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node)
- **Archiving**: [archiver](https://github.com/archiverjs/node-archiver)

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- `npm`

### 1. Clone & Install

```bash
git clone https://github.com/your-username/spotify-playlist-downloader.git
cd spotify-playlist-downloader
npm install
```

### 2. Create `.env` File

Create a file named `.env` in the root folder of the project:

```env
PORT=5000
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

> **Note:** Get your Spotify credentials by creating a free app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

### 3. Run in Development Mode

```bash
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `5000` | No | Port for the Express backend server |
| `SPOTIFY_CLIENT_ID` | Built-in fallback | Recommended | Spotify Developer Client ID |
| `SPOTIFY_CLIENT_SECRET` | Built-in fallback | Recommended | Spotify Developer Client Secret |
| `DOWNLOAD_DIR` | `./downloads` | No | Custom folder for temporary downloads & ZIP archives |
| `VITE_API_URL` | *(empty / proxy)* | No | Custom API URL if hosting frontend separately |

---

## 📦 Production Deployment

```bash
# 1. Build the production frontend into /dist
npm run build

# 2. Start the Express production server (serves API & static frontend)
npm start
```

The web application will be accessible at `http://localhost:5000`.

---

## 📁 Project Structure

```text
spotify-playlist-downloader/
├── .env                     # Local environment config (created manually, git-ignored)
├── .gitignore               # Git ignored rules (.env, downloads, dist, node_modules)
├── index.html               # Frontend HTML root
├── package.json             # NPM dependencies & run scripts
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite bundler & API proxy configuration
├── vitest.config.ts         # Vitest configuration
│
├── public/                  # Static assets (favicon.ico, robots.txt)
│
├── server/                  # Backend Express Server (ESM)
│   ├── index.js             # Server entry point & static SPA handler
│   └── routes/
│       └── downloader.js    # Downloader API, Spotify resolver, yt-dlp & SSE streaming
│
└── src/                     # Frontend React Application
    ├── App.tsx              # Root component & router
    ├── main.tsx             # React entry point
    ├── components/          # React components
    │   ├── DownloadComplete.tsx # ZIP download & completion screen
    │   ├── Header.tsx           # Top navigation bar
    │   ├── HeroSection.tsx      # URL input & audio format presets
    │   ├── ProgressDashboard.tsx# Live download progress & tracklist
    │   ├── TrackItem.tsx        # Track status row
    │   └── ui/                  # Reusable UI primitives (Button, Card, Toast...)
    ├── hooks/               # Custom React hooks
    ├── lib/                 # Utilities & format options
    ├── pages/               # App views (Index, NotFound)
    └── test/                # Unit tests
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning status and server uptime |
| `GET` | `/api/downloader/stats` | Global download and processed playlist counts |
| `POST` | `/api/downloader/start` | Initiates extraction (`{ playlistUrl, format, quality }`) |
| `GET` | `/api/downloader/stream/:id` | Real-time Server-Sent Events (SSE) progress stream |
| `GET` | `/api/downloader/download/:id` | Downloads the generated ZIP archive |
| `POST` | `/api/downloader/retry-failed` | Retries failed tracks for an existing session |
| `POST` | `/api/downloader/cancel` | Cancels an ongoing download process |
| `POST` | `/api/downloader/cleanup` | Cleans up temporary downloaded files and archive |

---

## 🧪 Tests & Linting

```bash
# Run unit tests
npm test

# Run linter
npm run lint
```

---

## 📄 License & Disclaimer

This software is for personal educational and archiving purposes only. Please respect the copyright of music artists and streaming platforms.
