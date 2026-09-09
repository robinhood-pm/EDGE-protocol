// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ConditionalTokens.sol";
import "./FeeTreasury.sol";

/**
 * @title Exchange
 * @dev Settles trades between buyers and sellers of Conditional Tokens using EIP-712 signatures.
 */
contract Exchange is EIP712 {
    using SafeERC20 for IERC20;

    ConditionalTokens public immutable conditionalTokens;
    IERC20 public immutable collateralToken;
    FeeTreasury public immutable feeTreasury;

    uint256 public feeBasisPoints = 100; // 1% default fee

    // TypeHash for EIP-712
    bytes32 public constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,uint256 marketId,uint8 outcome,uint256 amount,uint256 price,bool isBuy,uint256 nonce,uint256 expiration)"
    );

    // Track cancelled or filled nonces (mapping maker => nonce => isUsed)
    mapping(address => mapping(uint256 => bool)) public usedNonces;

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

    constructor(
        address _conditionalTokens,
        address _collateralToken,
        address _feeTreasury
    ) EIP712("EdgeProtocolExchange", "1") {
        conditionalTokens = ConditionalTokens(_conditionalTokens);
        collateralToken = IERC20(_collateralToken);
        feeTreasury = FeeTreasury(_feeTreasury);
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
        usedNonces[msg.sender][nonce] = true;
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
        require(buyOrder.amount == sellOrder.amount, "Amount mismatch (exact fill required for MVP)");
        require(buyOrder.price >= sellOrder.price, "Price mismatch (buyer price < seller price)");

        require(block.timestamp <= buyOrder.expiration, "Buy order expired");
        require(block.timestamp <= sellOrder.expiration, "Sell order expired");

        require(!usedNonces[buyOrder.maker][buyOrder.nonce], "Buy order nonce used");
        require(!usedNonces[sellOrder.maker][sellOrder.nonce], "Sell order nonce used");

        require(verifySignature(buyOrder, buySignature), "Invalid buy signature");
        require(verifySignature(sellOrder, sellSignature), "Invalid sell signature");

        // Mark nonces as used
        usedNonces[buyOrder.maker][buyOrder.nonce] = true;
        usedNonces[sellOrder.maker][sellOrder.nonce] = true;

        // Calculate total cost and fees
        // Execution price is the seller's asking price (or could be mid-price, depending on engine rules)
        uint256 executionPrice = sellOrder.price;
        uint256 totalCost = (buyOrder.amount * executionPrice) / 1e18; // assuming price is scaled by 1e18 for precision, or simpler:
        // Wait, to avoid precision issues in MVP, let's say `price` is total collateral cost for 1 share.
        // Actually, if amount is 1 share, cost is `price`. 
        // Let's just use totalCost = buyOrder.amount * executionPrice / 1000000 (if 6 decimals).
        // Let's assume price is total price for the entire `amount` to keep it simple, or price is per unit.
        // Let's make `price` the TOTAL price for the `amount` of shares in the order.
        totalCost = executionPrice; // simplified for MVP: price is the total collateral required for this amount of shares.

        uint256 fee = (totalCost * feeBasisPoints) / 10000;
        uint256 sellerProceeds = totalCost - fee;

        // 1. Transfer USDG from Buyer to Seller and Treasury
        collateralToken.safeTransferFrom(buyOrder.maker, sellOrder.maker, sellerProceeds);
        if (fee > 0) {
            collateralToken.safeTransferFrom(buyOrder.maker, address(feeTreasury), fee);
        }

        // 2. Transfer Outcome Tokens (ERC1155) from Seller to Buyer
        uint256 tokenId = conditionalTokens.getPositionId(buyOrder.marketId, buyOrder.outcome);
        conditionalTokens.safeTransferFrom(sellOrder.maker, buyOrder.maker, tokenId, buyOrder.amount, "");

        emit OrderMatched(
            hashOrder(buyOrder),
            hashOrder(sellOrder),
            buyOrder.maker,
            sellOrder.maker,
            buyOrder.marketId,
            buyOrder.outcome,
            buyOrder.amount,
            executionPrice
        );
    }
}
