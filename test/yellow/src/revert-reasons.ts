import {utils} from 'ethers';

const hexify = utils.hexlify;

// upgradability
export const NOT_ADMIN = 'caller not maintainer';
export const NOT_MAINTAINER = 'caller not maintainer';
export const NEWER_IMPL_IS_SET = 'newerImplementation is already set';
export const INVALID_NEWER_IMPL = 'invalid newerImplementation supplied';
export const NEWER_IMPL_ZERO = 'no newer implementation to upgrade to';
export const MUST_THROUGH_DELEGATECALL = 'must be called through delegatecall';
export const MUST_NOT_THROUGH_DELEGATECALL = 'must not be called through delegatecall';
export const ALREADY_INITIALIZED = 'already initialized';
export const ALREADY_MIGRATED = 'already migrated';

// vault
export const VAULT_ALREADY_SETUP = 'Vault is already setup';
export const INVALID_SIGNATURE = 'Invalid signature';
export const INVALID_VIRTUAL_ADDRESS = 'Invalid virtual address';
export const INVALID_ETH_AMOUNT = 'Incorrect msg.value';
export const DESTINATION_ZERO_ADDRESS = 'Destination is zero address';
export const INVALID_ACTION = 'Invalid action';
export const REQUEST_EXPIRED = 'Request expired';
export const SIGNATURE_ALREAD_USED = 'Signature already used';
export const AMOUNT_ZERO = 'Amount is zero';

export function ACCOUNT_MISSING_ROLE(account: string, role: string): string {
  return `AccessControl: account ${hexify(account)} is missing role ${role}`;
}
