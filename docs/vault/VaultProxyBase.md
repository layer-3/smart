# VaultProxyBase

Logic for the Proxy, excluding start implementation contract address, which must be hardcoded.
> ProxyBase contract was extracted from the Proxy to allow supplying start implementation address and thus ease testing.

## Contents
<!-- START doctoc -->
<!-- END doctoc -->

## Functions

### `constructor`

📋   &nbsp;&nbsp;
Set the address of the latest version of implementation contract, provided the first implementation contract in the versions chain. Call `initialize` on that address. Grant admin and maintainer role to deployer.

> Recursively retrieve `nextImplementation` address starting with `startImplementation` supplied.

#### Declaration

```solidity
  function constructor(
  ) internal
```

### `getImplementation`

📋   &nbsp;&nbsp;
Retrieve implementation contract.

> May be used by block explorers.


#### Declaration

```solidity
  function getImplementation(
  ) external returns (address)
```

#### Returns

| Type | Description |
| --- | --- |
|`address` | Implementation contract address.

### `_implementation`

📋   &nbsp;&nbsp;
Retrieve implementation contract stored in `_IMPLEMENTATION_SLOT`. Internal method.

> Retrieve implementation contract stored in `_IMPLEMENTATION_SLOT`. Internal method.


#### Declaration

```solidity
  function _implementation(
  ) internal returns (address)
```

#### Returns

| Type | Description |
| --- | --- |
|`address` | Implementation contract address.
