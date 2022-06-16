## Yellow





### Contents
<!-- START doctoc -->
<!-- END doctoc -->



### Functions

#### `init`

📋   &nbsp;&nbsp;
Initialize the contract and the owner address permissions.
- Set the owner as multi-signature account from Gnosis Safe
- Set the total supply to 10 billion tokens with 18 decimal places for a total of 10**27 units.
- grant DEFAULT_ADMIN_ROLE to owner.
- grant MINTER_ROLE to owner.
- grant PAUSER_ROLE to owner.


##### Declaration
```solidity
  function init(
  ) public initializer
```

##### Modifiers:
| Modifier |
| --- |
| initializer |



#### `_beforeTokenTransfer`

📋   &nbsp;&nbsp;
Requirements:
- the contract must not be paused.

> For explicit interface definition.

##### Declaration
```solidity
  function _beforeTokenTransfer(
  ) internal
```




#### `mint`

📋   &nbsp;&nbsp;
Creates `amount` new tokens for `to`.
Requirements:
- the caller must have the `MINTER_ROLE`.
- the contract owner has `MINTER_ROLE` by default.

> For explicit interface definition.


##### Declaration
```solidity
  function mint(
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
|`to` | address | Account address to create tokens to
|`amount` | uint256 | Amount of tokens to create

#### `pause`

📋   &nbsp;&nbsp;
Pauses all token transfers.
Requirements:
- the caller must have the `PAUSER_ROLE`.
- the contract owner has `PAUSER_ROLE` by default.

> For explicit interface definition.

##### Declaration
```solidity
  function pause(
  ) public onlyRole
```

##### Modifiers:
| Modifier |
| --- |
| onlyRole |



#### `burn`

📋   &nbsp;&nbsp;
Removes `amount` new tokens from caller.

> For explicit interface definition.


##### Declaration
```solidity
  function burn(
    uint256 amount
  ) public
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amount` | uint256 | Amount of tokens to remove

#### `_mint`

📋   &nbsp;&nbsp;
No description
> For explicit interface definition.

##### Declaration
```solidity
  function _mint(
  ) internal
```




#### `_pause`

📋   &nbsp;&nbsp;
No description
> For explicit interface definition.

##### Declaration
```solidity
  function _pause(
  ) internal whenNotPaused
```

##### Modifiers:
| Modifier |
| --- |
| whenNotPaused |



#### `_burn`

📋   &nbsp;&nbsp;
No description
> For explicit interface definition.

##### Declaration
```solidity
  function _burn(
  ) internal
```






