import { ethers } from 'hardhat';

import type { DeployFunction } from 'hardhat-deploy/dist/types';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { VaultImplV1 } from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    getUnnamedAccounts,
  } = hre;

  const { deployer } = await getNamedAccounts();
  const [VaultImplDeployer, VaultProxyDeployer, Broker, CoSigner] = await getUnnamedAccounts();

  const { address: clearingAddress } = await deploy('YellowClearingV1', { from: deployer });
  const { address: vaultImplAddress } = await deploy('VaultImplV1', { from: VaultImplDeployer });
  const { address: vaultProxyAddress } = await deploy('TESTVaultProxy', {
    from: VaultProxyDeployer,
    args: [vaultImplAddress],
  });

  console.log('YellowClearing deployed to:', clearingAddress);
  console.log('VaultImpl deployed to:', vaultImplAddress);
  console.log('VaultProxy deployed to:', vaultProxyAddress);

  const TESTVaultProxy: VaultImplV1 = await ethers.getContractAt(
    'VaultImplV1',
    vaultProxyAddress,
    VaultProxyDeployer,
  );

  await TESTVaultProxy.setup(Broker, CoSigner);

  console.log('VaultProxy setup');
};

export default func;
func.tags = ['YN-local'];
