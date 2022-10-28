# YellowClearingBase

Base contract for Yellow Clearing. Responsible for all operations regarding Yellow Network.

> The actual implementation must derive from YellowClearingBase and can override `_migrateParticipantData` function.

## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Usage](#usage)
- [Globals](#globals)
- [Functions](#functions)
  - [`constructor`](#constructor)
  - [`getNextImplementation`](#getnextimplementation)
  - [`setNextImplementation`](#setnextimplementation)
  - [`hasParticipant`](#hasparticipant)
  - [`requireParticipantNotPresentBackwards`](#requireparticipantnotpresentbackwards)
  - [`requireParticipantNotPresentForwards`](#requireparticipantnotpresentforwards)
  - [`requireParticipantNotPresentRecursive`](#requireparticipantnotpresentrecursive)
  - [`getParticipantData`](#getparticipantdata)
  - [`getIdentityPayload`](#getidentitypayload)
  - [`registerParticipant`](#registerparticipant)
  - [`validateParticipant`](#validateparticipant)
  - [`suspendParticipant`](#suspendparticipant)
  - [`reinstateParticipant`](#reinstateparticipant)
  - [`setParticipantData`](#setparticipantdata)
  - [`migrateParticipant`](#migrateparticipant)
  - [`migrateParticipantData`](#migrateparticipantdata)
  - [`_requireParticipantPresent`](#_requireparticipantpresent)
  - [`_requireParticipantNotPresent`](#_requireparticipantnotpresent)
  - [`_recoverIdentitySigner`](#_recoveridentitysigner)
  - [`_migrateParticipantData`](#_migrateparticipantdata)
- [Events](#events)
  - [`NextImplementationSet`](#nextimplementationset)
  - [`ParticipantRegistered`](#participantregistered)
  - [`ParticipantStatusChanged`](#participantstatuschanged)
  - [`ParticipantDataSet`](#participantdataset)
  - [`ParticipantMigratedFrom`](#participantmigratedfrom)
  - [`ParticipantMigratedTo`](#participantmigratedto)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

test

## Globals

| Var | Type | Description |
| --- | --- | --- |
| REGISTRY_MAINTAINER_ROLE | bytes32 |  |
| REGISTRY_VALIDATOR_ROLE | bytes32 |  |
| AUDITOR_ROLE | bytes32 |  |
| PREVIOUS_IMPLEMENTATION_ROLE | bytes32 |  |
| _participantData | mapping(address => struct YellowClearingBase.ParticipantData) |  |

## Functions

### `constructor`

📋   &nbsp;&nbsp;
Grant DEFAULT_ADMIN_ROLE and REGISTRY_MAINTAINER_ROLE roles to deployer, link previous implementation it supplied.


#### Declaration

```solidity
  function constructor(
  ) internal
```

### `getNextImplementation`

📋   &nbsp;&nbsp;
Get next implementation address if set, zero address if not.

> Get next implementation address if set, zero address if not.


#### Declaration

```solidity
  function getNextImplementation(
  ) external returns (contract YellowClearingBase)
```

#### Returns

| Type | Description |
| --- | --- |
|`YellowClearingBase` | Next implementation address if set, zero address if not.

### `setNextImplementation`

📋   &nbsp;&nbsp;
Set next implementation address. Must not be zero address or self. Emit `NextImplementationSet` event.

> Require REGISTRY_MAINTAINER_ROLE to be invoked. Require next implementation not to be already set. Require supplied next implementation contract to have granted this contract PREVIOUS_IMPLEMENTATION_ROLE.


#### Declaration

```solidity
  function setNextImplementation(
    contract YellowClearingBase nextImplementation
  ) external onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`nextImplementation` | contract YellowClearingBase | Next implementation address.|

### `hasParticipant`

📋   &nbsp;&nbsp;
Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `ParticipantStatus.None`.

> Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `ParticipantStatus.None`.


#### Declaration

```solidity
  function hasParticipant(
  ) public returns (bool)
```

#### Returns

| Type | Description |
| --- | --- |
|`True` | if participant is present, false otherwise.

### `requireParticipantNotPresentBackwards`

📋   &nbsp;&nbsp;
Recursively check that participant is not present in this registry and all previous ones.

> Recursively check that participant is not present in this registry and all previous ones.


#### Declaration

```solidity
  function requireParticipantNotPresentBackwards(
    address participant
  ) public
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to check.|

### `requireParticipantNotPresentForwards`

📋   &nbsp;&nbsp;
Recursively check that participant is not present in this registry and all subsequent ones.

> Recursively check that participant is not present in this registry and all subsequent ones.


#### Declaration

```solidity
  function requireParticipantNotPresentForwards(
    address participant
  ) public
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to check.|

### `requireParticipantNotPresentRecursive`

📋   &nbsp;&nbsp;
Recursively check that participant is not present in this registry and all previous and subsequent ones.

> Recursively check that participant is not present in this registry and all previous and subsequent ones.


#### Declaration

```solidity
  function requireParticipantNotPresentRecursive(
    address participant
  ) public
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to check.|

### `getParticipantData`

📋   &nbsp;&nbsp;
Get participant data stored in the registry. Revert if participant is not present.

> Get participant data stored in the registry. Revert if participant is not present.


#### Declaration

```solidity
  function getParticipantData(
    address participant
  ) external returns (struct YellowClearingBase.ParticipantData)
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to get data about.
|

#### Returns

| Type | Description |
| --- | --- |
|`ParticipantData` | Participant data.

### `getIdentityPayload`

📋   &nbsp;&nbsp;
Return identity payload structure for a supplied participant. Used to ease interaction with this contract.

> Return identity payload structure for a supplied participant. Used to ease interaction with this contract.


#### Declaration

```solidity
  function getIdentityPayload(
    address participant
  ) public returns (struct YellowClearingBase.IdentityPayload)
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to get identity payload for.
|

#### Returns

| Type | Description |
| --- | --- |
|`IdentityPayload` | Identity payload structure for a supplied participant.

### `registerParticipant`

📋   &nbsp;&nbsp;
Register participant by adding it to the registry with Pending status. Emit `ParticipantRegistered` event.

> Participant must not be present in this or any previous or subsequent implementations.


#### Declaration

```solidity
  function registerParticipant(
    address participant,
    bytes signature
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Virtual (no address, only public key exist) address of participant to add.
|
|`signature` | bytes | Participant identity payload signed by this same participant.|

### `validateParticipant`

📋   &nbsp;&nbsp;
Validate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.

> Require REGISTRY_VALIDATOR_ROLE to invoke. Participant must be present with Pending status.


#### Declaration

```solidity
  function validateParticipant(
    address participant
  ) external onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to validate.|

### `suspendParticipant`

📋   &nbsp;&nbsp;
Suspend participant and set their status to Suspended. Emit `ParticipantStatusChanged` event.

> Require AUDITOR_ROLE to invoke. Participant must be present and not migrated


#### Declaration

```solidity
  function suspendParticipant(
    address participant
  ) external onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to suspend.|

### `reinstateParticipant`

📋   &nbsp;&nbsp;
Reinstate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.

> Require AUDITOR_ROLE to invoke. Participant must have been suspended previously.


#### Declaration

```solidity
  function reinstateParticipant(
    address participant
  ) external onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to reinstate.|

### `setParticipantData`

📋   &nbsp;&nbsp;
Set participant data to data supplied. Emit `ParticipantDataChanged` event.

> Require REGISTRY_MAINTAINER_ROLE to invoke. Participant must not have been migrated.


#### Declaration

```solidity
  function setParticipantData(
    address participant,
    struct YellowClearingBase.ParticipantData data
  ) external onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to set data of.
|
|`data` | struct YellowClearingBase.ParticipantData | Data to set.|

### `migrateParticipant`

📋   &nbsp;&nbsp;
Migrate participant to the newest implementation present in upgrades chain. Emit `ParticipantMigratedFrom` and `ParticipantMigratedTo` events.

> NextImplementation must have been set. Participant must not have been migrated.


#### Declaration

```solidity
  function migrateParticipant(
    address participant,
    bytes signature
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to migrate.
|
|`signature` | bytes | Participant identity payload signed by that participant.|

### `migrateParticipantData`

📋   &nbsp;&nbsp;
Recursively migrate participant data to newest implementation in upgrades chain. Emit `ParticipantMigratedTo` event.

> Require PREVIOUS_IMPLEMENTATION_ROLE to invoke.


#### Declaration

```solidity
  function migrateParticipantData(
    address participant,
    struct YellowClearingBase.ParticipantData data
  ) external onlyRole
```

#### Modifiers

| Modifier |
| --- |
| onlyRole |

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to migrate data of.
|
|`data` | struct YellowClearingBase.ParticipantData | Participant data to migrate.|

### `_requireParticipantPresent`

📋   &nbsp;&nbsp;
Require participant it present in this registry.

> Require participant it present in this registry.


#### Declaration

```solidity
  function _requireParticipantPresent(
    address participant
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to check.|

### `_requireParticipantNotPresent`

📋   &nbsp;&nbsp;
Require participant it not present in this registry.

> Require participant it not present in this registry.


#### Declaration

```solidity
  function _requireParticipantNotPresent(
    address participant
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to check.|

### `_recoverIdentitySigner`

📋   &nbsp;&nbsp;
Recover signer of identity payload.

> Recover signer of identity payload.


#### Declaration

```solidity
  function _recoverIdentitySigner(
    struct YellowClearingBase.IdentityPayload identityPayload,
    bytes signature
  ) internal returns (address)
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`identityPayload` | struct YellowClearingBase.IdentityPayload | Identity payload that has been signed.
|
|`signature` | bytes | Signed identity payload.
|

#### Returns

| Type | Description |
| --- | --- |
|`address` | Address of the signer.

### `_migrateParticipantData`

📋   &nbsp;&nbsp;
Internal logic of migrating participant data. Can be overridden to change.

> Internal logic of migrating participant data. Can be overridden to change.


#### Declaration

```solidity
  function _migrateParticipantData(
    address participant,
    struct YellowClearingBase.ParticipantData data
  ) internal
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`participant` | address | Address of participant to migrate data of.
|
|`data` | struct YellowClearingBase.ParticipantData | Participant data to migrate.|

## Events

### `NextImplementationSet`

📋   &nbsp;&nbsp;
No description

### `ParticipantRegistered`

📋   &nbsp;&nbsp;
No description

### `ParticipantStatusChanged`

📋   &nbsp;&nbsp;
No description

### `ParticipantDataSet`

📋   &nbsp;&nbsp;
No description

### `ParticipantMigratedFrom`

📋   &nbsp;&nbsp;
No description

### `ParticipantMigratedTo`

📋   &nbsp;&nbsp;
No description
