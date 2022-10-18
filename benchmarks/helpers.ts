import type {BigNumber, providers} from 'ethers';

export const gasUsed = async (response: providers.TransactionResponse) => {
  const {gasUsed: gasUsedBN} = await response.wait();
  return (gasUsedBN as BigNumber).toNumber();
};
