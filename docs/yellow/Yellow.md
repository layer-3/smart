## Yellow

### Contents

<!-- START doctoc -->
<!-- END doctoc -->

### Globals

| Var         | Type    | Description |
| ----------- | ------- | ----------- |
| BURNER_ROLE | bytes32 |             |

### Functions

#### `init`

📋 &nbsp;&nbsp;
No description

##### Declaration

```solidity
  function init(
  ) public initializer
```

##### Modifiers:

| Modifier    |
| ----------- |
| initializer |

#### `_beforeTokenTransfer`

📋 &nbsp;&nbsp;
No description

> For explicit interface definition
> Requirements:

- the contract must not be paused.

##### Declaration

```solidity
  function _beforeTokenTransfer(
  ) internal
```

#### `mint`

📋 &nbsp;&nbsp;
No description

> Creates `amount` new tokens for `to`.
> Requirements:

- the caller must have the `MINTER_ROLE`.

##### Declaration

```solidity
  function mint(
    address to,
    uint256 amount
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg      | Type    | Description                         |
| -------- | ------- | ----------------------------------- |
| `to`     | address | Account address to create tokens to |
| `amount` | uint256 | Amount of tokens to create          |

#### `burn`

📋 &nbsp;&nbsp;
No description

> Removes `amount` new tokens from caller
> Requirements:

- the caller must have the `BURNER_ROLE`.

##### Declaration

```solidity
  function burn(
    uint256 amount
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg      | Type    | Description                |
| -------- | ------- | -------------------------- |
| `amount` | uint256 | Amount of tokens to remove |

#### `burnFrom`

📋 &nbsp;&nbsp;
No description

> Removes `amount` new tokens for `to`.
> Requirements:

- the caller must have the `MINTER_ROLE`.

##### Declaration

```solidity
  function burnFrom(
    address from,
    uint256 amount
  ) public onlyRole
```

##### Modifiers:

| Modifier |
| -------- |
| onlyRole |

##### Args:

| Arg      | Type    | Description                           |
| -------- | ------- | ------------------------------------- |
| `from`   | address | Account address to remove tokens from |
| `amount` | uint256 | Amount of tokens to remove            |

#### `_mint`

📋 &nbsp;&nbsp;
No description

> For explicit interface definition

##### Declaration

```solidity
  function _mint(
  ) internal
```

#### `_burn`

📋 &nbsp;&nbsp;
No description

> For explicit interface definition

##### Declaration

```solidity
  function _burn(
  ) internal
```
