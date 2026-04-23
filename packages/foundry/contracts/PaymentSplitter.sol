// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentSplitter
 * @notice Splits task completion payments between workers (95%) and the platform company (5%).
 * @dev Commission rate is configurable. Only authorized operators (TaskManager) can trigger payments.
 */
contract PaymentSplitter is Ownable, ReentrancyGuard {
    // ─── State ───────────────────────────────────────────────────────────
    address public companyWallet;
    uint256 public commissionRate; // basis points (500 = 5%)
    uint256 public constant MAX_COMMISSION = 2000; // 20% cap
    uint256 public constant BASIS_POINTS = 10000;

    uint256 public totalPaidToWorkers;
    uint256 public totalCommissionCollected;

    mapping(address => bool) public authorizedOperators;

    // ─── Events ──────────────────────────────────────────────────────────
    event PaymentProcessed(
        uint256 indexed taskId,
        address indexed worker,
        uint256 workerAmount,
        uint256 companyFee
    );
    event CommissionRateUpdated(uint256 oldRate, uint256 newRate);
    event CompanyWalletUpdated(address oldWallet, address newWallet);
    event OperatorAuthorized(address indexed operator);
    event OperatorRevoked(address indexed operator);

    // ─── Errors ──────────────────────────────────────────────────────────
    error InvalidCommissionRate();
    error InvalidCompanyWallet();
    error PaymentFailed();
    error NotAuthorizedOperator();
    error InsufficientFunds();

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyAuthorizedOperator() {
        if (!authorizedOperators[msg.sender]) revert NotAuthorizedOperator();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor(address _admin, address _companyWallet) Ownable(_admin) {
        if (_companyWallet == address(0)) revert InvalidCompanyWallet();
        companyWallet = _companyWallet;
        commissionRate = 500; // 5% default
    }

    // ─── External Functions ──────────────────────────────────────────────

    /**
     * @notice Process payment: split between worker and company
     * @param _taskId Task identifier for event logging
     * @param _worker Worker to pay
     * @dev Must receive exact payment amount as msg.value
     */
    function processPayment(
        uint256 _taskId,
        address _worker
    ) external payable onlyAuthorizedOperator nonReentrant {
        if (msg.value == 0) revert InsufficientFunds();

        uint256 companyFee = (msg.value * commissionRate) / BASIS_POINTS;
        uint256 workerAmount = msg.value - companyFee;

        // Pay worker
        (bool workerSuccess, ) = _worker.call{value: workerAmount}("");
        if (!workerSuccess) revert PaymentFailed();

        // Pay company
        if (companyFee > 0) {
            (bool companySuccess, ) = companyWallet.call{value: companyFee}("");
            if (!companySuccess) revert PaymentFailed();
        }

        totalPaidToWorkers += workerAmount;
        totalCommissionCollected += companyFee;

        emit PaymentProcessed(_taskId, _worker, workerAmount, companyFee);
    }

    // ─── Admin Functions ─────────────────────────────────────────────────

    function setCommissionRate(uint256 _newRate) external onlyOwner {
        if (_newRate > MAX_COMMISSION) revert InvalidCommissionRate();
        uint256 oldRate = commissionRate;
        commissionRate = _newRate;
        emit CommissionRateUpdated(oldRate, _newRate);
    }

    function setCompanyWallet(address _newWallet) external onlyOwner {
        if (_newWallet == address(0)) revert InvalidCompanyWallet();
        address oldWallet = companyWallet;
        companyWallet = _newWallet;
        emit CompanyWalletUpdated(oldWallet, _newWallet);
    }

    function authorizeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = true;
        emit OperatorAuthorized(_operator);
    }

    function revokeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = false;
        emit OperatorRevoked(_operator);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function calculateSplit(uint256 _amount) external view returns (uint256 workerAmount, uint256 companyFee) {
        companyFee = (_amount * commissionRate) / BASIS_POINTS;
        workerAmount = _amount - companyFee;
    }

    receive() external payable {}
}
