// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSystem
 * @notice Manages worker reputation scores and rank tiers.
 *         Ranks: Bronze → Silver → Gold → Platinum → Diamond
 * @dev Only authorized operators (TaskManager) can modify reputation.
 */
contract ReputationSystem is Ownable {
    // ─── Types ───────────────────────────────────────────────────────────
    enum Rank { Bronze, Silver, Gold, Platinum, Diamond }

    struct WorkerStats {
        uint256 reputationPoints;
        uint256 tasksCompleted;
        uint256 tasksRejected;
        uint256 totalEarned;
        uint256 registeredAt;
    }

    // ─── Constants ───────────────────────────────────────────────────────
    uint256 public constant SILVER_THRESHOLD = 100;
    uint256 public constant GOLD_THRESHOLD = 500;
    uint256 public constant PLATINUM_THRESHOLD = 1500;
    uint256 public constant DIAMOND_THRESHOLD = 5000;

    // Task priority multipliers
    uint256 public constant PRIORITY_LOW = 1;
    uint256 public constant PRIORITY_MEDIUM = 2;
    uint256 public constant PRIORITY_HIGH = 3;
    uint256 public constant PRIORITY_CRITICAL = 5;

    uint256 public constant BASE_COMPLETION_POINTS = 10;
    uint256 public constant REJECTION_PENALTY = 5;

    // ─── State ───────────────────────────────────────────────────────────
    mapping(address => WorkerStats) public workerStats;
    mapping(address => bool) public authorizedOperators;
    address[] public allWorkers;
    mapping(address => bool) private isRegistered;

    // ─── Events ──────────────────────────────────────────────────────────
    event ReputationAdded(address indexed worker, uint256 points, uint256 newTotal);
    event ReputationDeducted(address indexed worker, uint256 points, uint256 newTotal);
    event RankChanged(address indexed worker, Rank oldRank, Rank newRank);
    event WorkerRegistered(address indexed worker);
    event TaskRecorded(address indexed worker, uint256 earned);
    event OperatorAuthorized(address indexed operator);
    event OperatorRevoked(address indexed operator);

    // ─── Errors ──────────────────────────────────────────────────────────
    error NotAuthorizedOperator();

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyAuthorizedOperator() {
        if (!authorizedOperators[msg.sender]) revert NotAuthorizedOperator();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor(address _admin) Ownable(_admin) {}

    // ─── External Functions ──────────────────────────────────────────────

    /**
     * @notice Add reputation points to a worker (called by TaskManager on task completion)
     * @param _worker Worker address
     * @param _priorityLevel 0=Low, 1=Medium, 2=High, 3=Critical
     * @param _earned Amount earned from the task (for stats tracking)
     */
    function recordTaskCompletion(
        address _worker,
        uint256 _priorityLevel,
        uint256 _earned
    ) external onlyAuthorizedOperator {
        _registerWorkerIfNew(_worker);

        uint256 multiplier;
        if (_priorityLevel == 0) multiplier = PRIORITY_LOW;
        else if (_priorityLevel == 1) multiplier = PRIORITY_MEDIUM;
        else if (_priorityLevel == 2) multiplier = PRIORITY_HIGH;
        else multiplier = PRIORITY_CRITICAL;

        uint256 points = BASE_COMPLETION_POINTS * multiplier;
        Rank oldRank = getRank(_worker);

        workerStats[_worker].reputationPoints += points;
        workerStats[_worker].tasksCompleted += 1;
        workerStats[_worker].totalEarned += _earned;

        Rank newRank = getRank(_worker);

        emit ReputationAdded(_worker, points, workerStats[_worker].reputationPoints);
        emit TaskRecorded(_worker, _earned);

        if (oldRank != newRank) {
            emit RankChanged(_worker, oldRank, newRank);
        }
    }

    /**
     * @notice Deduct reputation points (on task rejection)
     * @param _worker Worker address
     */
    function recordTaskRejection(address _worker) external onlyAuthorizedOperator {
        _registerWorkerIfNew(_worker);

        Rank oldRank = getRank(_worker);
        WorkerStats storage stats = workerStats[_worker];

        stats.tasksRejected += 1;

        if (stats.reputationPoints >= REJECTION_PENALTY) {
            stats.reputationPoints -= REJECTION_PENALTY;
        } else {
            stats.reputationPoints = 0;
        }

        Rank newRank = getRank(_worker);
        emit ReputationDeducted(_worker, REJECTION_PENALTY, stats.reputationPoints);

        if (oldRank != newRank) {
            emit RankChanged(_worker, oldRank, newRank);
        }
    }

    // ─── Admin Functions ─────────────────────────────────────────────────

    function authorizeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = true;
        emit OperatorAuthorized(_operator);
    }

    function revokeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = false;
        emit OperatorRevoked(_operator);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getRank(address _worker) public view returns (Rank) {
        uint256 points = workerStats[_worker].reputationPoints;
        if (points >= DIAMOND_THRESHOLD) return Rank.Diamond;
        if (points >= PLATINUM_THRESHOLD) return Rank.Platinum;
        if (points >= GOLD_THRESHOLD) return Rank.Gold;
        if (points >= SILVER_THRESHOLD) return Rank.Silver;
        return Rank.Bronze;
    }

    function getReputation(address _worker) external view returns (uint256) {
        return workerStats[_worker].reputationPoints;
    }

    function getWorkerStats(address _worker) external view returns (WorkerStats memory) {
        return workerStats[_worker];
    }

    function getWorkerCount() external view returns (uint256) {
        return allWorkers.length;
    }

    /**
     * @notice Get early-access duration in seconds based on rank
     */
    function getEarlyAccessDuration(address _worker) external view returns (uint256) {
        Rank rank = getRank(_worker);
        if (rank == Rank.Diamond) return 3600;    // 1 hour
        if (rank == Rank.Platinum) return 1800;    // 30 minutes
        if (rank == Rank.Gold) return 900;         // 15 minutes
        if (rank == Rank.Silver) return 300;       // 5 minutes
        return 0;                                  // Bronze: no early access
    }

    // ─── Internal Functions ──────────────────────────────────────────────

    function _registerWorkerIfNew(address _worker) internal {
        if (!isRegistered[_worker]) {
            isRegistered[_worker] = true;
            allWorkers.push(_worker);
            workerStats[_worker].registeredAt = block.timestamp;
            emit WorkerRegistered(_worker);
        }
    }
}
