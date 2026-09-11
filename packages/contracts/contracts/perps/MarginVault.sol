// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IMarginVault.sol";

contract MarginVault is Initializable, OwnableUpgradeable, IMarginVault {
    using SafeERC20 for IERC20;

    IERC20 public collateralToken;

    // trader => available margin
    mapping(address => uint256) public availableMargin;
    
    // trader => reserved margin (for open positions)
    mapping(address => uint256) public reservedMargin;

    // authorized caller (like PositionManager)
    mapping(address => bool) public isAuthorized;

    event MarginDeposited(address indexed trader, uint256 amount);
    event MarginWithdrawn(address indexed trader, uint256 amount);
    event MarginReserved(address indexed trader, uint256 amount);
    event MarginReleased(address indexed trader, uint256 amount);
    event InsuranceFundTransfer(address indexed trader, uint256 amount);

    modifier onlyAuthorized() {
        require(isAuthorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _collateralToken) public initializer {
        __Ownable_init(msg.sender);
        collateralToken = IERC20(_collateralToken);
    }

    function setAuthorized(address addr, bool authorized) external onlyOwner {
        isAuthorized[addr] = authorized;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        availableMargin[msg.sender] += amount;
        emit MarginDeposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(availableMargin[msg.sender] >= amount, "Insufficient available margin");
        
        availableMargin[msg.sender] -= amount;
        collateralToken.safeTransfer(msg.sender, amount);
        emit MarginWithdrawn(msg.sender, amount);
    }

    function reserveMargin(address trader, uint256 amount) external onlyAuthorized {
        require(availableMargin[trader] >= amount, "Insufficient available margin");
        availableMargin[trader] -= amount;
        reservedMargin[trader] += amount;
        emit MarginReserved(trader, amount);
    }

    function releaseMargin(address trader, uint256 amount) external onlyAuthorized {
        require(reservedMargin[trader] >= amount, "Insufficient reserved margin");
        reservedMargin[trader] -= amount;
        availableMargin[trader] += amount;
        emit MarginReleased(trader, amount);
    }

    function applyRealizedPnL(address trader, uint256 amount, bool isProfit) external onlyAuthorized {
        if (isProfit) {
            availableMargin[trader] += amount;
        } else {
            // Loss is typically taken from reserved margin first if it's during a close
            require(availableMargin[trader] + reservedMargin[trader] >= amount, "Insufficient total margin for loss");
            // simplified: we assume PositionManager has moved things back to available before applying loss
            availableMargin[trader] -= amount;
        }
    }

    function applyFunding(address trader, uint256 amount, bool isPayment) external onlyAuthorized {
        if (isPayment) {
            require(availableMargin[trader] >= amount, "Insufficient margin for funding");
            availableMargin[trader] -= amount;
        } else {
            availableMargin[trader] += amount;
        }
    }

    function handleLiquidationLoss(address trader, uint256 amount) external onlyAuthorized {
        if (availableMargin[trader] + reservedMargin[trader] < amount) {
            // Bad debt - would request from insurance fund
            uint256 shortfall = amount - (availableMargin[trader] + reservedMargin[trader]);
            availableMargin[trader] = 0;
            reservedMargin[trader] = 0;
            emit InsuranceFundTransfer(trader, shortfall);
        } else {
            // Can cover
            if (reservedMargin[trader] >= amount) {
                reservedMargin[trader] -= amount;
            } else {
                uint256 remaining = amount - reservedMargin[trader];
                reservedMargin[trader] = 0;
                availableMargin[trader] -= remaining;
            }
        }
    }

    function getBalance(address trader) external view returns (uint256) {
        return availableMargin[trader] + reservedMargin[trader];
    }

    function getReservedMargin(address trader) external view returns (uint256) {
        return reservedMargin[trader];
    }

    function getAvailableMargin(address trader) external view returns (uint256) {
        return availableMargin[trader];
    }
}
