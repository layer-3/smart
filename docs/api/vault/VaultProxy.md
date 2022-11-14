# VaultProxy

Proxy contract containing all delegate logic and hardcoded start implementation contract address.
For more information see `VaultProxyBase.sol`.

## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Different bytecode](#different-bytecode)
- [Deploy](#deploy)
- [Setup](#setup)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Different bytecode

`VaultProxy` contract contains hardcoded address of the first `VaultImpl`, so that participants (deployers) are not able to change it.
This address differs for each blockchain (as `VaultImpl` contracts do not reside on the same address on those chains), which means that the supplied argument in `VaultProxy.sol` has to be changed for each chain.

Therefore, once generated `VaultProxy` bytecode will not be eligible for every blockchain, and `VaultProxy.sol` needs to be modified and recompiled before every deployment.

## Deploy

Typescript:

```ts
const VaultProxyFactory = new ethers.contractFactory(
  VaultProxyArtifact.abi,
  VaultProxyArtifact.bytecode,
  // signer will be requested to sign and pay for deployment transaction
  signer,
);

const VaultProxy = await VaultProxyFactory.deploy();
await VaultProxy.deployed();
const deployTx = await VaultProxy.deployTransaction.wait();
```

## Setup

For user to be able to deposit funds to and withdraw funds from the vault, `VaultProxy` has to be setup with `broker` and `coSigner` virtual addresses.

Those addresses are virtual because they are not active in the blockchain. The vault will receive orders signed by private keys that those addresses are created from.

To setup the vault, an account with `DEFAULT_ADMIN_ROLE` (deployer by default) has to invoke `setup(address broker, address coSigner)` function.

Typescript:

```ts
// signer will be requested to sign and pay for deployment transaction
const VaultImpl = new ethers.Contract(VaultProxyAddress, VaultImplV1Artifact.abi, signer);
const setupTx = await VaultImpl.setup(brokerAddress, signerAddress);
await setupTx.wait();
```

> NOTE: for `ethers` to enable function autocomplition and to avoid any type errors, we need to signal that there is an abi of `VaultImpl` on `VaultProxyAddress`.
