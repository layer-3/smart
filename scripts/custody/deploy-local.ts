import fs from 'fs';

import {ethers} from 'hardhat';

const OUTPUT_PATH = './cache/deploy-local.env';

async function main() {
  const envCache = readEnvCache();
  const signers = await ethers.getSigners();
  const [broker] = signers;

  const brokerWallet = new ethers.Wallet(
    '266ccede2bb3d559a0616dadbb8a2f51583df10a01744f8c86c624765cc4613e',
    ethers.provider
  );
  if (!signers.find((s) => s.address === brokerWallet.address)) {
    console.warn(
      `Broker ${brokerWallet.address} is not in the list of signers. ETH will not be minted.`
    );
  }
  envCache.brokerPrivateKey = brokerWallet.privateKey.slice(2); // remove 0x

  const getTxsCountOfBlock = async (block: number) =>
    (((await ethers.provider.getBlock(block)) ?? {}).transactions ?? {}).length || 0;
  // skip token deployment if deployed
  const tokenName = 'LocalToken';
  const TestTokenContract = await ethers.getContractFactory('TestERC20');
  if ((await getTxsCountOfBlock(1)) === 0 || !envCache.testTokenAddress) {
    const token = await TestTokenContract.deploy(tokenName, 'LOCAL', '0');
    await token.deployed();
    console.log(`${tokenName} deployed to:`, token.address);
    envCache.testTokenAddress = token.address;
  } else {
    console.log(`(cached) ${tokenName} already deployed at ${envCache.testTokenAddress}`);
  }

  // skip vault deployment if deployed
  const vaultName = 'SimpleVault';
  const vaultFactory = await ethers.getContractFactory('SimpleVault');
  if ((await getTxsCountOfBlock(2)) === 0 || !envCache.vaultAddress) {
    const brokerAddress = await broker.getAddress();
    console.log(`Broker address:`, brokerAddress);
    const vaultContract = await vaultFactory.deploy(vaultName, brokerAddress);
    await vaultContract.deployed();
    console.log(`${vaultName} deployed to:`, vaultContract.address);
    envCache.vaultAddress = vaultContract.address;
  } else {
    console.log(`(cached) ${vaultName} already deployed at ${envCache.vaultAddress}`);
  }

  // mint test token to specific account address
  try {
    const userTest = new ethers.Wallet(
      '0x4576fdf6bde1fe670b17ee667d4da85ca3a4383219757a977dfa8cfe3b5c89ee',
      ethers.provider
    );
    if (!signers.find((s) => s.address === userTest.address)) {
      console.warn(
        `User test ${userTest.address} is not in the list of signers. ETH will not be minted.`
      );
    }
    const token = await TestTokenContract.attach(envCache.testTokenAddress);
    const mintAmount = '10000';
    await (await token.connect(userTest).setBalance(ethers.utils.parseEther(mintAmount))).wait();
    envCache.userTestAddress = userTest.address;
    envCache.userTestPrivateKey = userTest.privateKey;
    console.log('UserAddress:', envCache.userTestAddress);
    console.log('UserPrivateKey:', envCache.userTestPrivateKey);
    console.log(`Set ${tokenName} balance to UserAddress for`, mintAmount, 'tokens');
  } catch (error) {
    console.error(error);
  }

  // write output
  writeEnvCache(envCache);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function readEnvCache() {
  const cache = fs.readFileSync(OUTPUT_PATH, {flag: 'a+'}).toString();
  const parts = cache
    .split('\n')
    .filter(Boolean)
    .map((r) => r.split('='));
  const result = {
    brokerPrivateKey: (parts.find((r) => r[0] === 'CUSTODY_BROKER_PRIVATE_KEY') ?? ({} as any))[1],
    vaultAddress: (parts.find((r) => r[0] === 'CUSTODY_VAULT_ADDRESS') ?? ({} as any))[1],
    testTokenAddress: (parts.find((r) => r[0] === 'CUSTODY_TEST_TOKEN_ADDRESS') ?? ({} as any))[1],
    userTestAddress: (parts.find((r) => r[0] === 'CUSTODY_USER_TEST_ADDRESS') ?? ({} as any))[1],
    userTestPrivateKey: (parts.find((r) => r[0] === 'CUSTODY_USER_TEST_PRIVATE_KEY') ??
      ({} as any))[1],
  };
  return result;
}

function writeEnvCache(result: any) {
  fs.writeFileSync(
    OUTPUT_PATH,
    [
      `CUSTODY_BROKER_PRIVATE_KEY=${result.brokerPrivateKey}`,
      `CUSTODY_VAULT_ADDRESS=${result.vaultAddress}`,
      `CUSTODY_TEST_TOKEN_ADDRESS=${result.testTokenAddress}`,
      `CUSTODY_USER_TEST_ADDRESS=${result.userTestAddress}`,
      `CUSTODY_USER_TEST_PRIVATE_KEY=${result.userTestPrivateKey}`,
    ].join('\n'),
    {flag: 'w'}
  );
  return result;
}
