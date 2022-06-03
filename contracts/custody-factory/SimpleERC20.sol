//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @notice SimpleERC20 is an ERC20 token modified for usage in OpenDAX v4 testing.
 */
contract SimpleERC20 is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 public constant BURNER_ROLE = keccak256('BURNER_ROLE');

    uint8 private _decimals;

    /**
     * @notice Grant default admin, minter and burner roles to msg.sender; specify decimals token representation.
     * @dev Grant default admin, minter and burner roles to msg.sender; specify token decimals representation.
     * @param name_ Name of the token.
     * @param symbol_ Symbol of the token.
     * @param decimals_ Token decimal representation override.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    /**
     * @notice ERC20 decimals() override, providing ability to change decimal representation of the token.
     * @dev ERC20 decimals() override, providing ability to change decimal representation of the token.
     * @return uint8 Overriden token decimal representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Public _mint implementation.
     * @dev MINTER_ROLE rights required.
     * @param to Address to mint tokens to.
     * @param amount Amount of tokens to mint to.
     */
    function mintTo(address to, uint256 amount) public virtual onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Public _burn implementation.
     * @dev BURNER_ROLE rights required.
     * @param from Address to burn tokens from.
     * @param amount Amount of tokens to burn.
     */
    function burnFrom(address from, uint256 amount) public virtual onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }
}
