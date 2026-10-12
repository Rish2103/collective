# COLLECTIVE 🌐

> **Consumer Group Payments with Guaranteed Smart-Contract Enforcement**  
> Built for the **Metropolis Consumer Products & Payments Hackathon** on **Monad Testnet**.

---

## 🚀 Overview

**COLLECTIVE** solves trust and coordination problems in shared consumer payments (such as group vacations, team gifts, event tickets, or collective club purchases). 

Traditional group-splitting apps (like Splitwise) rely on post-facto peer reminders and off-chain trust. COLLECTIVE moves the entire funding lifecycle on-chain:
1. **Target & Deadline Enforcement**: An organizer creates a pool with an exact funding target, a deadline, and a fixed recipient.
2. **Mock ERC-20 Contributions**: Participants contribute mock tokens directly on Monad Testnet.
3. **Automated Payout**: Once the target is reached, funds are disbursed directly to the recipient address.
4. **Guaranteed 100% Refunds**: If the deadline passes without reaching the funding target, every contributor can withdraw 100% of their deposited tokens via a secure pull-refund mechanism.

---

## 🏗️ Architecture

```
COLLECTIVE/
├── contracts/               # Smart contract suite (Hardhat + OpenZeppelin)
│   ├── contracts/
│   │   ├── MockERC20.sol    # Faucet token (Mock USD / mUSD)
│   │   └── CollectivePool.sol # Multi-pool manager with CEI & ReentrancyGuard
│   ├── scripts/
│   │   └── deploy.ts        # Monad Testnet & localhost deployment script
│   └── test/
│       └── CollectivePool.test.ts # 20 automated unit tests (100% coverage)
├── frontend/                # Consumer client (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/      # Navbar, FaucetModal, CreatePoolModal, PoolCard, PoolDetailsModal
│   │   ├── contracts/       # Human-readable ABIs and Monad Testnet network config
│   │   └── hooks/           # useWallet (MetaMask) and useCollective (Contract interactions)
│   └── vite.config.ts
├── .gsd/                    # Project memory (SPEC.md, ROADMAP.md, STATE.md)
└── package.json             # Root orchestrator scripts
```

---

## ⚡ Monad Testnet Configuration

| Parameter | Value |
|-----------|-------|
| **Network Name** | Monad Testnet |
| **Chain ID** | `10143` (`0x279f`) |
| **RPC URL** | `https://testnet-rpc.monad.xyz` |
| **Currency Symbol** | `MON` |
| **Block Explorer** | [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com) |

### 🚀 Live Deployed Contracts on Monad Testnet

| Contract | Address | Explorer Link |
|---|---|---|
| **MockERC20 (`mUSD`)** | `0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6` | [View on Explorer](https://testnet.monadexplorer.com/address/0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6) |
| **CollectivePool (Manager)** | `0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02` | [View on Explorer](https://testnet.monadexplorer.com/address/0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02) |


---

## 🛡️ Smart Contract Security

* **Checks-Effects-Interactions (CEI)**: All internal balances and state updates occur before ERC-20 token transfers.
* **Reentrancy Protection**: OpenZeppelin's `ReentrancyGuard` protects all state-changing entry points (`contribute`, `claimPayout`, `claimRefund`).
* **Safe Transfers**: OpenZeppelin's `SafeERC20` handles non-standard ERC-20 return values.
* **Pull Over Push Refunds**: Contributors claim their own refunds individually; no unbounded loops or denial-of-service attack vectors.

---

## 🛠️ Quick Start

### Prerequisites
- Node.js LTS (v20+ or v24+)
- MetaMask browser extension

### 1. Run Automated Contract Tests
```bash
npm run test
```
*Compiles all Solidity contracts and executes 20 comprehensive unit tests.*

### 2. Start the Frontend Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎬 Hackathon Live Demo Workflow

1. **Connect MetaMask**: Click **Connect Wallet** in the header. If connected to another network, click **Switch to Monad** to automatically add/switch to Monad Testnet.
2. **Claim Test Tokens**: Click **Faucet** and mint 1,000 `mUSD` (Mock USD) directly to your test account.
3. **Launch a Pool**: Click **+ Create Pool**.
   - Select the **3 Mins (Demo)** or **5 Mins (Demo)** preset for live judging.
   - Enter your target (e.g., `500 mUSD`) and recipient address.
4. **Contribute**: Open the pool card, choose your deposit amount, and click **Deposit**. The app handles the ERC-20 approval and deposit in a seamless 2-step flow.
5. **Verify Payout**:
   - Once target is met, click **Execute Payout to Recipient**. Funds transfer instantly to the recipient.
6. **Verify Refund**:
   - For an underfunded pool whose timer expires, the pool switches to **Expired — 100% Refunds Active**. Contributors click **Claim 100% Refund** to recover their exact deposits.
