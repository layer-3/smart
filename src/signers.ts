import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

export async function randomSignerWithAddress(): Promise<SignerWithAddress> {
  return await SignerWithAddress.create(ethers.provider.getSigner());
}
