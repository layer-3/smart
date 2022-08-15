## IYellow





### Contents
<!-- START doctoc -->
<!-- END doctoc -->



### Functions

#### `mint`

📋   &nbsp;&nbsp;
No description


##### Declaration
```solidity
  function mint(
  ) external
```




#### `burn`

📋   &nbsp;&nbsp;
No description


##### Declaration
```solidity
  function burn(
  ) external
```




#### `dilute`

📋   &nbsp;&nbsp;
No description


##### Declaration
```solidity
  function dilute(
  ) external
```




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



