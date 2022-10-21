import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import hre from 'hardhat';
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39';
import { HDKey } from 'ethereum-cryptography/hdkey';

import type { HardhatNetworkConfig } from 'hardhat/types';

interface IAccount {
  privateKey: string;
  address: string;
}

async function main(): Promise<void> {
  const networkConfig: HardhatNetworkConfig = hre.config.networks.hardhat;

  const log = process.env.log !== undefined || false;

  let confMnemonic = '';
  let confPassphrase = '';

  if (!Array.isArray(networkConfig.accounts)) {
    confMnemonic = networkConfig.accounts.mnemonic;
    confPassphrase = networkConfig.accounts.passphrase;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const envMnemonic = process.env.MNEMONIC!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const envPassphrase = process.env.PASSPHRASE!;
  const accounts_number = process.env.NUMBER ?? 20;

  const mnemonic = envMnemonic || confMnemonic;
  const passphrase = envPassphrase || confPassphrase;

  if (log) {
    console.log('mnemonic:', mnemonic);
  }

  const seed = mnemonicToSeedSync(mnemonic, passphrase);
  const masterKey = HDKey.fromMasterSeed(seed);

  const pubAccounts = await hre.ethers.getSigners();

  const accounts: IAccount[] = [];

  for (let i = 0; i < accounts_number; i++) {
    const derived = masterKey.derive(`m/44'/60'/0'/0/${i}`);

    if (!derived.privateKey || !derived.publicExtendedKey) {
      console.log("can't derive private key");
      continue;
    }

    const privateKey = '0x' + Buffer.from(derived.privateKey).toString('hex');
    const address = pubAccounts[i].address;

    if (log) {
      console.log(`child ${i} private key:`, privateKey);
      console.log(`child ${i} address:`, address);
    }
    accounts.push({ privateKey, address });
  }

  writeFileSync(
    path.dirname(fileURLToPath(import.meta.url)) + '/../addresses/hardhat-accounts.json',
    JSON.stringify(accounts, undefined, 2),
  );
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
