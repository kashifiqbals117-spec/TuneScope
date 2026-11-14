# TuneScope 🎵 — Music Intelligence & Social Analytics

TuneScope is a music intelligence and social music application inspired by Spotify Wrapped and Tunesimo. It unites personal music telemetry, listening history, discovery patterns, annual and weekly Wrapped-style recaps, social listening circles, friend activity feeds with real-time song reactions, and deep music taste matchmaking.

---

## 🌟 Product Vision & Features

### 1. Personal Music Analytics
- **Listening Duration**: Total minutes, hours, days, daily averages, and active listening streaks.
- **Top Artists & Anthems**: Deep ranking with loyalty metrics and discography replay shares.
- **Audio Vibe Profiling**: Danceability, Energy, Valence, Acousticness, and Tempo analysis.
- **Sonic Diversity Score**: Shannon entropy index measuring genre variety across catalog listening.
- **24-Hour Rhythm**: Hourly distribution breakdown with peak hour identification and "Night Owl" scoring.

### 2. Music Discovery & Trajectory
- **Discovery Velocity**: Quantifies new artists introduced per week.
- **First-Listen Timeline**: Interactive chronological roadmap of newly discovered musicians.
- **Multi-Dimensional Genre Radar**: Radar visualizations plotting audio DNA and genre spread.

### 3. Wrapped-Style Recaps (Yearly & Weekly)
- **Interactive Story Mode**: Full-screen, slide-by-slide animated Wrapped experience with progress bars, keyboard navigation, and audio ambiance simulation.
- **Persona Reveal**: Personalized sonic archetypes (e.g. *The Cosmic Explorer*, *The Late Night Dreamer*, *The Electronic Purist*).
- **Shareable Snapshots**: Exportable recap cards with unique public share tokens (`/recap/share/:token`).

### 4. Social Music & Community
- **Live Activity Feed**: Real-time broadcasts of what friends are listening to via Socket.IO.
- **Real-Time Song Reactions**: Interactive emoji reactions (🔥, ❤️, 🔁, ✨, 🤯) with live counter synchronization.
- **Friend Circles**: Create and participate in community listening groups with group leaderboards.
- **Music Taste Match**: Algorithmic taste comparison calculating overlap %, mutual artists, shared genres, and vibe compatibility.
- **Community Leaderboards**: Weekly listening champions, diversity pioneers, and active streak leaders.

### 5. Official Spotify Web API Integration
- **OAuth 2.0 Authorization Code Flow**: Secure user authorization.
- **Provider-Isolated Architecture**: Official Spotify endpoints only (`/v1/me`, `/v1/me/player/recently-played`).
- **Strict Developer Policy Compliance**: Tokens encrypted, Client Secret strictly kept backend-only, no scraping, no prohibited derived profiles from Spotify Content.
- **One-Click Disconnect & Status**: Clear status indicators, expiration handling, and token revocation.

### 6. Built-in Demonstration Datasets
- **High-Fidelity Simulated Data**: 4 pre-seeded demo user profiles (*Alex Mercer*, *Sarah Chen*, *Marcus Vance*, *Elena Rostova*), 150+ scrobbles, diverse audio features, mutual friendships, and pre-generated Wrapped stories.
- **Instant Demo Login**: One-click demo login button for evaluating all features without manual credential setup.

---

## 🏗️ Architecture & Monorepo Structure

