# TuneScope 🎵 — Music Intelligence & Social Analytics

TuneScope is a music intelligence and social music application inspired by Spotify Wrapped and Tunesimo. It brings together personal music analytics, listening history, discovery trajectories, interactive Wrapped-style recaps, social listening circles, friend activity feeds with real-time song reactions, and audio taste matchmaking.

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

## 🛠️ Technology Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite | High-performance SPA with fast HMR |
| **Frontend Styling** | Tailwind CSS | Deep charcoal dark theme, responsive grids, sleek micro-interactions |
| **Icons & Visuals** | Lucide React, Recharts | Data visualizations, radars, activity charts, polished UI icons |
| **Client Routing** | React Router v6 | Single-page application route management with protected routes |
| **Backend Framework** | Node.js, Express, TypeScript | Scalable RESTful API and WebSocket orchestration |
| **Database & ORM** | PostgreSQL 16, Prisma ORM | Relational database modeling, migrations, and type-safe queries |
| **Real-time WebSockets** | Socket.IO | Instant broadcasts for live activity feeds and emoji reactions |
| **Authentication** | JWT, bcryptjs | Stateless token authentication with password hashing |
| **Testing** | Vitest, Supertest, Testing Library | Integration testing for endpoints and unit tests for UI components |
| **CI / CD** | GitHub Actions | Automated lint, migration check, testing, and production builds |
| **Hosting & Cloud** | Vercel (Frontend), Render (Backend & Postgres) | Multi-cloud deployment with zero-downtime rollouts |

---

## 🏗️ Monorepo Structure

```
tunescope/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions automated test & build pipeline
├── shared/                     # Shared TypeScript contracts, DTOs & models
│   ├── src/index.ts            # Common interfaces, enums, type definitions
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # Express + PostgreSQL + Prisma + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL relational data models
│   │   └── migrations/         # Database migrations history
│   ├── src/
│   │   ├── config/             # Environment validation (dotenv / env schema)
│   │   ├── db/                 # Prisma singleton & demo seed script
│   │   ├── middleware/         # JWT auth, rate-limiter, global error sanitization
│   │   ├── modules/
│   │   │   ├── auth/           # Login, registration, demo authentication
│   │   │   ├── spotify/        # Spotify OAuth provider & profile verification
│   │   │   ├── ingestion/      # Scrobbles ingestion & deduplication engine
│   │   │   ├── analytics/      # Aggregation engine (duration, loyalty, vibes)
│   │   │   ├── social/         # Friendships, groups, reactions & compatibility
│   │   │   ├── recaps/         # Weekly & yearly Wrapped story generator
│   │   │   └── music/          # History, top artists, tracks catalog
│   │   ├── socket/             # Socket.IO WebSocket server
│   │   ├── server.ts           # Express application builder
│   │   └── index.ts            # HTTP server bootstrap entry point
│   ├── tests/                  # Vitest backend integration test suite
│   ├── .env.example            # Backend-specific environment template
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # GlassCard, Button, Badge, EmptyState, Skeleton, ErrorBoundary
│   │   │   ├── layout/         # Persistent Sectioned Sidebar, Header, Mobile Drawer
│   │   │   ├── charts/         # ActivityChart, Heatmap, GenreRadar
│   │   │   ├── recap/          # Animated Wrapped Story Viewer
│   │   │   └── social/         # TasteComparisonModal, FriendCards
│   │   ├── context/            # Auth, Spotify, Socket, Toast contexts
│   │   ├── pages/              # Overview, Discover, History, Artists, Tracks, Recaps, Friends, Profile, Settings
│   │   ├── utils/              # apiFetch, error translation layer
│   │   └── test/               # Vitest component & navigation tests
│   ├── .env.example            # Frontend environment template
│   ├── vercel.json             # Vercel SPA rewrites
│   ├── package.json
│   └── vite.config.ts
├── render.yaml                 # Render Blueprint specification for Web Service & Postgres
├── vercel.json                 # Monorepo root Vercel configuration
├── CONTRIBUTING.md             # Developer collaboration & Git workflow standards
├── WORKFLOW.md                 # Production deployment branch guidelines
├── DEPLOYMENT.md               # Production infrastructure reference
├── .env.example                # Master environment variables template
└── package.json                # Monorepo root workspace configuration
```

---

## 💻 Prerequisites

Ensure your local development workstation has the following installed:

1. **Node.js**: `v20.x` LTS recommended (minimum `v18.x`). Verify with `node -v`.
2. **npm**: `v9.x` or `v10.x` (comes with Node.js). Verify with `npm -v`.
3. **Git**: Installed and configured with your name and email. Verify with `git --version`.
4. **PostgreSQL**: `v14+` or `v16+` installed locally (or via Docker). Verify with `psql --version`.
5. **Spotify Developer Account** (free): Required to test live Spotify OAuth and listening data synchronization.

---

## 🚀 Local Installation & Setup

Follow these exact steps to get TuneScope running on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/kashifiqbals117-spec/TuneScope.git
cd tunescope
```

### 2. Install Monorepo Dependencies
Install all workspace dependencies across `shared`, `backend`, and `frontend`:
```bash
npm install
```

### 3. Configure Local Environment Variables
Create your local environment files from the provided templates:

```bash
# On Linux / macOS:
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# On Windows (PowerShell):
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Open `backend/.env` (or root `.env`) in your editor and configure your local PostgreSQL credentials:
```env
DATABASE_URL=postgresql://postgres:your_password@127.0.0.1:5432/tunescope?schema=public
```

> **Security Note**: Never point your local environment to the shared production database! Keep local development isolated.

