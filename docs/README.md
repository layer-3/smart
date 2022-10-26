<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Custody Overview](#custody-overview)
  - [Introduction](#introduction)
  - [Technologies](#technologies)
  - [Components](#components)
- [YellowClearing overview](#yellowclearing-overview)
  - [Registry logic](#registry-logic)
  - [Interaction](#interaction)
  - [Usage](#usage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Custody Overview

### Introduction

The main utility of custody is safeguarding for cryptocurrency assets. Private keys, which are used to conduct transactions or access crypto holdings, are a complex combination of alphanumerics.

The custody solutions will provide a secure environment by connecting via a verified crypto gateway like MetaMask, then the user's deposit goes to a safe cold-wallet of the opendax platform.

Once the assets are deposited, all transactions are now processed off-chain. Their assets are always secure due to this 2nd layer which is implemented in the custody deposit/withdrawal system.

### Technologies

The main technology behind our custody solution is the smart contract on Ethereum blockchain.

- **Solidity**  
  [Solidity Programming Language](https://soliditylang.org/)  
  Solidity is a statically-typed curly-braces programming language designed for developing smart contracts that run on Ethereum.

  Custody takes advantage of solidity to implement the smart contract to validate and sign contract of deposit from the user’s wallet into opendax decentralize exchange wallet, withdrawal from opendax decentralize exchange wallet into user’s wallet.

- **Hardhat**  
  [Ethereum development environment for professionals](https://hardhat.org/)
  The development tool to run, debug, test, deploy and upgrade smart contract of the custody with Solidity. It helps developers manage and automate the recurring tasks that are inherent to the process of building smart contracts and dApps, as well as easily introducing more functionality around this workflow. This means compiling, running and testing smart contracts at the very core.

  Hardhat comes built-in with Hardhat Network, a local Ethereum network designed for development. Its functionality focuses around Solidity debugging, featuring stack traces, console.log() and explicit error messages when transactions fail.

  Hardhat Runner, the CLI command to interact with Hardhat, is an extensible task runner. It's designed around the concepts of tasks and plugins. Every time you're running Hardhat from the CLI you're running a task. E.g. npx hardhat compile is running the built-in compile task. Tasks can call other tasks, allowing complex workflows to be defined. Users and plugins can override existing tasks, making those workflows customizable and extendable.

- **Abigen**  
  [Documentation and Tutorials for Abigen](https://docs.avax.network/build/tools/abigen/)  
  Compile a solidity contract into Go Bindings and call contracts programatically.

  Finex is the main component of interaction by connecting via go-binding compiled custody smart contract for off-chain trading.

### Components

There are 2 components intract with the custody:

- **Frontdex**  
  Frontdex has funcationallity to connect with user's wallet and provide wallet's information.
  Custody take wallet's information from frondex to make a deposit with signed key.

  Also, The custody need wallet's information to get user balance and deposit history on the opendax platform.

- **Finex**  
  Finex mainly do off-chain trading. So, Finex take user's balance on the platform to make off-chain trade.

  After the trading is complete finex will verify trading transaction and start withdrawal process by signing to the custoday as broker.

  The assets will be withdraw from opendax decentralize exchange wallet to user's wallet at the end.

## YellowClearing overview

### Registry logic

- **ParticipantData**  
  Data stored for each participant inside a registry is defined as follows:

  ```solidity
  enum ParticipantStatus {
    // Participant is not registered or have been removed
    None,
    // Participant is registered but not yet validated
    Pending,
    // Participant is registered but do not have token staked
    Inactive,
    // Participant is registered and have token staked
    Active,
    // Participant is registered but is not allowed to participate
    Suspended,
    // Participant is registered but have migrated to the next implementation
    Migrated
  }

  struct ParticipantData {
    ParticipantStatus status;
    uint64 nonce;
    uint64 registrationTime;
  }
  ```

  Where `status` is a participant status, which Yellow Network allowance is build upon; `nonce` - a number of last mutative participant interaction with the registry (i.e. invoked `registerParticipant` or `migrateParticipant` for a given participant); `registrationTime` - timestamp in seconds at the moment of participant registration.

### Interaction

Registry logic has a defined set of interaction functions, most of which are straightforward to use. However, `registerParticipant` and `migrateParticipant` require to be described. Both of these functions accept two arguments: `participant` and `signature`.
`participant` is an address of participant to interact with, whereas `signature` is an `IdentityPayload` signed by `participant`.

IdentityPayload is a special structure acting as a proof of account for interaction with `YellowClearing` and is defined as follows:

```solidity
struct IdentityPayload {
  YellowClearingBase YellowClearing;
  address participant;
  uint64 nonce;
}
```

Identity payload can be easily retrieved by invoking `getIdentityPayload(address participant)` function of the `YellowClearing` smart contract. Nevertheless, be aware that returned structure is somewhat different:

Typescript:

```typescript
export interface IdentityPayloadBN {
  YellowClearing: string;
  participant: string;
  nonce: BigNumber; // BigNumber instead of number
}
```

### Usage

- **Frontdex**  
  Frontdex can get already signed `IdentityPayload` by using `getAndSignIdentityPayload` function located at `/src/identityPayload.ts`.

  For example, overall Frontdex participant registration code should look like this:

  ```typescript
  const YellowClearing = new ethers.Contract(registryAddress, YellowClearingV1Artifact.abi, signer);

  const registerParams = await getAndSignIdenityPayload(YellowClearing, signer);

  const registerTx = await YellowClearing.registerParticipant(...registerParams);

  await registerTx.wait();
  ```

- **Finex**  
  To get `IdentityPayload`, Finex can invoke `getIdentityPayload(address participant)` function on a `YellowClearing` smart contract, although keep in mind that structure returned from this function need to be modified before further participant signing: `nonce` field should be cast from `BigNumber` to `uint256` (or any other `uint` type).
