import { readFileSync } from 'node:fs';

export function importUsage(contractName: string): string {
  const path = `./docs/api/templates/usage/${contractName}.md`;
  return readFileSync(path).toString();
}
