import { ethers } from 'hardhat';

export async function getNetworkName(): Promise<string> {
  const network = await ethers.provider.getNetwork();
  return network.name;
}

export function getNetworkExplorerURL(network: string): string {
  switch (network) {
    case 'homestead': {
      return 'https://etherscan.io';
    }

    case 'goerli': {
      return 'https://goerli.etherscan.io';
    }

    case 'matic': {
      return 'https://polygonscan.com';
    }

    case 'maticmum': {
      return 'https://mumbai.polygonscan.com';
    }

    default: {
      throw new Error(`Network explorer for ${network} is not supported.`, { cause: 404 });
    }
  }
}
