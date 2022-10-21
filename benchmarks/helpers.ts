import type { providers } from 'ethers';

export const gasUsed = async (response: providers.TransactionResponse): Promise<number> => {
  const { gasUsed: gasUsedBN } = await response.wait();
  return gasUsedBN.toNumber();
};
