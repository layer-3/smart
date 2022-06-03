import fs from 'fs';

import {ethers, upgrades} from 'hardhat';

import {deployAndAddToken} from '../../src/FactoryHelpers';
import {SimpleVaultFactory} from '../../typechain';

/**
 * @notice This script deploys SimpleVaultFactory, deploys and adds tokens to it specified in json file.
 * Run script from custody folder with `[variables] npx hardhat run scripts/deploy-factory-erc20.ts (--network <network>)`
 * NOTE: relative path is specified from hardhat project root, not from scripts folder.
 * 3 local variables can be specified for the script:
 * - IN - json file to read token data from. './data/erc20-tokens.json' by default
 * - LOG - LOGGING deployed addresses to console. 'false' by default.
 * - OUT - file to write addresses data to. './data/factory-tokens-addresses.json' by default.
 * To deploy to non-local blockchain, network must be defined in `hardhat.config.ts` and then specified in --network param to this script.
 * For network to connect to real blockchain, an .env file must be populated with URLs and private keys for desired blockchains, as showed in `.env.example`.
 */

interface IDeployedToken {
  address: string;
  asset: string;
  tokenTicker: string;
  initialMint: number;
}

interface IDeployedFactoryTokens {
  SimpleVaultFactory: string;
  deployedTokens: IDeployedToken[];
}

async function main() {
  const IN = process.env.IN || './data/erc20-tokens.json';
  const LOGGING = process.env.LOG || false;
  const OUT = process.env.OUT || './data/factory-tokens-addresses.json';

  const tokens = JSON.parse(fs.readFileSync(IN, 'utf8')).tokens;

  console.log(`Deploying SimpleVaultFactory and ${tokens.length} tokens...`);

  const INITIAL_MINT_PART = 100000;

  const deployedFactoryTokens: IDeployedFactoryTokens = {
    SimpleVaultFactory: '',
    deployedTokens: [],
  };

  const FactoryFactory = await ethers.getContractFactory('SimpleVaultFactory');
  const SimpleVaultFactory = await upgrades.deployProxy(FactoryFactory, []);
  await SimpleVaultFactory.deployed();

  deployedFactoryTokens.SimpleVaultFactory = SimpleVaultFactory.address;
  if (LOGGING) {
    console.log(`SimpleVaultFactory deployed to ${SimpleVaultFactory.address}\n`);
  }

  for await (const token of tokens) {
    const TokenContract = await deployAndAddToken(
      SimpleVaultFactory as SimpleVaultFactory,
      token.asset,
      token.tokenTicker,
      18,
      token.totalSupply / INITIAL_MINT_PART
    );

    deployedFactoryTokens.deployedTokens.push({
      address: TokenContract.address,
      asset: token.asset,
      tokenTicker: token.tokenTicker,
      initialMint: token.totalSupply / INITIAL_MINT_PART,
    });
    if (LOGGING) {
      console.log(
        `Deployed token ${token.asset} (${token.tokenTicker}) on address ${TokenContract.address}`
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fs.writeFile(OUT, JSON.stringify(deployedFactoryTokens), () => {});
  console.log(`SimpleVaultFactory and tokens deployed, addresses in ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
