// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMarginVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function reserveMargin(address trader, uint256 amount) external;
    function releaseMargin(address trader, uint256 amount) external;
    function applyRealizedPnL(address trader, uint256 amount, bool isProfit) external;
    function applyFunding(address trader, uint256 amount, bool isPayment) external;
    function handleLiquidationLoss(address trader, uint256 amount) external;
    
    function getBalance(address trader) external view returns (uint256);
    function getReservedMargin(address trader) external view returns (uint256);
    function getAvailableMargin(address trader) external view returns (uint256);
}
