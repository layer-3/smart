## IYellowClearing


Defines an interface for YellowClearing contract, which contains all logic related to Yellow Network, except state channels adjudication.


### Contents
<!-- START doctoc -->
<!-- END doctoc -->



### Functions

#### `version`

📋   &nbsp;&nbsp;
Get the currect natspec version of this contract.

> Get the currect natspec version of this contract.


##### Declaration
```solidity
  function version(
  ) external returns (uint8, uint8, uint8)
```



##### Returns:
| Type | Description |
| --- | --- |
|`uint8` | major version part.
|`uint8` | minor version part.
|`uint8` | patch version part.
#### `addVersion`

📋   &nbsp;&nbsp;
Add a natspec version to a list of supported ones.
Require VERSIONER_ROLE to invoke. Require the version not to be present.



##### Declaration
```solidity
  function addVersion(
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`major` | uint8 | version part.
|`minor` | uint8 | version part.
|`patch` | uint8 | version part.

#### `removeVersion`

📋   &nbsp;&nbsp;
Remove a natspec version from a list of supported ones.
Require VERSIONER_ROLE to invoke. Require the version to be present. Removes all stored contracts at that version from the storage.



##### Declaration
```solidity
  function removeVersion(
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`major` | uint8 | version part.
|`minor` | uint8 | version part.
|`patch` | uint8 | version part.

#### `addContract`

📋   &nbsp;&nbsp;
Add a contract to the list of supported ones.

> Require VERSIONER_ROLE to invoke. Require `contractName` not to be present.


##### Declaration
```solidity
  function addContract(
    string contractName
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to add.

#### `removeContract`

📋   &nbsp;&nbsp;
Remove a contract from the list of supported ones.

> Require VERSIONER_ROLE to invoke. Require `contractName` to be present. Removes all stored contract with `contractName` from the storage.


##### Declaration
```solidity
  function removeContract(
    string contractName
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to remove.

#### `addContractAtVersion`

📋   &nbsp;&nbsp;
Add a contract at version to the registry.

> Require VERSIONER_ROLE to invoke. Require `contractName` to be supported. Require a version to be supported. Require `contractName` not to be already supported at a version supplied.


##### Declaration
```solidity
  function addContractAtVersion(
    string contractName,
    address contractAddress,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to add.
|`contractAddress` | address | Address of the contract to add.
|`major` | uint8 | version part.
|`minor` | uint8 | version part.
|`patch` | uint8 | version part.

#### `editContractAtVersion`

📋   &nbsp;&nbsp;
Edit the address of a contract at version in the registry.

> Require VERSIONER_ROLE to invoke. Require `contractName` to be already supported at a version supplied.


##### Declaration
```solidity
  function editContractAtVersion(
    string contractName,
    address changedAddress,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to edit.
|`changedAddress` | address | Changed address of the contract.
|`major` | uint8 | version part.
|`minor` | uint8 | version part.
|`patch` | uint8 | version part.

#### `removeContractAtVersion`

📋   &nbsp;&nbsp;
Remove a contract at version from the registry.

> Require VERSIONER_ROLE to invoke. Require `contractName` to be already supported at a version supplied.


##### Declaration
```solidity
  function removeContractAtVersion(
    string contractName,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to remove.
|`major` | uint8 | version part.
|`minor` | uint8 | version part.
|`patch` | uint8 | version part.

#### `latestVersion`

📋   &nbsp;&nbsp;
Get latest supported version in the registry.

> Require any version to be supported.


##### Declaration
```solidity
  function latestVersion(
  ) external returns (uint8, uint8, uint8)
```



##### Returns:
| Type | Description |
| --- | --- |
|`uint8` | major version part.
|`uint8` | minor version part.
|`uint8` | patch version part.
#### `getAllContractAt`

📋   &nbsp;&nbsp;
Get all contracts at a version specified.

> Require a version to be supported.


##### Declaration
```solidity
  function getAllContractAt(
  ) external returns (struct IYellowClearing.ProtocolContract[])
```



##### Returns:
| Type | Description |
| --- | --- |
|`ProtocolContract` | Array of supported contract names and addresses at a version specified.
#### `getAllLatestContracts`

📋   &nbsp;&nbsp;
Get all contracts at a latest version.

> Require any version to be supported.


##### Declaration
```solidity
  function getAllLatestContracts(
  ) external returns (struct IYellowClearing.ProtocolContract[])
```



##### Returns:
| Type | Description |
| --- | --- |
|`ProtocolContract` | Array of latest supported contract names and addresses.
#### `getContractAt`

📋   &nbsp;&nbsp;
Get address of `contractName` at a version specified.

> Require a version to be suppored. Require `contractName` to be supported. Require `contractName` to be supported at version.


##### Declaration
```solidity
  function getContractAt(
    string contractName,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external returns (struct IYellowClearing.ProtocolContract)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to get address of.
|`major` | uint8 | version part.
|`minor` | uint8 | version part.
|`patch` | uint8 | version part.

##### Returns:
| Type | Description |
| --- | --- |
|`ProtocolContract` | Contract name and address.
#### `getLatestContract`

📋   &nbsp;&nbsp;
Get address of `contractName` at the latest version.

> Require any version to be present. Require `contractName` to be supported at version.


##### Declaration
```solidity
  function getLatestContract(
    string contractName
  ) external returns (struct IYellowClearing.ProtocolContract)
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`contractName` | string | Name of the contract to get address of.

##### Returns:
| Type | Description |
| --- | --- |
|`ProtocolContract` | Contract name and address.
#### `lastSnapshot`

📋   &nbsp;&nbsp;
Get latest snapshot id for the node to fetch only needed data.

> Get latest snapshot id for the node to fetch only needed data.


##### Declaration
```solidity
  function lastSnapshot(
  ) external returns (uint256)
```



##### Returns:
| Type | Description |
| --- | --- |
|`uint256` | Id of the latest snapshot.
#### `fetchAllRegistry`

📋   &nbsp;&nbsp;
Fetch all node registry.

> It is more optimal to fetch only the unseed part of the registry using `fetchRegistry` method.


##### Declaration
```solidity
  function fetchAllRegistry(
  ) external returns (struct IYellowClearing.RegistryChange[])
```



##### Returns:
| Type | Description |
| --- | --- |
|`RegistryChange` | Array of struct describing registry changes.
#### `fetchRegistry`

📋   &nbsp;&nbsp;
Fetch changes to the registry since `startSid`.

> This method is more optimal to use in case a node already possesses a part of the registry.


##### Declaration
```solidity
  function fetchRegistry(
  ) external returns (struct IYellowClearing.RegistryChange[])
```



##### Returns:
| Type | Description |
| --- | --- |
|`RegistryChange` | Array of struct describing registry changes.
#### `createSnapshot`

📋   &nbsp;&nbsp;
Create a pending snapshot to add registry changes to.

> Require REGISTRAR_ROLE to invoke. Require pending snapshot to be empty.

##### Declaration
```solidity
  function createSnapshot(
  ) external
```




#### `addToSnapshot`

📋   &nbsp;&nbsp;
Add a registry change to the pending snapshot.

> Require REGISTRAR_ROLE to invoke.


##### Declaration
```solidity
  function addToSnapshot(
    struct IYellowClearing.RegistryChange registryChange
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`registryChange` | struct IYellowClearing.RegistryChange | A struct describing a change to the registry.

#### `dumpPendingSnapshot`

📋   &nbsp;&nbsp;
Dump all changes from pending snapshot.

> Require REGISTRAR_ROLE to invoke. Require pending snapshot not to be empty.

##### Declaration
```solidity
  function dumpPendingSnapshot(
  ) external
```




#### `finalizeSnapshot`

📋   &nbsp;&nbsp;
Finalize snapshot, add it to the mapping of snapshots, dumps it and increment latest snapshot id. Emits `RegistryUpdated` event with added snapshot id.

> Require REGISTRAR_ROLE to invoke. Require pending shapshot not to be empty.

##### Declaration
```solidity
  function finalizeSnapshot(
  ) external
```




#### `requireStateSupported`

📋   &nbsp;&nbsp;
Encodes application-specific rules for a particular ForceMove-compliant state channel.

> Encodes application-specific rules for a particular ForceMove-compliant state channel.


##### Declaration
```solidity
  function requireStateSupported(
    struct IYellowClearing.FixedPart proof,
    struct IYellowClearing.RecoveredVariablePart[] candidate
  ) external
```


##### Args:
| Arg | Type | Description |
| --- | --- | --- |
|`proof` | struct IYellowClearing.FixedPart | Array of recovered variable parts which constitutes a support proof for the candidate.
|`candidate` | struct IYellowClearing.RecoveredVariablePart[] | Recovered variable part the proof was supplied for.



### Events

#### `RegistryUpdated`

📋   &nbsp;&nbsp;
No description

  


