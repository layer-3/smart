//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol';

contract Yellow is ERC20CappedUpgradeable, ERC20PresetMinterPauserUpgradeable {
    bytes32 public constant BURNER_ROLE = keccak256('BURNER_ROLE');

    function init(
        string memory name_,
        string memory symbol_,
        address owner_,
        uint256 totalSupply_
    ) public virtual initializer {
        require(owner_ != address(0), 'Owner is zero address');
        __AccessControl_init();
        __ERC20_init(name_, symbol_);
        __ERC20Capped_init(totalSupply_);
        __ERC20PresetMinterPauser_init(name_, symbol_);
        _grantRole(DEFAULT_ADMIN_ROLE, owner_);
        _grantRole(MINTER_ROLE, owner_);
        _grantRole(BURNER_ROLE, owner_);
        _grantRole(PAUSER_ROLE, owner_);
    }

    /**
     * @dev For explicit interface definition
     * Requirements:
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Upgradeable, ERC20PresetMinterPauserUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     * Requirements:
     * - the caller must have the `MINTER_ROLE`.
     * @param to Account address to create tokens to
     * @param amount Amount of tokens to create
     */
    function mint(address to, uint256 amount)
        public
        virtual
        override(ERC20PresetMinterPauserUpgradeable)
        onlyRole(MINTER_ROLE)
    {
        _mint(to, amount);
    }

    /**
     * @dev Removes `amount` new tokens from caller
     * Requirements:
     * - the caller must have the `BURNER_ROLE`.
     * @param amount Amount of tokens to remove
     */
    function burn(uint256 amount)
        public
        virtual
        override(ERC20BurnableUpgradeable)
        onlyRole(BURNER_ROLE)
    {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Removes `amount` new tokens for `to`.
     * Requirements:
     * - the caller must have the `MINTER_ROLE`.
     * @param from Account address to remove tokens from
     * @param amount Amount of tokens to remove
     */
    function burnFrom(address from, uint256 amount)
        public
        virtual
        override(ERC20BurnableUpgradeable)
        onlyRole(BURNER_ROLE)
    {
        _burn(from, amount);
    }

    /**
     * @dev For explicit interface definition
     */
    function _mint(address account, uint256 amount)
        internal
        virtual
        override(ERC20Upgradeable, ERC20CappedUpgradeable)
    {
        super._mint(account, amount);
    }

    /**
     * @dev For explicit interface definition
     */
    function _burn(address from, uint256 amount) internal virtual override(ERC20Upgradeable) {
        super._burn(from, amount);
    }
}
