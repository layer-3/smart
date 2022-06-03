<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [Custody Overview](#custody-overview)
  - [Introduction](#introduction)
  - [Technologies](#technologies)
  - [Components](#components)

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
  [Ethereum development environment for professionals ](https://hardhat.org/)
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