### 4. Initialize Local PostgreSQL Database
Create a database named `tunescope` locally:

```bash
# Using PostgreSQL command line:
psql -U postgres -c "CREATE DATABASE tunescope;"

# Or using the createdb utility:
createdb -U postgres tunescope
```

### 5. Run Database Migrations & Generate Prisma Client
Apply the schema migrations to your local database:

```bash
# Generate Prisma Client types
npx prisma generate --schema=backend/prisma/schema.prisma

# Apply database migrations
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

### 6. Seed Demonstration Data
Populate your local database with 4 rich demo user profiles, 8 artists, 22 tracks, 272 scrobbles, and Wrapped recaps:

```bash
npm run db:seed
```

### 7. Start Local Development Servers
Run both backend and frontend concurrently:

```bash
npm run dev
```

Or run them in separate terminal tabs:
```bash
# Terminal 1 - Backend Server
npm run dev:backend

# Terminal 2 - Frontend Application
npm run dev:frontend
```

Open your browser to:
- **Frontend Application**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Backend API Healthcheck**: [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health)

Log in immediately using the pre-seeded demo account:
- **Email**: `alex@tunescope.app`
- **Password**: `tunescope2026`
*(Or click "Quick Demo Login" on the login screen).*

---

## 🧪 Testing & Production Builds

### Run All Automated Tests
```bash
npm test
```
Executes:
- **Backend Tests** (`npm run test:backend`): 25 integration tests verifying authentication, token generation, Spotify OAuth callbacks, data ingestion, deduplication, and analytics calculations.
- **Frontend Tests** (`npm run test:frontend`): 9 unit tests verifying sidebar navigation, error boundaries, empty states, and layout components.

### Build for Production
Verify production builds compile without TypeScript errors:
```bash
# Build all workspaces
npm run build

# Or build individual packages:
npm run build:backend
npm run build:frontend
```

---

## 🔑 External Service Configuration

### 1. Spotify Developer Dashboard Setup
To connect real Spotify accounts locally:

1. Log in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with your Spotify account.
2. Click **Create app**:
   - **App name**: `TuneScope Local Dev`
   - **App description**: `Local development instance of TuneScope`
   - **Redirect URIs**: You **MUST** use `127.0.0.1` (Spotify strictly rejects `localhost`):
     ```text
     http://127.0.0.1:5000/api/spotify/callback
     ```
   - **Which API/SDKs are you planning to use?**: Select **Web API**.
3. Agree to the terms and click **Save**.
4. Click **Settings** in your new Spotify app to view your **Client ID** and **Client Secret**.
5. Add these credentials to your local `backend/.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/api/spotify/callback
   ```
6. **User Management (Development Mode)**: Spotify Developer apps start in "Development Mode", which restricts OAuth access to explicitly registered accounts:
   - In your Spotify Developer App dashboard, open the **User Management** tab.
   - Add your own Spotify account email and your teammates' Spotify account emails to the list of authorized users.

### 2. Cloudinary Setup (Optional Media Storage)
TuneScope currently supports direct image URLs (e.g., Unsplash, Spotify CDN, web URLs) for avatars out of the box. If your team is implementing file upload capabilities for custom avatars:

1. Register for a free account at [Cloudinary](https://cloudinary.com).
2. Go to your **Cloudinary Dashboard** to find your **Cloud Name**, **API Key**, and **API Secret**.
3. Add these to `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

### 3. PostgreSQL Database
- Every team member should use their own local PostgreSQL database (`DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/tunescope?schema=public`).
- Never share production database URLs or run destructive commands (`prisma migrate reset`) against remote instances.

---

## 👥 GitHub Team Collaboration Workflow

### How the Repository Owner Invites Collaborators
1. Open the GitHub repository: [https://github.com/kashifiqbals117-spec/TuneScope](https://github.com/kashifiqbals117-spec/TuneScope)
2. Click the **Settings** tab.
3. In the left sidebar, click **Collaborators** under *Access*.
4. Click **Add people**.
5. Enter your friend's GitHub username or email address and send the invitation.
6. Your collaborator receives an email with an invitation link (or can visit `https://github.com/kashifiqbals117-spec/TuneScope/invitations`) to accept.

### How Collaborators Work on Features
Once invited, all developers must adhere to our standardized Git workflow:

```
main (Production — Always Stable)
  ▲
  │ Pull Request / Tested Merge
  │
  ├─► feature/friend-system
  ├─► feature/activity-feed
  ├─► feature/music-analytics
  ├─► feature/wrapped-improvements
  └─► fix/spotify-oauth
```

1. **Pull the latest `main`**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a dedicated feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Write code and tests**:
   Make sure all tests pass: `npm test`.
4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat(module): description of changes"
   git push -u origin feature/your-feature-name
   ```
5. **Open a Pull Request on GitHub**:
   - GitHub Actions will automatically verify dependencies, migrations, backend tests, frontend tests, and production builds.
   - Request review from a teammate.
   - Once approved and CI checks pass, merge into `main`.

For complete details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 🔒 Production Safety & Architecture

TuneScope operates with continuous deployment from `main`:
- **Production Frontend**: Deployed on **Vercel** CDN from `main`.
- **Production Backend**: Deployed on **Render** Web Service from `main`.
- **Production Database**: Managed **PostgreSQL on Render**.

### Collaborative Safety Guarantees
- The shared production database and Render environment variables are managed exclusively by the repository owner.
- Collaborators work with local databases and local credentials, completely insulating the live production environment from local development or experiments.
- Pull Requests require passing CI checks before merging into `main`, preventing broken code from triggering production deploys.

---

## 📄 License

TuneScope is built for collaborative education and personal music intelligence exploration.
