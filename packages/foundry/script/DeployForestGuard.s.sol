// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/ForestRegistry.sol";
import "../contracts/ReputationSystem.sol";
import "../contracts/PaymentSplitter.sol";
import "../contracts/TaskManager.sol";

/**
 * @notice Deploy script for the ForestGuard DAO platform
 * @dev Deploys all 4 contracts and configures cross-contract authorization:
 *      1. ReputationSystem
 *      2. PaymentSplitter (with company wallet)
 *      3. ForestRegistry
 *      4. TaskManager (references all 3 above)
 *      5. Authorize TaskManager as operator on ForestRegistry, ReputationSystem, PaymentSplitter
 */
contract DeployForestGuard is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // Deploy ReputationSystem
        ReputationSystem reputationSystem = new ReputationSystem(deployer);
        deployments.push(Deployment("ReputationSystem", address(reputationSystem)));
        console.log("ReputationSystem deployed at:", address(reputationSystem));

        // Deploy PaymentSplitter (company wallet = deployer for now, can be changed later)
        PaymentSplitter paymentSplitter = new PaymentSplitter(deployer, deployer);
        deployments.push(Deployment("PaymentSplitter", address(paymentSplitter)));
        console.log("PaymentSplitter deployed at:", address(paymentSplitter));

        // Deploy ForestRegistry
        ForestRegistry forestRegistry = new ForestRegistry(deployer);
        deployments.push(Deployment("ForestRegistry", address(forestRegistry)));
        console.log("ForestRegistry deployed at:", address(forestRegistry));

        // Deploy TaskManager
        TaskManager taskManager = new TaskManager(
            deployer,
            address(forestRegistry),
            address(reputationSystem),
            address(paymentSplitter)
        );
        deployments.push(Deployment("TaskManager", address(taskManager)));
        console.log("TaskManager deployed at:", address(taskManager));

        // ─── Cross-contract authorization ────────────────────────────────
        // TaskManager needs operator access on all other contracts
        forestRegistry.authorizeOperator(address(taskManager));
        console.log("TaskManager authorized on ForestRegistry");

        reputationSystem.authorizeOperator(address(taskManager));
        console.log("TaskManager authorized on ReputationSystem");

        paymentSplitter.authorizeOperator(address(taskManager));
        console.log("TaskManager authorized on PaymentSplitter");
    }
}
