# TuneScope 🎵 — Music Intelligence & Social Analytics

TuneScope is a premium music intelligence and social music application inspired by Spotify Wrapped and Tunesimo. It unites personal music telemetry, listening history, discovery patterns, annual and weekly Wrapped-style recaps, social listening circles, friend activity feeds with real-time song reactions, and deep music taste matchmaking.

---

## 🌟 Product Vision & Features

### 1. Personal Music Analytics
- **Listening Duration**: Total minutes, hours, days, daily averages, and active listening streaks.
- **Top Artists & Anthems**: Deep ranking with loyalty metrics and discography replay shares.
- **Audio Vibe Profiling**: Danceability, Energy, Valence, Acousticness, and Tempo analysis.
- **Sonic Diversity Score**: Shannon entropy index measuring genre variety across catalog listening.
- **24-Hour Sonic Rhythm**: Hourly distribution breakdown with peak hour identification and "Night Owl" scoring.

### 2. Music Discovery & Trajectory
- **Discovery Velocity**: Quantifies new artists introduced per week.
- **First-Listen Timeline**: Interactive chronological roadmap of newly discovered musicians.
- **Multi-Dimensional Genre Radar**: Radar visualizations plotting audio DNA and genre spread.

### 3. Wrapped-Style Recaps (Yearly & Weekly)
- **Interactive Story Mode**: Full-screen, slide-by-slide animated Wrapped experience with progress bars, keyboard navigation, and audio ambiance simulation.
- **Persona Reveal**: Personalized sonic archetypes (*The Cosmic Explorer*, *The Late Night Dreamer*, *The Electronic Purist*).
- **Shareable Snapshots**: Exportable recap cards with unique public share tokens (`/recap/share/:token`) and one-click clipboard copying.

### 4. Social Music & Community
- **Live Activity Feed**: Real-time broadcasts of what friends are listening to via Socket.IO.
- **Real-Time Song Reactions**: Interactive emoji reactions (🔥, ❤️, 🔁, ✨, 🤯) with live counter synchronization.
- **Friend Circles**: Create and participate in community listening groups with circle leaderboards.
- **Music Taste Match**: Algorithmic taste comparison calculating overlap %, mutual artists, shared genres, and vibe compatibility.
- **Understandable Privacy**: User visibility toggles (Public, Friends Only, Private) protecting profile information.

### 5. Official Spotify Web API Integration
- **OAuth 2.0 Authorization Code Flow**: Secure user authorization using `127.0.0.1` locally and custom HTTPS domains in production.
- **Live Verification**: Actively verifies access to official Spotify endpoints (`/v1/me`, `/v1/me/player/recently-played`).
- **Developer Policy Handling**: Graceful detection of Spotify Developer Platform Premium requirements (HTTP 403) with clear guidance.
- **Strict Developer Policy Compliance**: Tokens encrypted, Client Secret strictly kept backend-only, no scraping, no prohibited derived profiles from Spotify Content.

### 6. Built-in Demonstration Datasets
- **High-Fidelity Simulated Data**: 4 pre-seeded demo user profiles (*Alex Mercer*, *Sarah Chen*, *Marcus Vance*, *Elena Rostova*), 150+ scrobbles, diverse audio features, mutual friendships, and pre-generated Wrapped stories.
- **Instant Demo Login**: One-click demo login button for evaluating all features without manual credential setup.

---

## 🎨 UI/UX & Design Philosophy

TuneScope features a deep charcoal dark aesthetic engineered for visual clarity, readability, and responsiveness:

- **Deep Charcoal Canvas**: Restrained dark tones (`#07090E`, `#0B0F17`, `#101522`) with subtle 1px borders (`border-white/[0.08]`) avoiding excessive glassmorphism.
- **Structured Persistent Sidebar**:
  - **DISCOVER**: Overview, Discover
  - **MY MUSIC**: Listening History, Artists, Tracks, Recaps
  - **SOCIAL**: Friends, Profile
  - **SETTINGS**: Settings
