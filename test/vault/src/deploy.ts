import type {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Contract} from 'ethers';
import {ethers} from 'hardhat';

import {randomSignerWithAddress} from '../../../src/signers';
import type {VaultImplBase, VaultImplV1, VaultProxyBase} from '../../../typechain';

// TODO: add functions and use them in `VaultUpgradeability.spec.ts` and `VaultImplV1.spec.ts`

interface DeployImplOptions {
  admin?: SignerWithAddress;
}

interface DeployImplReturns {
  impl: VaultImplBase;
  admin: SignerWithAddress;
}

export async function deployVaultImpl(options: DeployImplOptions): Promise<DeployImplReturns> {
  const admin = options.admin ?? (await randomSignerWithAddress());
  // TODO: add option to deploy `TESTVaultUpgradeability`
  const VaultImpl1Factory = await ethers.getContractFactory('VaultImplV1');
  const VaultImpl1 = (await VaultImpl1Factory.connect(admin).deploy()) as VaultImplBase;
  await VaultImpl1.deployed();
  return { impl: VaultImpl1, admin };
}

interface DeployProxyOptions {
  admin?: SignerWithAddress;
  impl: VaultImplBase;
}

interface DeployProxyReturns {
  proxy: VaultProxyBase;
  admin: SignerWithAddress;
}

export async function deployVaultProxy(
  implOrOptions: VaultImplBase | DeployProxyOptions,
): Promise<DeployProxyReturns> {
  let impl;
  let admin;

  if (implOrOptions instanceof Contract) {
    impl = implOrOptions;
    admin = await randomSignerWithAddress();
  } else {
    impl = (implOrOptions as DeployProxyOptions).impl;
    admin = (implOrOptions as DeployProxyOptions).admin ?? (await randomSignerWithAddress());
  }

  const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
  const VaultProxy = (await VaultProxyFactory.connect(admin).deploy(
    impl.address,
  )) as VaultProxyBase;
  await VaultProxy.deployed();
  return { proxy: VaultProxy, admin };
}

interface DeployVaultOptions {
  impl?: VaultImplBase;
  proxyAdmin?: SignerWithAddress;
  broker?: SignerWithAddress;
  coSigner?: SignerWithAddress;
}

interface DeployVaultReturns {
  proxy: VaultProxyBase;
  proxiedImpl: VaultImplBase;
  impl: VaultImplBase;
  proxyAdmin: SignerWithAddress;
  broker: SignerWithAddress;
  coSigner: SignerWithAddress;
}

export async function deployAndSetupVault(): Promise<DeployVaultReturns> {
  return await _deployVault({});
}

async function _deployVault(options: DeployVaultOptions): Promise<DeployVaultReturns> {
  const VaultImpl = options.impl ?? (await deployVaultImpl({})).impl;
  const proxyAdmin = options.proxyAdmin ?? (await randomSignerWithAddress());
  const broker = options.broker ?? (await randomSignerWithAddress());
  const coSigner = options.coSigner ?? (await randomSignerWithAddress());

  const VaultProxy = (await deployVaultProxy({admin: proxyAdmin, impl: VaultImpl})).proxy;
  const ProxiedImpl: Contract & VaultImplV1 = await ethers.getContractAt(
    'VaultImplV1',
    VaultProxy.address,
    proxyAdmin,
  );

  await ProxiedImpl.setup(broker.address, coSigner.address);

  return {
    proxy: VaultProxy,
    proxiedImpl: ProxiedImpl,
    impl: VaultImpl,
    proxyAdmin,
    broker,
    coSigner,
  };
}
