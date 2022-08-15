## IYellowStorage





### Contents
<!-- START doctoc -->
<!-- END doctoc -->



### Functions

#### `getAddress`

📋   &nbsp;&nbsp;
Get address stored at `_key` at addressStorage.

> Get address stored at `_key` at addressStorage.


##### Declaration
```solidity
  function getAddress(
    bytes32 _key
  ) external returns (address)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`address` | stored at `_key` at addressStorage.
#### `getUint`

📋   &nbsp;&nbsp;
Get uint stored at `_key` at uintStorage.

> Get uint stored at `_key` at uintStorage.


##### Declaration
```solidity
  function getUint(
    bytes32 _key
  ) external returns (uint256)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`uint` | stored at `_key` at uintStorage.
#### `getString`

📋   &nbsp;&nbsp;
Get string stored at `_key` at stringStorage.

> Get string stored at `_key` at stringStorage.


##### Declaration
```solidity
  function getString(
    bytes32 _key
  ) external returns (string)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`string` | stored at `_key` at stringStorage.
#### `getBytes`

📋   &nbsp;&nbsp;
Get bytes stored at `_key` at bytesStorage.

> Get bytes stored at `_key` at bytesStorage.


##### Declaration
```solidity
  function getBytes(
    bytes32 _key
  ) external returns (bytes)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`bytes` | stored at `_key` at bytesStorage.
#### `getBool`

📋   &nbsp;&nbsp;
Get bool stored at `_key` at boolStorage.

> Get bool stored at `_key` at boolStorage.


##### Declaration
```solidity
  function getBool(
    bytes32 _key
  ) external returns (bool)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`bool` | stored at `_key` at boolStorage.
#### `getInt`

📋   &nbsp;&nbsp;
Get int stored at `_key` at intStorage.

> Get int stored at `_key` at intStorage.


##### Declaration
```solidity
  function getInt(
    bytes32 _key
  ) external returns (int256)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`int` | stored at `_key` at intStorage.
#### `getBytes32`

📋   &nbsp;&nbsp;
Get bytes32 stored at `_key` at bytes32Storage.

> Get bytes32 stored at `_key` at bytes32Storage.


##### Declaration
```solidity
  function getBytes32(
    bytes32 _key
  ) external returns (bytes32)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to query a value for.

##### Returns:
| Type | Description |
| --- | --- |
|`bytes32` | stored at `_key` at bytes32Storage.
#### `setAddress`

📋   &nbsp;&nbsp;
Set address stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setAddress(
    bytes32 _key,
    address _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | address | A value to be stored at `_key`.

#### `setUint`

📋   &nbsp;&nbsp;
Set uint stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setUint(
    bytes32 _key,
    uint256 _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | uint256 | A value to be stored at `_key`.

#### `setString`

📋   &nbsp;&nbsp;
Set string stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setString(
    bytes32 _key,
    string _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | string | A value to be stored at `_key`.

#### `setBytes`

📋   &nbsp;&nbsp;
Set bytes stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setBytes(
    bytes32 _key,
    bytes _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | bytes | A value to be stored at `_key`.

#### `setBool`

📋   &nbsp;&nbsp;
Set bool stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setBool(
    bytes32 _key,
    bool _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | bool | A value to be stored at `_key`.

#### `setInt`

📋   &nbsp;&nbsp;
Set int stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setInt(
    bytes32 _key,
    int256 _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | int256 | A value to be stored at `_key`.

#### `setBytes32`

📋   &nbsp;&nbsp;
Set bytes32 stored at `_key` to a `_value`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function setBytes32(
    bytes32 _key,
    bytes32 _value
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to store a `_value` at.
|`_value` | bytes32 | A value to be stored at `_key`.

#### `deleteAddress`

📋   &nbsp;&nbsp;
Delete an address stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteAddress(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.

#### `deleteUint`

📋   &nbsp;&nbsp;
Delete an uint stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteUint(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.

#### `deleteString`

📋   &nbsp;&nbsp;
Delete string stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteString(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.

#### `deleteBytes`

📋   &nbsp;&nbsp;
Delete bytes stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteBytes(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.

#### `deleteBool`

📋   &nbsp;&nbsp;
Delete bool stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteBool(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.

#### `deleteInt`

📋   &nbsp;&nbsp;
Delete int stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteInt(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.

#### `deleteBytes32`

📋   &nbsp;&nbsp;
Delete bytes32 stored at a `_key`.

> Require MANAGER_ROLE to invoke.


##### Declaration
```solidity
  function deleteBytes32(
    bytes32 _key
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`_key` | bytes32 | A key to remove a value at.



