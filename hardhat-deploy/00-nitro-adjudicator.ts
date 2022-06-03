import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, getChainId} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const log = process.env.log !== undefined || false;

  if (log) {
    console.log('Working on chain id #', await getChainId());
  }

  await deploy('NitroAdjudicator', {
    from: deployer,
    log: log,
  });
};
export default func;
func.tags = ['NitroAdjudicator'];