- **Responsive Layout**: Full mobile drawer with backdrop and auto-close on navigation; responsive grids adapting across mobile, tablet, laptop, and desktop.
- **User-Friendly Error Handling**:
  - Global React Error Boundary preventing application crashes.
  - Toast notification system with auto-dismiss and accessibility announcements.
  - Error translation layer mapping technical codes (`ECONNREFUSED`, `401`, `403`, `500`) into clean, actionable messages.
  - Consistent pulse loading skeletons (`CardSkeleton`, `ChartSkeleton`, `TrackRowSkeleton`).

---

## 🏗️ Monorepo Structure

```
tunescope/
├── shared/                     # Shared TypeScript contracts & DTOs
│   ├── src/index.ts            # Interfaces, Models, Enums
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # Express + PostgreSQL + Prisma + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL relational schema
│   │   └── migrations/         # Baseline production migrations
│   ├── src/
│   │   ├── config/             # Environment configuration (Zod / dotenv)
│   │   ├── db/                 # Prisma client instance & rich seed dataset
│   │   ├── middleware/         # Auth, Rate Limiting, Error Handler
│   │   ├── modules/
│   │   │   ├── auth/           # JWT & bcrypt authentication
│   │   │   ├── spotify/        # Official Spotify OAuth provider & verification
│   │   │   ├── ingestion/      # Data ingestion & deduplication engine
│   │   │   ├── analytics/      # Modular personal analytics calculations
│   │   │   ├── social/         # Friends, reactions, circles & leaderboards
│   │   │   ├── recaps/         # Weekly & Yearly Wrapped story generators
│   │   │   └── music/          # History, artists, and tracks catalog
│   │   ├── socket/             # Socket.IO real-time event server
│   │   ├── server.ts           # Express application setup
│   │   └── index.ts            # HTTP entry point
│   ├── tests/                  # Vitest backend integration & unit test suite
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # GlassCard, Button, Badge, EmptyState, ErrorMessage, Skeleton
│   │   │   ├── layout/         # Sectioned Sidebar, Header, Mobile Drawer, Layout
│   │   │   ├── charts/         # Recharts: Activity, Heatmap, GenreRadar
│   │   │   ├── recap/          # Interactive Wrapped Story Viewer
│   │   │   └── social/         # TasteComparisonModal
│   │   ├── context/            # Auth, Spotify, Socket, Toast contexts
│   │   ├── pages/              # Overview, Discover, History, Artists, Tracks, Recaps, Friends, Profile, Settings
│   │   ├── utils/              # apiFetch, error translation layer
│   │   └── test/               # Vitest frontend component & navigation test suite
│   ├── vercel.json             # Vercel SPA rewrites
│   ├── package.json
│   └── vite.config.ts
├── render.yaml                 # Render Blueprint for Web Service + PostgreSQL
├── vercel.json                 # Monorepo root Vercel configuration
├── DEPLOYMENT.md               # Complete production deployment guide
├── .env.example                # Template for environment variables
└── package.json                # Workspace root
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ & npm 9+
- PostgreSQL 14+ running locally

### 1. Clone & Install
```bash
git clone https://github.com/kashifiqbals117-spec/TuneScope.git
cd tunescope
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` in the root and in `backend/.env`:
```bash
cp .env.example .env
cp .env.example backend/.env
```
Update your local database credentials and Spotify Client Secret if testing live Spotify sync.

### 3. Initialize Database & Seed
```bash
npm run prisma:push --workspace=@tunescope/backend
npm run prisma:seed --workspace=@tunescope/backend
```

### 4. Run Development Servers
```bash
npm run dev
```
- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:5000`

---

## 🧪 Testing & Production Builds

### Run Test Suites
```bash
npm test
```
Runs 25 backend tests and 9 frontend tests (auth, Spotify OAuth, error translations, ingestion, analytics, components, navigation).

### Run Production Build
```bash
npm run build
```
Compiles `@tunescope/shared`, `@tunescope/backend`, and `@tunescope/frontend` without errors.

---

## 🌐 Production Deployment

Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions:
- **Frontend**: Deploy on [Vercel](https://vercel.com) using [vercel.json](./vercel.json).
- **Backend**: Deploy on [Render](https://render.com) using [render.yaml](./render.yaml).
- **Database**: Provision PostgreSQL on Render with `prisma migrate deploy`.
