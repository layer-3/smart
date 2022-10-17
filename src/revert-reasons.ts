import {utils} from 'ethers';

const hexify = utils.hexlify;

// upgradability
export const NOT_ADMIN = 'Caller not maintainer';
export const NOT_MAINTAINER = 'Caller not maintainer';
export const NEXT_IMPL_IS_SET = 'nextImplementation is already set';
export const INVALID_NEXT_IMPL = 'Invalid nextImplementation supplied';
export const NEXT_IMPL_ZERO = 'No next implementation to upgrade to';
export const MUST_THROUGH_DELEGATECALL = 'Must be called through delegatecall';
export const MUST_NOT_THROUGH_DELEGATECALL = 'Must not be called through delegatecall';
export const ALREADY_INITIALIZED = 'Already initialized';
export const ALREADY_MIGRATED = 'Already migrated';

// vault
export const VAULT_ALREADY_SETUP = 'Vault is already setup';
export const INVALID_SIGNATURE = 'Invalid signature';
export const INVALID_ADDRESS = 'Invalid address';
export const INVALID_ETH_AMOUNT = 'Incorrect msg.value';
export const DESTINATION_ZERO_ADDRESS = 'Destination is zero address';
export const INVALID_ACTION = 'Invalid action';
export const REQUEST_EXPIRED = 'Request expired';
export const SIGNATURE_ALREAD_USED = 'Signature already used';
export const AMOUNT_ZERO = 'Amount is zero';
export const INVALID_IMPL_ADDRESS = 'Invalid implementation address';
export const INVALID_CHAIN_ID = 'Invalid chain id';

// network registry
export const NEXT_IMPL_ALREADY_SET = 'Next implementation already set';
export const PREV_IMPL_ROLE_REQUIRED = 'Previous implementation role is required';
export const PARTICIPANT_ALREADY_REGISTERED = 'Participant already registered';
export const NO_PARTICIPANT = 'Participant does not exist';
export const INVALID_SIGNER = 'Invalid signer';
export const INVALID_STATUS = 'Invalid status';
export const INVALID_PARTICIPANT_ADDRESS = 'Invalid participant address';
export const PARTICIPANT_ALREADY_MIGRATED = 'Participant already migrated';
export const NO_NEXT_IMPL = 'Next implementation is not set';

export function ACCOUNT_MISSING_ROLE(account: string, role: string): string {
  return `AccessControl: account ${hexify(account)} is missing role ${role}`;
}
