//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.16;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol';

contract Yellow is ERC20CappedUpgradeable, ERC20PresetMinterPauserUpgradeable {
    /**
     * @notice Initialize the contract and the owner address permissions.
     * - Set the total supply to 10 billion tokens with 18 decimal places for a total of 10**27 units.
     * - grant DEFAULT_ADMIN_ROLE to owner.
     * - grant MINTER_ROLE to owner.
     * - grant PAUSER_ROLE to owner.
     * The owner will be a multi-signature wallet using a Gnosis Safe.
     * Several signatures will be mandatory for minting new tokens or pausing transfers.
     * This will ensure that not a single person can manipulate the market by stopping transfers of minting new tokens.
     */
    function init(
        string memory name_,
        string memory symbol_,
        address owner_
    ) public virtual initializer {
        require(owner_ != address(0), 'Owner is zero address');
        uint256 totalSupply_ = 10**27;
        __AccessControl_init();
        __ERC20_init(name_, symbol_);
        __ERC20Capped_init(totalSupply_);
        __ERC20PresetMinterPauser_init(name_, symbol_);
        _grantRole(DEFAULT_ADMIN_ROLE, owner_);
        _grantRole(MINTER_ROLE, owner_);
        _grantRole(PAUSER_ROLE, owner_);
    }

    /**
     * Requirements:
     * - the contract must not be paused.
     * @dev For explicit interface definition.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Upgradeable, ERC20PresetMinterPauserUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @notice Creates `amount` new tokens for `to`.
     * Requirements:
     * - the caller must have the `MINTER_ROLE`.
     * - the contract owner has `MINTER_ROLE` by default.
     * @dev For explicit interface definition.
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
     * @notice Pauses all token transfers.
     * Requirements:
     * - the caller must have the `PAUSER_ROLE`.
     * - the contract owner has `PAUSER_ROLE` by default.
     * @dev For explicit interface definition.
     */
    function pause()
        public
        virtual
        override(ERC20PresetMinterPauserUpgradeable)
        onlyRole(PAUSER_ROLE)
    {
        _pause();
    }

    /**
     * @notice Removes `amount` new tokens from caller.
     * @dev For explicit interface definition.
     * @param amount Amount of tokens to remove
     */
    function burn(uint256 amount)
        public
        virtual
        override(ERC20BurnableUpgradeable)
    {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev For explicit interface definition.
     */
    function _mint(address account, uint256 amount)
        internal
        virtual
        override(ERC20Upgradeable, ERC20CappedUpgradeable)
    {
        super._mint(account, amount);
    }

    /**
     * @dev For explicit interface definition.
     */
    function _pause()
        internal
        virtual
        whenNotPaused
        override(PausableUpgradeable)
    {
        super._pause();
    }

    /**
     * @dev For explicit interface definition.
     */
    function _burn(address from, uint256 amount) internal virtual override(ERC20Upgradeable) {
        super._burn(from, amount);
    }
}
