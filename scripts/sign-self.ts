import { ethers } from 'hardhat';

import { signSelf } from '../src/signatures';
import { logEnvironment, logTxHashOrAddress } from '../src/logging';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { Signer } from 'ethers';

async function main(): Promise<void> {
  await logEnvironment();

  let signer: Signer | SignerWithAddress;

  if (process.env.PRIVATE_KEY) {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY);
  } else {
    const [caller] = await ethers.getSigners();
    signer = caller;
  }

  await logTxHashOrAddress(['Signer:', await signer.getAddress()]);
  console.log('Signed:', await signSelf(signer));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
