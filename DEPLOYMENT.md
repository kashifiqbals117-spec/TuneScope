# TuneScope — Production Deployment Guide

This guide provides end-to-end instructions for deploying TuneScope to production across **Vercel** (Frontend), **Render Web Service** (Backend), and **Render PostgreSQL** (Database).

---

## Architecture Overview

```mermaid
flowchart LR
    User["Client Browser"]
    Vercel["Frontend (Vercel SPA)"]
    Render["Backend (Render Web Service)"]
    DB[("PostgreSQL (Render / Neon)")]
    Spotify["Spotify Web API"]

    User -->|HTTPS| Vercel
    Vercel -->|REST API & WebSockets| Render
    Render -->|Prisma ORM (SSL)| DB
    Render -->|OAuth 2.0 & Web API| Spotify
```

---

## 1. Database Deployment (Render PostgreSQL)

### Step 1.1: Create PostgreSQL Database on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **PostgreSQL**.
3. Name your database: `tunescope-db`.
4. Choose your region (recommended: closest to your expected users, e.g., `Oregon (US West)` or `Frankfurt (EU)`).
5. Select the **Standard** plan (or Free tier for testing).
6. Click **Create Database**.

### Step 1.2: Obtain Connection String
1. In the database dashboard, find the **Internal Database URL** (if deploying backend on Render in the same region) or **External Database URL** (includes `sslmode=require`).
2. Format:
   ```text
   postgresql://tunescope_user:password@hostname.render.com/tunescope?sslmode=require
   ```

### Step 1.3: Run Prisma Migrations
When deploying via `render.yaml` or manual build, the build command will execute:
```bash
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```
This safely applies the baseline migration (`backend/prisma/migrations/20261114000000_init/migration.sql`) to create all tables, indexes, and foreign keys.

---

## 2. Backend Deployment (Render Web Service)

### Step 2.1: Option A — One-Click Deploy with `render.yaml`
1. Connect your GitHub repository `https://github.com/kashifiqbals117-spec/TuneScope.git`.
2. In the Render Dashboard, click **New +** → **Blueprint**.
3. Select the repository and the branch `ui-redesign-deploy`.
4. Render automatically parses [render.yaml](./render.yaml) to provision the database and web service.

### Step 2.2: Option B — Manual Web Service Setup
1. Click **New +** → **Web Service**.
2. Connect the repository and set the branch to `ui-redesign-deploy`.
3. Configure the service settings:
   - **Name**: `tunescope-backend`
   - **Environment**: `Node`
   - **Region**: Same region as your PostgreSQL instance
   - **Build Command**:
     ```bash
     npm install && npm run build --workspace=shared && npm run build --workspace=backend && npx prisma migrate deploy --schema=backend/prisma/schema.prisma
     ```
   - **Start Command**:
     ```bash
     npm run start --workspace=backend
     ```
   - **Health Check Path**: `/health`

### Step 2.3: Configure Production Environment Variables on Render
Add the following environment variables in the Render Environment tab:

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Production environment mode | `production` |
| `PORT` | Web service port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | 32+ character random secret | *(Generate secure random string)* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `FRONTEND_URL` | Deployed Vercel URL | `https://tunescope.vercel.app` |
| `CORS_ORIGINS` | Permitted CORS domains | `https://tunescope.vercel.app` |
| `SPOTIFY_CLIENT_ID` | From Spotify Developer Dashboard | `74ea27f4996748eebfc1d250618499e4` |
| `SPOTIFY_CLIENT_SECRET` | Official Spotify Client Secret | `your_spotify_client_secret` |
| `SPOTIFY_REDIRECT_URI` | Production callback URL | `https://tunescope-backend.onrender.com/api/spotify/callback` |
| `SPOTIFY_SCOPES` | Authorized Spotify permissions | `user-read-recently-played user-top-read user-read-playback-state user-read-currently-playing user-read-email user-read-private` |

---

## 3. Frontend Deployment (Vercel)

### Step 3.1: Connect Repository to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select the `TuneScope` GitHub repository.
4. Set the branch to `ui-redesign-deploy`.

### Step 3.2: Build & Output Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default) or `frontend`
- **Build Command**: `npm run build --workspace=shared && npm run build --workspace=frontend`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install`

The provided [vercel.json](./vercel.json) handles client-side SPA routing (`index.html` rewrites).

### Step 3.3: Configure Frontend Environment Variables on Vercel
In the Vercel project settings under **Environment Variables**, add:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://tunescope-backend.onrender.com` | Points frontend API requests to your Render backend |

---

## 4. Spotify Developer Dashboard Configuration

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Open your registered TuneScope application.
3. Click **Settings**.
4. In **Redirect URIs**, add your production callback URL:
   ```text
   https://tunescope-backend.onrender.com/api/spotify/callback
   ```
   *(Keep `http://127.0.0.1:5000/api/spotify/callback` for local development).*
5. Save changes.

> [!IMPORTANT]
> Under Spotify's Developer Policy for applications in Development Mode, the Spotify account that created the Spotify Developer App (`SPOTIFY_CLIENT_ID`) requires an active Spotify Premium subscription to call endpoints like `/v1/me` and `/v1/me/player/recently-played`.

---

## 5. Post-Deployment Verification Checklist

- [ ] **Health Check**: Visit `https://<render-backend>/health` — must return `{ status: "healthy", database: "connected" }`.
- [ ] **Frontend Routing**: Load `https://<vercel-frontend>` — verified navigation across all 9 persistent sidebar sections.
- [ ] **Authentication**: Register a new user or log in via the demo account.
- [ ] **Security Audit**: Ensure developer tools Network tab confirms no secrets, tokens, or raw SQL queries leak.
- [ ] **Error Handling**: Verify that network disconnects and expired tokens display user-friendly toast and inline alerts with retry buttons.
- [ ] **Spotify OAuth**: Initiate connection, grant authorization on Spotify, and verify redirect to `/settings?spotify=...`.
