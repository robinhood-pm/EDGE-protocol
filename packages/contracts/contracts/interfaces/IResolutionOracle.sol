// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IResolutionOracle
 * @dev Interface for all resolution oracles in the prediction market.
 */
interface IResolutionOracle {
    /**
     * @dev Checks if a given market is resolved.
     * @param marketId The ID of the market.
     * @return bool True if resolved, false otherwise.
     */
    function isResolved(uint256 marketId) external view returns (bool);

    /**
     * @dev Gets the winning outcome of a resolved market.
     * @param marketId The ID of the market.
     * @return uint8 The winning outcome (0 for NO, 1 for YES).
     */
    function getOutcome(uint256 marketId) external view returns (uint8);
}
