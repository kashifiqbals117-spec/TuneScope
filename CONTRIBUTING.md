# Contributing to TuneScope

Welcome to the **TuneScope** developer team! This guide outlines our collaborative development workflow, branching standards, testing requirements, and Pull Request process.

---

## 1. Core Principles

- **`main` is Production**: The `main` branch is our single source of truth and continuously deploys to production (Vercel & Render). It must remain stable and deployable at all times.
- **No Direct Commits to `main`**: All work — features, bug fixes, UI improvements, and performance optimizations — must be developed on a dedicated branch and merged via an approved Pull Request.
- **Never Force-Push to `main`**: Force-pushing (`git push --force`) to `main` is strictly forbidden.
- **Test Before You Merge**: Every Pull Request must pass automated tests (`npm test`) and production builds (`npm run build:backend`, `npm run build:frontend`) before merging.
- **Separate Development Environments**: Each developer runs their own local PostgreSQL database and Spotify Developer app. Never point local code to the shared production database!

---

## 2. Branch Naming Conventions

Use lowercase branch names prefixed with the change type:

| Branch Type | Usage Pattern | Example |
| :--- | :--- | :--- |
| **New Features** | `feature/<short-description>` | `feature/friend-system`, `feature/activity-feed` |
| **Bug Fixes** | `fix/<short-description>` | `fix/spotify-oauth`, `fix/dashboard-layout` |
| **Refactoring** | `refactor/<short-description>` | `refactor/analytics-caching` |
| **Documentation** | `docs/<short-description>` | `docs/api-guide` |
| **Performance** | `perf/<short-description>` | `perf/recap-slides-virtualization` |

---

## 3. Step-by-Step Developer Workflow

### Step 1: Start from the Latest `main`
Before beginning any new work, update your local `main` branch to match GitHub:

```bash
git checkout main
git pull origin main
```

### Step 2: Create a Feature Branch
Create and switch to your feature branch:

```bash
git checkout -b feature/your-feature-name
```

### Step 3: Develop & Test Locally
Implement your feature following the monorepo structure:
- Shared types and interfaces: `shared/src/`
- Backend endpoints and business logic: `backend/src/modules/`
- Frontend components and views: `frontend/src/`

Run tests frequently during development:

```bash
# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run full test suite
npm test
```

Verify production builds pass without TypeScript or bundler errors:

```bash
npm run build:backend
npm run build:frontend
```

### Step 4: Commit Your Changes
Make focused, meaningful commits using [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(analytics): add weekly listening trends chart"
```

> **Security Alert**: Never stage or commit `.env` files, passwords, API secrets, or database URLs!

### Step 5: Push Your Branch to GitHub
```bash
git push -u origin feature/your-feature-name
```

### Step 6: Open a Pull Request (PR)
1. Navigate to the GitHub repository: `https://github.com/kashifiqbals117-spec/TuneScope`
2. Click **Compare & pull request** next to your pushed branch.
3. Set the base branch to **`main`**.
4. Fill out the Pull Request template:
   - **Description**: Concise summary of what was built or fixed.
   - **Affected Functionality**: List of components, modules, or routes modified.
   - **Testing Performed**: Output or confirmation of `npm test` and local browser checks.
   - **Breaking Changes**: Highlight any database schema updates or API changes.

### Step 7: Automated CI Checks & Code Review
- GitHub Actions will automatically trigger and run:
  - Dependency installation (`npm ci`)
  - Prisma client generation
  - Database migration validation
  - Backend and frontend tests
  - Production TypeScript builds
- Request a code review from a teammate.
- Address any review feedback on your feature branch and push updates.

### Step 8: Merge into `main`
Once your PR receives an approving review and passes all CI checks:
1. Merge the Pull Request via GitHub.
2. After the merge completes, update your local `main` and delete the merged feature branch:

```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

---

## 4. Database Migrations Etiquette

When adding or modifying Prisma models:
1. Edit `backend/prisma/schema.prisma`.
2. Generate a new migration locally:
   ```bash
   npm run prisma:migrate --workspace=backend
   ```
3. Never edit or delete existing migration files in `backend/prisma/migrations/`.
4. If you add demo seed data, update `backend/src/db/seed.ts` and test with:
   ```bash
   npm run prisma:seed --workspace=backend
   ```

---

## 5. Getting Help & Code Discussions

- Open an [Issue on GitHub](https://github.com/kashifiqbals117-spec/TuneScope/issues) to report bugs or propose feature architectures before starting large changes.
- Ensure all conversations and feedback remain respectful and constructive.
