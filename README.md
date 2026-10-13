# COLLECTIVE 2.0

> **Bring people together to fund shared goals, with transparent on-chain outcomes.**

Built for the **Metropolis Hackathon — Consumer Products & Payments track** on **Monad Testnet** (Chain ID: `10143`).

---

## 🚀 Overview

**COLLECTIVE 2.0** solves trust, accountability, and coordination failures in group payments—such as shared vacations, team dinners, hackathon projects, event tickets, and community initiatives.

Traditional group-splitting apps rely on post-event reminders, off-chain trust, and manual payment chasing. COLLECTIVE enforces the entire funding lifecycle on-chain:

- **Target Met**: If the funding target is reached before the deadline, the recipient can claim the full amount contributed under the deployed contract rules.
- **Deadline Passed Below Target**: If the deadline passes without reaching the target, every contributor can individually claim a 100% refund through a non-custodial pull-refund mechanism.

> [!NOTE]  
> **Hackathon Prototype Notice**: The live deployment runs on **Monad Testnet** using mock **mUSD** test tokens. It is an experimental prototype built for the Metropolis Hackathon, not a commercial banking or production financial service.

---

## ✨ Features

- **Dynamic On-Chain Pool Discovery**: All active, funded, and expired pools are loaded live from the `CollectivePool` smart contract via read-only JSON-RPC. Zero mock data or fabricated pools.
- **Pool Creation & Contribution**: Creators set a title, description, target amount, duration, and recipient. Any connected wallet can contribute `mUSD` with one-click allowance approval.
- **Mock mUSD Faucet**: Integrated in-app faucet allows anyone to mint test `mUSD` tokens immediately to test contributions.
- **Pull-Based Refunds**: Contributors pull their own refunds individually; no creator permission is required and one backer's claim cannot block another.
- **Target & Deadline Enforcement**: Immutable smart-contract logic locks contributions once the deadline passes and guarantees fund accessibility.
- **Shareable Pool Links & QR Drawer**: Direct deep links (`?pool=<id>`) and offline, high-contrast QR code generation for effortless sharing over WhatsApp, Telegram, or X.
- **On-Chain Backers List**: Inspect verified contributors for any pool directly in the pool details dialog with deterministic avatars, shortened addresses, and Monad Explorer links.
- **Dual-View Activity Timeline**: Switch between live Monad Testnet event receipts (within a safe 100-block window with pagination) and verified pool status cards computed from contract storage.
- **Personal Activity Dashboard ("My Activity")**: Tracks connected wallet metrics—total deposited capital, backed initiatives, created pools, and highlights claimable refunds with a dedicated action banner.
- **Real-Time Funding Intelligence & Stretch Goals**: Dynamic progress bars, backer counts, average contribution figures, and explicit stretch goal badges for overfunded pools.
- **Quick-Start Pool Templates**: 1-click presets for common consumer scenarios (*Hackathon Team Dinner*, *Cabin Trip*, *Community Gift*, *Fast Demo*).
- **Live Monad Block Ticker & Stopwatch**: Pulsating live block height badge in the navigation bar and real-time transaction stopwatch measuring Monad finality duration.
- **Sensory Audio Feedback**: Optional, client-side synthesized Web Audio chimes (toggleable, muted by default) for link copying, tab navigation, and transaction confirmation.
- **Trust & Protocol Rules Modal**: In-app inspector detailing deployed contract addresses, bytecode verification status, non-custodial invariants, and economic rules.
- **Fully Responsive UI**: Mobile-optimized layouts tested across desktop (1280×800), tablet (768×1024), and mobile (375×667) screen sizes.

---

## 🔄 How It Works

