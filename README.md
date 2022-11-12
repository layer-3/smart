# Smart Contracts

## Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Getting Started](#getting-started)
- [Deployments](#deployments)
- [Go bindings](#go-bindings)
  - [Install `solc`](#install-solc)
  - [Install `abigen`](#install-abigen)
  - [Generating go bindings](#generating-go-bindings)
- [Documentation](#documentation)
  - [Back-end and Front-end interactions](#back-end-and-front-end-interactions)
- [Scripts](#scripts)
  - [Compile](#compile)
  - [Start local hardhat node](#start-local-hardhat-node)
  - [Deploy](#deploy)
  - [Deploy Yellow Network contracts to local node](#deploy-yellow-network-contracts-to-local-node)
  - [Run scripts](#run-scripts)
  - [Export addresses generated from mnemonics](#export-addresses-generated-from-mnemonics)
  - [Verify deployed contract](#verify-deployed-contract)
  - [Lint](#lint)
  - [Generate documentation](#generate-documentation)
  - [Test](#test)
  - [Test coverage](#test-coverage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting Started

Copy `.env.example` into `.env`.

Update the configuration and install dependencies.

```shell
npm install
```

Don't forget to install and apply workspace VS Code extensions and settings.

## Deployments

Public data about smart contract deployments is available in `/deployments/<network>/<contract-name>.json` files and conform to the following interface:

```typescript
interface Deployment {
  address: Address;
  abi: ABI;
  receipt?: Receipt;
  transactionHash?: string;
  history?: Deployment[];
  numDeployments?: number;
  implementation?: string;
  args: any[];
  linkedData?: any;
  solcInputHash: string;
  metadata: string;
  bytecode: string;
  deployedBytecode: string;
  libraries?: Libraries;
  userdoc: any;
  devdoc: any;
  methodIdentifiers?: any;
  diamondCut?: FacetCut[];
  facets?: Facet[];
  storageLayout: any;
  gasEstimates?: any;
}
```

Moreover, each `/deployments/<network>` folder contains `.chainId` file with the id of a corresponding network. This data alongside with contract abi and bytecode can be useful for external applications.

## Go bindings

In order to interact with smart contracts from golang, go bindings are needed. These are basically all smart contract public fields, structs, events and functions transpiled to golang, which can be invoked from go code and will interact with blockchain right away.

Go bindings are generated with [`abigen`](https://geth.ethereum.org/docs/dapp/abigen) tool. The functionality of resulting bindings depends on the data you supplied to `abigen`.
We encourage you to provide a combined source of data, called 'standart json', which comprises contract abi and bytecode.This will additionaly allow the developer to deploy smart contracts from the back-end.

'standart json' can be obtained with `solc` - solidity compiler.

### Install `solc`

(excerpt from [official Solidity documentation](https://docs.soliditylang.org/en/latest/installing-solidity.html). Other download methods are described there)

---

#### Linux packages

**Latest** Ubuntu stable version is available using the following commands:

```shell
sudo add-apt-repository ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install solc
```

Furthermore, some Linux distributions provide their own packages.

For example, Arch Linux has packages for the latest development version:

```shell
pacman -S solidity
```

There is also a [snap package](https://snapcraft.io/solc), however, it is **currently unmaintained**.
It is installable in all the [supported Linux distros](https://snapcraft.io/docs/core/install). To install the latest stable version of solc:

```shell
sudo snap install solc
```

---

#### MacOS packages

Solidity compiler is also distributed through Homebrew as a build-from-source version. Pre-built bottles are currently not supported.

```shell
brew update
brew upgrade
brew tap ethereum/ethereum
brew install solidity
```

To install the most recent 0.4.x / 0.5.x version of Solidity you can also use brew install solidity@4 and brew install solidity@5, respectively.

If you need a specific version of Solidity you can install a Homebrew formula directly from Github.

View [solidity.rb commits on Github](https://github.com/ethereum/homebrew-ethereum/commits/master/solidity.rb).

Copy the commit hash of the version you want and check it out on your machine.

```shell
git clone <https://github.com/ethereum/homebrew-ethereum.git>
cd homebrew-ethereum
git checkout <your-hash-goes-here>
```

Install it using brew:

```shell
brew unlink solidity
# eg. Install 0.4.8
brew install solidity.rb
```

---

#### Static binaries

Download prebuilt binary file corresponding to your OS at a desirable version from [`solidity/releases`](https://github.com/ethereum/solidity/releases) page.

---

#### Solc-select

`solc-select` is a tool to quickly switch between Solidity compiler versions.

Install with

```shell
pip3 install solc-select
```

More documentation is available on [plugin's GitHub repository](https://github.com/crytic/solc-select).

### Install `abigen`

(excerpt from [official geth installation documentation](https://geth.ethereum.org/docs/install-and-build/installing-geth). Other download methods are described there)
Other download methods are available.

---

#### Linux

> Note: These commands install the core Geth software and the following developer tools: `clef`, `devp2p`, `abigen`, `bootnode`, `evm`, `rlpdump` and `puppeth`. The binaries for each of these tools are saved in `/usr/bin/`.

The easiest way to install Geth on Ubuntu-based distributions is with the built-in launchpad PPAs (Personal Package Archives).
The following command enables the built-in launchpad repository:

```shell
sudo add-apt-repository -y ppa:ethereum/ethereum
```

Then, to install the stable version of go-ethereum:

```shell
sudo apt-get update
sudo apt-get install ethereum
```

Also available on Arch linux from pacman:

```shell
pacman -S geth
```

---

#### MacOS

> Note: These commands install the core Geth software and the following developer tools: `clef`, `devp2p`, `abigen`, `bootnode`, `evm`, `rlpdump` and `puppeth`. The binaries for each of these tools are saved in `/usr/bin/`.

```shell
brew tap ethereum/ethereum
brew install ethereum
```

---

#### Static binaries

Download prebuild binary corresponding to your OS at a desirable version from [official `Download Geth` website](https://geth.ethereum.org/downloads/);

### Generating go bindings

We use `make` to execute scripts to generate go bindings, so make sure it is installed.

---

#### Use globally installed `solc` and `abigen`

**Required packages:** `curl`, `tar`, `solc`, `abigen`.

Run globally installed `solc` and `abigen` on the host machine.

```bash
npm run bindings:local
```

> If you need to generate go bindings frequently, we encourage you to install `solc` and `abigen` on your machine.

---

#### Install and use `solc` and `abigen`

**Required packages:** `curl`, `tar`.

Install `solc` and `abigen` to `./cache` folder, and use them generate bindings.

```bash
npm run bindings:[linux | macos]
```

---

#### Use cached `solc` and `abigen`

**Required packages:** `curl`, `tar`.

**`solc` and `abigen` must be installed to `./cache` folder.** Use `solc` and `abigen` from `./cache` to generate bindings.

```bash
npm run bindings:cache
```

---

#### Run a docker container

**Required packages:** `docker`.

Use this method if you don't want any files added, except for the bindings. Run a docker container, which installs `solc` and `abigen`, generate bindings and copy them to host machine.

> Note: it takes approximately 100 seconds to build container the first time, so be patient.

```bash
npm run bindings:docker
```

## Documentation

Documentation of smart contract API and system architecture is available at [`/docs`](./docs/).

### Back-end and Front-end interactions

BE and FE interactions with smart contracts are described in [`/docs/api`](./docs/api/).

## Scripts

<!-- markdownlint-disable MD033 -->

### Compile

```shell
npx hardhat compile
```

Alongside with generating artifacts (abi + bytecode, stored in `./artifacts`), this script creates typescript types (stored in `./typechain`).

### Start local hardhat node

To start local hardhat node available at `http://127.0.0.1:8545`.
You can connect further hardhat calls to this node by providing `--network localhost` parameter to the commands.

```shell
npm run node:local
```

### Deploy

Smart contracts are deployed via `hardhat-deploy` plugin, deploy scripts are stored in `./deploy` and deployment information is stored to `./deployments` ([see more](#deployments)).

If you want to deploy specific contract(s), you need to specify deploy scripts tag(s) (can be found at the bottom of the script, e.g. `func.tags = ['clearing'];`) via `--tags` flag.
Moreover, you can specify the network you want to deploy contract(s) to via `--network` flag.
List of supported networks is described in `hardhat.config.ts`.

> Note: Some scripts require specific ENV variables to be provided, so make sure you have read the script before running it.

```shell
[script-variables] npx hardhat deploy [--tags <deploy-script-tags,...>] [--network <network>]
```

If you need to deploy a contract without a script present in `./deploy`, you can use generalized deploy script present in `./scripts`:

```shell
[CONTRACT=<name> CONTRACT_ARGS=<args,sep,by,comma>] npx hardat run scripts/deploy-contract.ts [--network <network>]
```

The same applies for upgradability deployments:

```shell
[CONTRACT=<name> CONTRACT_ARGS=<args,sep,by,comma>] npx hardat run scripts/deploy-upgradable-contract.ts [--network <network>]
```

And upgrade with

```shell
[CONTRACT=<name> IMPL_ADDRESS=<new_impl_address>] npx hardat run scripts/upgrade-contract.ts [--network <network>]
```

### Deploy Yellow Network contracts to local node

```shell
npm run YN:local
```

This deploys `YellowClearing`, `VaultImpl` and connected `VaultProxy` to it. Addresses of deployed contracts are exported to `./local-YN-addresses.json`.
Deployers of aforementioned contracts, Broker and CoSigner are respectifully [0:5] local hardhat node addresses.

> Note: Original `VaultProxy` contract requires hardcoded `VaultImpl` address, which is impossible to do by scripts.
> Therefore, this script deploys test version of `VaultProxy` (which accepts `VaultImpl` address as a constructor parameter) and has **different abi and bytecode**.

### Run scripts

Scripts are located in `./scripts` folder and are used to interact with the contracts.

> Note: before running a script make sure you know what ENV variables it expects to be set.

```shell
[ENV=<val>] npx hardhat run scripts/path.to.script.ts [--network <network>]
```

### Export addresses generated from mnemonics

If you set mnemonics in `hardhat.config.ts` or have a mnemonic addresses of which you want to know, run

```shell
[MNEMONIC=<mnemonic>] npm run export-accounts
```

This script generates accounts addresses and private keys to `./hardhat-accounts.json`.

### Verify deployed contract

If you have deployed the contract with the help of `deploy` scripts, some deployments data is saved to `./deployments` ([see more](#deployments)).

This data can be used to verify these contracts:

```shell
npx hardhat etherscan-verify --network <network> [--contract-name <specific-contract-name>]
```

See more with

```shell
npx hardhat help etherscan-verify
```

Nevertheless, if you have deployed the contract with simple scripts (not `hardhat-deploy`) or certain contract deployment information in `./deployments` is lost, you can use

```shell
npx hardhat verify --network <network> <address to verify>
```

See more with

```shell
npx hardhat help verify
```

### Lint

To run linter to see errors use

```shell
npx run lint
```

If you want linter to fix all autofixable errors use

```shell
npx run lint:fix
```

### Generate documentation

You can generate contracts documentation with

```shell
npm run docs
```

This will rewrite docs to `./docs/api` and put table of contents to all other `.md` files.

### Test

Test everything:

```shell
npx hardhat test
```

To test specific file:

```shell
npx hardhat test test/path.to.file.spec.ts
```

### Test coverage

To generate test coverage files use

```shell
npx hardhat coverage
```

This will write contracts test coverate in html page format to `./coverage` folder. Moveover, `./coverage.json` containing all coverage information will be created.

<!-- markdownlint-enable MD033 -->
