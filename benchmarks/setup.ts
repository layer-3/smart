import { Assertion } from 'chai';

import { gasUsed } from './helpers';

const green = (x: string): string => `\u001B[32m${x}\u001B[0m`;
const red = (x: string): string => `\u001B[31m${x}\u001B[0m`;

const formatNum = (x: number): string => {
  return x.toLocaleString().replace(/,/g, '_');
};

const expectedEqual = (expectedGasUsed: number): string => {
  return `expected to NOT consume ${expectedGasUsed} gas, but did`;
};

interface ReasonStringGenerators {
  expectedDifferent: (gasUsed: number, expectedGasUsed: number) => string;
  expectedEqual: (expectedGasUsed: number) => string;
}

const reasonStringGenerators = (
  gasUsed: number,
  expectedGasUsed: number,
): ReasonStringGenerators => {
  const setWhite = '\u001B[0m';

  const diff = gasUsed - expectedGasUsed;
  const diffStr: string = diff > 0 ? red('+' + formatNum(diff)) : green(formatNum(diff));
  const diffPercent = `${Math.round((Math.abs(diff) / expectedGasUsed) * 100)}%`;

  const expectedDifferent = (gasUsed: number, expectedGasUsed: number): string => {
    return `${setWhite}expected to consume ${formatNum(
      expectedGasUsed,
    )} gas, but actually consumed ${formatNum(gasUsed)} gas (${diffStr}, ${diffPercent}).`;
  };

  return { expectedDifferent, expectedEqual };
};

// is called upon number
Assertion.addMethod('equalGas', async function (expectedGasUsed: number) {
  // an object upon which this assertion is called
  const gasUsed: number = await this._obj;

  const { expectedDifferent, expectedEqual } = reasonStringGenerators(gasUsed, expectedGasUsed);

  this.assert(
    gasUsed === expectedGasUsed,
    expectedDifferent(gasUsed, expectedGasUsed),
    expectedEqual(expectedGasUsed),
    expectedGasUsed,
  );
});

// is called upon TransactionResponse object
Assertion.addMethod('consumeGas', async function (expectedGasUsed: number) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  new Assertion(await gasUsed(this._obj)).to.equalGas(expectedGasUsed);
});
