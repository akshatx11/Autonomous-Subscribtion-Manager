# Smart Contract Deployment Guide - Monad Testnet

## Overview
This guide walks you through deploying the SubscriptionManager smart contract to the Monad testnet.

## Prerequisites

1. **MetaMask or Web3 Wallet**
   - Install MetaMask: https://metamask.io/

2. **Testnet MON Tokens**
   - Get free testnet MON from the Monad faucet: https://faucet.testnet.monad.xyz
   - You'll need a small amount for gas fees (0.1 MON should be plenty)

3. **Private Key**
   - Export your MetaMask private key (⚠️ Keep this secret!)
   - Settings → Security & Privacy → Show Private Key

## Deployment Steps

### Step 1: Setup Environment Variables

Create a `.env.local` file in the project root and add:

```env
# Blockchain Configuration
PRIVATE_KEY=your-wallet-private-key-here
MONAD_TESTNET_RPC=https://testnet.monad.xyz/rpc
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
```

⚠️ **SECURITY WARNING**: Never commit `.env.local` to git. Add it to `.gitignore`.

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `hardhat` - Ethereum development framework
- `@nomicfoundation/hardhat-toolbox` - Hardhat tools
- `ethers` - Ethereum library for frontend
- `dotenv` - Environment variable management

### Step 3: Compile Smart Contract

```bash
npm run hardhat:compile
```

This compiles the Solidity contract and generates the ABI and bytecode.

### Step 4: Deploy to Monad Testnet

```bash
npm run hardhat:deploy
```

Expected output:
```
🚀 Deploying SubscriptionManager to Monad Testnet...

📝 Deploying with account: 0x... (your wallet address)
💰 Account balance: X.XX MON

⏳ Deploying SubscriptionManager contract...
✅ SubscriptionManager deployed to: 0x...

📄 Deployment info saved to: ./deployments.json
📄 Contract addresses saved for frontend: ./lib/contract-addresses.json

🎉 Deployment complete!
```

### Step 5: Update Contract Address in Frontend

The deployment script automatically updates `lib/contract-addresses.json` with your new contract address.

Update your `.env.local`:
```env
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS=0x... (from deployment output)
```

### Step 6: Verify Contract on Explorer (Optional)

Once deployed, you can view your contract on:
- **Monad Testnet Explorer**: https://testnet.monadexplorer.com
- Search for your contract address

## Testing the Contract

### Using Hardhat Console

```bash
npx hardhat console --network monadTestnet
```

In the console:
```javascript
const contractAddress = "0x..."; // Your deployed address
const contract = await ethers.getContractAt("SubscriptionManager", contractAddress);

// Create a test subscription
const tx = await contract.createSubscription(
  "plan-pro",
  "Netflix",
  ethers.parseEther("15.99"),
  30
);
await tx.wait();

// Get user subscriptions
const subscriptions = await contract.getUserSubscriptions(await signer.getAddress());
console.log(subscriptions);
```

## Smart Contract Functions

### Write Functions (Modify State)

1. **createSubscription(planId, serviceName, monthlyPrice, usageThreshold)**
   - Creates a new subscription for the caller
   - Returns subscription ID

2. **logUsage(subscriptionId, usagePercentage)**
   - Logs usage for a subscription
   - Triggers automatic plan downgrade if usage < threshold

3. **cancelSubscription(subscriptionId)**
   - Cancels an active subscription

### Read Functions (View Only)

1. **getSubscription(subscriptionId)**
   - Returns subscription details

2. **getUserSubscriptions(userAddress)**
   - Returns all subscription IDs for a user

3. **getTotalSavings()**
   - Returns total savings across all users

4. **getUserSavings(userAddress)**
   - Returns savings for a specific user

## Key Features

✅ **Autonomous Plan Adjustments**
- Monitors usage automatically
- Downgrades plans when usage drops below threshold
- Saves money without user intervention

✅ **On-Chain History**
- All actions logged on-chain
- Transparent audit trail
- Gas-efficient storage

✅ **Security**
- Owner controls contract configuration
- Only subscription owner can modify their subscriptions
- Reentrancy protection built-in

## Troubleshooting

### Error: "Account does not have enough balance"
- Get more testnet MON from: https://faucet.testnet.monad.xyz
- Wait for the faucet transaction to confirm

### Error: "Invalid private key"
- Ensure your PRIVATE_KEY is in `.env.local`
- Check the key is in hexadecimal format (no 0x prefix needed)

### Error: "Network request failed"
- Check Monad testnet RPC is accessible
- Try updating MONAD_TESTNET_RPC in `.env.local`

### Contract not showing on explorer
- Wait a few seconds for block confirmation
- Check you're on the testnet explorer (not mainnet)

## Contract Addresses

After deployment, your contract addresses will be saved in:
- `deployments.json` - Full deployment info
- `lib/contract-addresses.json` - Quick reference for frontend

## Frontend Integration

The contract is automatically integrated via:
- `lib/contract-interaction.ts` - Contract functions
- `components/providers/web3-provider.tsx` - Wallet connection
- `lib/monad-config.ts` - Network configuration

Example usage in React:
```typescript
import { ContractInteraction } from "@/lib/contract-interaction";
import contractAddresses from "@/lib/contract-addresses.json";

const contract = new ContractInteraction(
  contractAddresses.SubscriptionManager
);

// Create subscription
await contract.createSubscription(
  "plan-pro",
  "Netflix",
  "15.99",
  30
);
```

## Next Steps

1. ✅ Deploy contract
2. ✅ Get testnet MON tokens
3. ✅ Update frontend with contract address
4. 📝 Test subscription creation in dashboard
5. 📝 Add more smart contract features (token integration, governance, etc.)

## Resources

- [Monad Documentation](https://docs.monad.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/v6)
- [Solidity Documentation](https://docs.soliditylang.org)

## Questions?

Check the deployment logs or review the contract in `contracts/SubscriptionManager.sol`.
