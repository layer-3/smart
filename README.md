# Smart Contracts

## Getting Started

Copy `.env.example` into `.env`.

Update the configuration and install dependencies.

```shell
npm install
```

## Testing

Test everyting:

```shell
npx hardhat test
```

Test separate file:

```shell
npx hardhat test test/path.to.file.spec.ts
```

## Custody

### Generate IVault

```sh
make custody
```

### Deploy Simple Vault

```shell
BROKER_ADDRESS=0x.. npx hardhat run scripts/custody/deploy-simple-vault.ts [--network <network>]
```

### Upgrade Simple Vault

```shell
CONTRACT_FACTORY=SimpleVault TARGET_ADDRESS=0x.. npx hardhat run scripts/upgrade-contract.ts [--network <network>]
```

### Deploy ERC20 Test Token

```shell
npx hardhat run scripts/custody/deploy-test-token.ts [--network <network>]
```

### Mint ERC20 Test Token

```shell
TOKEN_ADDRESS=0x.. MINT_TO=0x.. MINT_AMOUNT=10 npx hardhat run scripts/custody/mint-test-token.ts [--network <network>]
```

## Custody Factory

### Deploy Factory and add SimpleERC20

Deploy and adds to Factory SimpleERC20 defined in `data/erc20-tokens.json`.

```shell
[IN=path/to/input.json] [LOGGING=true/false] [OUT=path/to/output.json] npx hardhat run scripts/custody-factory/deploy-factory-erc20.ts [--network <network>]
```

## Vesting

### Deploy Vesting

```shell
CONTRACT_ARGS=token,start,period,cliff,claiming_interval npx hardhat run scripts/vesting/deploy-vesting.ts [--network <network>]
```

## Yellow


### Deploy on multiple networks with contract verification

```shell
cp .env.example .env
# complete .env file information
PRIVATE_KEY=0x... NETWORKS="mainnet bsc polygon avalanche" ./scripts/deploy-yellow-token.sh
```

### Deploy Yellow

```shell
CONTRACT_ARGS=name,symbol,owner,total_supply npx hardhat run scripts/deploy-upgradable-contract.ts [--network <network>]
```

### Grant/revoke burner

```shell
YELLOW_ADDRESS=0x... ADMIN_PRIVATE_KEY=0x... ACCOUNT=0x... npx hardhat run scripts/yellow/grant(revoke)-burner.ts [--network <network>]
```

## General scripts

```shell
# Deploy Simple Smart Contract
PRIVATE_KEY=0x.. CONTRACT_FACTORY=Yellow CONTRACT_ARGS=Yellow,YELLOW,0x..,10000000000000000000000000000 npx hardhat run scripts/deploy-contract.ts [--network <network>]

# Deploy Upgradable Smart Contract
PRIVATE_KEY=0x.. CONTRACT_FACTORY=Yellow CONTRACT_ARGS=Yellow,YELLOW,0x3bAFF670839d53E6e726B8B6193510E064C9ab7b,10000000000000000000000000000 npx hardhat run scripts/deploy-upgradable-contract.ts [--network <network>]

# Upgrade Smart Contract
PRIVATE_KEY=0x.. CONTRACT_FACTORY=Yellow CONTRACT_ADDRESS=0x.. npx hardhat run scripts/upgrade-smart-contract.ts [--network <network>]
```

## Get current nonce

Sometimes the deployment can get stuck due to previously pending transactions. You can check the currently mined tx nonce and pending tx nonce with a script.

```shell
ADDRESS=0x.. npx hardhat run scripts/get-nonce.ts [--network <network>]
```

## Verify

Contract verification makes source code available on Explorer (e.g. Etherscan), leading to the user being able to interact directly with the contract in Explorer.

```shell
npx hardhat verify [--network <network>] CONTRACT_ADDRESS
```

## Test deposit & withdraw in local node

You can test with hardhat node by running

```shell
npx hardhat node
npx hardhat run scripts/deploy-local.ts --network localhost # deploy smart contracts
```

To test with deposit and withdraw, simply provide the data interacted with Finex web service or custom values as needed.

```shell
# Using data from Finex request and response
PVT_KEY=0x.. CONTRACT_ADDRESS=0x.. FINEX_REQUEST='[1,1,"deposit", ..]' FINEX_RESPONSE='[2,1,"deposit", ..]]' npx hardhat run scripts/deposit-withdraw.ts --network localhost
PVT_KEY=0x.. CONTRACT_ADDRESS=0x.. FINEX_REQUEST='[1,1,"withdraw", ..]' FINEX_RESPONSE='[2,1,"withdraw", ..]]' npx hardhat run scripts/deposit-withdraw.ts --network localhost

# Custom values
PVT_KEY=0x.. CONTRACT_ADDRESS=0x.. ACTION=deposit PAYLOAD='{"assetAddress": "0x..", "assetAmount: "10", "rid": "0x...", "expire": "100000"}' SIGNATURE=0x.. npx hardhat run scripts/deposit-withdraw.ts --network localhost
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
