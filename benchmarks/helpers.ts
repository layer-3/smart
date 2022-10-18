import type {providers} from 'ethers';

export const gasUsed = async (response: providers.TransactionResponse) => {
  const {gasUsed: gasUsedBN} = await response.wait();
  return gasUsedBN.toNumber();
};
