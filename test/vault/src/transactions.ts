import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {utils, Signer} from 'ethers';

import {signEncoded} from '../../../src/signatures';

import {
  PartialPayload,
  Payload,
  supplementPayload,
  DEPOSIT_ACTION,
  PartialPayloadWithAction,
  WITHDRAW_ACTION,
  encodeAndSignPayload,
} from './payload';

export async function setAddressParams(signer: Signer, address: string): Promise<[string, string]> {
  return [address, await signEncoded(signer, utils.defaultAbiCoder.encode(['address'], [address]))];
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
