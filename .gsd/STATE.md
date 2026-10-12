---
updated: 2026-10-12T17:47:00+05:30
---

# Project State

## Current Position

**Milestone:** COLLECTIVE MVP
**Phase:** 1 - Smart Contracts & Local Testing
**Status:** executing
**Plan:** Plan 1.1 - Setup Hardhat environment and dependencies

## Last Action

- Inspected workspace and environment tools.
- Installed Node.js LTS v24.20.0 and npm 11.19.0 via winget.
- Initialized git repository.
- Created root `.gitignore`.
- Finalized `.gsd/SPEC.md` and `.gsd/ROADMAP.md`.

## Next Steps

1. Create `contracts/` directory and initialize Hardhat project.
2. Install `@openzeppelin/contracts`, `@nomicfoundation/hardhat-toolbox`, and ethers.
3. Write `MockERC20.sol` and `CollectivePool.sol`.
4. Run Hardhat unit tests to verify contract correctness.

## Active Decisions

| Decision | Choice | Made | Affects |
|----------|--------|------|---------|
| Pool Architecture | Single Multi-Pool Contract (`CollectivePool.sol`) | 2026-10-12 | Contracts & Frontend state |
| Token Standard | ERC-20 (MockUSD) with open faucet | 2026-10-12 | Contracts & Faucet UX |
| Blockchain | Monad Testnet (Chain ID 10143) | 2026-10-12 | Deployment & Wallet config |
| Refunds | Pull over Push pattern (user claims refund) | 2026-10-12 | Contract security & gas safety |
| Demo Deadlines | Support short demo presets (3m/5m/1h) | 2026-10-12 | UI form & Hackathon judging |

## Blockers

None.

## Concerns

- Need a funded Monad Testnet private key for final live deployment. (Local Hardhat testing will proceed immediately without waiting for testnet faucet).
