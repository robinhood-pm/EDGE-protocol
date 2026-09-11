// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract InsuranceFund is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public collateralToken;

    event InsuranceFundDeposited(address indexed sender, uint256 amount);
    event InsuranceFundUsed(address indexed vault, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _collateralToken) public initializer {
        __Ownable_init(msg.sender);
        collateralToken = IERC20(_collateralToken);
    }

    function deposit(uint256 amount) external {
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        emit InsuranceFundDeposited(msg.sender, amount);
    }

    function coverBadDebt(uint256 amount) external {
        // Only authorized like MarginVault should call this.
        collateralToken.safeTransfer(msg.sender, amount);
        emit InsuranceFundUsed(msg.sender, amount);
    }

    function getBalance() external view returns (uint256) {
        return collateralToken.balanceOf(address(this));
    }
}
