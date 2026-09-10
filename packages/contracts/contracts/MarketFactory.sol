// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ConditionalTokens.sol";

/**
 * @title MarketFactory
 * @dev Manages the creation, status, and resolution of prediction markets.
 * Acts as the centralized registry for all markets.
 */
contract MarketFactory is Initializable, OwnableUpgradeable {
    ConditionalTokens public conditionalTokens;
    
    uint256 public nextMarketId;

    enum MarketStatus { OPEN, CLOSED, RESOLVED, INVALIDATED }

    struct Market {
        string question;
        string ipfsHash; // Metadata hash
        uint256 closeTime;
        address resolver; // Oracle or address that can resolve the market
        MarketStatus status;
        uint8 winningOutcome; // 0 for NO, 1 for YES
    }

    mapping(uint256 => Market) public markets;

    event MarketCreated(uint256 indexed marketId, string question, uint256 closeTime, address resolver);
    event MarketClosed(uint256 indexed marketId);
    event MarketResolved(uint256 indexed marketId, uint8 winningOutcome);
    event MarketInvalidated(uint256 indexed marketId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _conditionalTokens) public initializer {
        require(_conditionalTokens != address(0), "Invalid conditional tokens address");
        __Ownable_init(msg.sender);
        conditionalTokens = ConditionalTokens(_conditionalTokens);
        nextMarketId = 1;
    }

    /**
     * @dev Creates a new market.
     * @param question The market question.
     * @param ipfsHash The IPFS hash for detailed metadata.
     * @param closeTime The timestamp when the market stops trading.
     * @param resolver The address authorized to resolve the market.
     */
    function createMarket(
        string memory question,
        string memory ipfsHash,
        uint256 closeTime,
        address resolver
    ) external onlyOwner returns (uint256) {
        require(closeTime > block.timestamp, "Close time must be in the future");
        require(resolver != address(0), "Invalid resolver address");

        uint256 marketId = nextMarketId++;

        markets[marketId] = Market({
            question: question,
            ipfsHash: ipfsHash,
            closeTime: closeTime,
            resolver: resolver,
            status: MarketStatus.OPEN,
            winningOutcome: 0
        });

        emit MarketCreated(marketId, question, closeTime, resolver);
        return marketId;
    }

    /**
     * @dev Closes a market from further trading. Can be called automatically via logic or manually.
     * @param marketId The ID of the market.
     */
    function closeMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.OPEN, "Market not open");
        require(block.timestamp >= market.closeTime || msg.sender == owner(), "Cannot close yet");

        market.status = MarketStatus.CLOSED;
        emit MarketClosed(marketId);
    }

    /**
     * @dev Resolves a market. Only callable by the designated resolver.
     * @param marketId The ID of the market.
     * @param winningOutcome 0 for NO, 1 for YES.
     */
    function resolveMarket(uint256 marketId, uint8 winningOutcome) external {
        Market storage market = markets[marketId];
        require(msg.sender == market.resolver, "Not the designated resolver");
        require(market.status == MarketStatus.CLOSED || market.status == MarketStatus.OPEN, "Invalid market status");
        require(winningOutcome == 0 || winningOutcome == 1, "Invalid outcome");

        market.status = MarketStatus.RESOLVED;
        market.winningOutcome = winningOutcome;

        // Call the ConditionalTokens contract to lock the result
        conditionalTokens.resolveMarket(marketId, winningOutcome);

        emit MarketResolved(marketId, winningOutcome);
    }

    /**
     * @dev Invalidates a market. Can be called by the resolver or owner if there's an issue.
     * Resolves the market such that both sides can theoretically be refunded, but for this MVP
     * we will require a more complex refund mechanism in ConditionalTokens if implemented fully.
     */
    function invalidateMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(msg.sender == market.resolver || msg.sender == owner(), "Not authorized");
        require(market.status != MarketStatus.RESOLVED, "Already resolved");

        market.status = MarketStatus.INVALIDATED;
        conditionalTokens.invalidateMarket(marketId);
        
        emit MarketInvalidated(marketId);
    }
}
