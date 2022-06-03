//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '../SimpleVaultFactory.sol';

contract SimpleVaultFactoryTest is SimpleVaultFactory {
    bool public constant AVAILABLE_AFTER_UPGRADE = true;
}
