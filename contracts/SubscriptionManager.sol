// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SubscriptionManager
 * @dev Manages autonomous subscription plan adjustments based on usage
 */
contract SubscriptionManager {
    // Structs
    struct Subscription {
        address user;
        string planId;
        string serviceName;
        uint256 monthlyPrice;
        uint256 usageThreshold; // percentage (0-100)
        uint256 createdAt;
        bool isActive;
        uint256 lastAdjustedAt;
    }

    struct UsageLog {
        address user;
        string subscriptionId;
        uint256 usagePercentage;
        uint256 timestamp;
    }

    struct AdjustmentRecord {
        address user;
        string subscriptionId;
        string oldPlan;
        string newPlan;
        uint256 timestamp;
        string reason;
    }

    // State variables
    mapping(bytes32 => Subscription) public subscriptions;
    mapping(address => bytes32[]) public userSubscriptions;
    UsageLog[] public usageLogs;
    AdjustmentRecord[] public adjustmentRecords;

    uint256 public totalSubscriptions;
    uint256 public totalSavings;
    address public owner;

    // Events
    event SubscriptionCreated(
        address indexed user,
        bytes32 indexed subscriptionId,
        string planId,
        string serviceName,
        uint256 monthlyPrice
    );

    event UsageLogged(
        address indexed user,
        bytes32 indexed subscriptionId,
        uint256 usagePercentage,
        uint256 timestamp
    );

    event PlanAdjusted(
        address indexed user,
        bytes32 indexed subscriptionId,
        string oldPlan,
        string newPlan,
        uint256 savingsAmount,
        uint256 timestamp
    );

    event SubscriptionCancelled(
        address indexed user,
        bytes32 indexed subscriptionId,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlySubscriptionOwner(bytes32 subscriptionId) {
        require(
            subscriptions[subscriptionId].user == msg.sender,
            "Only subscription owner can perform this action"
        );
        _;
    }

    modifier subscriptionExists(bytes32 subscriptionId) {
        require(
            subscriptions[subscriptionId].isActive,
            "Subscription does not exist or is inactive"
        );
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        totalSubscriptions = 0;
        totalSavings = 0;
    }

    // Core Functions

    /**
     * @dev Creates a new subscription
     */
    function createSubscription(
        string memory _planId,
        string memory _serviceName,
        uint256 _monthlyPrice,
        uint256 _usageThreshold
    ) public returns (bytes32) {
        require(_monthlyPrice > 0, "Monthly price must be greater than 0");
        require(_usageThreshold <= 100, "Usage threshold must be 0-100%");
        require(bytes(_serviceName).length > 0, "Service name cannot be empty");

        bytes32 subscriptionId = keccak256(
            abi.encodePacked(msg.sender, _serviceName, block.timestamp)
        );

        subscriptions[subscriptionId] = Subscription({
            user: msg.sender,
            planId: _planId,
            serviceName: _serviceName,
            monthlyPrice: _monthlyPrice,
            usageThreshold: _usageThreshold,
            createdAt: block.timestamp,
            isActive: true,
            lastAdjustedAt: block.timestamp
        });

        userSubscriptions[msg.sender].push(subscriptionId);
        totalSubscriptions++;

        emit SubscriptionCreated(
            msg.sender,
            subscriptionId,
            _planId,
            _serviceName,
            _monthlyPrice
        );

        return subscriptionId;
    }

    /**
     * @dev Logs usage for a subscription
     */
    function logUsage(
        bytes32 _subscriptionId,
        uint256 _usagePercentage
    ) public subscriptionExists(_subscriptionId) {
        require(
            msg.sender == subscriptions[_subscriptionId].user ||
                msg.sender == owner,
            "Unauthorized"
        );
        require(_usagePercentage <= 100, "Usage percentage must be 0-100%");

        usageLogs.push(
            UsageLog({
                user: subscriptions[_subscriptionId].user,
                subscriptionId: subscriptions[_subscriptionId].planId,
                usagePercentage: _usagePercentage,
                timestamp: block.timestamp
            })
        );

        emit UsageLogged(
            subscriptions[_subscriptionId].user,
            _subscriptionId,
            _usagePercentage,
            block.timestamp
        );

        // Auto-adjust if usage is below threshold
        if (_usagePercentage < subscriptions[_subscriptionId].usageThreshold) {
            _autoAdjustPlan(_subscriptionId);
        }
    }

    /**
     * @dev Internal function to auto-adjust plan based on usage
     */
    function _autoAdjustPlan(bytes32 _subscriptionId) internal {
        Subscription storage sub = subscriptions[_subscriptionId];
        require(sub.isActive, "Subscription is not active");

        // Check if 30 days have passed since last adjustment
        require(
            block.timestamp >= sub.lastAdjustedAt + 30 days,
            "Can only adjust once per month"
        );

        string memory newPlan = _calculateDowngradePlan(sub.planId);

        uint256 oldPrice = sub.monthlyPrice;
        uint256 newPrice = _getPriceForPlan(newPlan);

        if (newPrice < oldPrice) {
            uint256 savings = oldPrice - newPrice;
            totalSavings += savings;

            adjustmentRecords.push(
                AdjustmentRecord({
                    user: sub.user,
                    subscriptionId: sub.planId,
                    oldPlan: sub.planId,
                    newPlan: newPlan,
                    timestamp: block.timestamp,
                    reason: "Low usage detected"
                })
            );

            sub.planId = newPlan;
            sub.monthlyPrice = newPrice;
            sub.lastAdjustedAt = block.timestamp;

            emit PlanAdjusted(
                sub.user,
                _subscriptionId,
                subscriptions[_subscriptionId].planId,
                newPlan,
                savings,
                block.timestamp
            );
        }
    }

    /**
     * @dev Calculates the downgraded plan
     */
    function _calculateDowngradePlan(string memory _currentPlan)
        internal
        pure
        returns (string memory)
    {
        if (
            keccak256(abi.encodePacked(_currentPlan)) ==
            keccak256(abi.encodePacked("enterprise"))
        ) {
            return "professional";
        } else if (
            keccak256(abi.encodePacked(_currentPlan)) ==
            keccak256(abi.encodePacked("professional"))
        ) {
            return "starter";
        }
        return "free";
    }

    /**
     * @dev Gets price for a plan (in wei)
     */
    function _getPriceForPlan(string memory _plan)
        internal
        pure
        returns (uint256)
    {
        if (
            keccak256(abi.encodePacked(_plan)) ==
            keccak256(abi.encodePacked("enterprise"))
        ) {
            return 99 * 10**18; // 99 tokens
        } else if (
            keccak256(abi.encodePacked(_plan)) ==
            keccak256(abi.encodePacked("professional"))
        ) {
            return 49 * 10**18; // 49 tokens
        } else if (
            keccak256(abi.encodePacked(_plan)) ==
            keccak256(abi.encodePacked("starter"))
        ) {
            return 19 * 10**18; // 19 tokens
        }
        return 0; // free plan
    }

    /**
     * @dev Cancels a subscription
     */
    function cancelSubscription(bytes32 _subscriptionId)
        public
        subscriptionExists(_subscriptionId)
        onlySubscriptionOwner(_subscriptionId)
    {
        subscriptions[_subscriptionId].isActive = false;

        emit SubscriptionCancelled(msg.sender, _subscriptionId, block.timestamp);
    }

    // View Functions

    /**
     * @dev Gets subscription details
     */
    function getSubscription(bytes32 _subscriptionId)
        public
        view
        returns (Subscription memory)
    {
        return subscriptions[_subscriptionId];
    }

    /**
     * @dev Gets all subscriptions for a user
     */
    function getUserSubscriptions(address _user)
        public
        view
        returns (bytes32[] memory)
    {
        return userSubscriptions[_user];
    }

    /**
     * @dev Gets usage logs
     */
    function getUsageLogs() public view returns (UsageLog[] memory) {
        return usageLogs;
    }

    /**
     * @dev Gets adjustment records
     */
    function getAdjustmentRecords()
        public
        view
        returns (AdjustmentRecord[] memory)
    {
        return adjustmentRecords;
    }

    /**
     * @dev Gets total savings
     */
    function getTotalSavings() public view returns (uint256) {
        return totalSavings;
    }

    /**
     * @dev Gets user's total savings
     */
    function getUserSavings(address _user) public view returns (uint256) {
        uint256 savings = 0;
        for (uint256 i = 0; i < adjustmentRecords.length; i++) {
            if (adjustmentRecords[i].user == _user) {
                // Calculate savings from adjustment
                uint256 oldPrice = _getPriceForPlan(
                    adjustmentRecords[i].oldPlan
                );
                uint256 newPrice = _getPriceForPlan(
                    adjustmentRecords[i].newPlan
                );
                if (oldPrice > newPrice) {
                    savings += (oldPrice - newPrice);
                }
            }
        }
        return savings;
    }
}
