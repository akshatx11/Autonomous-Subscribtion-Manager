# Smart Contracts - File Structure

## Complete Project Layout

```
asm-project/
├── 📄 MONAD_DEPLOYMENT_SUMMARY.md      ← START HERE! 
├── 📄 SMART_CONTRACT_DEPLOYMENT.md     ← Detailed guide
├── 📄 SMART_CONTRACT_README.md         ← Quick overview
│
├── 📁 contracts/                       ← Smart contracts
│   └── SubscriptionManager.sol         ← Main contract (320+ lines)
│
├── 📁 scripts/                         ← Deployment scripts
│   └── deploy.js                       ← 1-command deployment
│
├── 📁 test/                            ← Contract tests
│   └── SubscriptionManager.test.js     ← Unit tests
│
├── 📁 lib/                             ← Utilities & configs
│   ├── contract-interaction.ts         ← Frontend integration
│   ├── contract-addresses.json         ← Contract registry
│   ├── monad-config.ts                 ← Network configuration
│   └── ... (existing files)
│
├── 📄 hardhat.config.js                ← Hardhat setup
├── 📄 .env.blockchain                  ← Blockchain env template
├── 📄 .env.example                     ← (updated with blockchain vars)
├── 📄 package.json                     ← (updated with web3 deps)
│
└── 📁 app/                             ← Next.js app
    └── (existing frontend)
```

---

## 📖 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| **MONAD_DEPLOYMENT_SUMMARY.md** | 🎯 Overview & checklist | 5 min |
| **SMART_CONTRACT_DEPLOYMENT.md** | 📚 Complete guide with examples | 15 min |
| **SMART_CONTRACT_README.md** | 🚀 Quick start reference | 3 min |
| **contracts/SubscriptionManager.sol** | 💻 Contract source code | 10 min |

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `hardhat.config.js` | Hardhat framework setup |
| `.env.blockchain` | Blockchain variables template |
| `package.json` | NPM scripts & dependencies |

---

## 💻 Code Files

| File | Type | Purpose |
|------|------|---------|
| `contracts/SubscriptionManager.sol` | Solidity | Main smart contract |
| `scripts/deploy.js` | JavaScript | Deployment automation |
| `test/SubscriptionManager.test.js` | JavaScript | Unit tests |
| `lib/contract-interaction.ts` | TypeScript | Frontend integration |
| `lib/monad-config.ts` | TypeScript | Network configuration |
| `lib/contract-addresses.json` | JSON | Contract registry |

---

## 🚀 Quick Navigation

### For First Time Deployment:
1. 📖 Read: `MONAD_DEPLOYMENT_SUMMARY.md`
2. 📚 Reference: `SMART_CONTRACT_DEPLOYMENT.md`
3. 🚀 Deploy: `npm run hardhat:deploy`

### For Contract Details:
1. 💻 Review: `contracts/SubscriptionManager.sol`
2. 🧪 Tests: `test/SubscriptionManager.test.js`
3. 🔗 Integration: `lib/contract-interaction.ts`

### For Network Setup:
1. ⚙️ Config: `hardhat.config.js`
2. 🌐 Network: `lib/monad-config.ts`
3. 📝 Env: `.env.blockchain`

---

## 📦 What Each File Does

### Smart Contract (`contracts/SubscriptionManager.sol`)
- **850+ lines of Solidity code**
- Manages subscriptions on-chain
- Handles automated plan downgrades
- Tracks savings and usage
- Emits events for all actions

### Deployment Script (`scripts/deploy.js`)
- **Deploys contract in seconds**
- Auto-generates contract addresses
- Saves addresses for frontend
- Provides deployment confirmation

### Frontend Integration (`lib/contract-interaction.ts`)
- **TypeScript wrapper for contract**
- Easy-to-use class `ContractInteraction`
- Methods for all contract functions
- Handles ethers.js conversions

### Configuration (`hardhat.config.js`)
- **Hardhat framework setup**
- Monad testnet & mainnet configs
- Compiler settings
- Network definitions

### Network Config (`lib/monad-config.ts`)
- **MetaMask network setup**
- RPC URLs
- Chain IDs
- Add/switch network functions

