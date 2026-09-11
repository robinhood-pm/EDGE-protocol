// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IPositionManager.sol";
import "../interfaces/IMarginVault.sol";

contract PositionManager is Initializable, OwnableUpgradeable, IPositionManager {
    IMarginVault public marginVault;

    // trader => perpMarketId => isLong => Position
    mapping(address => mapping(uint256 => mapping(bool => Position))) public positions;
    
    // authorized callers (like PerpExchange, LiquidationEngine)
    mapping(address => bool) public isAuthorized;

    modifier onlyAuthorized() {
        require(isAuthorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _marginVault) public initializer {
        __Ownable_init(msg.sender);
        marginVault = IMarginVault(_marginVault);
    }

    function setAuthorized(address addr, bool authorized) external onlyOwner {
        isAuthorized[addr] = authorized;
    }

    function openPosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 size,
        uint256 price,
        uint256 margin,
        uint256 leverage
    ) external onlyAuthorized {
        Position storage pos = positions[trader][perpMarketId][isLong];
        require(pos.size == 0, "Position already exists");

        marginVault.reserveMargin(trader, margin);

        pos.trader = trader;
        pos.perpMarketId = perpMarketId;
        pos.isLong = isLong;
        pos.size = size;
        pos.entryPrice = price;
        pos.margin = margin;
        pos.leverage = leverage;
    }

    function increasePosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 addSize,
        uint256 price,
        uint256 addMargin
    ) external onlyAuthorized {
        Position storage pos = positions[trader][perpMarketId][isLong];
        require(pos.size > 0, "Position does not exist");

        marginVault.reserveMargin(trader, addMargin);

        // Average entry price
        uint256 totalCost = (pos.size * pos.entryPrice) + (addSize * price);
        pos.size += addSize;
        pos.entryPrice = totalCost / pos.size;
        pos.margin += addMargin;
    }

    function reducePosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 reduceSize,
        uint256 price
    ) external onlyAuthorized {
        Position storage pos = positions[trader][perpMarketId][isLong];
        require(pos.size >= reduceSize, "Reduce size exceeds position");

        // Calculate PnL for the reduced portion
        uint256 pnl;
        bool isProfit;
        if (isLong) {
            if (price > pos.entryPrice) {
                pnl = (price - pos.entryPrice) * reduceSize;
                isProfit = true;
            } else {
                pnl = (pos.entryPrice - price) * reduceSize;
                isProfit = false;
            }
        } else {
            if (price < pos.entryPrice) {
                pnl = (pos.entryPrice - price) * reduceSize;
                isProfit = true;
            } else {
                pnl = (price - pos.entryPrice) * reduceSize;
                isProfit = false;
            }
        }

        uint256 marginToRelease = (pos.margin * reduceSize) / pos.size;
        
        pos.size -= reduceSize;
        pos.margin -= marginToRelease;

        marginVault.releaseMargin(trader, marginToRelease);
        marginVault.applyRealizedPnL(trader, pnl, isProfit);

        if (pos.size == 0) {
            delete positions[trader][perpMarketId][isLong];
        }
    }

    function closePosition(
        address trader,
        uint256 perpMarketId,
        bool isLong,
        uint256 price
    ) external onlyAuthorized {
        Position storage pos = positions[trader][perpMarketId][isLong];
        require(pos.size > 0, "No position");
        
        uint256 size = pos.size;
        this.reducePosition(trader, perpMarketId, isLong, size, price);
    }

    function liquidatePosition(
        address trader,
        uint256 perpMarketId
    ) external onlyAuthorized returns (uint256 penaltyAmount) {
        // Simplified liquidation call
        // In reality, this would calculate penalty, transfer to insurance fund, and clear position
        return 0;
    }

    function settlePosition(
        address trader,
        uint256 perpMarketId,
        uint256 settlementPrice
    ) external onlyAuthorized {
        // Settle against the final 0, 1, or 0.5 price
        Position storage posLong = positions[trader][perpMarketId][true];
        if (posLong.size > 0) {
            this.reducePosition(trader, perpMarketId, true, posLong.size, settlementPrice);
        }

        Position storage posShort = positions[trader][perpMarketId][false];
        if (posShort.size > 0) {
            this.reducePosition(trader, perpMarketId, false, posShort.size, settlementPrice);
        }
    }

    function getPosition(address trader, uint256 perpMarketId, bool isLong) external view returns (Position memory) {
        return positions[trader][perpMarketId][isLong];
    }
}
