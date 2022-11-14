import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

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

  const envMnemonic = process.env.MNEMONIC;
  const envPassphrase = process.env.PASSPHRASE;
  const accounts_number = process.env.NUMBER ?? 20;
  const outDir = process.env.OUTDIR ?? '/../';

  const mnemonic = envMnemonic ?? confMnemonic;
  const passphrase = envPassphrase ?? confPassphrase;

  if (!mnemonic) {
    throw new Error('No mnemonic provided!');
  }

  if (log) {
    console.log('Mnemonic:', mnemonic);
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

  const dir = __dirname + outDir;

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(dir + '/hardhat-accounts.json', JSON.stringify(accounts, undefined, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
