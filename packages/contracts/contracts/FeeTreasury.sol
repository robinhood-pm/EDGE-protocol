// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FeeTreasury
 * @dev Simple treasury contract to hold fees collected by the Exchange.
 * The owner (eventually a Multi-Sig) can withdraw accumulated funds.
 */
contract FeeTreasury is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
    }

    /**
     * @dev Withdraws ERC20 tokens from the treasury.
     * @param token Address of the ERC20 token to withdraw.
     * @param to Address to send the tokens to.
     * @param amount Amount to withdraw.
     */
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).safeTransfer(to, amount);

        emit Withdrawn(token, to, amount);
    }
}
