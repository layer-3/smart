import * as dotenv from 'dotenv';
import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-abi-exporter';
import 'hardhat-deploy';

dotenv.config();

task('accounts', 'Prints the list of accounts', async (_, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  paths: {
    sources: 'contracts',
    deploy: 'hardhat-deploy',
    deployments: 'hardhat-deployments',
  },
  networks: {
    ethereum: {
      url: process.env.ETHEREUM_URL ?? '',
      accounts: ACCOUNTS,
    },
    goerli: {
      url: process.env.GOERLI_URL ?? '',
      accounts: ACCOUNTS,
    },
    polygon: {
      url: process.env.POLYGON_URL ?? '',
      accounts: ACCOUNTS,
    },
    mumbai: {
      url: process.env.MUMBAI_URL ?? '',
      accounts: ACCOUNTS,
    },
    generic: {
      url: process.env.GENERIC_URL ?? '',
      chainId: Number.parseInt(process.env.GENERIC_CHAIN_ID ?? '0'),
      gasPrice: process.env.GENERIC_GAS_PRICE
        ? Number.parseInt(process.env.GENERIC_GAS_PRICE)
        : 'auto',
      accounts: ACCOUNTS,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      polygon: ETHERSCAN_API_KEY,
      polygonMumbai: ETHERSCAN_API_KEY,
    },
  },
};

export default config;
