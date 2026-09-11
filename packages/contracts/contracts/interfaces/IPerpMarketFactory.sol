// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPerpMarketFactory {
    enum MarketStatus { DRAFT, ACTIVE, REDUCE_ONLY, PAUSED, CLOSED, SETTLEMENT_PENDING, SETTLED, INVALID }

    struct PerpMarket {
        uint256 predictionMarketId;
        uint256 conditionId;
        uint256 expiryTimestamp;
        address resolutionAdapter;
        string indexSource;
        uint256 maxLeverage;
        uint256 initialMarginRate;
        uint256 maintenanceMarginRate;
        uint256 maxOpenInterest;
        uint256 fundingInterval;
        uint256 liquidationPenalty;
        MarketStatus status;
    }

    function createPerpMarket(
        uint256 predictionMarketId,
        uint256 conditionId,
        uint256 expiryTimestamp,
        address resolutionAdapter,
        string memory indexSource,
        uint256 maxLeverage,
        uint256 initialMarginRate,
        uint256 maintenanceMarginRate,
        uint256 maxOpenInterest,
        uint256 fundingInterval,
        uint256 liquidationPenalty
    ) external returns (uint256);

    function pausePerpMarket(uint256 perpMarketId) external;
    function setReduceOnly(uint256 perpMarketId) external;
    function updateRiskParams(
        uint256 perpMarketId,
        uint256 maxLeverage,
        uint256 initialMarginRate,
        uint256 maintenanceMarginRate,
        uint256 maxOpenInterest
    ) external;

    function getMarket(uint256 perpMarketId) external view returns (PerpMarket memory);
}
