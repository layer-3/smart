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
- [Testing](#testing)
- [Other scripts](#other-scripts)

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

#### Use installed `solc` and `abigen`

**Required packages:** `curl`, `tar`, `solc`, `abigen`.

Installed `solc` and `abigen` are used to generate bindings.

```bash
npm run bindings:local
```

> If you need to generate go bindings frequently, we encourage you to install `solc` and `abigen` on your machine.

---

#### Install and use `solc` and `abigen`

**Required packages:** `curl`, `tar`.

`solc` and `abigen` are installed to `/cache` folder, and later used to generate bindings.

```bash
npm run bindings:[linux | macos]
```

---

#### Use locally installed `solc` and `abigen`

**Required packages:** `curl`, `tar`.

**`solc` and `abigen` from previous method are required.** Use locally installed (from previous method) `solc` and `abigen` to generate bindings.

---

#### Run a docker container

**Required packages:** `docker`.

Use this method if you don't want any files added, except for the bindings. Run a docker container, which installs `solc` and `abigen`, generate bindings and copy them to host machine.

> Note: it takes approximately 140 seconds to build container the first time, so be patient.

```bash
npm run bindings:docker
```

## Documentation

Documentation of smart contract API and system architecture is available at [`/docs`](./docs/).

### Back-end and Front-end interactions

BE and FE interactions with smart contracts are described in [`/docs/api`](./docs/api/).

## Testing

Test everyting:

```shell
npx hardhat test
```

Test separate file:

```shell
npx hardhat test test/path.to.file.spec.ts
```

## Other scripts

// TODO:
