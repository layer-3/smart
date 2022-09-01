import {Assertion} from 'chai';
import {BigNumber, providers} from 'ethers';

const reasonStringGenerators = (gasUsed: number, expectedGasUsed: number) => {
  const formatNum = (x: number) => {
    return x.toLocaleString().replace(/,/g, '_');
  };
  const green = (x: string) => `\x1b[32m${x}\x1b[0m`;
  const red = (x: string) => `\x1b[31m${x}\x1b[0m`;
  const setWhite = '\x1b[0m';

  const diff = gasUsed - expectedGasUsed;
  const diffStr: string = diff > 0 ? red('+' + formatNum(diff)) : green(formatNum(diff));
  const diffPercent = `${Math.round((Math.abs(diff) / expectedGasUsed) * 100)}%`;

  const expectedDifferent = (gasUsed: number, expectedGasUsed: number) => {
    return `${setWhite}expected to consume ${formatNum(
      expectedGasUsed
    )} gas, but actually consumed ${formatNum(gasUsed)} gas (${diffStr}, ${diffPercent}).`;
  };

  const expectedEqual = (expectedGasUsed: number) => {
    return `expected to NOT consume ${expectedGasUsed} gas, but did`;
  };

  return {expectedDifferent, expectedEqual};
};

Assertion.addMethod('equalGas', async function (expectedGasUsed: number) {
  const gasUsed: number = await this._obj;

  const {expectedDifferent, expectedEqual} = reasonStringGenerators(gasUsed, expectedGasUsed);

  this.assert(
    gasUsed === expectedGasUsed,
    expectedDifferent(gasUsed, expectedGasUsed),
    expectedEqual(expectedGasUsed),
    expectedGasUsed
  );
});

Assertion.addMethod('consumeGas', async function (expectedGasUsed: number) {
  await new Assertion(await gasUsed(this._obj)).to.equalGas(expectedGasUsed);
});

export const gasUsed = async (response: providers.TransactionResponse) => {
  const {gasUsed: gasUsedBN} = await response.wait();
  return (gasUsedBN as BigNumber).toNumber();
};
