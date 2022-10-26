# VaultImplBase

Base logic for the Implementation.
> The actual Implementation must derive from this contract and override `_initialize` and `_migrate` methods if necessary.

## Contents
<!-- START doctoc -->
<!-- END doctoc -->

## Globals

| Var | Type | Description |
| --- | --- | --- |
| MAINTAINER_ROLE | bytes32 |  |

## Modifiers

### `onlyProxy`

📋   &nbsp;&nbsp;
Check that the execution is being performed through a delegatecall call and that the execution context is
a proxy contract with an implementation (as defined in ERC1967) pointing to self.


#### Declaration
```solidity
  modifier onlyProxy```


### `notDelegated`

📋   &nbsp;&nbsp;
Check that the execution is not being performed through a delegate call. This allows a function to be
callable on the implementing contract but not through proxies.


#### Declaration
```solidity
  modifier notDelegated```


### `onlyMaintainer`

📋   &nbsp;&nbsp;
Check that the caller has MAINTAINER_ROLE.

> Role differs depending on the caller. If called via Proxy, then Proxy's storage is checked.
If called directly, this contract's storage is checked. This logic allows to have a different Proxy and Implementation roles.

#### Declaration
```solidity
  modifier onlyMaintainer```


## Functions

### `constructor`

📋   &nbsp;&nbsp;
Set the Implementation deployer as an Admin and Maintainer.
No dev description

#### Declaration

```solidity
  function constructor(
  ) internal```


### `_setupDeployerRoles`

📋   &nbsp;&nbsp;
Grant DEFAULT_ADMIN_ROLE and MAINTAINER_ROLE to the caller. Internal method.

> Grant DEFAULT_ADMIN_ROLE and MAINTAINER_ROLE to the caller. Internal method.

#### Declaration

```solidity
  function _setupDeployerRoles(
  ) internal```


### `getNextImplementation`

📋   &nbsp;&nbsp;
Return next implementation contract address or zero address if not set yet.
NextImplementation points to the next implementation contract in a chain of contracts to allow upgrading.

> Must not be a delegated call.


#### Declaration

```solidity
  function getNextImplementation(
  ) external notDelegated returns (contract VaultImplBase)```


#### Modifiers

| Modifier |
| --- |
| notDelegated |

#### Returns

| Type | Description |
| --- | --- |
|`VaultImplBase` | Next implementation contract address or zero address if not set yet.### `setNextImplementation`

📋   &nbsp;&nbsp;
Set next implementation contract address if not set yet.
NextImplementation points to the next implementation contract in a chain of contracts to allow upgrading.

> Must not be a delegated call. Require caller to be Implementation Maintainer. Must not be zero address or self address.
Emits `NextImplementationSet` event.


#### Declaration

```solidity
  function setNextImplementation(
    contract VaultImplBase nextImplementation
  ) external notDelegated onlyMaintainer```


#### Modifiers

| Modifier |
| --- |
| notDelegated |
| onlyMaintainer |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`nextImplementation` | contract VaultImplBase | Next implementation contract address.### `proxiableUUID`

📋   &nbsp;&nbsp;
No description
> Implementation of the ERC1822 function. This returns the storage slot used by the
implementation. It is used to validate the implementation's compatibility when performing an upgrade.

#### Declaration

```solidity
  function proxiableUUID(
  ) external notDelegated returns (bytes32)```


#### Modifiers

| Modifier |
| --- |
| notDelegated |

### `_initialize`

📋   &nbsp;&nbsp;
Override this function for Implementation to initialize any storage variables. Use instead of constructor.

> Can only be called by Proxy.

#### Declaration

```solidity
  function _initialize(
  ) internal onlyProxy```


#### Modifiers

| Modifier |
| --- |
| onlyProxy |

### `initialize`

📋   &nbsp;&nbsp;
Call `_initialize_ defined by the Implementation to initialize any storage variables.

> Can only be called by Proxy.

#### Declaration

```solidity
  function initialize(
  ) external onlyProxy```


#### Modifiers

| Modifier |
| --- |
| onlyProxy |

### `_migrate`

📋   &nbsp;&nbsp;
Override this function for Implementation to migrate any storage variables between different implementation versions if needed.

> Can only be called by Proxy.

#### Declaration

```solidity
  function _migrate(
  ) internal onlyProxy```


#### Modifiers

| Modifier |
| --- |
| onlyProxy |

### `applyUpgrade`

📋   &nbsp;&nbsp;
Call `_migrate` defined by the Implementation to migrate any storage variables. Call `upgrade` function on itself to ensure the this contract is the latest version.

> Can only be called by Proxy.

#### Declaration

```solidity
  function applyUpgrade(
  ) external onlyProxy```


#### Modifiers

| Modifier |
| --- |
| onlyProxy |

### `upgrade`

📋   &nbsp;&nbsp;
Perform an upgrade from the current implementation contract to a next one specified in a current Implementation. Also calls `applyUpgrade` on a next implementation.

> Require called to be Proxy Maintainer. Can only be called by Proxy.

#### Declaration

```solidity
  function upgrade(
  ) public onlyMaintainer onlyProxy```


#### Modifiers

| Modifier |
| --- |
| onlyMaintainer |
| onlyProxy |


## Events

### `NextImplementationSet`

📋   &nbsp;&nbsp;
No description
> Indicates that a next implementation address was set.
#### Params

| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`nextImplementation` | contract VaultImplBase | :white_check_mark: | Address of a next implementation that was set.