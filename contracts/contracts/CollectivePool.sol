// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CollectivePool
 * @notice Multi-pool manager for consumer group-payments on Monad Testnet.
 * Enforces automated payouts upon reaching funding targets and guaranteed refunds upon expiry.
 */
contract CollectivePool is ReentrancyGuard {
    using SafeERC20 for IERC20;

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

    // Pool ID counter
    uint256 public nextPoolId;

    // poolId => Pool details
    mapping(uint256 => Pool) public pools;

    // poolId => contributor => amount contributed
    mapping(uint256 => mapping(address => uint256)) public contributions;

    // List of unique contributors per pool (for UI discovery)
    mapping(uint256 => address[]) private poolContributors;
    mapping(uint256 => mapping(address => bool)) private hasContributed;

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        address indexed recipient,
        address token,
        uint256 targetAmount,
        uint256 deadline,
        string title
    );

    event ContributionMade(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount,
        uint256 totalContributed
    );

    event PayoutClaimed(
        uint256 indexed poolId,
        address indexed recipient,
        uint256 amount
    );

    event RefundClaimed(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount
    );

    /**
     * @notice Create a new group funding pool.
     * @param token ERC-20 token address accepted for contributions
     * @param recipient Address that will receive funds upon reaching the target
     * @param targetAmount Total funding target in token units
     * @param durationSeconds Duration from current block timestamp until deadline
     * @param title Title/name of the pool
     * @param description Brief description of the funding goal
     * @return poolId The ID of the created pool
     */
    function createPool(
        address token,
        address recipient,
        uint256 targetAmount,
        uint256 durationSeconds,
        string calldata title,
        string calldata description
    ) external returns (uint256 poolId) {
        require(token != address(0), "Invalid token address");
        require(recipient != address(0), "Invalid recipient address");
        require(targetAmount > 0, "Target must be greater than zero");
        require(durationSeconds > 0, "Duration must be greater than zero");
        require(bytes(title).length > 0, "Title cannot be empty");

        poolId = nextPoolId++;
        uint256 deadline = block.timestamp + durationSeconds;

        pools[poolId] = Pool({
            id: poolId,
            creator: msg.sender,
            recipient: recipient,
            token: token,
            targetAmount: targetAmount,
            deadline: deadline,
            totalContributed: 0,
            state: PoolState.Active,
            title: title,
            description: description
        });

        emit PoolCreated(poolId, msg.sender, recipient, token, targetAmount, deadline, title);
    }

    /**
     * @notice Contribute tokens to an active pool.
     * @dev Caller must have approved this contract to spend `amount` tokens beforehand.
     * @param poolId The ID of the pool
     * @param amount The amount of tokens to contribute
     */
    function contribute(uint256 poolId, uint256 amount) external nonReentrant {
        Pool storage pool = pools[poolId];

        require(pool.targetAmount > 0, "Pool does not exist");
        require(pool.state == PoolState.Active, "Pool is not active");
        require(block.timestamp < pool.deadline, "Pool deadline has passed");
        require(amount > 0, "Contribution must be greater than zero");

        // Effects
        pool.totalContributed += amount;
        contributions[poolId][msg.sender] += amount;

        if (!hasContributed[poolId][msg.sender]) {
            hasContributed[poolId][msg.sender] = true;
            poolContributors[poolId].push(msg.sender);
        }

        // Interactions (SafeERC20)
        IERC20(pool.token).safeTransferFrom(msg.sender, address(this), amount);

        emit ContributionMade(poolId, msg.sender, amount, pool.totalContributed);
    }

    /**
     * @notice Claim payout for a successful pool where totalContributed >= targetAmount.
     * @dev Sends all pooled tokens to the fixed recipient.
     * @param poolId The ID of the pool
     */
    function claimPayout(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];

        require(pool.targetAmount > 0, "Pool does not exist");
        require(pool.state == PoolState.Active, "Pool is not active");
        require(pool.totalContributed >= pool.targetAmount, "Target amount has not been reached");

        uint256 payoutAmount = pool.totalContributed;

        // Effects
        pool.state = PoolState.PaidOut;

        // Interactions
        IERC20(pool.token).safeTransfer(pool.recipient, payoutAmount);

        emit PayoutClaimed(poolId, pool.recipient, payoutAmount);
    }

    /**
     * @notice Claim a 100% refund if the pool expired without meeting the target.
     * @dev Pull over push pattern: individual contributors withdraw their own deposit.
     * @param poolId The ID of the pool
     */
    function claimRefund(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];

        require(pool.targetAmount > 0, "Pool does not exist");
        require(block.timestamp >= pool.deadline, "Pool has not yet expired");
        require(pool.totalContributed < pool.targetAmount, "Target reached, refund unavailable");
        require(pool.state != PoolState.PaidOut, "Pool was already paid out");

        uint256 contributedAmount = contributions[poolId][msg.sender];
        require(contributedAmount > 0, "No contribution to refund");

        // Effects
        if (pool.state == PoolState.Active) {
            pool.state = PoolState.Refunding;
        }
        contributions[poolId][msg.sender] = 0;

        // Interactions
        IERC20(pool.token).safeTransfer(msg.sender, contributedAmount);

        emit RefundClaimed(poolId, msg.sender, contributedAmount);
    }

    /**
     * @notice Get all contributors for a given pool.
     */
    function getContributors(uint256 poolId) external view returns (address[] memory) {
        return poolContributors[poolId];
    }

    /**
     * @notice Get current pool state, dynamically accounting for deadline passage.
     */
    function getComputedState(uint256 poolId) external view returns (PoolState) {
        Pool storage pool = pools[poolId];
        if (pool.state == PoolState.PaidOut) {
            return PoolState.PaidOut;
        }
        if (pool.state == PoolState.Refunding) {
            return PoolState.Refunding;
        }
        if (block.timestamp >= pool.deadline && pool.totalContributed < pool.targetAmount) {
            return PoolState.Refunding;
        }
        return PoolState.Active;
    }

    /**
     * @notice Fetch total number of pools created.
     */
    function getPoolCount() external view returns (uint256) {
        return nextPoolId;
    }
}
