// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFundingModule {
    function calculateFundingRate(uint256 perpMarketId, uint256 indexPrice, uint256 markPrice) external view returns (int256);
    function applyFunding(uint256 perpMarketId) external;
    function getLatestFundingRate(uint256 perpMarketId) external view returns (int256);
    
    event FundingUpdated(uint256 indexed perpMarketId, int256 rate, uint256 timestamp);
    event FundingPaid(uint256 indexed perpMarketId, address indexed trader, int256 amount);
}
