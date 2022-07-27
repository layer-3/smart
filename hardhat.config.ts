import * as dotenv from 'dotenv';
import {HardhatUserConfig, task} from 'hardhat/config';
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

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        // This configuration is defined to support nitro-protocol contracts which use solidity 0.7.4.
        version: '0.7.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      // This configuration is a workaround for a nitro-protocol example contract which doesn't compile with the optimizer on.
      'contracts/nitro-protocol/examples/EmbeddedApplication.sol': {
        version: '0.7.4',
        settings: {
          optimizer: {enabled: false},
        },
      },
    },
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
    hardhat: {
      accounts: {
        mnemonic: 'blue yellow soon open speed web then enable rich work success matrix',
      },
    },
    mainnet: {
      url: process.env.MAINNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    bsc: {
      url: process.env.BSC_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    avalanche: {
      url: process.env.AVALANCHE_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    avalancheFujiTestnet: {
      url: process.env.AVALANCHE_FUJI_TESTNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    generic: {
      url: process.env.GENERIC_URL || '',
      chainId: parseInt(process.env.GENERIC_CHAIN_ID || '0'),
      gasPrice: process.env.GENERIC_GAS_PRICE ? parseInt(process.env.GENERIC_GAS_PRICE) : 'auto',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ganache: {
      url: process.env.GANACHE_URL || '',
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
      // binance smart chain
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_TESTNET_API_KEY,
      // huobi eco chain
      heco: process.env.HECOINFO_API_KEY,
      hecoTestnet: process.env.HECOINFO_TESTNET_API_KEY,
      // fantom mainnet
      opera: process.env.FTMSCAN_API_KEY,
      ftmTestnet: process.env.FTMSCAN_TESTNET_API_KEY,
      // optimism
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
      optimisticKovan: process.env.OPTIMISTIC_ETHERSCAN_KOVAN_API_KEY,
      // polygon
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_MUMBAI_API_KEY,
      // arbitrum
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumTestnet: process.env.ARBISCAN_TESTNET_API_KEY,
      // avalanche
      avalanche: process.env.SNOWTRACE_API_KEY,
      avalancheFujiTestnet: process.env.SNOWTRACE_TESTNET_API_KEY,
      // moonbeam
      moonbeam: process.env.MOONBEAM_MOONSCAN_API_KEY,
      moonriver: process.env.MOONRIVER_MOONSCAN_API_KEY,
      moonbaseAlpha: process.env.MOONBEAM_MOONSCAN_TESTNET_API_KEY,
      // harmony
      harmony: process.env.HARMONY_API_KEY,
      harmonyTest: process.env.HARMONY_TESTNET_API_KEY,
      // xdai and sokol don't need an API key, but you still need
      // to specify one; any string placeholder will work
      xdai: 'api-key',
      sokol: 'api-key',
      aurora: 'api-key',
      auroraTestnet: 'api-key',
    }
  }
};

export default config;
