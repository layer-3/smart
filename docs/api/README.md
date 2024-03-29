# Autogenerated documentation

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Integration](#integration)
  - [VaultProxy](#vaultproxy)
  - [YellowClearing](#yellowclearing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Integration

### VaultProxy

`VaultProxy` is a custody smart contract for brokerages.

Each broker should deploy and setup their vault for it to work correctly.

See more in the [`VaultProxy` documentation](./vault/VaultProxy.md).

### YellowClearing

`YellowClearing` is an all-in-one contract, which contains all the logic of Yellow Network, which can be devided in separate categories.

#### Registry

Registry is responsible for storing information about participants in the Network.

Before entering the Network, each participant should register themselves in the Registry.

See more in the [`YellowClearing` documentation](./clearing/YellowClearingBase.md).
