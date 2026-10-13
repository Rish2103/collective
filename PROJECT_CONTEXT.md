# COLLECTIVE 2.0 — Comprehensive Project Architecture & Context Manual

> **Authoritative Context Document for Engineers and AI Agents Working on COLLECTIVE 2.0**  
> *Target Network:* Monad Testnet (Chain ID: `10143` / `0x279f`)  
> *Track:* Metropolis Hackathon — Consumer Products & Payments Track  
> *Repository:* [https://github.com/Rish2103/collective](https://github.com/Rish2103/collective)  
> *Last Updated:* October 2026

---

## 1. Executive Summary & Core Mission

**COLLECTIVE 2.0** is an open-source, consumer-focused group-payment decentralized application (dApp) built natively for **Monad Testnet**. 

Its purpose is to eliminate social coordination friction, awkward peer reminders, and default risk in shared group expenditures—such as group vacations, team dinners, hackathon registrations, shared gifts, and community projects.

Unlike traditional payment-splitting tools (e.g., Splitwise, Venmo group requests, WhatsApp bill-splitting) which depend on post-facto trust and manual chasing, COLLECTIVE enforces the entire funding lifecycle on-chain through mathematical smart-contract guarantees:
- **Happy Path (Target Met):** When funding reaches or exceeds the target before the deadline, 100% of the funds are unlocked and can be disbursed directly to the designated recipient address.
- **Sad Path (Deadline Expired Under Target):** If the deadline passes without meeting the target, every backer is guaranteed an individual, non-custodial **100% pull-refund** of their deposited tokens directly back to their wallet.

---

## 2. The Problem Space & Why Monad

### 2.1 The Traditional Group Payment Dilemma
In modern social life, group payments frequently fail due to three persistent friction points:
1. **The Organizer Burden:** One person fronts hundreds or thousands of dollars (for flights, Airbnb, dinner, or tickets) and spends weeks chasing peers for repayment.
2. **The "All-or-Nothing" Dilemma:** Many group activities only make sense if enough people participate. If 4 out of 10 people contribute, the organizer is stranded with partial funds and must manually refund everyone.
3. **Custody & Escrow Risk:** Centralized escrow services take high platform fees (3% to 8%), require cumbersome KYC for simple casual payments, and retain unilateral control over user deposits.

### 2.2 Why Monad Testnet?
COLLECTIVE leverages the unique strengths of the **Monad blockchain**:
- **10,000 Transactions Per Second (TPS) & 1-Second Block Finality:** Group contributions settle almost instantly, delivering a Web2-like consumer checkout experience without the typical 12-second to 15-minute confirmation latency of Ethereum Mainnet or older L2s.
- **Sub-Cent Gas Fees:** Casual group payments (e.g., a \$15 dinner split or \$25 gift contribution) are economically viable because gas overhead is fractions of a cent in `MON`.
- **EVM Equivalence:** Allows seamless integration of battle-tested Ethereum smart-contract standards (OpenZeppelin ERC-20, SafeERC20, ReentrancyGuard) and developer tooling (Hardhat, ethers.js v6).

---

## 3. Product Design & Mathematical Invariants

### 3.1 The Two Deterministic Lifecycle Outcomes

```
                              +---------------------------------------+
                              |   1. Organizer Creates Funding Pool   |
                              |   (Target, Duration, Recipient, Name) |
                              +---------------------------------------+
                                                  |
                                                  v
                              +---------------------------------------+
                              |    2. Backers Deposit Mock mUSD       |
                              |    (Atomic Token Allowance + Deposit) |
                              +---------------------------------------+
                                                  |
                         +------------------------+------------------------+
                         |                                                 |
         [Target Met Before Deadline]                         [Deadline Expires Below Target]
                         |                                                 |
                         v                                                 v
            +--------------------------+                      +--------------------------+
            | 3. Recipient Claims      |                      | 4. 100% Pull-Refunds     |
            |    Full Contributions    |                      |    Unlocked for Backers  |
            |    (Including Surplus)   |                      |    (Non-Custodial)       |
            +--------------------------+                      +--------------------------+
```

### 3.2 Non-Custodial Pull-Over-Push Refund Architecture
A common vulnerability in naive crowdfunding smart contracts is "push refunds" (the contract loops through an array of contributors and sends tokens to each). This pattern suffers from:
- **Out-of-Gas Denial-of-Service:** If a pool has 200 contributors, the gas cost of iterating over all addresses exceeds the block gas limit, permanently locking everyone's funds.
- **Malicious Revert DOS:** If one contributor is a smart contract that reverts on receipt, the entire refund loop reverts, preventing all other contributors from being refunded.

**The COLLECTIVE Solution (Pull-Based):**
COLLECTIVE uses the **Checks-Effects-Interactions (CEI)** pull-refund pattern:
1. State is updated first: `contributions[poolId][msg.sender] = 0;`
2. Tokens are transferred second: `IERC20(pool.token).safeTransfer(msg.sender, amount);`
3. Each contributor withdraws their own tokens independently. One backer's transaction has zero impact on another backer.

### 3.3 Overfunding & Stretch Goal Economics
Under the deployed smart contract rules:
- Pools remain active and accept contributions until the deadline or until payout is triggered.
- If a pool is overfunded (e.g. Pool #6 funded at 12,000 mUSD against a 10,000 mUSD target = 120%), the contract disburses the **entire total contributed** (including the surplus) to the recipient upon payout.
- Once a pool reaches or exceeds its target, **refunds are permanently locked**, preventing backers from withdrawing funds from a successful campaign.

### 3.4 Public Zero-Friction Read-Only Access
Anyone can explore the application, view active pools, check backer lists, and inspect platform volume directly via public Monad JSON-RPC **without connecting a wallet or holding testnet gas**. Wallet connection is only requested when an active on-chain transaction is initiated (Minting, Contributing, Creating, or Claiming).

---

## 4. System Architecture & Codebase Map

### 4.1 Monorepo Structure

```
COLLECTIVE/
├── contracts/                        # Smart contract suite (Hardhat + TypeScript)
│   ├── contracts/
│   │   ├── CollectivePool.sol        # Core escrow & pool manager contract
│   │   └── MockERC20.sol             # Mock USD (mUSD) test token with open faucet
│   ├── deployments/
│   │   ├── hardhat.json              # Local development addresses
│   │   └── monadTestnet.json         # Deployed Monad Testnet contract metadata
│   ├── scripts/
│   │   └── deploy.ts                 # Automated deployment script for Hardhat & Monad
│   ├── test/
│   │   └── CollectivePool.test.ts    # 28 comprehensive automated unit tests
│   ├── hardhat.config.ts             # Hardhat network & compiler configuration
│   ├── package.json                  # Contract workspace dependencies
│   └── .env.example                  # Template for deployer credentials
├── frontend/                         # Consumer web dApp (React 18 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/               # React UI components
│   │   │   ├── ActivityTimeline.tsx  # Dual-view on-chain activity & pool status
│   │   │   ├── CreatePoolModal.tsx   # Pool creation modal with template presets
│   │   │   ├── FaucetModal.tsx       # mUSD test token faucet dialog
│   │   │   ├── HowItWorks.tsx        # 3-step lifecycle consumer explainer
│   │   │   ├── Navbar.tsx            # Header with wallet, block ticker & audio toggle
│   │   │   ├── PersonalDashboard.tsx # "My Activity" backer dashboard
│   │   │   ├── PoolCard.tsx          # Pool card with progress and share action
│   │   │   ├── PoolDetailsModal.tsx  # Detailed pool view with backer list
│   │   │   ├── ShareModal.tsx        # QR code & social share drawer
│   │   │   ├── TransactionFeedback.tsx # Floating transaction status & stopwatch
│   │   │   └── TrustModal.tsx        # Security & smart-contract rules modal
│   │   ├── contracts/                # Contract ABIs and Monad network config
│   │   │   ├── abis.ts               # Human-readable ethers.js ABIs
│   │   │   └── config.ts             # Deployed addresses and RPC configuration
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useActivityTimeline.ts# Event log querying & bounded pagination
│   │   │   ├── useBlockTicker.ts     # Live Monad block height polling
│   │   │   ├── useCollective.ts      # Multi-pool reads, writes & refund hooks
│   │   │   └── useWallet.ts          # MetaMask connection & network management
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── audioFeedback.ts      # Synthesized Web Audio feedback
│   │   │   ├── errorHandler.ts       # RPC and contract error decoding
│   │   │   └── formatters.ts         # Wei/Ether formatters and countdown timers
│   │   ├── types/                    # Shared TypeScript interfaces
│   │   │   └── index.ts              # PoolData, PoolState, TimelineEvent types
│   │   ├── App.tsx                   # Main application container & views
│   │   └── main.tsx                  # Application entry point
│   ├── test-browser.js               # 13 automated Playwright E2E browser tests
│   ├── package.json                  # Frontend scripts & dependencies
│   ├── vite.config.ts                # Vite bundler configuration
│   └── .env.example                  # Template for frontend environment variables
├── .gitignore                        # Git exclusion rules
├── package.json                      # Root workspace orchestrator scripts
├── README.md                         # Main repository documentation
├── CONTRIBUTING.md                   # Collaboration & pull request guide
└── PROJECT_CONTEXT.md                # This comprehensive context manual
```

---

## 5. Smart Contracts Deep Dive

### 5.1 `CollectivePool.sol`

The core contract managing all pool lifecycles.

```solidity
enum PoolState {
    Active,     // Accepting contributions (until deadline or payout)
    PaidOut,    // Target met and funds transferred to recipient
    Refunding   // Deadline passed without meeting target, contributors claiming refunds
}

struct Pool {
    uint256 id;
    address creator;
    address recipient;
    address token;
    uint256 targetAmount;
    uint256 deadline;
    uint256 totalContributed;
    PoolState state;
    string title;
    string description;
}
```

#### Core Storage Mappings:
- `nextPoolId`: Global counter for pool IDs.
- `pools[poolId]`: Complete pool metadata struct.
- `contributions[poolId][contributor]`: Amount deposited by specific account in Wei.
- `poolContributors[poolId]`: Dynamic list of unique backer addresses.
- `hasContributed[poolId][contributor]`: Deduplication flag ensuring unique backer arrays.

#### Key Functions:
1. **`createPool(address token, address recipient, uint256 targetAmount, uint256 durationSeconds, string title, string description)`**
   - Validates non-zero addresses and positive values.
   - Calculates immutable deadline: `block.timestamp + durationSeconds`.
   - Emits `PoolCreated`.
2. **`contribute(uint256 poolId, uint256 amount)`**
   - Guarded by `nonReentrant`.
   - Requires `pool.state == PoolState.Active` and `block.timestamp < pool.deadline`.
   - Uses `IERC20(pool.token).safeTransferFrom(msg.sender, address(this), amount)`.
   - Tracks unique contributors for on-chain discovery.
   - Emits `ContributionMade`.
3. **`claimPayout(uint256 poolId)`**
   - Guarded by `nonReentrant`.
   - Requires `pool.totalContributed >= pool.targetAmount`.
   - Sets `pool.state = PoolState.PaidOut` before external call.
   - Sends the entire `pool.totalContributed` to `pool.recipient`.
   - Emits `PayoutClaimed`.
4. **`claimRefund(uint256 poolId)`**
   - Guarded by `nonReentrant`.
   - Requires `block.timestamp >= pool.deadline`, `pool.totalContributed < pool.targetAmount`, and `pool.state != PoolState.PaidOut`.
   - Checks user deposit: `contributedAmount = contributions[poolId][msg.sender]; require(contributedAmount > 0)`.
   - Sets deposit to 0 first (CEI): `contributions[poolId][msg.sender] = 0;`.
   - Transfers tokens: `IERC20(pool.token).safeTransfer(msg.sender, contributedAmount);`.
   - Emits `RefundClaimed`.
5. **`getComputedState(uint256 poolId)`**
   - Dynamic view function accounting for deadline passage in real time without needing an on-chain transaction.

### 5.2 `MockERC20.sol`

A standard ERC-20 contract with an open `mint(address to, uint256 amount)` faucet method allowing users to mint 1,000 `mUSD` directly to their wallet for testing without cost.

---

## 6. Frontend Architecture & Custom Hooks

The frontend is built with **React 18**, **Vite 5**, and **ethers.js v6**. It follows a modular, hook-driven architecture:

### 6.1 `useWallet` Hook (`frontend/src/hooks/useWallet.ts`)
- Manages MetaMask connection lifecycle (`account`, `chainId`, `isConnecting`, `error`).
- Automatically handles network switching: if connected to an incorrect network, prompts MetaMask to switch to or add **Monad Testnet** (Chain ID `10143`, Hex `0x279f`).
- Listens to `accountsChanged` and `chainChanged` window events for instant state synchronization.

### 6.2 `useCollective` Hook (`frontend/src/hooks/useCollective.ts`)
- **Public Read Fallback:** Initializes with `ethers.BrowserProvider` if MetaMask is available; otherwise transparently falls back to `ethers.JsonRpcProvider(MONAD_TESTNET.rpcUrl)`.
- **Atomic Two-Step Contribution:** Checks current allowance with `token.allowance()`. If allowance is insufficient, automatically initiates `token.approve()` before triggering `pool.contribute()`.
- **Refined Refund Accounting:** Differentiates between:
  - *Active Escrow:* Pool is currently active before deadline.
  - *Claimable Refund:* Pool expired under target and `contributions[poolId][account] > 0`.
  - *Settled Refund:* Backer previously contributed, but deposit has already been withdrawn (`contributions[poolId][account] == 0`).
  - *Never Contributed:* Backer has no historical or current stake in the pool.

### 6.3 `useActivityTimeline` Hook (`frontend/src/hooks/useActivityTimeline.ts`)
- Solves Monad Testnet's RPC constraint: `eth_getLogs` is strictly limited to 100 blocks per query.
- Bounded batch querying: Scans the most recent 500 blocks using 5 safe chunks of 100 blocks with 60ms throttling between calls.
- Provides a "Scan Older Blocks" pagination trigger that loads earlier 500-block intervals on user demand.
- Local event deduplication and persistent caching in `localStorage`.

### 6.4 `useBlockTicker` Hook (`frontend/src/hooks/useBlockTicker.ts`)
- Polls Monad Testnet block height every 3.5 seconds.
- Displays a pulsating block number indicator in the navbar, reinforcing Monad's high-throughput block production.

### 6.5 Synthetic Web Audio Feedback (`frontend/src/utils/audioFeedback.ts`)
- Zero external audio files or network requests: generates pure acoustic chimes using the browser's native **Web Audio API**.
- **Autoplay Safeguard:** Employs `await audioCtx.resume()` to prevent dropped notes in modern Chromium browsers.
- **Calibrated Volume:** Tuned to a pleasant ~0.22 peak gain with a 15ms linear attack envelope and smooth exponential decay to avoid speaker pops.
- **Wired Events:**
  - `playToggleSound(enabled)`: Ascending C5 $\rightarrow$ G5 chime on enable; descending E5 $\rightarrow$ C5 tone on mute.
  - `playCopyChime()`: Crisp double-ping (E5 + A5) for all copy actions (links, addresses, contracts).
  - `playClickSound()`: Subtle tactile micro-tap for tab switching and quick templates.
  - `playSuccessChime()`: 4-note ascending major arpeggio for faucet mints and confirmed transactions.

---

## 7. Zero-Hardcoding Architecture (Strict Rule)

**Non-Negotiable Project Constraint:** No dynamic application values may be hardcoded or fabricated.

| Prohibited Pattern | Implemented Architectural Solution |
|---|---|
| Hardcoded pool names or dummy descriptions | All pools are fetched dynamically via `CollectivePool.pools(i)` on Monad Testnet. |
| Hardcoded platform statistics (volume, counts) | Metrics are computed deterministically from on-chain BigInt state (`reduce` over live pools). |
| Hardcoded recipient or contributor addresses | Addresses are read directly from contract state and rendered with explorer links. |
| Fabricated transaction activity or fake timestamps | The Activity Timeline decodes real event logs from Monad Testnet RPC. |
| Hardcoded refund availability | Refund eligibility is derived directly from `contract.contributions(poolId, account)`. |

Centralized configuration lives strictly in `frontend/src/contracts/config.ts` with support for Vite environment variables (`VITE_MONAD_RPC_URL`, `VITE_COLLECTIVE_POOL_ADDRESS`, `VITE_MOCK_TOKEN_ADDRESS`).

---

## 8. Live Deployed Contracts on Monad Testnet

| Contract | Address | Explorer Link |
|---|---|---|
| **CollectivePool (Manager)** | `0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02) |
| **MockERC20 (`mUSD`)** | `0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6) |
| **Deployer Wallet** | `0xbDE38691fa0E8d34782a5F76504001f0Cb5b083d` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xbDE38691fa0E8d34782a5F76504001f0Cb5b083d) |

