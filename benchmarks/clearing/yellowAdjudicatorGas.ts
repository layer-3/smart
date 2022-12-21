// export const BENCHMARK_STEPS = [1000] as const;
export const BENCHMARK_STEPS = [1, 10, 100, 200, 300, 400, 500, 650, 800, 1000] as const;

export interface YellowAdjudicatorGasResults {
  swap: Record<string, number>;
}

export const emptyYellowAdjudicatorGasResults: YellowAdjudicatorGasResults = {
  swap: {},
};
