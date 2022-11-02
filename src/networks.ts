import { ethers } from 'hardhat';

export async function getNetworkName(): Promise<string> {
  const network = await ethers.provider.getNetwork();
  return network.name;
}
