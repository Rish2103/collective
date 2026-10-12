# Contributing to COLLECTIVE 2.0

Thank you for contributing to COLLECTIVE! This guide helps you set up quickly and submit high-quality frontend pull requests.

---

## 🛠️ Quick Setup for Collaborators

1. **Fork or Clone**:
   ```bash
   git clone https://github.com/Rish2103/collective.git
   cd collective
   ```

2. **Install Dependencies**:
   ```bash
   npm --prefix contracts install
   npm --prefix frontend install
   ```

3. **Start the Frontend Locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173).

---

## 🌿 Feature Branch Workflow

Always work on a descriptive feature branch created from `main`:

```bash
# Update main branch
git checkout main
git pull origin main

# Create a new feature branch
git switch -c feat/improve-pool-cards
```

---

## 🔒 Golden Rules & Architecture Constraints

1. **Zero Hardcoded Application Values**:
   - Never hardcode fake pools, simulated balances, dummy transactions, or fabricated metrics.
   - All dynamic pool data must come from on-chain contract calls (`useCollective`) or event logs (`useActivityTimeline`).
2. **Preserve Deployed Contract Configurations**:
   - Do **not** change the deployed Monad Testnet addresses in `frontend/src/contracts/config.ts`.
   - Do **not** deploy contracts or change contract economics.
3. **Never Commit Secrets or Private Keys**:
   - Do not commit `.env`, `.env.local`, or any private keys.
   - Vite environment variables (`VITE_*`) are public in client bundles; never store private credentials in them.
4. **Mobile & Desktop Responsiveness**:
   - Test your changes across mobile (375px width) and desktop (1280px width).

---

## 🧪 Pre-Commit Verification

Before committing and pushing, always verify that your code compiles and passes all checks:

```bash
# 1. Run smart contract unit tests (28/28 passing)
npm run test

# 2. Verify frontend TypeScript types and build
npm run build

# 3. (Optional) Run headless browser test suite
npm run test:browser
```

---

## 🚀 Submitting Your Changes

```bash
# Stage only your intended changes
git add frontend/src/components/PoolCard.tsx

# Commit with a clear conventional commit message
git commit -m "feat(frontend): improve mobile layout for pool cards"

# Push your feature branch
git push -u origin feat/improve-pool-cards
```

Then go to [https://github.com/Rish2103/collective](https://github.com/Rish2103/collective) and open a **Pull Request** targeting `main`. Describe your changes and include screenshots if UI elements were modified.
