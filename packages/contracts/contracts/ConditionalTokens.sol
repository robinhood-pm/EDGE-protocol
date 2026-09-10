// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ConditionalTokens
 * @dev Implementation of the Conditional Tokens standard for Prediction Markets.
 * Allows splitting collateral into YES and NO tokens, merging them back, and redeeming winnings.
 */
contract ConditionalTokens is Initializable, ERC1155Upgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public collateralToken;

    // Mapping from marketId to whether it has been resolved
    mapping(uint256 => bool) public isMarketResolved;
    // Mapping from marketId to the winning outcome (0 for NO, 1 for YES)
    mapping(uint256 => uint8) public marketWinner;
    
    // Mapping from marketId to whether it is invalidated
    mapping(uint256 => bool) public isMarketInvalidated;

    // Events
    event PositionSplit(address indexed stakeholder, uint256 indexed marketId, uint256 amount);
    event PositionMerged(address indexed stakeholder, uint256 indexed marketId, uint256 amount);
    event PositionRedeemed(address indexed stakeholder, uint256 indexed marketId, uint256 amount, uint8 winningOutcome);
    event MarketResolved(uint256 indexed marketId, uint8 winningOutcome);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _collateralToken, string memory _uri) public initializer {
        require(_collateralToken != address(0), "Invalid collateral token");
        __ERC1155_init(_uri);
        __Ownable_init(msg.sender);
        collateralToken = IERC20(_collateralToken);
    }

    /**
     * @dev Generates the token ID for a specific market and outcome.
     * @param marketId The unique ID of the market.
     * @param outcome 0 for NO, 1 for YES.
     * @return The combined token ID.
     */
    function getPositionId(uint256 marketId, uint8 outcome) public pure returns (uint256) {
        require(outcome == 0 || outcome == 1, "Invalid outcome");
        // Use bit shifting to combine marketId and outcome
        // Token ID ends with 0 for NO, 1 for YES
        return (marketId << 1) | outcome;
    }

    /**
     * @dev Splits collateral into YES and NO tokens.
     * @param marketId The unique ID of the market.
     * @param amount The amount of collateral to split (and amount of each token to mint).
     */
    function splitPosition(uint256 marketId, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(!isMarketResolved[marketId], "Market already resolved");

        // Transfer collateral from user to this contract
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 yesTokenId = getPositionId(marketId, 1);
        uint256 noTokenId = getPositionId(marketId, 0);

        uint256[] memory ids = new uint256[](2);
        ids[0] = yesTokenId;
        ids[1] = noTokenId;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = amount;
        amounts[1] = amount;

        // Mint YES and NO tokens to the user
        _mintBatch(msg.sender, ids, amounts, "");

        emit PositionSplit(msg.sender, marketId, amount);
    }

    /**
     * @dev Merges YES and NO tokens back into collateral.
     * @param marketId The unique ID of the market.
     * @param amount The amount of pair tokens to merge.
     */
    function mergePositions(uint256 marketId, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(!isMarketResolved[marketId], "Market already resolved");

        uint256 yesTokenId = getPositionId(marketId, 1);
        uint256 noTokenId = getPositionId(marketId, 0);

        uint256[] memory ids = new uint256[](2);
        ids[0] = yesTokenId;
        ids[1] = noTokenId;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = amount;
        amounts[1] = amount;

        // Burn YES and NO tokens from the user
        _burnBatch(msg.sender, ids, amounts);

        // Return collateral to the user
        collateralToken.safeTransfer(msg.sender, amount);

        emit PositionMerged(msg.sender, marketId, amount);
    }

    /**
     * @dev Resolves a market. Only callable by the owner (which will be the Factory/Registry).
     * @param marketId The unique ID of the market.
     * @param winningOutcome 0 for NO, 1 for YES.
     */
    function resolveMarket(uint256 marketId, uint8 winningOutcome) external onlyOwner {
        require(!isMarketResolved[marketId], "Market already resolved");
        require(winningOutcome == 0 || winningOutcome == 1, "Invalid outcome");

        isMarketResolved[marketId] = true;
        marketWinner[marketId] = winningOutcome;

        emit MarketResolved(marketId, winningOutcome);
    }

    /**
     * @dev Invalidates a market. Only callable by the owner (which will be the Factory/Registry).
     * @param marketId The unique ID of the market.
     */
    function invalidateMarket(uint256 marketId) external onlyOwner {
        require(!isMarketResolved[marketId], "Market already resolved");
        require(!isMarketInvalidated[marketId], "Market already invalidated");

        isMarketInvalidated[marketId] = true;

        emit MarketResolved(marketId, 255); // 255 can signify invalid
    }

    /**
     * @dev Redeems winning tokens for collateral after a market is resolved or invalidated.
     * @param marketId The unique ID of the market.
     */
    function redeemPositions(uint256 marketId) external {
        require(isMarketResolved[marketId] || isMarketInvalidated[marketId], "Market not ready for redemption");

        if (isMarketInvalidated[marketId]) {
            uint256 yesTokenId = getPositionId(marketId, 1);
            uint256 noTokenId = getPositionId(marketId, 0);

            uint256 yesBalance = balanceOf(msg.sender, yesTokenId);
            uint256 noBalance = balanceOf(msg.sender, noTokenId);

            uint256 totalRedeemable = (yesBalance + noBalance) / 2;
            require(totalRedeemable > 0, "No tokens to redeem");

            if (yesBalance > 0) _burn(msg.sender, yesTokenId, yesBalance);
            if (noBalance > 0) _burn(msg.sender, noTokenId, noBalance);

            collateralToken.safeTransfer(msg.sender, totalRedeemable);
            emit PositionRedeemed(msg.sender, marketId, totalRedeemable, 255);
        } else {
            uint8 outcome = marketWinner[marketId];
            uint256 winningTokenId = getPositionId(marketId, outcome);
            
            uint256 balance = balanceOf(msg.sender, winningTokenId);
            require(balance > 0, "No winning tokens to redeem");

            // Burn the winning tokens
            _burn(msg.sender, winningTokenId, balance);

            // Transfer collateral equivalent to the balance
            collateralToken.safeTransfer(msg.sender, balance);

            emit PositionRedeemed(msg.sender, marketId, balance, outcome);
        }
    }
}