```
tunescope/
├── shared/                     # Shared TypeScript contracts & models
│   ├── src/index.ts            # Data models, DTOs, Enums, Interfaces
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # Express + PostgreSQL + Prisma + Socket.IO
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL relational schema
│   ├── src/
│   │   ├── config/             # Environment configuration (Zod / dotenv)
│   │   ├── db/                 # Prisma client instance & rich seed dataset
│   │   ├── middleware/         # Auth, Rate Limiting, Error Handler
│   │   ├── modules/
│   │   │   ├── auth/           # JWT & bcrypt authentication
│   │   │   ├── spotify/        # Official Spotify OAuth provider
│   │   │   ├── ingestion/      # Data ingestion & deduplication engine
│   │   │   ├── analytics/      # Modular personal analytics calculations
│   │   │   ├── social/         # Friends, reactions, groups & leaderboards
│   │   │   ├── recaps/         # Weekly & Yearly Wrapped story generators
│   │   │   └── music/          # History, artists, and tracks catalog
│   │   ├── socket/             # Socket.IO real-time event server
│   │   ├── server.ts           # Express application setup
│   │   └── index.ts            # HTTP entry point
│   ├── tests/                  # Vitest integration & unit test suite
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # GlassCard, Button, Badge, AudioPlayerPreview
│   │   │   ├── layout/         # Persistent Sidebar, Header, Mobile Drawer
│   │   │   ├── charts/         # Recharts: Activity, Heatmap, GenreRadar
│   │   │   ├── recap/          # Interactive Wrapped Story Viewer
│   │   │   └── social/         # Taste Comparison Modal, Reaction Bar
│   │   ├── context/            # AuthContext, SpotifyContext, SocketContext
│   │   ├── pages/              # Overview, Discover, History, Artists, Tracks, Recaps, Friends, Profile, Settings, Login, Register, SharedRecapView
│   │   ├── App.tsx             # Protected routing configuration
│   │   └── main.tsx
│   ├── tests/                  # Vitest + React Testing Library suite
│   ├── package.json
│   └── vite.config.ts
├── package.json                # Monorepo root with workspaces
├── .env.example                # Documented environment template
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router 6, Recharts, Lucide React, Socket.IO Client |
| **Backend** | Node.js, Express, PostgreSQL 18, Prisma ORM 5, Socket.IO, bcryptjs, jsonwebtoken, express-rate-limit, Zod |
| **Testing** | Vitest, Supertest, @testing-library/react, jsdom |

---

## 🔒 Security & Privacy Guarantees

1. **Client Secret Confidentiality**: The Spotify Client Secret is never sent to the browser or frontend bundle.
2. **Safe Credential Handling**: Passwords hashed with bcrypt (salt rounds = 10). Access tokens are never logged.
3. **API Rate Limiting**: Global window rate limiting protects API endpoints against denial-of-service and brute force.
4. **Visibility Controls**: User profiles offer 3 privacy levels: `PUBLIC`, `FRIENDS_ONLY`, and `PRIVATE`.
5. **Input Validation**: Strict schema validation using Zod.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remotely on port 5432)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> tunescope
cd tunescope
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both the project root and `backend/.env`:
```bash
cp .env.example .env
cp .env.example backend/.env
```

Ensure your PostgreSQL `DATABASE_URL` is set:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/tunescope?schema=public"
JWT_SECRET="your-secure-random-jwt-secret-string"
```

#### Spotify Web API Configuration (Optional)
To link your personal Spotify account:
1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Add `http://127.0.0.1:5000/api/spotify/callback` to the **Redirect URIs** (Spotify requires `127.0.0.1` instead of `localhost`).
3. Set your Client ID and Client Secret in `.env`:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/api/spotify/callback
```
*(If left unconfigured, TuneScope runs seamlessly in Demonstration Mode with rich simulated data.)*

### 3. Initialize PostgreSQL Database & Seed
```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers
Run frontend and backend simultaneously:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### 5. Instant Demo Access
Navigate to `http://localhost:5173` and click **"Continue as Alex Mercer (Demo)"** to explore the complete experience right away!

---

## 🧪 Testing & Production Builds

### Run All Tests
```bash
npm run test
```
Runs:
- Backend: Auth, Spotify OAuth handling, Analytics engine, Ingestion pipeline (19 tests).
- Frontend: Common components, persistent sidebar navigation (5 tests).

### Production Build
```bash
npm run build
```
Generates production-optimized distributions for `shared`, `backend`, and `frontend`.

