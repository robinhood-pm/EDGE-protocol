// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IResolutionOracle.sol";

interface AggregatorV3Interface {
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}

contract ChainlinkPriceAdapter is IResolutionOracle, Ownable {
    struct MarketCondition {
        address priceFeed;
        int256 targetPrice;
        bool resolveIfAbove; // true if YES when price >= target, false if YES when price <= target
        bool isRegistered;
        bool hasResolved;
        uint8 outcome;
    }

    mapping(uint256 => MarketCondition) public marketConditions;

    event MarketRegistered(uint256 indexed marketId, address priceFeed, int256 targetPrice, bool resolveIfAbove);
    event MarketResolved(uint256 indexed marketId, uint8 outcome, int256 closingPrice);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registers a market dynamically with its specific Chainlink feed.
     */
    function registerMarket(
        uint256 marketId,
        address priceFeed,
        int256 targetPrice,
        bool resolveIfAbove
    ) external onlyOwner {
        require(priceFeed != address(0), "Invalid price feed");
        require(!marketConditions[marketId].isRegistered, "Market already registered");

        marketConditions[marketId] = MarketCondition({
            priceFeed: priceFeed,
            targetPrice: targetPrice,
            resolveIfAbove: resolveIfAbove,
            isRegistered: true,
            hasResolved: false,
            outcome: 0
        });

        emit MarketRegistered(marketId, priceFeed, targetPrice, resolveIfAbove);
    }

    /**
     * @dev Checks current price and resolves if condition met.
     */
    function checkAndResolve(uint256 marketId) external {
        MarketCondition storage condition = marketConditions[marketId];
        require(condition.isRegistered, "Market not registered");
        require(!condition.hasResolved, "Market already resolved");

        AggregatorV3Interface feed = AggregatorV3Interface(condition.priceFeed);
        (, int256 price, , , ) = feed.latestRoundData();

        bool conditionMet;
        if (condition.resolveIfAbove) {
            conditionMet = price >= condition.targetPrice;
        } else {
            conditionMet = price <= condition.targetPrice;
        }

        uint8 outcome = conditionMet ? 1 : 0; // 1 for YES, 0 for NO

        condition.hasResolved = true;
        condition.outcome = outcome;

        emit MarketResolved(marketId, outcome, price);
    }

    function isResolved(uint256 marketId) external view override returns (bool) {
        return marketConditions[marketId].hasResolved;
    }

    function getOutcome(uint256 marketId) external view override returns (uint8) {
        require(marketConditions[marketId].hasResolved, "Not resolved yet");
        return marketConditions[marketId].outcome;
    }
}
