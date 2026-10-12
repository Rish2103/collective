---
updated: 2026-10-12T17:57:00+05:30
---

# Project State

## Current Position

**Milestone:** COLLECTIVE MVP
**Phase:** 4 - E2E Verification & Demo Polish
**Status:** complete
**Plan:** All Phase 4 plans complete & verified on Monad Testnet

## Last Action

- Deployed contracts to live Monad Testnet (Chain ID 10143):
  * MockERC20 (`mUSD`): `0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6`
  * CollectivePool: `0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02`
- Saved deployment metadata to `contracts/deployments/monadTestnet.json`.
- Configured frontend `.env` and `frontend/src/contracts/config.ts` with live Monad Testnet addresses.
- Executed multi-account live test on Monad Testnet:
  * Happy path: Pool created ➔ Deployer & Alice contributed ➔ Target reached ➔ Payout claimed to Bob (+100 mUSD received).
  * Refund path: Pool created with short deadline ➔ Alice contributed ➔ Deadline expired ➔ 100% refund claimed (+75 mUSD restored).
- All unit tests passing (20/20) and frontend production build verified.

## Next Steps

1. Run `npm run dev` to interact with the live dApp in the browser.
2. Push repository to public remote (GitHub/GitLab).
3. Optional: Deploy frontend to hosted platform (Vercel/Netlify).
4. Record technical demo video and submit before deadline (Oct 14, 09:29 AM IST).

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
