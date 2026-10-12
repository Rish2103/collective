# SPEC.md — Project Specification

> **Status**: `FINALIZED`
>
> 🔒 **Planning Lock**: Finalized for Hackathon Execution.

## Vision
**COLLECTIVE** is a decentralized, consumer-facing group-payment application built for the Metropolis Consumer Products & Payments Hackathon on the Monad Testnet. It enables users to create purpose-driven funding pools with defined targets, deadlines, and fixed recipients. Members contribute mock ERC-20 test tokens. A Solidity smart contract enforces successful payout to the recipient upon hitting the target, or allows contributors to claim 100% refunds if the deadline expires without meeting the funding target.

## Goals
1. **Trustless Group Pools**: Enable anyone to initiate a pool with a target amount, deadline, and fixed recipient.
2. **Automated Enforcement**: Enforce payout to recipient upon target completion and guaranteed pull refunds upon expired, unfunded pools via Solidity.
3. **Consumer-Grade UX**: Deliver an intuitive React + Vite + TypeScript interface integrated with MetaMask on Monad Testnet, featuring test-token faucet claims, seamless two-step contributions (approve + deposit), and live progress countdowns.

## Non-Goals (Out of Scope for MVP)
- Multi-signature or DAO governance over pool management.
- Dynamic or multiple split-recipient payouts.
- Native token (MON) payments (mock ERC-20 tokens are specified).
- Off-chain database or centralized backend storage (all state is on-chain or derived).
- Secondary market transfers of pool contribution positions.

## Constraints
- **Submission Deadline**: October 14, 2026, at 09:29 AM IST (~39 hours from start).
- **Network**: Monad Testnet (Chain ID `10143` / `0x279f`, RPC `https://testnet-rpc.monad.xyz`).
- **Client**: React + Vite + TypeScript + ethers.js v6 + MetaMask.
- **Tokens**: Mock ERC-20 (MockUSD) with open faucet capability.
- **Team**: 2–3 developers with mixed technical skills.

## Success Criteria
- [ ] Smart contracts (`MockERC20.sol` and `CollectivePool.sol`) compiled, tested with 100% passing unit tests, and deployed to Monad Testnet.
- [ ] Users can connect MetaMask and automatically switch/add Monad Testnet.
- [ ] Users can claim 1,000 MockUSD test tokens with one click from a faucet modal.
- [ ] Users can create a funding pool with a target amount, deadline (including 3m/5m demo presets), and recipient address.
- [ ] Contributors can approve and deposit MockUSD tokens into active pools.
- [ ] Recipient/Creator can trigger `claimPayout()` once the target is reached, successfully transferring funds to the recipient.
- [ ] Contributors can trigger `claimRefund()` when a pool expires below its target, successfully reclaiming their exact contributed tokens.
- [ ] No reentrancy vulnerabilities, CEI violations, or unhandled ERC-20 return values.

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| `CollectivePool.sol` (Multi-Pool Manager) | Must-have | Indexed storage mapping, nonReentrant, SafeERC20 |
| `MockERC20.sol` (Faucet Token) | Must-have | OpenZeppelin ERC20 with public `mint()` |
| Automated Contract Test Suite | Must-have | Hardhat TypeScript tests covering full matrix |
| Monad Testnet Deployment | Must-have | Live contracts verified/deployed on Monad |
| React + Vite + TS UI | Must-have | Pool list, pool details, create pool, faucet |
| MetaMask Wallet Connect | Must-have | ethers.js v6 BrowserProvider, network switch |
| 2-Step Contribution Flow | Must-have | Handled in UI: `approve` then `contribute` |

---

*Last updated: 2026-10-12T17:47:00+05:30*
