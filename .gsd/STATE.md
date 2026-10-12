---
updated: 2026-10-12T17:57:00+05:30
---

# Project State

## Current Position

**Milestone:** COLLECTIVE MVP
**Phase:** 4 - E2E Verification & Demo Polish
**Status:** verifying
**Plan:** Plan 4.1 - Multi-account rehearsal & live Monad deployment

## Last Action

- Built and compiled all smart contracts (`MockERC20.sol`, `CollectivePool.sol`).
- Executed Hardhat test suite: 20/20 unit tests passing with zero failures.
- Scaffolded React + Vite + TypeScript frontend with Tailwind CSS.
- Implemented `useWallet` hook with automatic Monad Testnet addition and network switching.
- Implemented `useCollective` hook with full pool lifecycle: create, 2-step approve & contribute, claim payout, and claim refund.
- Built interactive UI components: Navbar with live balances, Faucet modal, Create Pool modal with demo presets, Pool cards with live countdown timers, and Pool details modal.
- Verified production build (`npm run build`) in 2.45s with zero errors.
- Created root `package.json` and comprehensive `README.md`.

## Next Steps

1. Configure deployer private key in `.env` with funded Monad Testnet MON when ready.
2. Run `npm run deploy:monad` to deploy to live Monad Testnet.
3. Update contract addresses in `frontend/src/contracts/config.ts`.
4. Run `npm run dev` and test with MetaMask accounts.
5. Record hackathon demo video for Metropolis submission.

## Active Decisions

| Decision | Choice | Made | Affects |
|----------|--------|------|---------|
| Pool Architecture | Single Multi-Pool Contract (`CollectivePool.sol`) | 2026-10-12 | Contracts & Frontend state |
| Token Standard | ERC-20 (MockUSD) with open faucet | 2026-10-12 | Contracts & Faucet UX |
| Blockchain | Monad Testnet (Chain ID 10143) | 2026-10-12 | Deployment & Wallet config |
| Refunds | Pull over Push pattern (user claims refund) | 2026-10-12 | Contract security & gas safety |
| Demo Deadlines | Support short demo presets (3m/5m/1h) | 2026-10-12 | UI form & Hackathon judging |

## Blockers

None. Everything builds and passes automated tests locally.

## Concerns

- Ensure team has testnet `MON` for final live contract deployment on Monad Testnet.