```
      +-------------------------------------------------------------+
      |  1. Creator opens pool (target, duration, recipient, title)  |
      +-------------------------------------------------------------+
                                     |
                                     v
      +-------------------------------------------------------------+
      |        2. Contributors deposit mock mUSD into escrow         |
      +-------------------------------------------------------------+
                                     |
                 +-------------------+-------------------+
                 |                                       |
       [Target Met Before Deadline]          [Deadline Passes Under Target]
                 |                                       |
                 v                                       v
      +-------------------------+             +-------------------------+
      | 3. Recipient Claims     |             | 4. Individual Pull      |
      |    Full Contributions   |             |    Refunds Unlocked     |
      |    (including surplus)  |             |    (100% of deposit)    |
      +-------------------------+             +-------------------------+
```

1. **Pool Creation**: The creator defines the purpose, target amount (in mUSD), deadline duration, and recipient address.
2. **Escrow Funding**: Contributors approve and transfer mock mUSD tokens directly into the `CollectivePool` escrow contract.
3. **Successful Funding (Payout Flow)**:
   - Once total contributions reach or exceed the target, the pool state switches to funded.
   - The designated recipient can call `claimPayout` at any time to receive the total balance contributed.
   - **Surplus & Stretch Goals**: Under the deployed smart-contract rules, if a pool receives contributions above 100% of its target, the **entire contribution total** is disbursed to the recipient upon payout. The contract does not automatically return surplus funds to contributors.
4. **Underfunded Expiry (Pull-Refund Flow)**:
   - If the deadline expires and total contributions are below the target, the pool enters the refunding state.
   - Each contributor can call `claimRefund` individually to withdraw **100% of their deposited tokens**.
   - Refunds are **pull-based** (users claim their own funds), preventing denial-of-service vulnerabilities.

---

## 💻 Technology Stack

- **Smart Contracts**: Solidity `^0.8.20`, Hardhat, OpenZeppelin Contracts v5 (`ReentrancyGuard`, `SafeERC20`, `ERC20`)
- **Frontend Framework**: React 18, Vite 5, TypeScript 5
- **Styling**: Tailwind CSS 3, Lucide React icons
- **Blockchain Connectivity**: ethers.js v6, MetaMask browser extension
- **Target Network**: Monad Testnet (Chain ID: `10143`)
- **Utility Libraries**: `qrcode` (offline SVG/Canvas generation)
- **Audio Synthesis**: Native Web Audio API (zero external sound assets)
- **Testing**: Hardhat Test Suite (contract unit tests), Playwright (headless browser E2E tests)

---

## 📁 Architecture & Directory Structure

```
COLLECTIVE/
├── contracts/                        # Smart contract workspace (Hardhat)
│   ├── contracts/
│   │   ├── CollectivePool.sol        # Core escrow & pool manager contract
│   │   └── MockERC20.sol             # Mock mUSD token with public faucet mint
│   ├── deployments/
│   │   ├── hardhat.json              # Local development addresses
│   │   └── monadTestnet.json         # Deployed Monad Testnet contract metadata
│   ├── scripts/
│   │   └── deploy.ts                 # Deployment script for local and testnet
│   ├── test/
│   │   └── CollectivePool.test.ts    # 28 automated contract unit tests
│   ├── hardhat.config.ts             # Hardhat network & compiler configuration
│   ├── package.json                  # Contract workspace scripts & dependencies
│   └── .env.example                  # Template for deployer credentials
├── frontend/                         # Web dApp client (React + Vite)
│   ├── src/
│   │   ├── components/               # React UI components
│   │   │   ├── ActivityTimeline.tsx  # Dual-view on-chain activity & pool status
│   │   │   ├── CreatePoolModal.tsx   # Pool creation modal with template presets
│   │   │   ├── FaucetModal.tsx       # mUSD test token faucet dialog
│   │   │   ├── HowItWorks.tsx        # 3-step lifecycle explainer
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
│   │   │   └── formatters.ts         # Wei/Ether formatters and deadline countdowns
│   │   ├── App.tsx                   # Main application container & views
│   │   └── main.tsx                  # Application entry point
│   ├── test-browser.js               # 13 automated Playwright E2E browser tests
│   ├── package.json                  # Frontend scripts & dependencies
│   ├── vite.config.ts                # Vite bundler configuration
│   └── .env.example                  # Template for frontend environment variables
├── .gitignore                        # Git exclusion rules
├── package.json                      # Root workspace orchestrator scripts
└── README.md                         # Project documentation
```

