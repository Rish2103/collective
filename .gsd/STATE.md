---
updated: 2026-10-12T21:35:00+05:30
---

# Project State

## Current Position

**Milestone:** COLLECTIVE 2.0 — Innovation, Zero-Hardcoding Architecture, Premium UI & Reliability Upgrade
**Phase:** Phase 5 — COLLECTIVE 2.0 Execution
**Status:** complete
**Plan:** Plans 5.1 through 5.8 completed and verified with empirical test and browser evidence

## Last Action

- **Architectural Zero-Hardcoding Audit & Enforcement**:
  * Centralized configuration in `frontend/src/contracts/config.ts` with strict environment variable validation.
  * Verified 0 fake pools, 0 dummy statistics, and 0 hardcoded addresses in UI.
  * Deterministic BigInt token formatting via `ethers.formatUnits` in `utils/formatters.ts`.
- **Feature 1: Direct Shareable Pool Links (`?pool=<id>`)**:
  * Added 1-click share button on pool cards and modal with Web Share API and clipboard copy.
  * Direct URL parameter parsing on mount (`?pool=3`), opening the pool modal automatically, with fallback notification for invalid IDs.
- **Feature 2: Real-time On-Chain Activity Timeline**:
  * Built `useActivityTimeline.ts` querying verified `PoolCreated`, `ContributionMade`, `PayoutClaimed`, `RefundClaimed` events on Monad Testnet within the 100-block RPC limit.
  * Decodes block numbers, timestamps, caller addresses, and explorer deep-links in `ActivityTimeline.tsx`.
- **Feature 3: Personal Funding Dashboard ("My Activity")**:
  * Built `PersonalDashboard.tsx` summarizing total deposited capital, backed initiatives, created pools, and eligible pull refunds with direct claim alerts.
- **Feature 4: Funding Intelligence & Stretch Goals**:
  * Real backer counts, average deposit per backer, and surplus stretch goal disbursement indicator for overfunded pools (e.g. Pool #6).
- **Feature 5: Actionable Filters & Search**:
  * Filter pills for `All Pools (8)`, `Active (0)`, `Goal Met (3)`, `Refunds Open (5)`, `Created by Me`, and `Backed by Me`.
- **Feature 6: Trust & Transparency Panel**:
  * Built `TrustModal.tsx` detailing verified smart contracts, Monad Testnet chain parameters, non-custodial escrow, and pull-refund guarantees.
- **Empirical Verification**:
  * 28/28 passing Solidity unit tests in Hardhat.
  * Clean `tsc && vite build` production build.
  * 10-step Playwright browser test suite passing across Desktop, Tablet, and Mobile viewports with 0 console errors and 0 layout overflows.

## Active Decisions

| Decision | Choice | Made | Affects |
|----------|--------|------|---------|
| Pool Architecture | Single Multi-Pool Contract (`CollectivePool.sol`) | 2026-10-12 | Contracts & Frontend state |
| Token Standard | ERC-20 (MockUSD / mUSD) with open faucet | 2026-10-12 | Contracts & Faucet UX |
| Blockchain | Monad Testnet (Chain ID 10143) | 2026-10-12 | Deployment & Wallet config |
| Refunds | Pull over Push pattern (user claims refund) | 2026-10-12 | Contract security & gas safety |
| Overfunding Economics | Surplus funds disburse to recipient on payout; refunds permanently locked once funded | 2026-10-12 | Contract invariants & UI feedback |
| Read-Only Fallback | Fallback to public Monad JSON-RPC so all visitors can view pools without wallet | 2026-10-12 | Frontend accessibility & onboarding |
| RPC Log Window | Query maximum 100 blocks (`currentBlock - 99` to `currentBlock`) | 2026-10-12 | Monad RPC compatibility |

## Blockers

None. Fully verified and demo-ready for the Metropolis Hackathon deadline.
