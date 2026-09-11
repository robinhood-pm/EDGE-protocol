// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IPositionManager.sol";

contract LiquidationEngine is Initializable, OwnableUpgradeable {
    IPositionManager public positionManager;
    address public insuranceFund;

    event LiquidationExecuted(address indexed trader, uint256 indexed perpMarketId, uint256 penalty);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _positionManager, address _insuranceFund) public initializer {
        __Ownable_init(msg.sender);
        positionManager = IPositionManager(_positionManager);
        insuranceFund = _insuranceFund;
    }

    function checkLiquidation(address trader, uint256 perpMarketId) public view returns (bool) {
        // Simplified view of equity vs maintenance margin.
        // Requires Mark Price from Oracle. 
        return false; // stub
    }

    function liquidate(address trader, uint256 perpMarketId) external {
        // Enforce liquidation condition
        // ...
        
        uint256 penalty = positionManager.liquidatePosition(trader, perpMarketId);
        
        emit LiquidationExecuted(trader, perpMarketId, penalty);
    }
}