---

## 📋 Prerequisites

Before setting up the project locally, ensure you have:

- **Git**: Installed and configured.
- **Node.js**: `v20.x` or `v22.x` LTS recommended.
- **npm**: `v10.x` or higher.
- **MetaMask Extension**: Installed in your browser.
- **Testnet MON**: Required for gas fees on Monad Testnet (obtainable via the official Monad faucet).

---

## 🚀 Installation & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Rish2103/collective.git
cd collective
```

### 2. Install Dependencies

Install root and workspace dependencies:

```bash
# Install contract dependencies
npm --prefix contracts install

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Configure Frontend Environment (Optional)

The frontend includes verified default fallbacks pointing to the live Monad Testnet deployment. If you wish to customize RPC endpoints or addresses, create a local environment file:

```bash
cp frontend/.env.example frontend/.env.local
```

### 4. Run Contract Unit Tests

Verify smart-contract invariants with 28 automated tests:

```bash
npm run test
# or: npm --prefix contracts test
```

### 5. Start the Frontend Development Server

```bash
npm run dev
# or: npm --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Build the Frontend for Production

Verify TypeScript compilation and bundle creation:

```bash
npm run build
# or: npm --prefix frontend run build
```

### 7. Run Browser E2E Tests

Execute the headless Playwright browser test suite across 15 test scenarios:

```bash
npm run test:browser
# or: npm --prefix frontend run test:browser
```

### 8. Deploy to Vercel

To deploy COLLECTIVE to Vercel:

1. **Import Repository**: In the Vercel dashboard, click **Add New** > **Project** and select this repository.
2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (uses `frontend/package-lock.json`)
3. **Configure Environment Variables**:
   Add the following public environment variables (all include safe in-app fallbacks to live Monad Testnet contracts):
   - `VITE_MONAD_RPC_URL` = `https://testnet-rpc.monad.xyz`
   - `VITE_MONAD_EXPLORER_URL` = `https://testnet.monadexplorer.com`
   - `VITE_COLLECTIVE_POOL_ADDRESS` = `0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02`
   - `VITE_MOCK_TOKEN_ADDRESS` = `0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6`
   - `VITE_USDC_ADDRESS` = `0x534b2f3A21130d7a60830c2Df862319e593943A3`
4. **Deploy**: Click **Deploy**. The build completes in ~8 seconds and serves via Vercel's global edge network.

---

## ⚙️ Environment Variables

### Frontend Variables (`frontend/.env.example`)

All frontend variables use the `VITE_` prefix and are bundled into client-side code. **Never put private keys or secrets in frontend environment files.**

| Variable | Description | Required | Default / Fallback |
|---|---|---|---|
| `VITE_MONAD_RPC_URL` | Monad Testnet JSON-RPC endpoint | Optional | `https://testnet-rpc.monad.xyz` |
| `VITE_MONAD_EXPLORER_URL` | Monad Testnet block explorer URL | Optional | `https://testnet.monadexplorer.com` |
| `VITE_COLLECTIVE_POOL_ADDRESS` | Deployed `CollectivePool` address | Optional | `0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02` |
| `VITE_MOCK_TOKEN_ADDRESS` | Deployed `MockERC20` (mUSD) address | Optional | `0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6` |
| `VITE_USDC_ADDRESS` | Deployed Native Circle USDC address (6 dec) | Optional | `0x534b2f3A21130d7a60830c2Df862319e593943A3` |

### Contracts Variables (`contracts/.env.example`)

Used exclusively when running deployment scripts via Hardhat.

| Variable | Description | Required | Note |
|---|---|---|---|
| `PRIVATE_KEY` | Deployer account private key (hex without `0x`) | Required for testnet deploy | **Never commit to Git** |
| `MONAD_TESTNET_RPC` | RPC URL for contract deployment | Optional | `https://testnet-rpc.monad.xyz` |

