//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol';

interface IYellow is IERC20Upgradeable, IAccessControlUpgradeable {
    function initialize(
        string memory name_,
        string memory symbol_,
        address owner_,
        uint256 totalSupply_
    ) external;

    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external;
}
