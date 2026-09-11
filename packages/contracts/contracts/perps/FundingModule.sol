// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IFundingModule.sol";

contract FundingModule is Initializable, OwnableUpgradeable, IFundingModule {
    
    // perpMarketId => latest funding rate
    mapping(uint256 => int256) public latestFundingRate;
    
    uint256 public constant MAX_FUNDING_RATE = 10000; // 100% in bps? Simplified limit

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
    }

    function calculateFundingRate(uint256 perpMarketId, uint256 indexPrice, uint256 markPrice) external pure returns (int256) {
        // Simple logic: Rate = Mark - Index (scaled appropriately)
        int256 premium = int256(markPrice) - int256(indexPrice);
        // clamp mechanism
        if (premium > int256(MAX_FUNDING_RATE)) premium = int256(MAX_FUNDING_RATE);
        if (premium < -int256(MAX_FUNDING_RATE)) premium = -int256(MAX_FUNDING_RATE);
        
        return premium;
    }

    function applyFunding(uint256 perpMarketId) external onlyOwner {
        // In full implementation, this iterates active positions and applies payments.
        // For now, it's just the interface/event stub.
        emit FundingPaid(perpMarketId, address(0), 0);
    }

    function getLatestFundingRate(uint256 perpMarketId) external view returns (int256) {
        return latestFundingRate[perpMarketId];
    }
}
