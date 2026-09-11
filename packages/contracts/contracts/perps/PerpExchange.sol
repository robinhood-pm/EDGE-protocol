// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IPerpExchange.sol";
import "../interfaces/IPositionManager.sol";

contract PerpExchange is Initializable, EIP712Upgradeable, IPerpExchange {
    IPositionManager public positionManager;

    // TypeHash for EIP-712
    bytes32 public constant PERP_ORDER_TYPEHASH = keccak256(
        "PerpOrder(address maker,uint256 perpMarketId,bool isLong,uint256 size,uint256 price,uint256 margin,uint256 leverage,uint256 nonce,uint256 expiration)"
    );

    // maker => nonce => isCancelled
    mapping(address => mapping(uint256 => bool)) public cancelledNonces;

    // orderHash => filledAmount
    mapping(bytes32 => uint256) public filledAmount;

    event PerpOrderMatched(
        bytes32 longOrderHash,
        bytes32 shortOrderHash,
        address indexed longTrader,
        address indexed shortTrader,
        uint256 perpMarketId,
        uint256 size,
        uint256 executionPrice
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _positionManager) public initializer {
        __EIP712_init("EdgeProtocolPerpExchange", "1");
        positionManager = IPositionManager(_positionManager);
    }

    function hashOrder(PerpOrder memory order) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                PERP_ORDER_TYPEHASH,
                order.maker,
                order.perpMarketId,
                order.isLong,
                order.size,
                order.price,
                order.margin,
                order.leverage,
                order.nonce,
                order.expiration
            )
        );
    }

    function verifySignature(PerpOrder memory order, bytes memory signature) public view returns (bool) {
        bytes32 digest = _hashTypedDataV4(hashOrder(order));
        address signer = ECDSA.recover(digest, signature);
        return signer == order.maker;
    }

    function cancelOrder(uint256 nonce) external {
        cancelledNonces[msg.sender][nonce] = true;
    }

    function matchPerpOrders(
        PerpOrder memory longOrder,
        bytes memory longSignature,
        PerpOrder memory shortOrder,
        bytes memory shortSignature
    ) external {
        require(longOrder.isLong, "Long order must be isLong = true");
        require(!shortOrder.isLong, "Short order must be isLong = false");
        
        require(longOrder.perpMarketId == shortOrder.perpMarketId, "Market mismatch");
        require(longOrder.price >= shortOrder.price, "Price mismatch");

        require(block.timestamp <= longOrder.expiration, "Long order expired");
        require(block.timestamp <= shortOrder.expiration, "Short order expired");

        require(!cancelledNonces[longOrder.maker][longOrder.nonce], "Long order cancelled");
        require(!cancelledNonces[shortOrder.maker][shortOrder.nonce], "Short order cancelled");

        require(verifySignature(longOrder, longSignature), "Invalid long signature");
        require(verifySignature(shortOrder, shortSignature), "Invalid short signature");

        bytes32 longHash = hashOrder(longOrder);
        bytes32 shortHash = hashOrder(shortOrder);

        uint256 longRemaining = longOrder.size - filledAmount[longHash];
        uint256 shortRemaining = shortOrder.size - filledAmount[shortHash];

        require(longRemaining > 0, "Long order fully filled");
        require(shortRemaining > 0, "Short order fully filled");

        uint256 matchSize = longRemaining < shortRemaining ? longRemaining : shortRemaining;
        uint256 executionPrice = shortOrder.price; // Simplified price resolution

        filledAmount[longHash] += matchSize;
        filledAmount[shortHash] += matchSize;

        // Open or increase positions via PositionManager
        // If this is the first fill, open. Otherwise, increase.
        // Simplified: always call increasePosition if size > 0, otherwise openPosition.
        // We will assume the backend relayer correctly formats orders.
        // For MVP, just call openPosition (assumes new positions).
        
        uint256 matchedLongMargin = (longOrder.margin * matchSize) / longOrder.size;
        uint256 matchedShortMargin = (shortOrder.margin * matchSize) / shortOrder.size;

        IPositionManager.Position memory pLong = positionManager.getPosition(longOrder.maker, longOrder.perpMarketId, true);
        if (pLong.size == 0) {
            positionManager.openPosition(longOrder.maker, longOrder.perpMarketId, true, matchSize, executionPrice, matchedLongMargin, longOrder.leverage);
        } else {
            positionManager.increasePosition(longOrder.maker, longOrder.perpMarketId, true, matchSize, executionPrice, matchedLongMargin);
        }

        IPositionManager.Position memory pShort = positionManager.getPosition(shortOrder.maker, shortOrder.perpMarketId, false);
        if (pShort.size == 0) {
            positionManager.openPosition(shortOrder.maker, shortOrder.perpMarketId, false, matchSize, executionPrice, matchedShortMargin, shortOrder.leverage);
        } else {
            positionManager.increasePosition(shortOrder.maker, shortOrder.perpMarketId, false, matchSize, executionPrice, matchedShortMargin);
        }

        emit PerpOrderMatched(
            longHash,
            shortHash,
            longOrder.maker,
            shortOrder.maker,
            longOrder.perpMarketId,
            matchSize,
            executionPrice
        );
    }

    function getFilledAmount(bytes32 orderHash) external view returns (uint256) {
        return filledAmount[orderHash];
    }
}
