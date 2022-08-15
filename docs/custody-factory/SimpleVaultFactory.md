## SimpleVaultFactory


SimpleVaultFactory provides bonding functionality between ERC20 tokens and SimpleVault in OpenDAX v4 testing.


### Contents
<!-- START doctoc -->
<!-- END doctoc -->

### Globals


| Var | Type | Description |
| --- | --- | --- |
| brokerAndVaultArr | struct ISimpleVaultFactory.BrokerAndVault[] |  |
| tokenAndMintArr | struct ISimpleVaultFactory.TokenAndMint[] |  |


### Functions

#### `initialize`

📋   &nbsp;&nbsp;
Grant default admin role to msg.sender.

> Grant default admin role to msg.sender.

##### Declaration
```solidity
  function initialize(
  ) public initializer
```

##### Modifiers:
| Modifier |
| --- |
| initializer |



#### `addAdmin`

📋   &nbsp;&nbsp;
Grant DEFAULT_ADMIN_ROLE to account.

> DEFAULT_ADMIN_ROLE rights required.


##### Declaration
```solidity
  function addAdmin(
    address account
  ) public onlyRole
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`account` | address | Address to grant role to.

#### `deployVault`

📋   &nbsp;&nbsp;
Deploy a new SimpleVault and add it to list of vaults for future usage. Grants DEFAULT_ADMIN_ROLE of deployed SimpleVault to msg.sender.

> Deploy a new SimpleVault and add it to list of vaults for future usage. Grants DEFAULT_ADMIN_ROLE of deployed SimpleVault to msg.sender.


##### Declaration
```solidity
  function deployVault(
    string name_,
    address broker_
  ) public returns (contract SimpleVault)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`name_` | string | Name of the vault to create.
|`broker_` | address | Broker address of the vault to create.

##### Returns:
| Type | Description |
| --- | --- |
|`address` | Deployed SimpleVault address.
#### `redeployVault`

📋   &nbsp;&nbsp;
Redeploy SimpleVault: remove old vault and deploy a new one with the same name and broker.

> Vault must be already present in the list. msg.sender must have DEFAULT_ADMIN_ROLE of SimpleVault.


##### Declaration
```solidity
  function redeployVault(
    contract SimpleVault vault
  ) public returns (contract SimpleVault)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault address to redeploy.

##### Returns:
| Type | Description |
| --- | --- |
|`address` | Redeployed SimpleVault address.
#### `removeVault`

📋   &nbsp;&nbsp;
Remove SimpleVault from the list and burn all tokens from it.

> DEFAULT_ADMIN_ROLE required on the Vault.


##### Declaration
```solidity
  function removeVault(
    contract SimpleVault vault
  ) public returns (struct ISimpleVaultFactory.BrokerAndVault)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault to remove.

##### Returns:
| Type | Description |
| --- | --- |
|`BrokerAndVault` | Structure contraining SimpleVault and broker addresses.
#### `addToken`

📋   &nbsp;&nbsp;
Add deployed token to list of tokens and mint it to all vaults. SimpleVaultFactory is required to have MINTER_ROLE and BURNER_ROLE of token being added.

> DEFAULT_ADMIN_ROLE rights required. Token must not be already present in the list.


##### Declaration
```solidity
  function addToken(
    contract SimpleERC20 token,
    uint256 mint_per_deployment
  ) public onlyRole
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | SimpleERC20 token address.
|`mint_per_deployment` | uint256 | Initial amount of tokens to mint to vaults.

#### `deployAndAddToken`

📋   &nbsp;&nbsp;
Deploy SimpleERC20 token, add it to list of tokens and mint it to all vaults. Grants DEFAULT_ADMIN_ROLE of deployed SimpleERC20 to msg.sender.

> DEFAULT_ADMIN_ROLE required.


##### Declaration
```solidity
  function deployAndAddToken(
    string name,
    string symbol,
    uint8 decimals,
    uint256 mint_per_deployment
  ) public onlyRole returns (contract SimpleERC20)
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`name` | string | Token name.
|`symbol` | string | Token symbol.
|`decimals` | uint8 | Token decimal representation.
|`mint_per_deployment` | uint256 | Initial amount of tokens to mint to vaults.

##### Returns:
| Type | Description |
| --- | --- |
|`SimpleERC20` | Deployed token address.
#### `removeToken`

📋   &nbsp;&nbsp;
Remove token from the list and burn it from vaults.

> DEFAULT_ADMIN_ROLE required. Token must be present in the list.


