# VaultImplV1


> Implementation for the Proxy. Version 1.0.

## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Globals](#globals)
- [Functions](#functions)
  - [`_requireSigNotUsed`](#_requiresignotused)
  - [`_requireValidSignature`](#_requirevalidsignature)
  - [`_requireValidAddress`](#_requirevalidaddress)
  - [`_checkPayload`](#_checkpayload)
  - [`_useSignature`](#_usesignature)
  - [`getChainId`](#getchainid)
  - [`setup`](#setup)
  - [`getLastId`](#getlastid)
  - [`getBrokerAddress`](#getbrokeraddress)
  - [`setBrokerAddress`](#setbrokeraddress)
  - [`getCoSignerAddress`](#getcosigneraddress)
  - [`setCoSignerAddress`](#setcosigneraddress)
  - [`deposit`](#deposit)
  - [`withdraw`](#withdraw)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Globals

| Var | Type | Description |
| --- | --- | --- |
| DEPOSIT_ACTION | bytes32 |  |
| WITHDRAW_ACTION | bytes32 |  |

## Functions

### `_requireSigNotUsed`

📋   &nbsp;&nbsp;
Revert if hash of supplied signature was already used by the issuer.

> Revert if hash of supplied signature was already used by the issuer.


#### Declaration

```solidity
  function _requireSigNotUsed(
    address issuer,
    bytes signature
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`issuer` | address | Account using supplied signature.
|
|`signature` | bytes | Signature used as identifier for action requested from vault.|

### `_requireValidSignature`

📋   &nbsp;&nbsp;
Check supplied signature to be indeed signed by claimed signer.

> Check supplied signature to be indeed signed by claimed signer.


#### Declaration

```solidity
  function _requireValidSignature(
    address signer,
    bytes encodedData,
    bytes signature
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`signer` | address | Signer claimed to have signed the payload.
|
|`encodedData` | bytes | Encoded data, which denotes action to be performed.
|
|`signature` | bytes | Payload signed by claimed signer.|

### `_requireValidAddress`

📋   &nbsp;&nbsp;
No description

#### Declaration

```solidity
  function _requireValidAddress(
  ) internal
```

### `_checkPayload`

📋   &nbsp;&nbsp;
Check that payload data is correct: expire timestamp is due, destination is not zero address, there is no zero allocation amount, implementation address specified is this contract and chain id is indeed this chain's id.

> Check that payload data is correct: expire timestamp is due, destination is not zero address, there is no zero allocation amount, implementation address specified is this contract and chain id is indeed this chain's id.


#### Declaration

```solidity
  function _checkPayload(
    struct IVault.Payload payload
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`payload` | struct IVault.Payload | Payload structure, which denotes action to be performed.|

### `_useSignature`

📋   &nbsp;&nbsp;
Mark the signature as used by the issuer.

> Mark the signature as used by the issuer.


#### Declaration

```solidity
  function _useSignature(
    address issuer,
    bytes signature
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`issuer` | address | User issuer address.
|
|`signature` | bytes | Signature used as identifier for action requested from vault.|

### `getChainId`

📋   &nbsp;&nbsp;
Return chain id.

> Return chain id.


#### Declaration

```solidity
  function getChainId(
  ) internal returns (uint256)
```

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | Chain id.

### `setup`

📋   &nbsp;&nbsp;
The setup function sets addresses of the broker and coSigner.

> Require DEFAULT_ADMIN_ROLE to invoke. NOTE: once addresses are set, there is no way to change them if their private key is lost. In such case, vault implementation contract becomes useless and requires an upgrade.


#### Declaration

```solidity
  function setup(
    address brokerAddress,
    address coSignerAddress
  ) external onlyProxy onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`brokerAddress` | address | Address derived from broker public key.
|
|`coSignerAddress` | address | Address derived from coSigner public key.|

### `getLastId`

📋   &nbsp;&nbsp;
Get last ledger id (deposits and withdrawals id).

> Get last ledger id (deposits and withdrawals id).


#### Declaration

```solidity
  function getLastId(
  ) external onlyProxy returns (uint256)
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | Ledger id.

### `getBrokerAddress`

📋   &nbsp;&nbsp;
Get broker (only public key it is derived from exists) key for this vault.

> Get broker (only public key it is derived from exists) key for this vault.


#### Declaration

```solidity
  function getBrokerAddress(
  ) external onlyProxy returns (address)
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Returns

| Type | Description |
| --- | --- |
|`address` | Broker (only public key it is derived from exists) key.

### `setBrokerAddress`

📋   &nbsp;&nbsp;
Set the address derived from the broker's new public key. Emits `BrokerAddressSet` event.

> Supplied payload must be signed by broker's current public key.


#### Declaration

```solidity
  function setBrokerAddress(
    address address_,
    bytes signature
  ) external onlyProxy
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`address_` | address | New broker address.
|
|`signature` | bytes | New address signed by broker's current public key.|

### `getCoSignerAddress`

📋   &nbsp;&nbsp;
Get coSigner (only public key it is derived from exists) key for this vault.

> Get coSigner (only public key it is derived from exists) key for this vault.


#### Declaration

```solidity
  function getCoSignerAddress(
  ) external onlyProxy returns (address)
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Returns

| Type | Description |
| --- | --- |
|`address` | CoSigner (only public key it is derived from exists) key.

### `setCoSignerAddress`

📋   &nbsp;&nbsp;
Set the address derived from the coSigner's new public key. Emits `CoSignerAddressSet` event.

> Supplied payload must be signed by coSigner's current public key.


#### Declaration

```solidity
  function setCoSignerAddress(
    address address_,
    bytes signature
  ) external onlyProxy
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`address_` | address | New coSigner address.
|
|`signature` | bytes | New address signed by coSigner's current public key.|

### `deposit`

📋   &nbsp;&nbsp;
Deposit assets with given payload from the caller. Emits `Deposited` event.

> Deposit assets with given payload from the caller. Emits `Deposited` event.


#### Declaration

```solidity
  function deposit(
    struct IVault.Payload payload,
    bytes brokerSignature,
    bytes coSignerSignature
  ) external onlyProxy
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`payload` | struct IVault.Payload | Deposit payload.
|
|`brokerSignature` | bytes | Payload signed by the broker.
|
|`coSignerSignature` | bytes | Payload signed by the coSigner.|

### `withdraw`

📋   &nbsp;&nbsp;
Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.

> Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.


#### Declaration

```solidity
  function withdraw(
    struct IVault.Payload payload,
    bytes brokerSignature,
    bytes coSignerSignature
  ) external onlyProxy
```

#### Modifiers

| Modifier |
| --- |
| onlyProxy |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`payload` | struct IVault.Payload | Withdraw payload.
|
|`brokerSignature` | bytes | Payload signed by the Broker.
|
|`coSignerSignature` | bytes | Payload signed by the coSigner.|
