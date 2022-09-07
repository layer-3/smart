import {utils} from 'ethers';

const hexify = utils.hexlify;

export const NOT_ADMIN = 'caller not maintainer';
export const NOT_MAINTAINER = 'caller not maintainer';
export const NEWER_IMPL_IS_SET = 'newerImplementation is already set';
export const INVALID_NEWER_IMPL = 'invalid newerImplementation supplied';
export const NEWER_IMPL_ZERO = 'no newer implementation to upgrade to';
export const MUST_THROUGH_DELEGATECALL = 'must be called through delegatecall';
export const MUST_NOT_THROUGH_DELEGATECALL = 'must not be called through delegatecall';
export const ALREADY_INITIALIZED = 'already initialized';
export const ALREADY_MIGRATED = 'already migrated';

export function ACCOUNT_MISSING_ROLE(account: string, role: string): string {
  return `AccessControl: account ${hexify(account)} is missing role ${role}`;
}
