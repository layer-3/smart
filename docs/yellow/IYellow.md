## IYellow





### Contents
<!-- START doctoc -->
<!-- END doctoc -->



### Functions

#### `mint`

📋   &nbsp;&nbsp;
Create `amount` tokens and assigns them to `account`, increasing the total supply.

> Require DEFAULT_ADMIN_ROLE to invoke. Require `account` not to be zero address.


##### Declaration
```solidity
  function mint(
    address account,
    uint256 amount
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`account` | address | Address to create tokens to.
|`amount` | uint256 | Amount of tokens to create.

#### `burn`

📋   &nbsp;&nbsp;
Destroy `amount` tokens from `account`, reducing the total supply.

> Require DEFAULT_ADMIN_ROLE to invoke. Require `account` not to be zero address. Require `account` to have at least `amount` tokens.


##### Declaration
```solidity
  function burn(
    address account,
    uint256 amount
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`account` | address | Address to destroy tokens from.
|`amount` | uint256 | Amount of tokens to destroy.

#### `dilute`

📋   &nbsp;&nbsp;
Increase the maxCap and owned token amount by all accounts.

> Require DEFAULT_ADMIN_ROLE to invoke. Require `newCap` to be bigger than maxCap.


##### Declaration
```solidity
  function dilute(
    uint256 newCap
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`newCap` | uint256 | New market cap to set.

#### `lock`

📋   &nbsp;&nbsp;
Lock amount of Yellow tokens for the caller.

> Require sufficient Yellow token balance.


##### Declaration
```solidity
  function lock(
    uint256 amount
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amount` | uint256 | of Yellow tokens to be locked.

#### `unlock`

📋   &nbsp;&nbsp;
Unlock amount of Yellow tokens for the caller.

> Require sufficient amount of Yellow tokens to be locked.


##### Declaration
```solidity
  function unlock(
    uint256 amount
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`amount` | uint256 | of Yellow tokens to be unlocked.

#### `lockedBy`

📋   &nbsp;&nbsp;
Get the amount of Yellow tokens locked by the account supplied.

> Get the amount of Yellow tokens locked by account supplied.


##### Declaration
```solidity
  function lockedBy(
  ) external returns (uint256)
```



##### Returns:
| Type | Description |
| --- | --- |
|`amount` | of tokens locked by the account supplied.
#### `reserveAllocate`

📋   &nbsp;&nbsp;
Allocate `amount` of Yellow tokens to `treasuryType` reserve.

> Require TREASURER_ROLE to invoke. Require supplied amount not to exceed Yellow token cap. Token allocation will happen to the address got from the hash supplied inside _balances mapping of Yellow token.


##### Declaration
```solidity
  function reserveAllocate(
    bytes32 treasuryType,
    uint256 amount
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`treasuryType` | bytes32 | Hash of the uppercase treasury name preceeded by "TREASURY_", e.g. keccak256("TREASURY_COMMUNITY").
|`amount` | uint256 | of Yellow tokens to allocate.

#### `reserveTransfer`

📋   &nbsp;&nbsp;
Transfer `amount` of Yellow tokens from `treasuryType` reserve to the `destination`.

> Require TREASURER_ROLE to invoke. Require supplied amount to be present at "treasury address".


##### Declaration
```solidity
  function reserveTransfer(
    bytes32 treasuryType,
    uint256 amount,
    address destination
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`treasuryType` | bytes32 | Hash of the uppercase treasury name preceeded by "TREASURY_", e.g. keccak256("TREASURY_COMMUNITY").
|`amount` | uint256 | of Yellow tokens to transfer.
|`destination` | address | address.



