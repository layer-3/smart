/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {ethers} from 'hardhat';

import {
  DepositType,
  WithdrawType,
  approve,
  depositWithPayload,
  withdrawWithPayload,
  generatePayload,
  generateSignature,
} from '../../test/custody/common';

const actionConfigs: {
  [action: string]: {
    type: string;
    event: string;
    send: typeof depositWithPayload | typeof withdrawWithPayload;
  };
} = {
  deposit: {
    type: DepositType,
    event: 'Deposited',
    send: depositWithPayload,
  },
  withdraw: {
    type: WithdrawType,
    event: 'Withdrawn',
    send: withdrawWithPayload,
  },
};

async function main() {
  const signers = await ethers.getSigners();
  const [broker] = signers;
  const user = new ethers.Wallet(
    process.env.PVT_KEY || '0x4576fdf6bde1fe670b17ee667d4da85ca3a4383219757a977dfa8cfe3b5c89ee',
    ethers.provider
  );
  if (!signers.find((s) => s.address === user.address)) {
    console.warn(`Account ${user.address} is not in the list of signers. ETH will not be minted.`);
  }

  let action = actionConfigs[process.env.ACTION!];

  const requestPayload = process.env.PAYLOAD ? JSON.parse(process.env.PAYLOAD!) : {};
  if (process.env.FINEX_REQUEST) {
    const result = JSON.parse(process.env.FINEX_REQUEST!);
    action = actionConfigs[result[2]];
    const [assetAddress, assetAmount] = result[3];
    requestPayload.assetAddress = assetAddress;
    requestPayload.assetAmount = assetAmount;
  }
  if (process.env.FINEX_RESPONSE) {
    const result = JSON.parse(process.env.FINEX_RESPONSE!);
    const [rid, expire, signature] = result[3];
    requestPayload.rid = rid;
    requestPayload.expire = expire;
    requestPayload.signature = signature;
  }

  console.log('contract address:', process.env.CONTRACT_ADDRESS);
  console.log('payload:', requestPayload);
  console.log('broker address:', await broker.getAddress());
  console.log('user address:', await user.getAddress());

  if (!action) throw new Error('ACTION is invalid');
  console.log('action:', action.event);

  const isNative = requestPayload.assetAddress === ethers.constants.AddressZero;

  const VaultContract = await ethers.getContractFactory('SimpleVault');
  const vaultContract = await VaultContract.attach(process.env.CONTRACT_ADDRESS!);
  const tokenContract = isNative
    ? {address: requestPayload.assetAddress}
    : await (await ethers.getContractFactory('TestERC20')).attach(requestPayload.assetAddress);

  const amount = requestPayload.assetAmount;

  if (!isNative && action.type === DepositType) {
    await approve(user, vaultContract, tokenContract);
  }

  const {payload, data} = generatePayload({
    rid: requestPayload.rid || ethers.utils.formatBytes32String(Math.random().toString(16)),
    deadline: requestPayload.expire * 1000 || Date.now() + 600_000,
    destination: user.address,
    asset: tokenContract.address,
    amount,
  });
  console.log('data:', data);

  const ethAmount = tokenContract.address === ethers.constants.AddressZero ? amount : undefined;

  const signature =
    process.env.SIGNATURE ||
    requestPayload.signature ||
    (await generateSignature(broker, action.type, payload));
  console.log('signature:', signature);

  const result = await action.send(user, action.type, broker, payload, vaultContract, true, {
    ethAmount,
    signature,
  });

  const event = result.events.find((e: any) => e.event === action.event);
  console.log('result:', event);
  console.log('Done');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
