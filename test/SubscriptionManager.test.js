const { expect } = require("chai");

describe("SubscriptionManager", function () {
  let subscriptionManager;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SubscriptionManager = await ethers.getContractFactory(
      "SubscriptionManager"
    );
    subscriptionManager = await SubscriptionManager.deploy();
    await subscriptionManager.waitForDeployment();
  });

  describe("Subscription Creation", function () {
    it("Should create a subscription successfully", async function () {
      const tx = await subscriptionManager.connect(user1).createSubscription(
        "plan-pro",
        "Netflix",
        ethers.parseEther("15.99"),
        30
      );

      await expect(tx).to.emit(subscriptionManager, "SubscriptionCreated");

      const subscriptions = await subscriptionManager.getUserSubscriptions(
        user1.address
      );
      expect(subscriptions.length).to.equal(1);
    });

    it("Should reject subscription with zero price", async function () {
      await expect(
        subscriptionManager.connect(user1).createSubscription(
          "plan-pro",
          "Netflix",
          0,
          30
        )
      ).to.be.revertedWith("Monthly price must be greater than 0");
    });

    it("Should reject invalid usage threshold", async function () {
      await expect(
        subscriptionManager.connect(user1).createSubscription(
          "plan-pro",
          "Netflix",
          ethers.parseEther("15.99"),
          150 // > 100
        )
      ).to.be.revertedWith("Usage threshold must be 0-100%");
    });
  });

  describe("Usage Logging", function () {
    it("Should log usage for a subscription", async function () {
      const tx = await subscriptionManager.connect(user1).createSubscription(
        "plan-pro",
        "Netflix",
        ethers.parseEther("15.99"),
        30
      );

      const receipt = await tx.wait();
      const subscriptionId = receipt?.logs[0]?.topics[2]; // Get subscription ID from event

      const logTx = await subscriptionManager
        .connect(user1)
        .logUsage(subscriptionId, 25);

      await expect(logTx).to.emit(subscriptionManager, "UsageLogged");
    });
  });

  describe("Plan Adjustments", function () {
    it("Should auto-adjust plan when usage is low", async function () {
      const txCreate = await subscriptionManager
        .connect(user1)
        .createSubscription(
          "plan-enterprise",
          "ServiceX",
          ethers.parseEther("99"),
          30
        );

      const receiptCreate = await txCreate.wait();
      const subscriptionId = receiptCreate?.logs[0]?.topics[2];

      // Log low usage (20% < 30% threshold)
      const txLog = await subscriptionManager
        .connect(user1)
        .logUsage(subscriptionId, 20);

      await expect(txLog).to.emit(subscriptionManager, "PlanAdjusted");
    });
  });

  describe("Cancellation", function () {
    it("Should cancel a subscription", async function () {
      const tx = await subscriptionManager.connect(user1).createSubscription(
        "plan-pro",
        "Netflix",
        ethers.parseEther("15.99"),
        30
      );

      const receipt = await tx.wait();
      const subscriptionId = receipt?.logs[0]?.topics[2];

      const cancelTx = await subscriptionManager
        .connect(user1)
        .cancelSubscription(subscriptionId);

      await expect(cancelTx).to.emit(
        subscriptionManager,
        "SubscriptionCancelled"
      );
    });
  });

  describe("View Functions", function () {
    it("Should get total savings", async function () {
      const savings = await subscriptionManager.getTotalSavings();
      expect(savings).to.equal(0);
    });

    it("Should get user savings", async function () {
      const savings = await subscriptionManager.getUserSavings(user1.address);
      expect(savings).to.equal(0);
    });
  });
});
