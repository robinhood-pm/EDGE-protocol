// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IPositionManager.sol";

contract PerpSettlement is Initializable, OwnableUpgradeable {
    IPositionManager public positionManager;

    event PerpSettled(uint256 indexed perpMarketId, uint256 finalPrice);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _positionManager) public initializer {
        __Ownable_init(msg.sender);
        positionManager = IPositionManager(_positionManager);
    }

    function triggerSettlement(uint256 perpMarketId, uint256 finalPrice) external onlyOwner {
        // finalPrice = 1.00 (YES), 0.00 (NO), or 0.50 (INVALID) scaled.
        // Requires iterating over all positions in the market.
        // In full impl, this would loop or allow users to claim settlement themselves.
        
        emit PerpSettled(perpMarketId, finalPrice);
    }
}
