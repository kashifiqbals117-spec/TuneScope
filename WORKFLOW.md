# TuneScope Git & Deployment Workflow

This document establishes the official engineering standard for branching, feature development, testing, and production deployment across **TuneScope**.

---

## 1. Branch Architecture

```
main (Production — Always Stable)
  ▲
  │ Pull Request / Tested Merge
  │
  ├─► feature/spotify-integration
  ├─► feature/profile-avatar
  ├─► feature/social-features
  ├─► feature/recaps
  ├─► feature/analytics
  └─► feature/ui-improvements
```

### Production Branch: `main`
- `main` is the **single source of truth** for production.
- **Render** automatically builds and deploys the backend service from `main`.
- **Vercel** automatically builds and deploys the frontend application from `main`.
- Direct commits to `main` for feature development are strictly prohibited.

### Feature Branches: `feature/<name>`
- Created exclusively from the latest, tested `main`.
- Contains only code and tests scoped to the intended feature.
- Merged into `main` only after passing unit/integration tests and production builds.

---

## 2. Standard Feature Development Lifecycle

### Step 1: Synchronize `main`
```bash
git checkout main
git pull origin main
```

### Step 2: Create a Feature Branch
```bash
git checkout -b feature/<feature-name>
```

### Step 3: Implement & Test Locally
Implement the feature with proper tests and error handling. Verify all suites pass:
```bash
# Run all tests (backend and frontend)
npm test

# Verify production builds
npm run build:backend
npm run build:frontend
```

### Step 4: Commit with Conventional Commits
```bash
git add <modified-files>
git commit -m "feat(<scope>): describe feature clearly"
```
> **Security Rule**: Never stage or commit `.env` files, API tokens, passwords, or connection strings.

### Step 5: Push Feature Branch & Open PR
```bash
git push -u origin feature/<feature-name>
```

### Step 6: Merge into `main`
After code review and passing CI checks, merge into `main`:
```bash
git checkout main
git pull origin main
git merge feature/<feature-name> --no-ff -m "feat: merge <feature-name> into main"
git push origin main
```

### Step 7: Verify Production Deployments
Confirm that Render and Vercel automatically trigger and deploy cleanly:
- Backend Healthcheck: `https://tunescope-backend.onrender.com/health`
- Frontend Application: Vercel production URL

---

## 3. Production Environment & Service Registry

| Component | Host / Provider | Resource / Service ID | Production Target |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render Web Service | `srv-dbruhs5g1s2s73dlr310` | Branch: `main` |
| **Database** | Render PostgreSQL | `dpg-dbru8uui0phs73birl70-a` | Database: `tunescope_db_jx3a` |
| **Frontend** | Vercel CDN | `prj_sQiHL3hJtkI4AT2NG45gH45EifBQ` | Branch: `main` |
| **Repository** | GitHub | `kashifiqbals117-spec/TuneScope` | Default: `main` |
