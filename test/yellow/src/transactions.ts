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

function signEncoded(signer: Signer, encodedData: string): Promise<string> {
  return signer.signMessage(utils.arrayify(utils.keccak256(encodedData)));
}

export async function setVirtualAddressParams(
  signer: Signer,
  virtualAddress: string
): Promise<[string, string]> {
  return [
    virtualAddress,
    await signEncoded(signer, utils.defaultAbiCoder.encode(['address'], [virtualAddress])),
  ];
}

async function encodeAndSignPayload(
  payload: Payload,
  broker: SignerWithAddress,
  coSigner: SignerWithAddress
): Promise<[Payload, string, string]> {
  const encodedPayload = encodePayload(payload);

  const signatures = await Promise.all([
    signEncoded(broker, encodedPayload),
    signEncoded(coSigner, encodedPayload),
  ]);

  return [payload, signatures[0], signatures[1]];
}

export async function depositParams(
  pp: PartialPayload,
  broker: SignerWithAddress,
  coSigner: SignerWithAddress
): Promise<[Payload, string, string]> {
  pp.action = DEPOSIT_ACTION;

  return encodeAndSignPayload(
    await supplementPayload(pp as PartialPayloadWithAction),
    broker,
    coSigner
  );
}

export async function withdrawParams(
  pp: PartialPayload,
  broker: SignerWithAddress,
  coSigner: SignerWithAddress
): Promise<[Payload, string, string]> {
  pp.action = WITHDRAW_ACTION;

  return encodeAndSignPayload(
    await supplementPayload(pp as PartialPayloadWithAction),
    broker,
    coSigner
  );
}
