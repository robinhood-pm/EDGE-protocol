// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPerpExchange {
    struct PerpOrder {
        address maker;
        uint256 perpMarketId;
        bool isLong;
        uint256 size;
        uint256 price; // Scaled price (e.g., probability 0.62 = 620000 if 6 decimals)
        uint256 margin;
        uint256 leverage;
        uint256 nonce;
        uint256 expiration;
    }

    function matchPerpOrders(
        PerpOrder memory longOrder,
        bytes memory longSignature,
        PerpOrder memory shortOrder,
        bytes memory shortSignature
    ) external;

    function cancelOrder(uint256 nonce) external;

    function getFilledAmount(bytes32 orderHash) external view returns (uint256);
}
