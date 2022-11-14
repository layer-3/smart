import { logEnvironment, logTxHashesOrAddresses } from '../../src/logging';
import { tryDeployAndLog } from '../helpers';

import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeployFunction } from 'hardhat-deploy/types';

const CONTRACT_NAME = 'Vesting';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;

  const { deployer } = await getNamedAccounts();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const args = process.env.CONTRACT_ARGS!.split(',').map((v) => v.trim());
  console.log('Contract args:', args);

  await logEnvironment();

  const [result] = await tryDeployAndLog(CONTRACT_NAME, {
    from: deployer,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: { methodName: 'initialize', args: args },
    },
  });

  if (result) {
    await logTxHashesOrAddresses([
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ['Transaction hash', result.transactionHash!],
      [`${CONTRACT_NAME} address`, result.address],
    ]);
  }
};
export default func;
func.tags = ['vesting'];
