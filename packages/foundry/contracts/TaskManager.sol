// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ForestRegistry} from "./ForestRegistry.sol";
import {ReputationSystem} from "./ReputationSystem.sol";
import {PaymentSplitter} from "./PaymentSplitter.sol";

/**
 * @title TaskManager
 * @notice Core contract for task lifecycle: creation → application → proof → approval → payment.
 *         Integrates with ForestRegistry (budget), ReputationSystem (ranks), PaymentSplitter (payments).
 * @dev Auto-approve: when worker submits proof, the task is automatically approved and payment is processed.
 */
contract TaskManager is Ownable, ReentrancyGuard {
    // ─── Types ───────────────────────────────────────────────────────────
    enum TaskStatus { Open, Assigned, PendingApproval, Completed, Cancelled }
    enum TaskCategory { TreePlanting, Irrigation, PestControl, FirePrevention, SoilMaintenance, WasteCleanup, Monitoring, Other }
    enum TaskPriority { Low, Medium, High, Critical }

    struct Task {
        uint256 id;
        uint256 forestId;
        address creator;
        address assignee;
        string title;
        string description;
        uint256 reward;
        TaskCategory category;
        TaskPriority priority;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    // ─── State ───────────────────────────────────────────────────────────
    ForestRegistry public forestRegistry;
    ReputationSystem public reputationSystem;
    PaymentSplitter public paymentSplitter;

    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;
    uint256[] public allTaskIds;

    // Forest → active task IDs
    mapping(uint256 => uint256[]) public forestTasks;
    // Worker → assigned task IDs
    mapping(address => uint256[]) public workerTasks;

    // Forest → Category → has active task
    mapping(uint256 => mapping(TaskCategory => bool)) public hasActiveTask;

    // ─── Events ──────────────────────────────────────────────────────────
    event TaskCreated(
        uint256 indexed taskId,
        uint256 indexed forestId,
        string title,
        uint256 reward,
        TaskCategory category,
        TaskPriority priority
    );
    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 reward);
    event TaskCancelled(uint256 indexed taskId);

    // ─── Errors ──────────────────────────────────────────────────────────
    error NotForestOwner();
    error TaskNotOpen();
    error TaskNotAssigned();
    error NotTaskAssignee();
    error InsufficientForestBudget();
    error InvalidReward();
    error CannotApplyOwnTask();
    error ActiveTaskExistsForCategory();

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor(
        address _admin,
        address _forestRegistry,
        address _reputationSystem,
        address _paymentSplitter
    ) Ownable(_admin) {
        forestRegistry = ForestRegistry(payable(_forestRegistry));
        reputationSystem = ReputationSystem(_reputationSystem);
        paymentSplitter = PaymentSplitter(payable(_paymentSplitter));
    }

    // ─── External Functions ──────────────────────────────────────────────

    /**
     * @notice Create a new task for a forest (only forest owner can create)
     * @param _forestId Forest that needs the work done
     * @param _title Short title of the task
     * @param _description Detailed description
     * @param _reward Amount of MON to pay on completion
     * @param _category Type of work
     * @param _priority Urgency level
     */
    function createTask(
        uint256 _forestId,
        string calldata _title,
        string calldata _description,
        uint256 _reward,
        TaskCategory _category,
        TaskPriority _priority
    ) external returns (uint256 taskId) {
        // Verify caller is the forest owner
        if (!forestRegistry.isForestOwner(_forestId, msg.sender)) revert NotForestOwner();
        if (_reward == 0) revert InvalidReward();

        // Check forest has enough budget
        if (forestRegistry.getForestBudget(_forestId) < _reward) revert InsufficientForestBudget();

        // Ensure no active task exists for the same forest and category
        if (hasActiveTask[_forestId][_category]) revert ActiveTaskExistsForCategory();
        hasActiveTask[_forestId][_category] = true;

        taskId = nextTaskId++;

        tasks[taskId] = Task({
            id: taskId,
            forestId: _forestId,
            creator: msg.sender,
            assignee: address(0),
            title: _title,
            description: _description,
            reward: _reward,
            category: _category,
            priority: _priority,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            completedAt: 0
        });

        allTaskIds.push(taskId);
        forestTasks[_forestId].push(taskId);

        emit TaskCreated(taskId, _forestId, _title, _reward, _category, _priority);
    }

    /**
     * @notice Apply for an open task (first-come-first-served)
     * @param _taskId Task to apply for
     */
    function applyForTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Open) revert TaskNotOpen();
        if (task.creator == msg.sender) revert CannotApplyOwnTask();

        task.status = TaskStatus.Assigned;
        task.assignee = msg.sender;

        workerTasks[msg.sender].push(_taskId);

        emit TaskAssigned(_taskId, msg.sender);
    }

    /**
     * @notice Submit proof that the task is done, pending owner approval.
     * @param _taskId The assigned task to complete
     */
    function submitProof(uint256 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Assigned) revert TaskNotAssigned();
        if (task.assignee != msg.sender) revert NotTaskAssignee();

        // Mark as pending approval
        task.status = TaskStatus.PendingApproval;
    }

    /**
     * @notice Approve a task that is pending approval and process payment.
     * @param _taskId The task to approve
     */
    function approveTask(uint256 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.PendingApproval) revert TaskNotAssigned();
        if (task.creator != msg.sender) revert NotForestOwner();

        uint256 reward = task.reward;
        uint256 forestId = task.forestId;
        address worker = task.assignee;

        // Mark as completed
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;

        // Clear active task flag so a new one can be created for this category
        hasActiveTask[forestId][task.category] = false;

        // Pull funds from ForestRegistry to this contract
        forestRegistry.withdrawForPayment(forestId, reward, payable(address(this)));

        // Record reputation
        reputationSystem.recordTaskCompletion(worker, uint256(task.priority), reward);

        // Process payment via PaymentSplitter (splits 95% worker, 5% company)
        paymentSplitter.processPayment{value: reward}(_taskId, worker);

        emit TaskCompleted(_taskId, worker, reward);
    }

    /**
     * @notice Cancel an open task (only forest owner / task creator)
     * @param _taskId Task to cancel
     */
    function cancelTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];

        if (task.creator != msg.sender) revert NotForestOwner();
        if (task.status != TaskStatus.Open) revert TaskNotOpen();

        task.status = TaskStatus.Cancelled;
        hasActiveTask[task.forestId][task.category] = false;
        emit TaskCancelled(_taskId);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getTask(uint256 _taskId) external view returns (Task memory) {
        return tasks[_taskId];
    }

    function getForestTasks(uint256 _forestId) external view returns (uint256[] memory) {
        return forestTasks[_forestId];
    }

    function getWorkerTasks(address _worker) external view returns (uint256[] memory) {
        return workerTasks[_worker];
    }

    function getOpenTasks() external view returns (Task[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allTaskIds.length; i++) {
            if (tasks[allTaskIds[i]].status == TaskStatus.Open) {
                count++;
            }
        }

        Task[] memory openTasks = new Task[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allTaskIds.length; i++) {
            if (tasks[allTaskIds[i]].status == TaskStatus.Open) {
                openTasks[idx] = tasks[allTaskIds[i]];
                idx++;
            }
        }
        return openTasks;
    }

    function getAllTasks() external view returns (Task[] memory) {
        Task[] memory _allTasks = new Task[](allTaskIds.length);
        for (uint256 i = 0; i < allTaskIds.length; i++) {
            _allTasks[i] = tasks[allTaskIds[i]];
        }
        return _allTasks;
    }

    function getTotalTasks() external view returns (uint256) {
        return allTaskIds.length;
    }

    receive() external payable {}
}
