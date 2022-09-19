import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {utils, Signer} from 'ethers';

import {
  PartialPayload,
  Payload,
  encodePayload,
  supplementPayload,
  DEPOSIT_ACTION,
  PartialPayloadWithAction,
  WITHDRAW_ACTION,
} from './payload';

export async function setVirtualAddressParams(
  message: string,
  signer: Signer
): Promise<[string, string]> {
  const encodedMsg = utils.defaultAbiCoder.encode(['address'], [message]);
  const encodedMsgHash = utils.keccak256(encodedMsg);
  const encodedMsgHashBytes = utils.arrayify(encodedMsgHash);
  const signature = await signer.signMessage(encodedMsgHashBytes);
  return [encodedMsg, signature];
}

export async function depositParams(
  pp: PartialPayload,
  broker: SignerWithAddress,
  coSigner: SignerWithAddress
): Promise<[string, string, string]> {
  pp.action = DEPOSIT_ACTION;
  return await encodeAndSignPayload(
    await supplementPayload(pp as PartialPayloadWithAction),
    broker,
    coSigner
  );
}

export async function withdrawParams(
  pp: PartialPayload,
  broker: SignerWithAddress,
  coSigner: SignerWithAddress
): Promise<[string, string, string]> {
  pp.action = WITHDRAW_ACTION;
  return await encodeAndSignPayload(
    await supplementPayload(pp as PartialPayloadWithAction),
    broker,
    coSigner
  );
}

async function encodeAndSignPayload(
  payload: Payload,
  broker: SignerWithAddress,
  coSigner: SignerWithAddress
): Promise<[string, string, string]> {
  const encodedMsg = encodePayload(payload);
  const encodedMsgHash = utils.keccak256(encodedMsg);
  const encodedMsgHashBytes = utils.arrayify(encodedMsgHash);
  const brokerSig = await broker.signMessage(encodedMsgHashBytes);
  const coSignerSig = await coSigner.signMessage(encodedMsgHashBytes);
  return [encodedMsg, brokerSig, coSignerSig];
}
