// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IPerpMarketFactory.sol";

contract PerpMarketFactory is Initializable, OwnableUpgradeable, IPerpMarketFactory {
    uint256 public nextPerpMarketId;

    mapping(uint256 => PerpMarket) public perpMarkets;

    event PerpMarketCreated(uint256 indexed perpMarketId, uint256 indexed predictionMarketId);
    event PerpMarketPaused(uint256 indexed perpMarketId);
    event PerpMarketReduceOnly(uint256 indexed perpMarketId);
    event PerpMarketClosed(uint256 indexed perpMarketId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        nextPerpMarketId = 1;
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
    ) external onlyOwner returns (uint256) {
        require(expiryTimestamp > block.timestamp, "Expiry must be in future");

        uint256 perpMarketId = nextPerpMarketId++;

        perpMarkets[perpMarketId] = PerpMarket({
            predictionMarketId: predictionMarketId,
            conditionId: conditionId,
            expiryTimestamp: expiryTimestamp,
            resolutionAdapter: resolutionAdapter,
            indexSource: indexSource,
            maxLeverage: maxLeverage,
            initialMarginRate: initialMarginRate,
            maintenanceMarginRate: maintenanceMarginRate,
            maxOpenInterest: maxOpenInterest,
            fundingInterval: fundingInterval,
            liquidationPenalty: liquidationPenalty,
            status: MarketStatus.ACTIVE
        });

        emit PerpMarketCreated(perpMarketId, predictionMarketId);
        return perpMarketId;
    }

    function pausePerpMarket(uint256 perpMarketId) external onlyOwner {
        PerpMarket storage market = perpMarkets[perpMarketId];
        require(market.status != MarketStatus.SETTLED && market.status != MarketStatus.INVALID, "Market settled/invalid");
        market.status = MarketStatus.PAUSED;
        emit PerpMarketPaused(perpMarketId);
    }

    function setReduceOnly(uint256 perpMarketId) external onlyOwner {
        PerpMarket storage market = perpMarkets[perpMarketId];
        require(market.status == MarketStatus.ACTIVE, "Market must be active");
        market.status = MarketStatus.REDUCE_ONLY;
        emit PerpMarketReduceOnly(perpMarketId);
    }

    function updateRiskParams(
        uint256 perpMarketId,
        uint256 maxLeverage,
        uint256 initialMarginRate,
        uint256 maintenanceMarginRate,
        uint256 maxOpenInterest
    ) external onlyOwner {
        PerpMarket storage market = perpMarkets[perpMarketId];
        market.maxLeverage = maxLeverage;
        market.initialMarginRate = initialMarginRate;
        market.maintenanceMarginRate = maintenanceMarginRate;
        market.maxOpenInterest = maxOpenInterest;
    }

    function getMarket(uint256 perpMarketId) external view returns (PerpMarket memory) {
        return perpMarkets[perpMarketId];
    }
}
