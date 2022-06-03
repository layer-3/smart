//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './ISimpleVaultFactory.sol';
import '../custody/SimpleVault.sol';
import './SimpleERC20.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

/**
 * SimpleVaultFactory provides bonding functionality between ERC20 tokens and SimpleVault in OpenDAX v4 testing.
 */
contract SimpleVaultFactory is AccessControlUpgradeable, ISimpleVaultFactory {
    // NOTE: no support of EnumerableMap<address, address> as of @openzeppelin/contracts@4.5.0
    // EnumerableMap(address => address) public vaultOf;

    // order is not preserved between add/remove operations
    BrokerAndVault[] public brokerAndVaultArr;

    // TODO: replace with EnumerableMap<address, uint256> from @openzeppelin/contracts@4.6.0 when released
    // EnumerableMap(address => uint256) public tokens;

    // order is not preserved between add/remove operations
    TokenAndMint[] public tokenAndMintArr;

    /**
     * @notice Grant default admin role to msg.sender.
     * @dev Grant default admin role to msg.sender.
     */
    function initialize() public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Grant DEFAULT_ADMIN_ROLE to account.
     * @dev DEFAULT_ADMIN_ROLE rights required.
     * @param account Address to grant role to.
     */
    function addAdmin(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DEFAULT_ADMIN_ROLE, account);
    }

    /**
     * @notice Deploy a new SimpleVault and add it to list of vaults for future usage. Grants DEFAULT_ADMIN_ROLE of deployed SimpleVault to msg.sender.
     * @dev Deploy a new SimpleVault and add it to list of vaults for future usage. Grants DEFAULT_ADMIN_ROLE of deployed SimpleVault to msg.sender.
     * @param name_ Name of the vault to create.
     * @param broker_ Broker address of the vault to create.
     * @return address Deployed SimpleVault address.
     */
    function deployVault(string memory name_, address broker_) public returns (SimpleVault) {
        SimpleVault vault = new SimpleVault(name_, broker_);
        vault.grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _addVault(vault, broker_);
        _mintAllTokensToVault(vault);

        emit VaultDeployed(address(vault), name_, broker_);
        return vault;
    }

    /**
     * @notice Redeploy SimpleVault: remove old vault and deploy a new one with the same name and broker.
     * @dev Vault must be already present in the list. msg.sender must have DEFAULT_ADMIN_ROLE of SimpleVault.
     * @param vault SimpleVault address to redeploy.
     * @return address Redeployed SimpleVault address.
     */
    function redeployVault(SimpleVault vault) public returns (SimpleVault) {
        _requireVaultIsPresent(vault);
        _requireIsVaultAdmin(vault, msg.sender);

        // remove old vault, return BrokerAndVault struct
        address broker_ = removeVault(vault).broker;
        string memory name_ = vault.name();
        SimpleVault newVault = new SimpleVault(name_, broker_);

        newVault.grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _addVault(newVault, broker_);
        _mintAllTokensToVault(newVault);

        emit VaultDeployed(address(newVault), name_, broker_);
        return newVault;
    }

    /**
     * @notice Remove SimpleVault from the list and burn all tokens from it.
     * @dev DEFAULT_ADMIN_ROLE required on the Vault.
     * @param vault SimpleVault to remove.
     * @return BrokerAndVault Structure contraining SimpleVault and broker addresses.
     */
    function removeVault(SimpleVault vault) public returns (BrokerAndVault memory) {
        _requireVaultIsPresent(vault);
        _requireIsVaultAdmin(vault, msg.sender);

        _burnAllTokensFromVault(vault);
        return _removeVaultAtIndex(uint256(_getVaultIndex(vault)));
    }

    /**
     * @notice Add deployed token to list of tokens and mint it to all vaults. SimpleVaultFactory is required to have MINTER_ROLE and BURNER_ROLE of token being added.
     * @dev DEFAULT_ADMIN_ROLE rights required. Token must not be already present in the list.
     * @param token SimpleERC20 token address.
     * @param mint_per_deployment Initial amount of tokens to mint to vaults.
     */
    function addToken(
        SimpleERC20 token,
        uint256 mint_per_deployment //solhint-disable-line var-name-mixedcase
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _requireTokenIsNotPresent(token);
        _requireFactoryIsMinterBurner(token);

        _addToken(token, mint_per_deployment);
        _mintTokenForAllVaults(token, mint_per_deployment);
    }

    /**
     * @notice Deploy SimpleERC20 token, add it to list of tokens and mint it to all vaults. Grants DEFAULT_ADMIN_ROLE of deployed SimpleERC20 to msg.sender.
     * @dev DEFAULT_ADMIN_ROLE required.
     * @param name Token name.
     * @param symbol Token symbol.
     * @param decimals Token decimal representation.
     * @param mint_per_deployment Initial amount of tokens to mint to vaults.
     * @return SimpleERC20 Deployed token address.
     */
    function deployAndAddToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 mint_per_deployment //solhint-disable-line var-name-mixedcase
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (SimpleERC20) {
        SimpleERC20 token = new SimpleERC20(name, symbol, decimals);
        token.grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _addToken(token, mint_per_deployment);
        _mintTokenForAllVaults(token, mint_per_deployment);

        emit TokenDeployed(address(token), name, symbol, decimals);
        return token;
    }

    /**
     * @notice Remove token from the list and burn it from vaults.
     * @dev DEFAULT_ADMIN_ROLE required. Token must be present in the list.
     * @param token SimpleERC20 token to add.
     */
    function removeToken(SimpleERC20 token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _requireTokenIsPresent(token);

        _removeTokenAtIndex(uint256(_getTokenIndex(token)));
        _burnTokenFromAllVaults(token);
    }

    /**
     * @notice Check if Factory has Minter and Burner roles for specified token.
     * @dev Check if Factory has Minter and Burner roles for specified token.
     * @param token SimpleERC20 to check roles of.
     */
    function _requireFactoryIsMinterBurner(SimpleERC20 token) internal view {
        require(token.hasRole(keccak256('MINTER_ROLE'), address(this)), 'factory is not minter');
        require(token.hasRole(keccak256('BURNER_ROLE'), address(this)), 'factory is not burner');
    }

    /**
     * @notice Check if vault is present in the list.
     * @dev Check if vault is present in the list.
     * @param vault SimpleVault to check.
     */
    function _requireVaultIsPresent(SimpleVault vault) internal view {
        require(_getVaultIndex(vault) != -1, 'vault is not present');
    }

    /**
     * @notice Find the index of the vault in the list. Return -1 if not found.
     * @dev Find the index of the vault in the list. Return -1 if not found.
     * @param vault SimpleVault to find.
     * @return int256 Index of the SimpleVault in the list or -1 if not present.
     */
    function _getVaultIndex(SimpleVault vault) internal view returns (int256) {
        for (uint256 i = 0; i < brokerAndVaultArr.length; i++) {
            if (brokerAndVaultArr[i].vault == vault) {
                return int256(i);
            }
        }
        return -1;
    }

    /**
     * @notice Check if account has DEFAULT_ADMIN_ROLE in vault.
     * @dev Check if account has DEFAULT_ADMIN_ROLE in vault.
     * @param vault SimpleVault to check admin role in.
     * @param account Address to check admin role of.
     */
    function _requireIsVaultAdmin(SimpleVault vault, address account) internal view {
        require(vault.hasRole(DEFAULT_ADMIN_ROLE, account), 'account is not vault admin');
    }

    /**
     * @notice Check if token is not present in the list.
     * @dev Check if token is not present in the list.
     * @param token Address of the SimpleERC20 to check.
     */
    function _requireTokenIsNotPresent(SimpleERC20 token) internal view {
        require(_getTokenIndex(token) == -1, 'token is already present');
    }

    /**
     * @notice Check if token is present in the list.
     * @dev Check if token is present in the list.
     * @param token Address of the SimpleERC20 to check.
     */
    function _requireTokenIsPresent(SimpleERC20 token) internal view {
        require(_getTokenIndex(token) != -1, 'token is not present');
    }

    /**
     * @notice Add SimpleVault to the list. Internal method.
     * @dev Add SimpleVault to the list. Internal method.
     * @param vault SimpleVault address to add.
     * @param broker Broker address corresponding to the SimpleVault.
     */
    function _addVault(SimpleVault vault, address broker) internal {
        brokerAndVaultArr.push(BrokerAndVault(broker, vault));
    }

    /**
     * @notice Remove vault form the list.
     * @dev Swap the last element with element at index and pops the last one.
     * @param index Index of the element to remove.
     * @return brokerAndVault Structure containing removed SimpleVault and broker addresses.
     */
    function _removeVaultAtIndex(uint256 index)
        internal
        returns (BrokerAndVault memory brokerAndVault)
    {
        brokerAndVault = brokerAndVaultArr[index];
        brokerAndVaultArr[index] = brokerAndVaultArr[brokerAndVaultArr.length - 1];
        brokerAndVaultArr.pop();
    }

    /**
     * @notice Burn all tokens from the vault.
     * @dev Burn all tokens from the vault.
     * @param vault Vault to burn tokens from.
     */
    function _burnAllTokensFromVault(SimpleVault vault) internal {
        for (uint256 i = 0; i < tokenAndMintArr.length; i++) {
            SimpleERC20 token = tokenAndMintArr[i].token;
            token.burnFrom(address(vault), token.balanceOf(address(vault)));
        }
    }

    /**
     * @notice Mint mint_per_deployment amount of each token to vault specified.
     * @dev Mint mint_per_deployment amount of each token to vault specified.
     * @param vault SimpleVault address to mint tokens to.
     */
    function _mintAllTokensToVault(SimpleVault vault) internal {
        for (uint256 i = 0; i < tokenAndMintArr.length; i++) {
            SimpleERC20 token = tokenAndMintArr[i].token;
            token.mintTo(
                address(vault),
                tokenAndMintArr[i].mint_per_deployment * 10**token.decimals()
            );
        }
    }

    /**
     * @notice Add SimpleERC20 token to the list. Internal method.
     * @dev Add SimpleERC20 token to the list. Internal method.
     * @param token SimpleERC20 token address to add.
     * @param mint_per_deployment Initial amount of tokens to mint to vault.
     */
    //solhint-disable-next-line var-name-mixedcase
    function _addToken(SimpleERC20 token, uint256 mint_per_deployment) internal {
        tokenAndMintArr.push(TokenAndMint(token, mint_per_deployment));
    }

    /**
     * @notice Mint mint_per_deployment amount of SimpleERC20 token to all vaults from the list.
     * @dev Mint mint_per_deployment amount of SimpleERC20 token to all vaults from the list.
     * @param token SimpleERC20 token address.
     * @param mint_per_deployment Initial amount of tokens to mint to vaults.
     */
    //solhint-disable-next-line var-name-mixedcase
    function _mintTokenForAllVaults(SimpleERC20 token, uint256 mint_per_deployment) internal {
        for (uint256 i = 0; i < brokerAndVaultArr.length; i++) {
            token.mintTo(
                address(brokerAndVaultArr[i].vault),
                mint_per_deployment * 10**token.decimals()
            );
        }
    }

    /**
     * @notice Remove token form the list.
     * @dev Swap the last element with element at index and pops the last one.
     * @param index Index of the element to remove.
     */
    function _removeTokenAtIndex(uint256 index) internal {
        tokenAndMintArr[index] = tokenAndMintArr[tokenAndMintArr.length - 1];
        tokenAndMintArr.pop();
    }

    /**
     * @notice Find the index of the SimpleERC20 token in the list. Return -1 if not found.
     * @dev Find the index of the SimpleERC20 token in the list. Return -1 if not found.
     * @param token Address of the token find.
     * @return int256 Index of the token in the list or -1 if not present.
     */
    function _getTokenIndex(SimpleERC20 token) internal view returns (int256) {
        for (uint256 i = 0; i < tokenAndMintArr.length; i++) {
            if (tokenAndMintArr[i].token == token) {
                return int256(i);
            }
        }
        return -1;
    }

    /**
     * @notice Burn all SimpleERC20 tokens from all vaults from the list.
     * @dev Burn all SimpleERC20 tokens from all vaults from the list.
     * @param token SimpleERC20 token address.
     */
    function _burnTokenFromAllVaults(SimpleERC20 token) internal {
        for (uint256 i = 0; i < brokerAndVaultArr.length; i++) {
            token.burnFrom(
                address(brokerAndVaultArr[i].vault),
                token.balanceOf(address(brokerAndVaultArr[i].vault))
            );
        }
    }

    /**
     * @notice Check strings for equality.
     * @dev Check strings for equality.
     * @param s1 First string.
     * @param s2 Second string.
     * @return bool If s1 equals s2.
     */
    function _stringsEqual(string memory s1, string memory s2) internal pure returns (bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }
}
