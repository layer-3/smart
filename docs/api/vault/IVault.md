# IVault

IVault is the interface to implement custody.

## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Functions](#functions)
  - [`setup`](#setup)
  - [`getLastId`](#getlastid)
  - [`getBrokerAddress`](#getbrokeraddress)
  - [`setBrokerAddress`](#setbrokeraddress)
  - [`getCoSignerAddress`](#getcosigneraddress)
  - [`setCoSignerAddress`](#setcosigneraddress)
  - [`deposit`](#deposit)
  - [`withdraw`](#withdraw)
- [Events](#events)
  - [`BrokerAddressSet`](#brokeraddressset)
  - [`CoSignerAddressSet`](#cosigneraddressset)
  - [`Deposited`](#deposited)
  - [`Withdrawn`](#withdrawn)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Functions

### `setup`

📋   &nbsp;&nbsp;
The setup function sets addresses of the broker and coSigner.

> Require DEFAULT_ADMIN_ROLE to invoke. NOTE: once addresses are set, there is no way to change them if their private key is lost. In such case, vault implementation contract becomes useless and requires an upgrade.


#### Declaration

```solidity
  function setup(
    address brokerAddress,
    address coSignerAddress
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`brokerAddress` | address | Address derived from broker public key.
|
|`coSignerAddress` | address | Address derived from coSigner public key.|

### `getLastId`

📋   &nbsp;&nbsp;
Get last ledger id (deposits and withdrawals id).


#### Declaration

```solidity
  function getLastId(
  ) external returns (uint256)
```

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
  ) external returns (address)
```

#### Returns

| Type | Description |
| --- | --- |
|`address` | Broker address for this vault.

### `setBrokerAddress`

📋   &nbsp;&nbsp;
Set the address derived from the broker's new public key. Emits `BrokerAddressSet` event.

> Supplied payload must be signed by broker's current public key.


#### Declaration

```solidity
  function setBrokerAddress(
    address address_,
    bytes signature
  ) external
```

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
  ) external returns (address)
```

#### Returns

| Type | Description |
| --- | --- |
|`address` | CoSigner address for this vault.

### `setCoSignerAddress`

📋   &nbsp;&nbsp;
Set the address derived from the coSigner's new public key. Emits `CoSignerAddressSet` event.

> Supplied payload must be signed by coSigner's current public key.


#### Declaration

```solidity
  function setCoSignerAddress(
    address address_,
    bytes signature
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`address_` | address | New coSigner address.
|
|`signature` | bytes | New address signed by coSigner's current public key.|

### `deposit`

📋   &nbsp;&nbsp;
Deposit assets with given payload from the caller. Emits `Deposited` event.


#### Declaration

```solidity
  function deposit(
    struct IVault.Payload payload,
    bytes brokerSignature,
    bytes otpSignature
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`payload` | struct IVault.Payload | Deposit payload.
|
|`brokerSignature` | bytes | Payload signed by the Broker.
|
|`otpSignature` | bytes | Payload signed by the CoSigner service.|

### `withdraw`

📋   &nbsp;&nbsp;
Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.


#### Declaration

```solidity
  function withdraw(
    struct IVault.Payload payload,
    bytes brokerSignature,
    bytes otpSignature
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`payload` | struct IVault.Payload | Withdraw payload.
|
|`brokerSignature` | bytes | Payload signed by the Broker.
|
|`otpSignature` | bytes | Payload signed by the CoSigner service.|

## Events

### `BrokerAddressSet`

📋   &nbsp;&nbsp;
Address derived from broker's new public key is set.


#### Params

| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`newBrokerAddress` | address | :white_check_mark: | Updated Broker address.

### `CoSignerAddressSet`

📋   &nbsp;&nbsp;
Address derived from CoSigner's new public key is set.


#### Params

| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`newCoSignerAddress` | address | :white_check_mark: | Updated CoSigner address.

### `Deposited`

📋   &nbsp;&nbsp;
Deposited event.


#### Params

| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`id` | uint256 | :white_check_mark: | Ledger id.
|`account` | address | :white_check_mark: | Account address.
|`asset` | address | :white_check_mark: | Asset address deposited.
|`amount` | uint256 |  | Quantity of assets deposited.
|`rid` | bytes32 |  | Request id from broker.

### `Withdrawn`

📋   &nbsp;&nbsp;
Withdrawn event.


#### Params

| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`id` | uint256 | :white_check_mark: | Ledger id.
|`destination` | address | :white_check_mark: | Destination address.
|`asset` | address | :white_check_mark: | Asset address withdrawn.
|`amount` | uint256 |  | Quantity of assets withdrawn.
|`rid` | bytes32 |  | Request id from broker.
