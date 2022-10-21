import { ethers } from 'hardhat';

import { signSelf } from '../src/signatures';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { Signer } from 'ethers';

async function main(): Promise<void> {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log('Current network:', network.name);

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  const balanceBigNum = await deployer.getBalance();
  console.log('Deployer balance:', balanceBigNum.toString());

  let signer: Signer | SignerWithAddress = deployer;

  if (process.env.PRIVATE_KEY) {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY);
  }

  console.log('Signer:', signer);
  console.log(await signSelf(signer));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
