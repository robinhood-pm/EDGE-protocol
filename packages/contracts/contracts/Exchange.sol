// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ConditionalTokens.sol";
import "./FeeTreasury.sol";

/**
 * @title Exchange
 * @dev Settles trades between buyers and sellers of Conditional Tokens using EIP-712 signatures.
 */
contract Exchange is Initializable, EIP712Upgradeable {
    using SafeERC20 for IERC20;

    ConditionalTokens public conditionalTokens;
    IERC20 public collateralToken;
    FeeTreasury public feeTreasury;

    uint256 public feeBasisPoints; // 1% default fee

    // TypeHash for EIP-712
    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,uint256 marketId,uint8 outcome,uint256 amount,uint256 price,bool isBuy,uint256 nonce,uint256 expiration)"
    );

    // Track cancelled nonces (mapping maker => nonce => isCancelled)
    mapping(address => mapping(uint256 => bool)) public cancelledNonces;

    // Track filled amounts for partial fills (mapping orderHash => filledAmount)
    mapping(bytes32 => uint256) public filledAmount;

    event OrderMatched(
        bytes32 buyOrderHash,
        bytes32 sellOrderHash,
        address indexed buyer,
        address indexed seller,
        uint256 marketId,
        uint8 outcome,
        uint256 amount,
        uint256 price
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _conditionalTokens,
        address _collateralToken,
        address _feeTreasury
    ) public initializer {
        __EIP712_init("EdgeProtocolExchange", "1");
        conditionalTokens = ConditionalTokens(_conditionalTokens);
        collateralToken = IERC20(_collateralToken);
        feeTreasury = FeeTreasury(_feeTreasury);
        feeBasisPoints = 100;
    }

    struct Order {
        address maker;
        uint256 marketId;
        uint8 outcome;
        uint256 amount;
        uint256 price; // Price per share in collateral smallest units (e.g., 60 cents = 600000 if 6 decimals)
        bool isBuy;
        uint256 nonce;
        uint256 expiration;
    }

    function hashOrder(Order memory order) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                ORDER_TYPEHASH,
                order.maker,
                order.marketId,
                order.outcome,
                order.amount,
                order.price,
                order.isBuy,
                order.nonce,
                order.expiration
            )
        );
    }

    function verifySignature(Order memory order, bytes memory signature) public view returns (bool) {
        bytes32 digest = _hashTypedDataV4(hashOrder(order));
        address signer = ECDSA.recover(digest, signature);
        return signer == order.maker;
    }

    function cancelOrder(uint256 nonce) external {
        cancelledNonces[msg.sender][nonce] = true;
    }

    /**
     * @dev Matches a buy order and a sell order. Can be called by a relayer (the backend engine).
     * This handles partial fills implicitly if the engine breaks down amounts, 
     * but for MVP it expects exact amount matches.
     */
    function matchOrders(
        Order memory buyOrder,
        bytes memory buySignature,
        Order memory sellOrder,
        bytes memory sellSignature
    ) external {
        require(buyOrder.isBuy, "Buy order must be isBuy = true");
        require(!sellOrder.isBuy, "Sell order must be isBuy = false");
        
        require(buyOrder.marketId == sellOrder.marketId, "Market mismatch");
        require(buyOrder.outcome == sellOrder.outcome, "Outcome mismatch");
        require(buyOrder.price >= sellOrder.price, "Price mismatch (buyer price < seller price)");

        require(block.timestamp <= buyOrder.expiration, "Buy order expired");
        require(block.timestamp <= sellOrder.expiration, "Sell order expired");

        require(!cancelledNonces[buyOrder.maker][buyOrder.nonce], "Buy order cancelled");
        require(!cancelledNonces[sellOrder.maker][sellOrder.nonce], "Sell order cancelled");

        require(verifySignature(buyOrder, buySignature), "Invalid buy signature");
        require(verifySignature(sellOrder, sellSignature), "Invalid sell signature");

        bytes32 buyHash = hashOrder(buyOrder);
        bytes32 sellHash = hashOrder(sellOrder);

        uint256 buyRemaining = buyOrder.amount - filledAmount[buyHash];
        uint256 sellRemaining = sellOrder.amount - filledAmount[sellHash];

        require(buyRemaining > 0, "Buy order fully filled");
        require(sellRemaining > 0, "Sell order fully filled");

        // Match amount is the minimum of remaining amounts
        uint256 matchAmount = buyRemaining < sellRemaining ? buyRemaining : sellRemaining;

        // Update filled amounts
        filledAmount[buyHash] += matchAmount;
        filledAmount[sellHash] += matchAmount;

        // Calculate total cost and fees based on matchAmount
        uint256 executionPrice = sellOrder.price;
        
        // In this MVP, price is cost-per-share scaled or total cost. 
        // Previously we assumed price is the total cost for `buyOrder.amount` shares.
        // For partial fills to work correctly, `price` MUST be price per share!
        // So totalCost = matchAmount * executionPrice / 1e18 or just unit cost.
        // Wait, if price was total cost, partial fill requires prorating.
        // Let's assume price is per share.
        uint256 totalCost = (matchAmount * executionPrice) / 1e6; // if price is 0.36 USDG (360000)

        uint256 fee = (totalCost * feeBasisPoints) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        // 1. Transfer USDG from Buyer to Seller and Treasury
        collateralToken.safeTransferFrom(buyOrder.maker, sellOrder.maker, sellerProceeds);
        if (fee > 0) {
            collateralToken.safeTransferFrom(buyOrder.maker, address(feeTreasury), fee);
        }

        // 2. Transfer Outcome Tokens (ERC1155) from Seller to Buyer
        uint256 tokenId = conditionalTokens.getPositionId(buyOrder.marketId, buyOrder.outcome);
        conditionalTokens.safeTransferFrom(sellOrder.maker, buyOrder.maker, tokenId, matchAmount, "");

        emit OrderMatched(
            buyHash,
            sellHash,
            buyOrder.maker,
            sellOrder.maker,
            buyOrder.marketId,
            buyOrder.outcome,
            matchAmount,
            executionPrice
        );
    }
}
