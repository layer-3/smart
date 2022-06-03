/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {ethers} from 'hardhat';

import {SimpleVaultFactory} from '../typechain';

export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
export const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
export const BURNER_ROLE = ethers.utils.id('BURNER_ROLE');

export async function deployVault(
  SimpleVaultFactory: SimpleVaultFactory,
  vaultName: string,
  broker: string
) {
  const tx = await SimpleVaultFactory.deployVault(vaultName, broker);
  const result = await tx.wait();
  const vaultDeployedEv = result.events!.find((e) => e.event === 'VaultDeployed');
  const vaultAddress = vaultDeployedEv!.args!.vaultAddress;

  const VaultFactory = await ethers.getContractFactory('SimpleVault');
  return VaultFactory.attach(vaultAddress);
}

export async function redeployVault(SimpleVaultFactory: SimpleVaultFactory, vault: string) {
  const tx = await SimpleVaultFactory.redeployVault(vault);
  const result = await tx.wait();
  const vaultDeployedEv = result.events!.find((e) => e.event === 'VaultDeployed');
  const vaultAddress = vaultDeployedEv!.args!.vaultAddress;

  const VaultFactory = await ethers.getContractFactory('SimpleVault');
  return VaultFactory.attach(vaultAddress);
}

export async function deployAndAddToken(
  SimpleVaultFactory: SimpleVaultFactory,
  name: string,
  symbol: string,
  decimals: number,
  mint_per_deployment: number
) {
  const tx = await SimpleVaultFactory.deployAndAddToken(
    name,
    symbol,
    decimals,
    mint_per_deployment
  );
  const result = await tx.wait();
  const tokenDeoloyedEv = result.events!.find((e) => e.event === 'TokenDeployed');
  const tokenAddress = tokenDeoloyedEv!.args!.tokenAddress;

  const TokenFactory = await ethers.getContractFactory('SimpleERC20');
  return TokenFactory.attach(tokenAddress);
}

export async function deployTokenGrantRoles(
  SimpleVaultFactory: SimpleVaultFactory,
  name: string,
  symbol: string,
  decimals: number
) {
  const TokenFactory = await ethers.getContractFactory('SimpleERC20');
  const Token = await TokenFactory.deploy(name, symbol, decimals);
  await Token.deployed();

  await Token.grantRole(MINTER_ROLE, SimpleVaultFactory.address);
  await Token.grantRole(BURNER_ROLE, SimpleVaultFactory.address);

  return Token;
}
