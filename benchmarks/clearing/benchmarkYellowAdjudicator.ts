import { writeFileSync } from 'node:fs';

import { gasUsed } from '../helpers';

import {
  deployYellowAdjudicator,
  depositForSwaps,
  getSwapParams,
  randomWallet,
  setSeed,
} from './fixtures';
import { BENCHMARK_STEPS, emptyYellowAdjudicatorGasResults } from './yellowAdjudicatorGas';

async function main(): Promise<void> {
  setSeed(42);

  const gasResults = emptyYellowAdjudicatorGasResults;

  await Promise.all(
    BENCHMARK_STEPS.map(async (stepNum) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const yellowAdjudicator = await deployYellowAdjudicator();
      const brokerA = randomWallet();
      const brokerB = randomWallet();

      const assets = await depositForSwaps(yellowAdjudicator, brokerA, brokerB, stepNum * 2);

      gasResults.swap[`swaps_${stepNum}`] = await gasUsed(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await yellowAdjudicator.swap(
          ...(await getSwapParams(brokerA, brokerB, assets, stepNum * 2)),
          { gasLimit: 30_000_000 },
        ),
      );
    }),
  );

  writeFileSync(__dirname + '/gasResults.json', JSON.stringify(gasResults, undefined, 2));
  console.log('Benchmark results updated successfully!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
