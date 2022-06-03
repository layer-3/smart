import fs from 'fs';

import {ethers} from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, getChainId} = hre;
  const {deploy, execute} = deployments;

  const IN = './data/erc20-tokens.json';
  const tokens = JSON.parse(fs.readFileSync(IN, 'utf8')).tokens;

  const log = process.env.log !== undefined || false;

  if (log) {
    console.log('Working on chain id #', await getChainId());
    console.log(`Deploying ${tokens.length} tokens...`);
  }

  const INITIAL_MINT_PART = 100000;
  const {deployer} = await getNamedAccounts();

  for await (const token of tokens) {
    const SimpleERC20 = await deploy(token.tokenTicker, {
      from: deployer,
      contract: 'SimpleERC20',
      args: [token.asset, token.tokenTicker, 18],
      log: log,
    });

    const factoryAdress = (await deployments.get('SimpleVaultFactory')).address;

    await execute(
      token.tokenTicker,
      {from: deployer, log: log},
      'grantRole',
      ethers.utils.id('MINTER_ROLE'),
      factoryAdress
    );

    await execute(
      token.tokenTicker,
      {from: deployer, log: log},
      'grantRole',
      ethers.utils.id('BURNER_ROLE'),
      factoryAdress
    );

    await execute(
      'SimpleVaultFactory',
      {from: deployer, log: log},
      'addToken',
      SimpleERC20.address,
      token.totalSupply / INITIAL_MINT_PART
    );
  }
};
export default func;
func.tags = ['SimpleERC20'];
