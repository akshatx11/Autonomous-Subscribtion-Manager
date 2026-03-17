import { ethers } from "ethers";

// Import contract ABI
const SUBSCRIPTION_MANAGER_ABI = [
  "function createSubscription(string _planId, string _serviceName, uint256 _monthlyPrice, uint256 _usageThreshold) public returns (bytes32)",
  "function logUsage(bytes32 _subscriptionId, uint256 _usagePercentage) public",
  "function cancelSubscription(bytes32 _subscriptionId) public",
  "function getSubscription(bytes32 _subscriptionId) public view returns (tuple(address user, string planId, string serviceName, uint256 monthlyPrice, uint256 usageThreshold, uint256 createdAt, bool isActive, uint256 lastAdjustedAt))",
  "function getUserSubscriptions(address _user) public view returns (bytes32[])",
  "function getTotalSavings() public view returns (uint256)",
  "function getUserSavings(address _user) public view returns (uint256)",
  "event SubscriptionCreated(indexed address user, indexed bytes32 subscriptionId, string planId, string serviceName, uint256 monthlyPrice)",
  "event UsageLogged(indexed address user, indexed bytes32 subscriptionId, uint256 usagePercentage, uint256 timestamp)",
  "event PlanAdjusted(indexed address user, indexed bytes32 subscriptionId, string oldPlan, string newPlan, uint256 savingsAmount, uint256 timestamp)",
  "event SubscriptionCancelled(indexed address user, indexed bytes32 subscriptionId, uint256 timestamp)",
];

export class ContractInteraction {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  async initialize(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.signer = await provider.getSigner();
    this.contract = new ethers.Contract(
      this.contractAddress,
      SUBSCRIPTION_MANAGER_ABI,
      this.signer
    );
  }

  async createSubscription(
    planId: string,
    serviceName: string,
    monthlyPrice: string,
    usageThreshold: number
  ) {
    if (!this.contract) throw new Error("Contract not initialized");

    const tx = await this.contract.createSubscription(
      planId,
      serviceName,
      ethers.parseEther(monthlyPrice),
      usageThreshold
    );

    const receipt = await tx.wait();
    return receipt;
  }

  async logUsage(subscriptionId: string, usagePercentage: number) {
    if (!this.contract) throw new Error("Contract not initialized");

    const tx = await this.contract.logUsage(subscriptionId, usagePercentage);
    const receipt = await tx.wait();
    return receipt;
  }

  async cancelSubscription(subscriptionId: string) {
    if (!this.contract) throw new Error("Contract not initialized");

    const tx = await this.contract.cancelSubscription(subscriptionId);
    const receipt = await tx.wait();
    return receipt;
  }

  async getSubscription(subscriptionId: string) {
    if (!this.contract) throw new Error("Contract not initialized");

    const subscription = await this.contract.getSubscription(subscriptionId);
    return subscription;
  }

  async getUserSubscriptions(userAddress: string) {
    if (!this.contract) throw new Error("Contract not initialized");

    const subscriptions = await this.contract.getUserSubscriptions(userAddress);
    return subscriptions;
  }

  async getTotalSavings() {
    if (!this.contract) throw new Error("Contract not initialized");

    const savings = await this.contract.getTotalSavings();
    return ethers.formatEther(savings);
  }

  async getUserSavings(userAddress: string) {
    if (!this.contract) throw new Error("Contract not initialized");

    const savings = await this.contract.getUserSavings(userAddress);
    return ethers.formatEther(savings);
  }
}

export function getContractInstance(contractAddress: string) {
  return new ContractInteraction(contractAddress);
}
