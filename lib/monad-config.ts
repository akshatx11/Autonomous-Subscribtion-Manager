// Monad Testnet Configuration
export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  name: "Monad Testnet",
  rpcUrl: "https://testnet.monad.xyz/rpc",
  blockExplorerUrl: "https://testnet.monadexplorer.com",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
};

// Monad Mainnet Configuration (for future use)
export const MONAD_MAINNET_CONFIG = {
  chainId: 10143, // Update with actual mainnet chain ID
  name: "Monad Mainnet",
  rpcUrl: "https://mainnet.monad.xyz/rpc",
  blockExplorerUrl: "https://monadexplorer.com",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
};

// Get the appropriate config based on environment
export function getMonadConfig() {
  const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "testnet" || true;
  return isTestnet ? MONAD_TESTNET_CONFIG : MONAD_MAINNET_CONFIG;
}

// Add network to MetaMask
export async function addMonadNetworkToMetaMask(isTestnet = true) {
  const config = isTestnet ? MONAD_TESTNET_CONFIG : MONAD_MAINNET_CONFIG;

  if (!window.ethereum) {
    alert("Please install MetaMask");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${config.chainId.toString(16)}`,
          chainName: config.name,
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.blockExplorerUrl],
          nativeCurrency: config.nativeCurrency,
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Failed to add network:", error);
    return false;
  }
}

// Switch to Monad network
export async function switchToMonadNetwork(isTestnet = true) {
  const config = isTestnet ? MONAD_TESTNET_CONFIG : MONAD_MAINNET_CONFIG;

  if (!window.ethereum) {
    alert("Please install MetaMask");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${config.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      // Chain not added, try adding it
      return addMonadNetworkToMetaMask(isTestnet);
    }
    console.error("Failed to switch network:", error);
    return false;
  }
}