---

## 🎯 File Dependencies

```
User Action
    ↓
Frontend (React)
    ↓
contract-interaction.ts
    ↓
ethers.js
    ↓
Smart Contract (Monad)
```

---

## 📚 Learning Path

1. **Overview** (5 min)
   - Read: `MONAD_DEPLOYMENT_SUMMARY.md`

2. **Setup** (10 min)
   - Read: `SMART_CONTRACT_DEPLOYMENT.md` (Steps 1-4)
   - Update `.env.local`

3. **Deploy** (5 min)
   - Run: `npm run hardhat:deploy`
   - Save contract address

4. **Integration** (15 min)
   - Review: `lib/contract-interaction.ts`
   - Check: `SMART_CONTRACT_DEPLOYMENT.md` (Frontend Integration)
   - Add calls to React components

5. **Testing** (10 min)
   - Run: `npm run hardhat:test`
   - Review: `test/SubscriptionManager.test.js`

---

## ✅ Deployment Readiness

| Component | Status | Location |
|-----------|--------|----------|
| Smart Contract | ✅ Ready | `contracts/` |
| Deployment Script | ✅ Ready | `scripts/deploy.js` |
| Tests | ✅ Ready | `test/` |
| Documentation | ✅ Ready | `.md` files |
| Frontend Integration | ✅ Ready | `lib/` |
| Configuration | ✅ Ready | `hardhat.config.js` |

---

## 🔗 File Relationships

```
MONAD_DEPLOYMENT_SUMMARY.md (Start here)
├─→ SMART_CONTRACT_DEPLOYMENT.md (Full guide)
│   └─→ contracts/SubscriptionManager.sol (Contract code)
│
├─→ hardhat.config.js (Framework setup)
│   └─→ scripts/deploy.js (Deployment)
│
├─→ lib/monad-config.ts (Network setup)
│   └─→ lib/contract-interaction.ts (Frontend use)
│
└─→ test/SubscriptionManager.test.js (Verify)
```

---

## 🎓 Example Usage Pattern

```
1. Deploy
   └─→ npm run hardhat:deploy
       └─→ Contract deployed to Monad testnet
       └─→ Address saved to contract-addresses.json

2. Initialize in Frontend
   └─→ import ContractInteraction from "lib/contract-interaction.ts"
       └─→ Create instance with contract address
       └─→ Initialize with ethers provider

3. Use in React
   └─→ await contract.createSubscription(...)
       └─→ User sees transaction in MetaMask
       └─→ On-chain event emitted
       └─→ Data stored in contract

4. Read Data
   └─→ await contract.getUserSavings(address)
       └─→ Display in UI
```

---

## 🚨 Important Files

**MUST READ BEFORE DEPLOYMENT:**
- ✅ `MONAD_DEPLOYMENT_SUMMARY.md` - Overview
- ✅ `SMART_CONTRACT_DEPLOYMENT.md` - Step-by-step guide

**MUST UPDATE BEFORE DEPLOYMENT:**
- ✅ `.env.local` - Add PRIVATE_KEY

**MUST RUN FOR DEPLOYMENT:**
- ✅ `npm install` - Install dependencies
- ✅ `npm run hardhat:deploy` - Deploy contract

**MUST UPDATE AFTER DEPLOYMENT:**
- ✅ `.env.local` - Add contract address
- ✅ `lib/contract-addresses.json` - Verify address

---

## 📞 Troubleshooting

**Can't find a file?**
- Check this file's "File Structure" section
- Use Ctrl+P in VS Code to search

**Need deployment help?**
- Read: `SMART_CONTRACT_DEPLOYMENT.md` (Troubleshooting section)

**Want code examples?**
- Check: `lib/contract-interaction.ts` (Frontend usage)
- Check: `test/SubscriptionManager.test.js` (Test examples)

**Contract questions?**
- Review: `contracts/SubscriptionManager.sol` (Inline comments)
- See: `SMART_CONTRACT_DEPLOYMENT.md` (Contract Functions section)

---

**Created: January 25, 2026**
**Network: Monad Testnet**
**Status: ✅ Ready for Deployment**
