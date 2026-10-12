---
milestone: COLLECTIVE MVP
version: 1.0.0
updated: 2026-10-12T17:47:00+05:30
---

# Roadmap

> **Current Phase:** 1 - Smart Contracts & Testing
> **Status:** executing

## Must-Haves (from SPEC)

- [ ] Smart contracts (`MockERC20.sol` and `CollectivePool.sol`)
- [ ] 100% automated contract test suite with zero failures
- [ ] Deployment script and deployed contracts on Monad Testnet
- [ ] React + Vite + TypeScript frontend with ethers.js v6
- [ ] MetaMask network auto-detection & switch to Monad Testnet
- [ ] Faucet UI for minting test MockUSD tokens
- [ ] Pool creation form with target, deadline presets, and recipient
- [ ] 2-step contribution UX (approve + contribute)
- [ ] Claim payout (target met) & claim refund (expired under target)
- [ ] End-to-end verified demo workflow

---

## Phases

### Phase 1: Smart Contracts & Local Testing
**Status:** 🔄 In Progress
**Objective:** Build and test `MockERC20.sol` and `CollectivePool.sol` using Hardhat, ensuring strict security and edge-case handling.
**Requirements:** Contract security (ReentrancyGuard, SafeERC20, CEI), Hardhat test suite, deployment script for Monad Testnet.

**Plans:**
- [ ] Plan 1.1: Setup Hardhat environment and OpenZeppelin dependencies.
- [ ] Plan 1.2: Implement `MockERC20.sol` and `CollectivePool.sol`.
- [ ] Plan 1.3: Author comprehensive unit tests and verify 100% pass rate.
- [ ] Plan 1.4: Configure Monad Testnet network and deployment scripts.

---

### Phase 2: Frontend Foundation & Wallet Integration
**Status:** ⬜ Not Started
**Objective:** Scaffold React + Vite + TypeScript frontend, integrate ethers.js v6, handle MetaMask connection & Monad Testnet switching, build test-token faucet modal.
**Depends on:** Phase 1

**Plans:**
- [ ] Plan 2.1: Initialize Vite React TS frontend with Tailwind CSS.
- [ ] Plan 2.2: Implement `useWallet` hook with MetaMask and Monad Testnet auto-switch.
- [ ] Plan 2.3: Implement Faucet UI modal for minting test tokens.

---

### Phase 3: Pool Interactions & State Transitions
**Status:** ⬜ Not Started
**Objective:** Build the pool creation, discovery, contribution, payout, and refund UI components with live blockchain synchronization.
**Depends on:** Phase 2

**Plans:**
- [ ] Plan 3.1: Pool creation form with validation and demo deadline presets.
- [ ] Plan 3.2: Pool discovery grid and detailed progress view with countdown timers.
- [ ] Plan 3.3: 2-step contribution flow (Approve + Deposit) with status toasts.
- [ ] Plan 3.4: Payout and refund claim action buttons with conditional state handling.

---

### Phase 4: E2E Verification & Demo Polish
**Status:** ⬜ Not Started
**Objective:** Rehearse the complete hackathon demo with multiple accounts on Monad Testnet, verify error boundaries, and produce submission assets.
**Depends on:** Phase 3

**Plans:**
- [ ] Plan 4.1: Multi-account live testing on Monad Testnet.
- [ ] Plan 4.2: UI polish, error states, and responsive styling.
- [ ] Plan 4.3: Documentation, deployment guide, and video demo recording checklist.