---

## 🌐 Deployed Smart Contracts

The contracts and supported tokens are operational on **Monad Testnet**:

| Contract / Asset | Address | Explorer Link | Decimals |
|---|---|---|---|
| **CollectivePool** (Manager) | `0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02) | N/A |
| **Native Circle USDC** (Digital Dollar) | `0x534b2f3A21130d7a60830c2Df862319e593943A3` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x534b2f3A21130d7a60830c2Df862319e593943A3) | `6` |
| **MockERC20 (`mUSD`)** (Test Token) | `0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6) | `18` |
| **Deployer Wallet** | `0xbDE38691fa0E8d34782a5F76504001f0Cb5b083d` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xbDE38691fa0E8d34782a5F76504001f0Cb5b083d) | N/A |

### Network Parameters

- **Network Name**: Monad Testnet
- **Chain ID**: `10143` (`0x279f`)
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Native Gas Token**: `MON` (18 decimals)
- **Block Explorer**: [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com)
- **Token Decimals**: `6` for Circle USDC; `18` for native MON and mock mUSD

> [!WARNING]  
> **Test Token Disclaimer**: `mUSD` and testnet `USDC` on Monad Testnet are experimental test tokens with **no fiat value**. Do not send real funds or mainnet assets to any of these addresses.

---

## 🛡️ Smart Contract Rules & Invariants

1. **Checks-Effects-Interactions (CEI)**: Internal state updates (balances and pool states) occur before any external ERC-20 token transfers.
2. **Reentrancy Protection**: Critical entry points (`contribute`, `claimPayout`, `claimRefund`) utilize OpenZeppelin's `ReentrancyGuard`.
3. **Safe ERC-20 Handling**: Token transfers use OpenZeppelin's `SafeERC20` to guarantee revert-on-failure behavior across non-standard implementations.
4. **Independent Pull Refunds**: Contributors individually execute their own refund claims. The contract does not use loops over contributor arrays, eliminating denial-of-service and out-of-gas attack vectors.
5. **Exact Timestamp Boundaries**:
   - `contribute()` reverts when `block.timestamp >= pool.deadline`.
   - `claimRefund()` is enabled when `block.timestamp >= pool.deadline && totalContributed < targetAmount`.
6. **Overfunding & Surplus Economics**:
   - If a pool exceeds its target, all contributed funds (including surplus) transfer to the recipient on payout.
   - Once a pool reaches or exceeds its target, refunds are permanently locked.
7. **Solvency Guarantee**: At all times, the contract's token balance matches `totalContributed - totalRefunded` for active/refunding pools.

---

## 🧪 Testing Suite

### 1. Smart Contract Unit Tests (28/28 Passing)

The Hardhat suite executes 28 unit tests covering:
- Pool creation parameter validation and zero-address checks.
- Contribution accounting, multiple contributions by the same user, and token transfers.
- Happy path payout execution and double-payout prevention.
- Sad path pull-refund verification and 100% balance return.
- Overfunding economics and stretch goal disbursement.
- Exact timestamp boundary conditions (`block.timestamp == deadline`).
- Multi-pool isolation and independent solvency.

Run tests:
```bash
npm run test
```

### 2. Frontend Production Build & TypeScript Check

Validates strict TypeScript types and produces an optimized Vite bundle:
```bash
npm run build
```

### 3. Automated Browser E2E Tests (13 Scenarios Passing)

The Playwright browser suite tests 13 end-to-end user scenarios:
- Desktop, tablet, and mobile viewport responsiveness.
- Live RPC data rendering and zero hardcoded metrics.
- "How It Works" 3-step explainer display and testnet disclosures.
- Audio toggle and synthesized chime triggers.
- Quick pool-creation templates autofill.
- Share modal and offline QR code rendering.
- On-chain backers list with explorer links.
- Activity timeline dual-view switching (live logs vs verified pool status).
- Personal backer dashboard accounting.
- Direct URL parameter navigation (`?pool=3`) and invalid deep link fallback (`?pool=9999`).

