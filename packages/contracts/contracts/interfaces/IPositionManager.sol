// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPositionManager {
    struct Position {
        address trader;
        uint256 perpMarketId;
        bool isLong;
        uint256 size;
        uint256 entryPrice;
        uint256 margin;
        uint256 leverage;
        int256 realizedPnL;
        int256 fundingAccrued;
    }

    function openPosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 size,
        uint256 price,
        uint256 margin,
        uint256 leverage
    ) external;

    function increasePosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 addSize,
        uint256 price,
        uint256 addMargin
    ) external;

    function reducePosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 reduceSize,
        uint256 price
    ) external;

    function closePosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 price
    ) external;

    function liquidatePosition(
        address trader,
        uint256 perpMarketId
    ) external returns (uint256 penaltyAmount);

    function settlePosition(
        address trader,
        uint256 perpMarketId,
        uint256 settlementPrice
    ) external;

    function getPosition(address trader, uint256 perpMarketId, bool isLong) external view returns (Position memory);
}
