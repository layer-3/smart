import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Signer} from 'ethers';
import {ethers} from 'hardhat';

import {encodeSelf} from '../../test/yellow/src/signatures';

async function main() {
  const provider = ethers.provider;
  console.log('Current network:', (await provider.getNetwork()).name);

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  console.log('Deployer balance:', (await deployer.getBalance()).toString());

  let signer: Signer | SignerWithAddress = deployer;

  if (process.env.PRIVATE_KEY) {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY);
  }

  console.log('Signer:', signer);
  console.log(await encodeSelf(signer));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
