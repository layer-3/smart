import {utils} from 'ethers';
import {ParamType} from 'ethers/lib/utils';
import {ethers} from 'hardhat';

// keccak256('YELLOW_VAULT_DEPOSIT_ACTION');
export const DEPOSIT_ACTION = '0xa2d4613c2e2e0782566f63085acedcb19fbd37900464a8316040997ccd6e9fea';
// keccak256('YELLOW_VAULT_WITHDRAW_ACTION');
export const WITHDRAW_ACTION = '0x7db3a5ce85cf60bbe764132be0fbcb68292ae2471573882a46c8bcdaa1187b57';

export type Action = typeof DEPOSIT_ACTION | typeof WITHDRAW_ACTION;

export interface Allocation {
  asset: string;
  amount: number;
}

export interface PartialPayload {
  action?: Action;
  rid?: string;
  expire?: number;
  destination: string;
  allocations: Allocation[];
  implAddress: string;
  chainId?: number;
}

export interface PartialPayloadWithAction extends PartialPayload {
  action: Action;
}

export type Payload = Required<PartialPayload>;

export async function supplementPayload(pp: PartialPayloadWithAction): Promise<Payload> {
  const rid = pp.rid ?? randomRID();
  const expire = pp.expire ?? expireAt();
  const chainId = pp.chainId ?? (await ethers.getDefaultProvider().getNetwork()).chainId;

  const payload = pp;
  payload.rid = rid;
  payload.expire = expire;
  payload.chainId = chainId;

  return payload as Payload;
}

export function addAllocation(
  payload: PartialPayload,
  asset: string,
  amount: number
): PartialPayload {
  const newAlloc: Allocation = {asset, amount};
  payload.allocations ? payload.allocations.push(newAlloc) : (payload.allocations = [newAlloc]);
  return payload;
}

function randomRID(): string {
  return utils.formatBytes32String(Math.random().toString(16));
}

function expireAt(delta = 600_000): number {
  return Date.now() + delta;
}

export async function generalPayload(
  destination: string,
  implAddress: string
): Promise<PartialPayload> {
  return {
    rid: randomRID(),
    expire: expireAt(),
    destination,
    allocations: [],
    implAddress,
    chainId: 31337, // local hardhat node
  };
}

export function encodePayload(payload: Payload): string {
  return utils.defaultAbiCoder.encode(
    [
      {
        type: 'tuple',
        components: [
          {name: 'action', type: 'bytes32'},
          {name: 'rid', type: 'bytes32'},
          {name: 'expire', type: 'uint64'},
          {name: 'destination', type: 'address'},
          {
            name: 'allocations',
            type: 'tuple[]',
            components: [
              {name: 'asset', type: 'address'},
              {name: 'amount', type: 'uint256'},
            ],
          } as ParamType,
          {name: 'implAddress', type: 'address'},
          {name: 'chainId', type: 'uint256'},
        ],
      } as ParamType,
    ],
    [payload]
  );
}