### Network Parameters
- **Network Name**: Monad Testnet
- **Chain ID**: `10143` (`0x279f` in hex)
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Native Gas Currency**: `MON` (18 decimals)
- **Block Explorer**: `https://testnet.monadexplorer.com`

---

## 9. Notable On-Chain Pool Context (Monad Testnet)

When testing against live Monad Testnet data, the incoming engineer should understand the actual state of the existing pools on-chain:
- **Pool #0 ("Metropolis Hackathon Dinner")**: Expired and refunded.
- **Pool #1 ("E2E Short Expiry Pool")**: Expired under target. Active pull-refunds open.
- **Pool #2 ("Metropolis Team Dinner Fund")**: Successfully funded (target reached) and paid out.
- **Pool #3 ("Expired Trip Pool")**: Expired under target; contributor has already claimed their refund (`Refunds Settled`, remaining held = 0 mUSD).
- **Pool #6 ("xx")**: Heavily overfunded pool (12,000 mUSD contributed vs 10,000 mUSD target). Successfully paid out to recipient with surplus stretch goal demonstrated.
- **Pool #7 ("pp")**: Expired pool with short title `"pp"` created during boundary testing. Accurately labeled as `Pool #7 (titled "pp")` in the dashboard.

---

## 10. Automated Test Suites & Verification

