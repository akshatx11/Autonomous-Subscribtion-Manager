# 🚀 Smart Contract Deployment - Monad Testnet

## What's Been Added

Your ASM (Autonomous Subscription Manager) project now includes **full smart contract support** for the Monad testnet!

### 📋 Files Created

#### Smart Contracts
- **`contracts/SubscriptionManager.sol`** - Main smart contract with:
  - Subscription creation and management
  - Automated usage monitoring
  - Intelligent plan downgrading
  - On-chain transaction history
  - Gas-efficient storage

#### Blockchain Configuration
- **`hardhat.config.js`** - Hardhat development framework setup
- **`scripts/deploy.js`** - Automated deployment script for Monad testnet
- **`lib/contract-addresses.json`** - Contract address registry
- **`lib/contract-interaction.ts`** - TypeScript wrapper for contract interaction
- **`lib/monad-config.ts`** - Network configuration (RPC, chain IDs, etc.)
- **`test/SubscriptionManager.test.js`** - Unit tests for smart contract

#### Documentation & Configuration
- **`SMART_CONTRACT_DEPLOYMENT.md`** - Complete deployment guide
- **`.env.blockchain`** - Blockchain-specific environment variables
- Updated **`package.json`** with:
  - Hardhat npm scripts
  - Web3 dependencies (ethers, hardhat, hardhat-toolbox)

### 🔧 NPM Scripts Added

```bash
npm run hardhat:compile    # Compile smart contracts
npm run hardhat:deploy     # Deploy to Monad testnet
npm run hardhat:test       # Run contract tests
npm run hardhat:node       # Start local Hardhat node
```

### ⚙️ Configuration Required

1. **Add to `.env.local`:**
```env
PRIVATE_KEY=your-wallet-private-key-here
MONAD_TESTNET_RPC=https://testnet.monad.xyz/rpc
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
```

2. **Get Testnet MON:**
   - Visit: https://faucet.testnet.monad.xyz
   - Request testnet MON tokens (needed for gas fees)

### 🚢 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npm run hardhat:compile
   ```

3. **Deploy to Monad testnet:**
   ```bash
   npm run hardhat:deploy
   ```

4. **Contract address will be saved to:**
   - `lib/contract-addresses.json`
   - `deployments.json`

### 📝 Smart Contract Features

**Write Functions:**
- `createSubscription(planId, serviceName, monthlyPrice, usageThreshold)` - Create new subscription
- `logUsage(subscriptionId, usagePercentage)` - Log usage (triggers auto-adjustments)
- `cancelSubscription(subscriptionId)` - Cancel active subscription

**Read Functions:**
- `getSubscription(subscriptionId)` - Get subscription details
- `getUserSubscriptions(userAddress)` - Get all user subscriptions
- `getTotalSavings()` - Get total ecosystem savings
- `getUserSavings(userAddress)` - Get user's savings

**Events:**
- `SubscriptionCreated` - Fired when subscription is created
- `UsageLogged` - Fired when usage is recorded
- `PlanAdjusted` - Fired when plan is auto-downgraded
- `SubscriptionCancelled` - Fired when subscription is cancelled

### 🔐 Security

✅ Only-subscription-owner access control
✅ Input validation for all parameters
✅ 30-day cooldown between adjustments
✅ On-chain event logging for transparency
✅ Modular design for future upgrades

### 🧪 Testing

Run unit tests:
```bash
npm run hardhat:test
```

Tests cover:
- Subscription creation
- Usage logging
- Plan adjustments
- Cancellations
- View functions

### 📚 Documentation

See `SMART_CONTRACT_DEPLOYMENT.md` for:
- Detailed deployment steps
- Troubleshooting guide
- Contract function reference
- Frontend integration examples
- Monad testnet information

### 🔗 Frontend Integration

The frontend already has Web3 provider integration. To use contracts:

```typescript
import { ContractInteraction } from "@/lib/contract-interaction";
import contractAddresses from "@/lib/contract-addresses.json";

const contract = new ContractInteraction(
  contractAddresses.SubscriptionManager
);

// Create a subscription
await contract.createSubscription(
  "plan-pro",
  "Netflix",
  "15.99",
  30
);

// Log usage
await contract.logUsage(subscriptionId, 25);

// Get user savings
const savings = await contract.getUserSavings(walletAddress);
```

### 🌐 Network Details

**Monad Testnet:**
- Chain ID: 10143
- RPC: https://testnet.monad.xyz/rpc
- Explorer: https://testnet.monadexplorer.com
- Faucet: https://faucet.testnet.monad.xyz

### ✅ Next Steps

1. ✅ Smart contracts created
2. ✅ Deployment scripts ready
3. 🔲 Get testnet MON tokens
4. 🔲 Run deployment: `npm run hardhat:deploy`
5. 🔲 Update `lib/contract-addresses.json` with deployed address
6. 🔲 Integrate contract calls into dashboard

### 📞 Support

For issues:
- Check `SMART_CONTRACT_DEPLOYMENT.md` troubleshooting section
- Review `contracts/SubscriptionManager.sol` for contract logic
- Run tests: `npm run hardhat:test`

---

**Status: ✅ Ready for deployment to Monad testnet**
