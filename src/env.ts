export function requireEnv<T>(
  name: string,
  reason: string | ((_: T | undefined) => string),
  ...predicates: ((_: T) => boolean)[]
): T {
  const variable = process.env[name] as T;

  if (
    !variable ||
    // eslint-disable-next-line unicorn/no-array-reduce
    predicates.reduce((incorrectness, isCorrect) => !isCorrect(variable) && incorrectness, false)
  ) {
    throw new Error(typeof reason === 'string' ? reason : reason(variable));
  }

  return variable;
}