### 10.1 Smart Contract Unit Tests (28/28 Passing)
Run via Hardhat:
```bash
npm --prefix contracts test
# or from root: npm run test
```
**Test Coverage Highlights:**
1. Parameter validation: zero-address tokens, zero targets, zero durations, empty titles.
2. Contribution mechanics: token deductions, allowance checks, multi-backer accounting.
3. Happy path payout: target reached, funds disbursed, duplicate claims blocked.
4. Sad path pull-refunds: exact deadline boundary transitions (`block.timestamp == deadline`), 100% balance return, zero-contribution rejections.
5. Overfunding semantics: surplus disburse to recipient, permanent refund lockout once target met.
6. Multi-pool isolation: independent balances and zero accounting bleed across pools.

### 10.2 Headless Browser E2E Tests (13 Scenarios Passing)
Run via Playwright:
```bash
npm --prefix frontend run test:browser
```
**E2E Scenarios Tested:**
1. Desktop Viewport (1280×800) full layout & metrics.
2. Consumer Explainer ("How COLLECTIVE Works") 3-step rendering.
3. Monad block ticker & sound toggle controls.
4. Quick pool-creation templates autofill.
5. Share modal with offline high-contrast QR code rendering.
6. Pool details modal with on-chain backers list and explorer links.
7. Dual-view Activity Timeline (Monad event logs vs verified pool status).
8. Personal Backer Dashboard ("My Activity") accounting.
9. Trust & Protocol Rules modal.
10. Deep link routing (`?pool=3`) auto-opening requested pool.
11. Mobile Viewport (375×667) responsiveness and navigation.
12. Invalid pool deep link handling (`?pool=9999`).
13. Contributor refund state verification (settled vs active refunds vs stretch goals).

### 10.3 Production Frontend Build
```bash
npm --prefix frontend run build
# or from root: npm run build
```
Executes `tsc && vite build`, compiling all TypeScript with zero errors.

---

## 11. Instructions & Best Practices for Incoming Agents

When extending or collaborating on this codebase, adhere strictly to these principles:

1. **Do Not Redeploy Smart Contracts:**
   - The contracts at `0x4c1205b4...` and `0xb4C9816b...` are verified and populated with live testnet pools. Keep them unchanged in `frontend/src/contracts/config.ts`.
2. **Preserve the Zero-Hardcoding Invariant:**
   - Never insert mock pools, dummy testimonials, or fabricated balances into UI components. If new metrics are needed, derive them from contract state or event logs.
3. **Never Commit Secrets or Private Keys:**
   - Keep `.env` files untracked. Only update `.env.example` templates with generic placeholders.
4. **Follow the Feature Branch Workflow:**
   - Always branch off `main`: `git switch -c feat/your-feature-name`.
   - Keep commits small, atomic, and descriptive.
5. **Verify Before Submitting:**
   - Always run `npm run test` (contracts) and `npm run build` (frontend) before committing.
