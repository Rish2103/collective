---
milestone: COLLECTIVE MVP
version: 1.0.0
updated: 2026-10-12T17:57:00+05:30
---

# Roadmap

> **Current Phase:** 4 - E2E Verification & Demo Polish
> **Status:** ✅ Complete

## Must-Haves (from SPEC)

- [x] Smart contracts (`MockERC20.sol` and `CollectivePool.sol`)
- [x] 100% automated contract test suite with zero failures (20/20 passing)
- [x] Deployment script and deployed contracts for Monad Testnet & Localhost
- [x] React + Vite + TypeScript frontend with ethers.js v6
- [x] MetaMask network auto-detection & switch to Monad Testnet (Chain ID 10143)
- [x] Faucet UI for minting test MockUSD tokens
- [x] Pool creation form with target, deadline presets (3m/5m/1h), and recipient
- [x] 2-step contribution UX (approve + contribute) with live feedback
- [x] Claim payout (target met) & claim refund (expired under target)
- [x] Multi-account live testing on Monad Testnet (Rehearsal)

---

## Phases

### Phase 1: Smart Contracts & Local Testing
**Status:** ✅ Complete
**Objective:** Build and test `MockERC20.sol` and `CollectivePool.sol` using Hardhat, ensuring strict security and edge-case handling.
**Requirements:** Contract security (ReentrancyGuard, SafeERC20, CEI), Hardhat test suite, deployment script for Monad Testnet.

**Plans:**
- [x] Plan 1.1: Setup Hardhat environment and OpenZeppelin dependencies.
- [x] Plan 1.2: Implement `MockERC20.sol` and `CollectivePool.sol`.
- [x] Plan 1.3: Author comprehensive unit tests and verify 100% pass rate (20 passing tests).
- [x] Plan 1.4: Configure Monad Testnet network and deployment scripts.

---

### Phase 2: Frontend Foundation & Wallet Integration
**Status:** ✅ Complete
**Objective:** Scaffold React + Vite + TypeScript frontend, integrate ethers.js v6, handle MetaMask connection & Monad Testnet switching, build test-token faucet modal.
**Depends on:** Phase 1

**Plans:**
- [x] Plan 2.1: Initialize Vite React TS frontend with Tailwind CSS.
- [x] Plan 2.2: Implement `useWallet` hook with MetaMask and Monad Testnet auto-switch.
- [x] Plan 2.3: Implement Faucet UI modal for minting test tokens.

---

### Phase 3: Pool Interactions & State Transitions
**Status:** ✅ Complete
**Objective:** Build the pool creation, discovery, contribution, payout, and refund UI components with live blockchain synchronization.
**Depends on:** Phase 2

**Plans:**
- [x] Plan 3.1: Pool creation form with validation and demo deadline presets.
- [x] Plan 3.2: Pool discovery grid and detailed progress view with countdown timers.
- [x] Plan 3.3: 2-step contribution flow (Approve + Deposit) with status toasts.
- [x] Plan 3.4: Payout and refund claim action buttons with conditional state handling.

---

### Phase 4: E2E Verification & Demo Polish
**Status:** ✅ Complete
**Objective:** Rehearse the complete hackathon demo with multiple accounts on Monad Testnet, verify error boundaries, and produce submission assets.
**Depends on:** Phase 3

**Plans:**
- [x] Plan 4.1: Multi-account live testing on Monad Testnet.
- [x] Plan 4.2: UI polish, error states, and responsive styling.
- [x] Plan 4.3: Documentation, deployment guide, and video demo recording checklist.

---

### Phase 5: COLLECTIVE 2.0 — Innovation, Zero-Hardcoding & Premium UI Upgrade
**Status:** ⏳ In Progress
**Objective:** Deliver shareable pool links, on-chain activity timeline, personal contributions dashboard, funding intelligence, zero-hardcoding centralization, and premium Metropolis UI.
**Depends on:** Phase 4

**Plans:**
- [ ] Plan 5.1: Zero-hardcoding audit and centralized configuration module.
- [ ] Plan 5.2: Shareable pool links with URL parameter routing (`?pool=id`) and copy feedback.
- [ ] Plan 5.3: Transparent on-chain activity timeline with live event decoding and last sync time.
- [ ] Plan 5.4: Personal contributions / backer dashboard with claimable refund badges.
- [ ] Plan 5.5: Funding intelligence metrics (velocity, stretch goals, contributor analytics) & filters.
- [ ] Plan 5.6: Trust & transparency panel with verified explorer links & gas guidance.
- [ ] Plan 5.7: Premium Metropolis design overhaul & transaction status feedback system.
- [ ] Plan 5.8: Comprehensive verification (contracts, build, Playwright browser tests).
