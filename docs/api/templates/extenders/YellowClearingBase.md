<!-- DOCTOC SKIP -->

## Interaction

Registry logic has a defined set of interaction functions, most of which are straightforward to use. However, `registerParticipant` and `migrateParticipant` require to be described. Both of these functions accept two arguments: `participant` and `signature`.
`participant` is an address of participant to interact with, whereas `signature` is an `IdentityPayload` signed by `participant`.

`IdentityPayload` is a special structure acting as a proof of account for interaction with `YellowClearing`.
It can be easily retrieved by invoking `getIdentityPayload(address participant)` function of the `YellowClearing` smart contract. Nevertheless, be aware that returned structure is somewhat different:

Typescript:

```typescript
export interface IdentityPayloadBN {
  YellowClearing: string;
  participant: string;
  nonce: BigNumber; // BigNumber instead of number
}
```

## Usage

### Frontdex

Frontdex needs to get already signed `IdentityPayload` from Finex, as it stores participant private key.

For example, overall Frontdex participant registration code should look like this:

```typescript
const YellowClearing = new ethers.Contract(registryAddress, YellowClearingV1Artifact.abi, signer);

const registerTx = await YellowClearing.registerParticipant(
  participantAddress,
  finexParticipantSignature,
);

await registerTx.wait();
```

### Finex

To sign data for `registerParticipant`, Finex can either construct it itself or invoke `getIdentityPayload(address participant)` function on a `YellowClearing` smart contract.

If `migrateParticipant` data is being signed, there is no way for Finex to know the `nonce` of a `participant` and thus it needs to call `getIdentityPayload(address participant)`.

> NOTE: Structure returned from `getIdentityPayload(address participant)` needs to be modified before further participant signing: `nonce` field should be cast from `BigNumber` to `uint256` (or any other `uint` type).
