import {ethers} from 'hardhat';

export const BrokerRole = ethers.utils.id('CUSTODY_BROKER_ROLE');
export const DepositType = ethers.utils.id('CUSTODY_DEPOSIT_TYPE');
export const WithdrawType = ethers.utils.id('CUSTODY_WITHDRAW_TYPE');

export async function approve(
  signer: any,
  vaultContract: any,
  tokenContract: any,
  amount: any = ethers.constants.MaxUint256
) {
  const tx = await tokenContract.connect(signer).approve(vaultContract.address, amount);
  return tx.wait();
}

export async function deposit(
  signer: any,
  action: string,
  amount: any,
  broker: any,
  vaultContract: any,
  tokenContract: any
) {
  const {payload} = generatePayload({
    destination: signer.address,
    asset: tokenContract.address,
    amount,
  });
  const ethAmount = tokenContract.address === ethers.constants.AddressZero ? amount : undefined;
  return depositWithPayload(signer, action, broker, payload, vaultContract, true, {ethAmount});
}

export async function depositWithPayload(
  signer: any,
  action: string,
  broker: any,
  payload: any,
  vaultContract: any,
  wait = true,
  override: any = {}
) {
  const signature = override.signature || (await generateSignature(broker, action, payload));
  const tx = await vaultContract
    .connect(signer)
    .deposit(payload, signature, {value: override.ethAmount});
  return wait ? tx.wait() : tx;
}

export async function withdrawWithPayload(
  signer: any,
  action: string,
  broker: any,
  payload: any,
  vaultContract: any,
  wait = true,
  override: any = {}
) {
  const signature = override.signature || (await generateSignature(broker, action, payload));
  const tx = await vaultContract.connect(signer).withdraw(payload, signature);
  return wait ? tx.wait() : tx;
}

export async function generateSignature(broker: any, action: string, payload: any) {
  const message = ethers.utils.solidityKeccak256(['bytes32', 'bytes'], [action, payload]);
  return broker.signMessage(ethers.utils.arrayify(message));
}

export function generatePayload({
  rid = ethers.utils.formatBytes32String(Math.random().toString(16)),
  deadline = Date.now() + 600_000,
  destination,
  asset,
  amount,
  assets = [],
}: any) {
  assets = assets.length ? assets : [[asset, amount.toString()]];
  const expire = Math.floor(deadline / 1000);
  return {
    data: {rid, deadline, destination, assets},
    payload: ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint64', 'address', 'tuple(address, uint256)[]'],
      [rid, expire, destination, assets]
    ),
  };
}

export function getGasFee(tx: any) {
  return tx.gasUsed.mul(tx.effectiveGasPrice);
}