Run browser tests:
```bash
npm run test:browser
```

---

## 👥 Collaboration Guide

We welcome contributions from teammates and friends! Follow this workflow to collaborate smoothly:

### 1. Clone & Set Up Your Branch

```bash
# Clone the repository
git clone https://github.com/Rish2103/collective.git
cd collective

# Create a feature branch
git switch -c feat/improve-pool-cards

# Install dependencies
npm --prefix contracts install
npm --prefix frontend install
```

### 2. Start Developing

```bash
# Run the local frontend
npm run dev
```

### 3. Verify Your Changes Before Committing

Always ensure tests and builds pass before pushing:

```bash
# 1. Run contract tests
npm run test

# 2. Run frontend production build
npm run build

# 3. (Optional) Run browser tests
npm run test:browser
```

### 4. Commit and Push

Stage only the intended files:

```bash
# Example: staging frontend changes
git add frontend/src/components/PoolCard.tsx

# Commit with a descriptive message
git commit -m "feat(frontend): improve pool card mobile layout"

# Push your feature branch
git push -u origin feat/improve-pool-cards
```

### 5. Open a Pull Request

1. Navigate to [https://github.com/Rish2103/collective](https://github.com/Rish2103/collective).
2. Click **Compare & pull request**.
3. Detail what changes you made and provide verification screenshots if applicable.
4. Request review from **`Rish2103`**.

---

## 📌 Contribution Guidelines

- **Preserve Deployed Contracts**: Do not modify deployed addresses or smart-contract economics in `frontend/src/contracts/config.ts`.
- **Zero Hardcoding**: Never introduce mock pools, fake balances, hardcoded transaction hashes, or fabricated activity. Dynamic values must originate from on-chain RPC reads or wallet state.
- **Security First**: Never commit `.env` files, private keys, or API tokens.
- **Responsive & Accessible**: Ensure all UI additions work smoothly across mobile (375px) and desktop (1280px).
- **Keep PRs Focused**: Avoid massive refactors. Small, well-tested pull requests are reviewed and merged fastest.

---

## ⚠️ Limitations & Disclaimers

1. **Testnet Only**: Deployed strictly on Monad Testnet (Chain ID `10143`). Do not send real assets.
2. **Gas Dependency**: Executing transactions requires testnet `MON` for gas fees.
3. **RPC Rate Limits & Scope**: Monad Testnet RPC restricts `eth_getLogs` block ranges to 100 blocks. The timeline queries recent blocks and offers bounded pagination.
4. **Surplus Invariant**: If a pool is overfunded, the surplus is paid out to the recipient along with the target amount; it is not returned to contributors.
5. **No Production Audit**: This software is an educational hackathon prototype and has not undergone a commercial security audit.

---

## 📄 License

This project is licensed under the standard OSI-approved **MIT License** (dated 2026).  
Copyright (c) 2026 **COLLECTIVE Team**.  
See the full text in the repository root [LICENSE](LICENSE) file.

---

## 🤖 AI-Tool Disclosure

In accordance with hackathon and open-source transparency guidelines:
- **Google DeepMind Antigravity / Gemini 3.8 Flash**: Used as an AI pair-programming assistant for codebase analysis, multi-token USDC integration, FairShare and Goal Rescue logic, verifiable outcome receipt generation, test automation, and documentation verification.
- No other generative AI tools, proprietary code generators, or unauthorized external assets were used. All smart-contract rules and core cryptographic invariants were implemented and verified with automated test suites.

---

## 🏆 Credits & Hackathon Status

- **Project**: COLLECTIVE 2.0
- **Hackathon**: Metropolis Hackathon
- **Track**: Consumer Products & Payments
- **Repository Owner**: [Rish2103](https://github.com/Rish2103)

