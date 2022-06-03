## SimpleVaultFactory

SimpleVaultFactory provides bonding functionality between ERC20 tokens and SimpleVault in OpenDAX v4 testing.

### Contents

<!-- START doctoc -->
<!-- END doctoc -->

### Globals

| Var               | Type                                        | Description |
| ----------------- | ------------------------------------------- | ----------- |
| brokerAndVaultArr | struct ISimpleVaultFactory.BrokerAndVault[] |             |
| tokenAndMintArr   | struct ISimpleVaultFactory.TokenAndMint[]   |             |

### Functions

#### `initialize`

📋 &nbsp;&nbsp;
Grants default admin role to msg.sender

> Grants default admin role to msg.sender

##### Declaration

```solidity
  function initialize(
  ) public initializer
```

##### Modifiers:

| Modifier    |
| ----------- |
| initializer |

#### `addAdmin`

📋 &nbsp;&nbsp;
Grants DEFAULT_ADMIN_ROLE to account.

> DEFAULT_ADMIN_ROLE rights required.

##### Declaration

```solidity
  function addAdmin(
    address account
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg       | Type    | Description               |
| --------- | ------- | ------------------------- |
| `account` | address | Address to grant role to. |

#### `addTokenAdmin`

📋 &nbsp;&nbsp;
Grants DEFAULT_ADMIN_ROLE to token specified.

> Reverts if Factory does NOT have DEFAULT_ADMIN_ROLE of the SimpleERC20. DEFAULT_ADMIN_ROLE rights required.

##### Declaration

```solidity
  function addTokenAdmin(
    contract SimpleERC20 token,
    address account
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg       | Type                 | Description                        |
| --------- | -------------------- | ---------------------------------- |
| `token`   | contract SimpleERC20 | SimpleERC20 which will grant role. |
| `account` | address              | Address to grant role to.          |

#### `addTokensAdmin`

📋 &nbsp;&nbsp;
Grants DEFAULT_ADMIN_ROLE to all tokens in the list.

> It skips token of which Factory does NOT have DEFAULT_ADMIN_ROLE. DEFAULT_ADMIN_ROLE rights required.

##### Declaration

```solidity
  function addTokensAdmin(
    address account
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg       | Type    | Description               |
| --------- | ------- | ------------------------- |
| `account` | address | Address to grant role to. |

#### `deployVault`

📋 &nbsp;&nbsp;
Deploy a new SimpleVault and add it to list of vaults for future usage.

> DEFAULT_ADMIN_ROLE rights required. Vault must not be already present in the list.

##### Declaration

```solidity
  function deployVault(
    string name_,
    address broker_
  ) public returns (contract SimpleVault)
```

##### Args:

| Arg       | Type    | Description                            |
| --------- | ------- | -------------------------------------- |
| `name_`   | string  | Name of the vault to create.           |
| `broker_` | address | Broker address of the vault to create. |

##### Returns:

| Type      | Description                   |
| --------- | ----------------------------- |
| `address` | Deployed SimpleVault address. |

#### `addToken`

📋 &nbsp;&nbsp;
Add deployed token to list of tokens and mint it to all vaults.

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
| -------- |
| onlyRole |

##### Args:

| Arg                   | Type                 | Description                                 |
| --------------------- | -------------------- | ------------------------------------------- |
| `token`               | contract SimpleERC20 | SimpleERCC20 token address.                 |
| `mint_per_deployment` | uint256              | Initial amount of tokens to mint to vaults. |

#### `deployAndAddToken`

📋 &nbsp;&nbsp;
Deploy SimpleERC20 token, add it to list of tokens and mint it to all vaults.

> DEFAULT_ADMIN_ROLE rights required.

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
| -------- |
| onlyRole |

##### Args:

| Arg                   | Type    | Description                                 |
| --------------------- | ------- | ------------------------------------------- |
| `name`                | string  | Token name.                                 |
| `symbol`              | string  | Token symbol.                               |
| `decimals`            | uint8   | Token decimal representation.               |
| `mint_per_deployment` | uint256 | Initial amount of tokens to mint to vaults. |

##### Returns:

| Type          | Description             |
| ------------- | ----------------------- |
| `SimpleERC20` | Deployed token address. |

#### `removeToken`

📋 &nbsp;&nbsp;
Remove token from the list and burn it from vaults.

> DEFAULT_ADMIN_ROLE rights required. Token must be present in the list.

##### Declaration

```solidity
  function removeToken(
    contract SimpleERC20 token
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg     | Type                 | Description               |
| ------- | -------------------- | ------------------------- |
| `token` | contract SimpleERC20 | SimpleERC20 token to add. |

#### `_requireFactoryIsAdmin`

📋 &nbsp;&nbsp;
Checks if Factory is Admin for specified token.

> Checks if Factory is Admin for specified token.

##### Declaration

```solidity
  function _requireFactoryIsAdmin(
    contract SimpleERC20 token
  ) internal
```

##### Args:

| Arg     | Type                 | Description                           |
| ------- | -------------------- | ------------------------------------- |
| `token` | contract SimpleERC20 | SimpleERC20 to check admin rights of. |

#### `_addTokenAdmin`

📋 &nbsp;&nbsp;
Grants admin rigths of SimpleERC20 to address specified. Internal method.

> Grants admin rigths of SimpleERC20 to address specified. Internal method.

##### Declaration

```solidity
  function _addTokenAdmin(
    contract SimpleERC20 token,
    address account
  ) internal
```

##### Args:

| Arg       | Type                 | Description                        |
| --------- | -------------------- | ---------------------------------- |
| `token`   | contract SimpleERC20 | SimpleERC20 which will grant role. |
| `account` | address              | Account to grant role to.          |

#### `_addTokensAdmin`

📋 &nbsp;&nbsp;
Grants DEFAULT_ADMIN_ROLE to all tokens in the list. Internal method.

> Grants DEFAULT_ADMIN_ROLE to all tokens in the list. Internal method.

##### Declaration

```solidity
  function _addTokensAdmin(
    address account
  ) internal
```

##### Args:

| Arg       | Type    | Description               |
| --------- | ------- | ------------------------- |
| `account` | address | Address to grant role to. |

#### `_requireVaultIsNotPresent`

📋 &nbsp;&nbsp;
Checks if vault is not present in the list.

> Checks if vault is not present in the list.

##### Declaration

```solidity
  function _requireVaultIsNotPresent(
    string name,
    address broker
  ) internal
```

##### Args:

| Arg      | Type    | Description                         |
| -------- | ------- | ----------------------------------- |
| `name`   | string  | Name of the SimpleVault to check.   |
| `broker` | address | Broker of the SimpleVault to check. |

#### `_getVaultIndex`

📋 &nbsp;&nbsp;
Finds the index of the vault in the list. Returns -1 if not found.

> Finds the index of the vault in the list. Returns -1 if not found.

##### Declaration

```solidity
  function _getVaultIndex(
    string name,
    address broker
  ) internal returns (int256)
```

##### Args:

| Arg      | Type    | Description                        |
| -------- | ------- | ---------------------------------- |
| `name`   | string  | Name of the SimpleVault to find.   |
| `broker` | address | Broker of the SimpleVault to find. |

##### Returns:

| Type     | Description                                                |
| -------- | ---------------------------------------------------------- |
| `int256` | Index of the SimpleVault in the list or -1 if not present. |

#### `_requireTokenIsNotPresent`

📋 &nbsp;&nbsp;
Checks if token is not present in the list.

> Checks if token is not present in the list.

##### Declaration

```solidity
  function _requireTokenIsNotPresent(
    contract SimpleERC20 token
  ) internal
```

##### Args:

| Arg     | Type                 | Description                          |
| ------- | -------------------- | ------------------------------------ |
| `token` | contract SimpleERC20 | Address of the SimpleERC20 to check. |

#### `_requireTokenIsPresent`

📋 &nbsp;&nbsp;
Checks if token is present in the list.

> Checks if token is present in the list.

##### Declaration

```solidity
  function _requireTokenIsPresent(
    contract SimpleERC20 token
  ) internal
```

##### Args:

| Arg     | Type                 | Description                          |
| ------- | -------------------- | ------------------------------------ |
| `token` | contract SimpleERC20 | Address of the SimpleERC20 to check. |

#### `_addVault`

📋 &nbsp;&nbsp;
Adds SimpleVault to the list. Internal method.

> Adds SimpleVault to the list. Internal method.

##### Declaration

```solidity
  function _addVault(
    contract SimpleVault vault,
    address broker
  ) internal
```

##### Args:

| Arg      | Type                 | Description                                      |
| -------- | -------------------- | ------------------------------------------------ |
| `vault`  | contract SimpleVault | SimpleVault address to add.                      |
| `broker` | address              | Broker address corresponding to the SimpleVault. |

#### `_mintAllTokensToVault`

📋 &nbsp;&nbsp;
Mints mint_per_deployment amount of each token to vault specified.

> Mints mint_per_deployment amount of each token to vault specified.

##### Declaration

```solidity
  function _mintAllTokensToVault(
    contract SimpleVault vault
  ) internal
```

##### Args:

| Arg     | Type                 | Description                            |
| ------- | -------------------- | -------------------------------------- |
| `vault` | contract SimpleVault | SimpleVault address to mint tokens to. |

#### `_addToken`

📋 &nbsp;&nbsp;
Adds SimpleERC20 token to the list. Internal method.

> Adds SimpleERC20 token to the list. Internal method.

##### Declaration

```solidity
  function _addToken(
    contract SimpleERC20 token,
    uint256 mint_per_deployment
  ) internal
```

##### Args:

| Arg                   | Type                 | Description                                |
| --------------------- | -------------------- | ------------------------------------------ |
| `token`               | contract SimpleERC20 | SimpleERC20 token address to add.          |
| `mint_per_deployment` | uint256              | Initial amount of tokens to mint to vault. |

#### `_mintTokenForAllVaults`

📋 &nbsp;&nbsp;
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

| Arg                   | Type                 | Description                                 |
| --------------------- | -------------------- | ------------------------------------------- |
| `token`               | contract SimpleERC20 | SimpleERC20 token address.                  |
| `mint_per_deployment` | uint256              | Initial amount of tokens to mint to vaults. |

#### `_removeTokenAtIndex`

📋 &nbsp;&nbsp;
Removes token form the list.

> Swaps the last element with element at index and pops the last one.

##### Declaration

```solidity
  function _removeTokenAtIndex(
    uint256 index
  ) internal
```

##### Args:

| Arg     | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| `index` | uint256 | Index of the element to remove. |

#### `_getTokenIndex`

📋 &nbsp;&nbsp;
Finds the index of the SimpleERC20 token in the list. Returns -1 if not found.

> Finds the index of the SimpleERC20 token in the list. Returns -1 if not found.

##### Declaration

```solidity
  function _getTokenIndex(
    contract SimpleERC20 token
  ) internal returns (int256)
```

##### Args:

| Arg     | Type                 | Description                |
| ------- | -------------------- | -------------------------- |
| `token` | contract SimpleERC20 | Address of the token find. |

##### Returns:

| Type     | Description                                          |
| -------- | ---------------------------------------------------- |
| `int256` | Index of the token in the list or -1 if not present. |

#### `_burnTokenFromAllVaults`

📋 &nbsp;&nbsp;
Burn all SimpleERC20 tokens from all vaults from the list.

> Burn all SimpleERC20 tokens from all vaults from the list.

##### Declaration

```solidity
  function _burnTokenFromAllVaults(
    contract SimpleERC20 token
  ) internal
```

##### Args:

| Arg     | Type                 | Description                |
| ------- | -------------------- | -------------------------- |
| `token` | contract SimpleERC20 | SimpleERC20 token address. |

#### `_stringsEqual`

📋 &nbsp;&nbsp;
Checks strings for equality.

> Checks strings for equality.

##### Declaration

```solidity
  function _stringsEqual(
    string s1,
    string s2
  ) internal returns (bool)
```

##### Args:

| Arg  | Type   | Description    |
| ---- | ------ | -------------- |
| `s1` | string | First string.  |
| `s2` | string | Second string. |

##### Returns:

| Type   | Description      |
| ------ | ---------------- |
| `bool` | If s1 equals s2. |
