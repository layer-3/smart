// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/prefer-namespace-keyword, @typescript-eslint/no-unused-vars
declare module Chai {
  export interface Assertion {
    equalGas(expected: number): void;
    consumeGas(expected: number): void;
  }
}