##### Declaration
```solidity
  function removeToken(
    contract SimpleERC20 token
  ) public onlyRole
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | SimpleERC20 token to add.

#### `_requireFactoryIsMinterBurner`

📋   &nbsp;&nbsp;
Check if Factory has Minter and Burner roles for specified token.

> Check if Factory has Minter and Burner roles for specified token.


##### Declaration
```solidity
  function _requireFactoryIsMinterBurner(
    contract SimpleERC20 token
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | SimpleERC20 to check roles of.

#### `_requireVaultIsPresent`

📋   &nbsp;&nbsp;
Check if vault is present in the list.

> Check if vault is present in the list.


##### Declaration
```solidity
  function _requireVaultIsPresent(
    contract SimpleVault vault
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault to check.

#### `_getVaultIndex`

📋   &nbsp;&nbsp;
Find the index of the vault in the list. Return -1 if not found.

> Find the index of the vault in the list. Return -1 if not found.


##### Declaration
```solidity
  function _getVaultIndex(
    contract SimpleVault vault
  ) internal returns (int256)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault to find.

##### Returns:
| Type | Description |
| --- | --- |
|`int256` | Index of the SimpleVault in the list or -1 if not present.
#### `_requireIsVaultAdmin`

📋   &nbsp;&nbsp;
Check if account has DEFAULT_ADMIN_ROLE in vault.

> Check if account has DEFAULT_ADMIN_ROLE in vault.


##### Declaration
```solidity
  function _requireIsVaultAdmin(
    contract SimpleVault vault,
    address account
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault to check admin role in.
|`account` | address | Address to check admin role of.

#### `_requireTokenIsNotPresent`

📋   &nbsp;&nbsp;
Check if token is not present in the list.

> Check if token is not present in the list.


##### Declaration
```solidity
  function _requireTokenIsNotPresent(
    contract SimpleERC20 token
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | Address of the SimpleERC20 to check.

#### `_requireTokenIsPresent`

📋   &nbsp;&nbsp;
Check if token is present in the list.

> Check if token is present in the list.


##### Declaration
```solidity
  function _requireTokenIsPresent(
    contract SimpleERC20 token
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | Address of the SimpleERC20 to check.

#### `_addVault`

📋   &nbsp;&nbsp;
Add SimpleVault to the list. Internal method.

> Add SimpleVault to the list. Internal method.


##### Declaration
```solidity
  function _addVault(
    contract SimpleVault vault,
    address broker
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault address to add.
|`broker` | address | Broker address corresponding to the SimpleVault.

#### `_removeVaultAtIndex`

📋   &nbsp;&nbsp;
Remove vault form the list.

> Swap the last element with element at index and pops the last one.


##### Declaration
```solidity
  function _removeVaultAtIndex(
    uint256 index
  ) internal returns (struct ISimpleVaultFactory.BrokerAndVault brokerAndVault)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`index` | uint256 | Index of the element to remove.

##### Returns:
| Type | Description |
| --- | --- |
|`brokerAndVault` | Structure containing removed SimpleVault and broker addresses.
#### `_burnAllTokensFromVault`

📋   &nbsp;&nbsp;
Burn all tokens from the vault.

> Burn all tokens from the vault.


##### Declaration
```solidity
  function _burnAllTokensFromVault(
    contract SimpleVault vault
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | Vault to burn tokens from.

#### `_mintAllTokensToVault`

📋   &nbsp;&nbsp;
Mint mint_per_deployment amount of each token to vault specified.

> Mint mint_per_deployment amount of each token to vault specified.


##### Declaration
```solidity
  function _mintAllTokensToVault(
    contract SimpleVault vault
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`vault` | contract SimpleVault | SimpleVault address to mint tokens to.

#### `_addToken`

📋   &nbsp;&nbsp;
Add SimpleERC20 token to the list. Internal method.

> Add SimpleERC20 token to the list. Internal method.


##### Declaration
```solidity
  function _addToken(
    contract SimpleERC20 token,
    uint256 mint_per_deployment
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | SimpleERC20 token address to add.
|`mint_per_deployment` | uint256 | Initial amount of tokens to mint to vault.

#### `_mintTokenForAllVaults`

📋   &nbsp;&nbsp;
Mint mint_per_deployment amount of SimpleERC20 token to all vaults from the list.

> Mint mint_per_deployment amount of SimpleERC20 token to all vaults from the list.


##### Declaration
```solidity
  function _mintTokenForAllVaults(
    contract SimpleERC20 token,
    uint256 mint_per_deployment
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | SimpleERC20 token address.
|`mint_per_deployment` | uint256 | Initial amount of tokens to mint to vaults.

#### `_removeTokenAtIndex`

📋   &nbsp;&nbsp;
Remove token form the list.

> Swap the last element with element at index and pops the last one.


##### Declaration
```solidity
  function _removeTokenAtIndex(
    uint256 index
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`index` | uint256 | Index of the element to remove.

#### `_getTokenIndex`

📋   &nbsp;&nbsp;
Find the index of the SimpleERC20 token in the list. Return -1 if not found.

> Find the index of the SimpleERC20 token in the list. Return -1 if not found.


##### Declaration
```solidity
  function _getTokenIndex(
    contract SimpleERC20 token
  ) internal returns (int256)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | Address of the token find.

##### Returns:
| Type | Description |
| --- | --- |
|`int256` | Index of the token in the list or -1 if not present.
#### `_burnTokenFromAllVaults`

📋   &nbsp;&nbsp;
Burn all SimpleERC20 tokens from all vaults from the list.

> Burn all SimpleERC20 tokens from all vaults from the list.


##### Declaration
```solidity
  function _burnTokenFromAllVaults(
    contract SimpleERC20 token
  ) internal
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`token` | contract SimpleERC20 | SimpleERC20 token address.

#### `_stringsEqual`

📋   &nbsp;&nbsp;
Check strings for equality.

> Check strings for equality.


##### Declaration
```solidity
  function _stringsEqual(
    string s1,
    string s2
  ) internal returns (bool)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`s1` | string | First string.
|`s2` | string | Second string.

##### Returns:
| Type | Description |
| --- | --- |
|`bool` | If s1 equals s2.


