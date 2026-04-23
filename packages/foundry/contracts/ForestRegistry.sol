// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ForestRegistry
 * @notice Manages forest/agricultural land registration, budget deposits, and metadata.
 *         Each forest has an owner who can deposit native MON to fund tasks.
 * @dev One owner can register multiple forests. Budget is held in this contract.
 */
contract ForestRegistry is Ownable, ReentrancyGuard {
    // ─── Types ───────────────────────────────────────────────────────────
    struct Forest {
        uint256 id;
        address owner;
        string name;
        int256 latitude;
        int256 longitude;
        uint256 areaSqMeters;
        uint256 budget;
        bool active;
        uint256 createdAt;
    }

    // ─── State ───────────────────────────────────────────────────────────
    uint256 public nextForestId;
    mapping(uint256 => Forest) public forests;
    mapping(address => uint256[]) public ownerForests;

    /// @notice Authorized contracts that can deduct budget (e.g. TaskManager)
    mapping(address => bool) public authorizedOperators;

    // ─── Events ──────────────────────────────────────────────────────────
    event ForestRegistered(uint256 indexed forestId, address indexed owner, string name);
    event BudgetDeposited(uint256 indexed forestId, address indexed depositor, uint256 amount);
    event BudgetWithdrawn(uint256 indexed forestId, address indexed owner, uint256 amount);
    event BudgetDeducted(uint256 indexed forestId, uint256 amount, address indexed operator);
    event ForestDeactivated(uint256 indexed forestId);
    event OperatorAuthorized(address indexed operator);
    event OperatorRevoked(address indexed operator);

    // ─── Errors ──────────────────────────────────────────────────────────
    error NotForestOwner();
    error ForestNotActive();
    error InsufficientBudget();
    error InvalidAmount();
    error NotAuthorizedOperator();

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyForestOwner(uint256 _forestId) {
        if (forests[_forestId].owner != msg.sender) revert NotForestOwner();
        _;
    }

    modifier onlyActiveForest(uint256 _forestId) {
        if (!forests[_forestId].active) revert ForestNotActive();
        _;
    }

    modifier onlyAuthorizedOperator() {
        if (!authorizedOperators[msg.sender]) revert NotAuthorizedOperator();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor(address _admin) Ownable(_admin) {}

    // ─── External Functions ──────────────────────────────────────────────

    /**
     * @notice Register a new forest/agricultural land
     * @param _name Human-readable name of the forest
     * @param _latitude GPS latitude (multiplied by 1e6 for precision)
     * @param _longitude GPS longitude (multiplied by 1e6 for precision)
     * @param _areaSqMeters Area of the land in square meters
     */
    function registerForest(
        string calldata _name,
        int256 _latitude,
        int256 _longitude,
        uint256 _areaSqMeters
    ) external returns (uint256 forestId) {
        forestId = nextForestId++;

        forests[forestId] = Forest({
            id: forestId,
            owner: msg.sender,
            name: _name,
            latitude: _latitude,
            longitude: _longitude,
            areaSqMeters: _areaSqMeters,
            budget: 0,
            active: true,
            createdAt: block.timestamp
        });

        ownerForests[msg.sender].push(forestId);
        emit ForestRegistered(forestId, msg.sender, _name);
    }

    /**
     * @notice Deposit MON to fund a forest's task budget
     * @param _forestId The forest to fund
     */
    function depositBudget(uint256 _forestId) external payable onlyActiveForest(_forestId) {
        if (msg.value == 0) revert InvalidAmount();

        forests[_forestId].budget += msg.value;
        emit BudgetDeposited(_forestId, msg.sender, msg.value);
    }

    /**
     * @notice Forest owner withdraws budget
     * @param _forestId The forest to withdraw from
     * @param _amount Amount to withdraw in wei
     */
    function withdrawBudget(
        uint256 _forestId,
        uint256 _amount
    ) external onlyForestOwner(_forestId) nonReentrant {
        if (_amount == 0) revert InvalidAmount();
        if (forests[_forestId].budget < _amount) revert InsufficientBudget();

        forests[_forestId].budget -= _amount;

        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        emit BudgetWithdrawn(_forestId, msg.sender, _amount);
    }

    /**
     * @notice Deduct budget from a forest (called by TaskManager on task completion)
     * @param _forestId The forest to deduct from
     * @param _amount Amount to deduct in wei
     */
    function deductBudget(
        uint256 _forestId,
        uint256 _amount
    ) external onlyAuthorizedOperator onlyActiveForest(_forestId) {
        if (forests[_forestId].budget < _amount) revert InsufficientBudget();
        forests[_forestId].budget -= _amount;
        emit BudgetDeducted(_forestId, _amount, msg.sender);
    }

    /**
     * @notice Deduct budget AND transfer the funds to a recipient (used by TaskManager for payments)
     * @param _forestId The forest to deduct from
     * @param _amount Amount to deduct and transfer
     * @param _recipient Address to send the funds to (e.g., PaymentSplitter)
     */
    function withdrawForPayment(
        uint256 _forestId,
        uint256 _amount,
        address payable _recipient
    ) external onlyAuthorizedOperator onlyActiveForest(_forestId) nonReentrant {
        if (forests[_forestId].budget < _amount) revert InsufficientBudget();
        forests[_forestId].budget -= _amount;

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Payment transfer failed");

        emit BudgetDeducted(_forestId, _amount, msg.sender);
    }

    /**
     * @notice Deactivate a forest
     * @param _forestId The forest to deactivate
     */
    function deactivateForest(uint256 _forestId) external onlyForestOwner(_forestId) {
        forests[_forestId].active = false;
        emit ForestDeactivated(_forestId);
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

    function getForest(uint256 _forestId) external view returns (Forest memory) {
        return forests[_forestId];
    }

    function getOwnerForests(address _owner) external view returns (uint256[] memory) {
        return ownerForests[_owner];
    }

    function getForestBudget(uint256 _forestId) external view returns (uint256) {
        return forests[_forestId].budget;
    }

    function isForestOwner(uint256 _forestId, address _addr) external view returns (bool) {
        return forests[_forestId].owner == _addr;
    }

    receive() external payable {}
}
