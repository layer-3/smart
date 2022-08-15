## SimpleERC20


SimpleERC20 is an ERC20 token modified for usage in OpenDAX v4 testing.


### Contents
<!-- START doctoc -->
<!-- END doctoc -->

### Globals


| Var | Type | Description |
| --- | --- | --- |
| MINTER_ROLE | bytes32 |  |
| BURNER_ROLE | bytes32 |  |


### Functions

#### `constructor`

📋   &nbsp;&nbsp;
Grant default admin, minter and burner roles to msg.sender; specify decimals token representation.

> Grant default admin, minter and burner roles to msg.sender; specify token decimals representation.


##### Declaration
```solidity
  function constructor(
    string name_,
    string symbol_,
    uint8 decimals_
  ) public ERC20
```

##### Modifiers:
| Modifier |
| --- |
| ERC20 |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`name_` | string | Name of the token.
|`symbol_` | string | Symbol of the token.
|`decimals_` | uint8 | Token decimal representation override.

#### `decimals`

📋   &nbsp;&nbsp;
ERC20 decimals() override, providing ability to change decimal representation of the token.

> ERC20 decimals() override, providing ability to change decimal representation of the token.


##### Declaration
```solidity
  function decimals(
  ) public returns (uint8)
```



##### Returns:
| Type | Description |
| --- | --- |
|`uint8` | Overriden token decimal representation.
#### `mintTo`

📋   &nbsp;&nbsp;
Public _mint implementation.

> MINTER_ROLE rights required.


##### Declaration
```solidity
  function mintTo(
    address to,
    uint256 amount
  ) public onlyRole
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`to` | address | Address to mint tokens to.
|`amount` | uint256 | Amount of tokens to mint to.

#### `burnFrom`

📋   &nbsp;&nbsp;
Public _burn implementation.

> BURNER_ROLE rights required.


##### Declaration
```solidity
  function burnFrom(
    address from,
    uint256 amount
  ) public onlyRole
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |

##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`from` | address | Address to burn tokens from.
|`amount` | uint256 | Amount of tokens to burn.



