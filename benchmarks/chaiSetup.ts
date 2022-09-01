import {Assertion} from 'chai';
import {BigNumber, providers} from 'ethers';

Assertion.addMethod('consumeGas', async function (benchmark: number) {
  const received: providers.TransactionResponse = this._obj;
  const {gasUsed: gasUsedBN} = await received.wait();
  const gasUsed = (gasUsedBN as BigNumber).toNumber();

  console.log('Gas used:', gasUsed);

  const pass = gasUsed === benchmark; // This could get replaced with a looser check with upper/lower bounds

  if (pass) {
    return {
      message: () => `expected to NOT consume ${benchmark} gas, but did`,
      pass: true,
    };
  } else {
    const format = (x: number) => {
      return x.toLocaleString().replace(/,/g, '_');
    };
    const green = (x: string) => `\x1b[32m${x}\x1b[0m`;
    const red = (x: string) => `\x1b[31m${x}\x1b[0m`;

    const diff = gasUsed - benchmark;
    const diffStr: string = diff > 0 ? red('+' + format(diff)) : green(format(diff));
    const diffPercent = `${Math.round((Math.abs(diff) / benchmark) * 100)}%`;

    return {
      message: () =>
        `expected to consume ${format(benchmark)} gas, but actually consumed ${format(
          gasUsed
        )} gas (${diffStr}, ${diffPercent}). Consider running npm run benchmark:update`,
      pass: false,
    };
  }
});
