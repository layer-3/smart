import { expect } from 'chai';
import { utils } from 'ethers';
import { ethers } from 'hardhat';

import {
  ACCOUNT_MISSING_ROLE,
  INVALID_NEXT_IMPL,
  INVALID_PARTICIPANT_ADDRESS,
  INVALID_SIGNER,
  INVALID_STATUS,
  NEXT_IMPL_ALREADY_SET,
  NO_NEXT_IMPL,
  NO_PARTICIPANT,
  PARTICIPANT_ALREADY_EXIST,
  PARTICIPANT_ALREADY_MIGRATED,
  PREV_IMPL_ROLE_REQUIRED,
} from '../../src/revert-reasons';
import { signEncoded } from '../../src/signatures';
import {
  NEXT_IMPL_SET,
  PARTICIPANT_DATA_SET,
  PARTICIPANT_MIGRATED_FROM,
  PARTICIPANT_MIGRATED_TO,
  PARTICIPANT_REGISTERED,
  PARTICIPANT_STATUS_CHANGED,
} from '../../src/event-names';
import { connectGroup } from '../../src/contracts';
import { randomSignerWithAddress } from '../../src/signers';

import { deployAndLinkNextRegistry, deployNextRegistry, deployRegistry } from './src/deploy';
import { MockData, Status, setParticipantStatus } from './src/participantData';
import { migrateParams, registerParams, registerParamsFromPayload } from './src/transactions';
import { getIdentityPayload, signIdentityPayload } from './src/identityPayload';

import type {
  TESTYellowClearingV1,
  TESTYellowClearingV2,
  TESTYellowClearingV3,
} from '../../typechain';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = utils.id('REGISTRY_MAINTAINER_ROLE');
const VALIDATOR_ROLE = utils.id('REGISTRY_VALIDATOR_ROLE');
const AUDITOR_ROLE = utils.id('AUDITOR_ROLE');
const PREV_IMPL_ROLE = utils.id('PREVIOUS_IMPLEMENTATION_ROLE');

describe('Network Registry', () => {
  let registryAdmin: SignerWithAddress;
  let validator: SignerWithAddress;
  let auditor: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;
  let activePartipant: SignerWithAddress;
  let notPresentPartipant: SignerWithAddress;
  let noneParticipant: SignerWithAddress;
  let pendingParticipant: SignerWithAddress;
  let suspendedParticipant: SignerWithAddress;
  let migratedParticipant: SignerWithAddress;
  let virtualParticipant: SignerWithAddress;

  before(async () => {
    [
      registryAdmin,
      validator,
      auditor,
      someone,
      someother,
      activePartipant,
      notPresentPartipant,
      noneParticipant,
      pendingParticipant,
      suspendedParticipant,
      migratedParticipant,
      virtualParticipant,
    ] = await ethers.getSigners();
  });

  let RegistryV1: TESTYellowClearingV1;

  let RegistryAsSomeone: TESTYellowClearingV1;
  let RegistryAsAuditor: TESTYellowClearingV1;
  let RegistryAsValidator: TESTYellowClearingV1;

  beforeEach(async () => {
    RegistryV1 = await deployRegistry(1, registryAdmin);
    await RegistryV1.grantRole(VALIDATOR_ROLE, validator.address);
    await RegistryV1.grantRole(AUDITOR_ROLE, auditor.address);
    await setParticipantStatus(RegistryV1, activePartipant, Status.Active);
    await setParticipantStatus(RegistryV1, noneParticipant, Status.None);
    await setParticipantStatus(RegistryV1, pendingParticipant, Status.Pending);
    await setParticipantStatus(RegistryV1, suspendedParticipant, Status.Suspended);
    await setParticipantStatus(RegistryV1, migratedParticipant, Status.Migrated);

    [RegistryAsSomeone, RegistryAsAuditor, RegistryAsValidator] = connectGroup(RegistryV1, [
      someone,
      auditor,
      validator,
    ]);
  });

  describe('constructor', () => {
    it('Deployer is admin', async () => {
      expect(await RegistryV1.hasRole(ADM_ROLE, registryAdmin.address)).to.be.true;
    });

    it('Deployer is maintainer', async () => {
      expect(await RegistryV1.hasRole(MNTR_ROLE, registryAdmin.address)).to.be.true;
    });

    it('If prev impl is not 0, set PREV_IMPL role', async () => {
      const RegistryV2 = await deployNextRegistry(RegistryV1, 2, registryAdmin);
      expect(await RegistryV2.hasRole(PREV_IMPL_ROLE, RegistryV1.address)).to.be.true;
    });
  });

  describe('getNextImplementation', () => {
    it('Next impl address is zero after deployment', async () => {
      expect(await RegistryV1.getNextImplementation()).to.equal(AddressZero);
    });

    it('Return correct impl address after it has been set', async () => {
      const RegistryV2 = await deployNextRegistry(RegistryV1, 2, registryAdmin);
      await RegistryV1.setNextImplementation(RegistryV2.address);

      expect(await RegistryV1.getNextImplementation()).to.equal(RegistryV2.address);
    });
  });

  describe('setNextImplementation', () => {
    let RegistryV2: TESTYellowClearingV2;

    beforeEach(async () => {
      RegistryV2 = (await deployNextRegistry(RegistryV1, 2, registryAdmin)) as TESTYellowClearingV2;
    });

    it('Succeed if caller is admin and address is correct', async () => {
      await RegistryV1.setNextImplementation(RegistryV2.address);
      expect(await RegistryV1.getNextImplementation()).to.equal(RegistryV2.address);
    });

    it('Revert if caller is missing required role', async () => {
      await expect(RegistryAsSomeone.setNextImplementation(RegistryV2.address)).to.be.revertedWith(
        ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE),
      );
    });

    it('Revert on next impl contract missing required role', async () => {
      const RegistryV2NotLinked = await deployRegistry(2, registryAdmin);

      await expect(
        RegistryV1.setNextImplementation(RegistryV2NotLinked.address),
      ).to.be.revertedWith(PREV_IMPL_ROLE_REQUIRED);
    });

    it('Revert if setting to not YellowClearingBase SC', async () => {
      await expect(RegistryV1.setNextImplementation(someone.address)).to.be.reverted;
    });

    it('Revert if setting twice', async () => {
      await RegistryV1.setNextImplementation(RegistryV2.address);
      await expect(RegistryV1.setNextImplementation(RegistryV2.address)).to.be.revertedWith(
        NEXT_IMPL_ALREADY_SET,
      );
    });

    it('Revert if setting to address 0', async () => {
      await expect(RegistryV1.setNextImplementation(AddressZero)).to.be.revertedWith(
        INVALID_NEXT_IMPL,
      );
    });

    it('Revert if setting to self', async () => {
      await expect(RegistryV1.setNextImplementation(RegistryV1.address)).to.be.revertedWith(
        INVALID_NEXT_IMPL,
      );
    });

    it('Event emitted', async () => {
      await expect(RegistryV1.setNextImplementation(RegistryV2.address))
        .to.emit(RegistryV1, NEXT_IMPL_SET)
        .withArgs(RegistryV2.address);
    });
  });

  describe('hasParticipant', () => {
    it('Return true if participant is present', async () => {
      expect(await RegistryV1.hasParticipant(activePartipant.address)).to.be.true;
    });

    it('Return false if participant is not present', async () => {
      expect(await RegistryV1.hasParticipant(notPresentPartipant.address)).to.be.false;
    });

    it('Return false if participant is present and with status "None"', async () => {
      expect(await RegistryV1.hasParticipant(noneParticipant.address)).to.be.false;
    });
  });

  describe('requireParticipantNotPresentBackwards', () => {
    it('Succeed if participant is not present in this impl', async () => {
      await expect(RegistryV1.requireParticipantNotPresentBackwards(notPresentPartipant.address))
        .not.to.be.reverted;
    });

    it('Succeed if participant is not present in this and prev impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);

      await expect(
        RegistryV2.connect(someone).requireParticipantNotPresentBackwards(
          notPresentPartipant.address,
        ),
      ).not.to.be.reverted;
    });

    it('Succeed if participant is not present in this and 2 prev impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      const RegistryV3 = await deployAndLinkNextRegistry(RegistryV2);

      await expect(
        RegistryV3.connect(someone).requireParticipantNotPresentBackwards(
          notPresentPartipant.address,
        ),
      ).not.to.be.reverted;
    });

    it('Revert if participant is present in this impl', async () => {
      await expect(
        RegistryV1.requireParticipantNotPresentBackwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in prev impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);

      await expect(
        RegistryV2.connect(someone).requireParticipantNotPresentBackwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in 2nd prev impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      const RegistryV3 = await deployAndLinkNextRegistry(RegistryV2);

      await expect(
        RegistryV3.connect(someone).requireParticipantNotPresentBackwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });
  });

  describe('requireParticipantNotPresentForwards', () => {
    it('Succeed if participant is not present in this impl', async () => {
      await expect(RegistryV1.requireParticipantNotPresentForwards(notPresentPartipant.address)).not
        .to.be.reverted;
    });

    it('Succeed if participant is not present in this and next impls', async () => {
      await deployAndLinkNextRegistry(RegistryV1);

      await expect(RegistryV1.requireParticipantNotPresentForwards(notPresentPartipant.address)).not
        .to.be.reverted;
    });

    it('Succeed if participant is not present in this and next impls', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      await deployAndLinkNextRegistry(RegistryV2);

      await expect(RegistryV1.requireParticipantNotPresentForwards(notPresentPartipant.address)).not
        .to.be.reverted;
    });

    it('Revert if participant is present in this impl', async () => {
      await expect(
        RegistryV1.requireParticipantNotPresentForwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in next impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      await setParticipantStatus(RegistryV2, someone, Status.Active);

      await expect(
        RegistryV1.requireParticipantNotPresentForwards(someone.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in 2nd next impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      const RegistryV3 = await deployAndLinkNextRegistry(RegistryV2);
      await setParticipantStatus(RegistryV3, someone, Status.Active);

      await expect(
        RegistryV1.requireParticipantNotPresentForwards(someone.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });
  });

  describe('requireParticipantNotPresentRecursive', () => {
    it('Succeed if participant is not present in this impl', async () => {
      await expect(RegistryV1.requireParticipantNotPresentRecursive(notPresentPartipant.address))
        .not.to.be.reverted;
    });

    it('Succeed if participant is not present in this, 1 prev and 1 next impls', async () => {
      const middleRegistry = await deployAndLinkNextRegistry(RegistryV1);
      await deployAndLinkNextRegistry(middleRegistry);

      await expect(
        middleRegistry.requireParticipantNotPresentRecursive(notPresentPartipant.address),
      ).not.to.be.reverted;
    });

    it('Succeed if participant is not present in this, 2 prev and 2 next impls', async () => {
      const prevRegistry = await deployAndLinkNextRegistry(RegistryV1);
      const middleRegistry = await deployAndLinkNextRegistry(prevRegistry);
      const nextRegistry = await deployAndLinkNextRegistry(middleRegistry);
      await deployAndLinkNextRegistry(nextRegistry);

      await expect(
        middleRegistry.requireParticipantNotPresentRecursive(notPresentPartipant.address),
      ).not.to.be.reverted;
    });

    it('Revert if participant is present in this impl', async () => {
      await expect(
        RegistryV1.requireParticipantNotPresentForwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in prev impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);

      await expect(
        RegistryV2.connect(someone).requireParticipantNotPresentBackwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in 2nd prev impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      const RegistryV3 = await deployAndLinkNextRegistry(RegistryV2);

      await expect(
        RegistryV3.connect(someone).requireParticipantNotPresentBackwards(activePartipant.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in next impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      await setParticipantStatus(RegistryV2, someone, Status.Active);

      await expect(
        RegistryV1.requireParticipantNotPresentForwards(someone.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in 2nd next impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(RegistryV1);
      const RegistryV3 = await deployAndLinkNextRegistry(RegistryV2);
      await setParticipantStatus(RegistryV3, someone, Status.Active);

      await expect(
        RegistryV1.requireParticipantNotPresentForwards(someone.address),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });
  });

  describe('getParticipantData', () => {
    it('Successfully return present participant data', async () => {
      await expect(RegistryV1.getParticipantData(activePartipant.address)).to.not.be.reverted;
    });

    it('Returned participant data has all required fields', async () => {
      const data = await RegistryV1.getParticipantData(activePartipant.address);

      expect(data.status).not.to.be.undefined;
      expect(data.status).not.to.equal(Status.None);

      expect(data.registrationTime).not.to.be.undefined;
      expect(data.registrationTime).not.to.equal(0);
    });

    it('Revert if participant is not present', async () => {
      await expect(RegistryV1.getParticipantData(notPresentPartipant.address)).to.be.revertedWith(
        NO_PARTICIPANT,
      );
    });

    it('Revert if participant status is None', async () => {
      await expect(RegistryV1.getParticipantData(noneParticipant.address)).to.be.revertedWith(
        NO_PARTICIPANT,
      );
    });
  });

  describe('getIdentityPayload', () => {
    it('Payload is correct for present participant', async () => {
      const payload = await RegistryAsSomeone.getIdentityPayload(activePartipant.address);

      expect(payload.YellowClearing).to.equal(RegistryV1.address);
      expect(payload.participant).to.equal(activePartipant.address);

      const { nonce } = await RegistryAsSomeone.getParticipantData(activePartipant.address);
      expect(payload.nonce).to.equal(nonce.add(1));
    });

    it('Payload is correct for absent participant', async () => {
      const payload = await RegistryAsSomeone.getIdentityPayload(notPresentPartipant.address);

      expect(payload.YellowClearing).to.equal(RegistryV1.address);
      expect(payload.participant).to.equal(notPresentPartipant.address);
      expect(payload.nonce).to.equal(0);
    });
  });

  describe('registerParticipant', () => {
    it('Can register participant', async () => {
      await RegistryAsSomeone.registerParticipant(
        ...(await registerParams(RegistryV1, virtualParticipant)),
      );
    });

    it('Participant is marked Pending', async () => {
      await RegistryAsSomeone.registerParticipant(
        ...(await registerParams(RegistryV1, virtualParticipant)),
      );
      const data = await RegistryV1.getParticipantData(virtualParticipant.address);

      expect(data.status).to.equal(Status.Pending);
    });

    it('Revert on signer not participant', async () => {
      const IP = await getIdentityPayload(RegistryV1, virtualParticipant);

      await expect(
        RegistryAsSomeone.registerParticipant(
          virtualParticipant.address,
          await signIdentityPayload(IP, someone),
        ),
      ).to.be.revertedWith(INVALID_SIGNER);
    });

    it('Revert on wrong signed data', async () => {
      const correctIdentityPayload = await getIdentityPayload(RegistryV1, virtualParticipant);

      const wrongContractAddressIP = correctIdentityPayload;
      wrongContractAddressIP.YellowClearing = someone.address;
      await expect(
        RegistryAsSomeone.registerParticipant(
          ...(await registerParamsFromPayload(virtualParticipant, wrongContractAddressIP)),
        ),
      ).to.be.revertedWith(INVALID_SIGNER);

      const wrongParticipantAddressIP = correctIdentityPayload;
      wrongParticipantAddressIP.participant = someone.address;
      await expect(
        RegistryAsSomeone.registerParticipant(
          ...(await registerParamsFromPayload(virtualParticipant, wrongParticipantAddressIP)),
        ),
      ).to.be.revertedWith(INVALID_SIGNER);

      const wrongNonceIP = correctIdentityPayload;
      wrongNonceIP.nonce += 10;
      await expect(
        RegistryAsSomeone.registerParticipant(
          ...(await registerParamsFromPayload(virtualParticipant, wrongNonceIP)),
        ),
      ).to.be.revertedWith(INVALID_SIGNER);
    });

    it('Revert if participant is already present', async () => {
      await expect(
        RegistryAsSomeone.registerParticipant(
          ...(await registerParams(RegistryV1, activePartipant)),
        ),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in prev impl', async () => {
      const nextRegistry = await deployAndLinkNextRegistry(RegistryV1);

      const identityPayload = await getIdentityPayload(RegistryV1, virtualParticipant);
      identityPayload.YellowClearing = nextRegistry.address;

      await expect(
        nextRegistry
          .connect(someone)
          .registerParticipant(
            ...(await registerParamsFromPayload(activePartipant, identityPayload)),
          ),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Revert if participant is present in next impl', async () => {
      const nextRegistry = await deployAndLinkNextRegistry(RegistryV1);

      const v2ActiveParticipant = await randomSignerWithAddress();
      await setParticipantStatus(nextRegistry, v2ActiveParticipant, Status.Active);

      const identityPayload = await getIdentityPayload(nextRegistry, v2ActiveParticipant);
      identityPayload.YellowClearing = RegistryV1.address;

      await expect(
        RegistryAsSomeone.registerParticipant(
          ...(await registerParamsFromPayload(v2ActiveParticipant, identityPayload)),
        ),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_EXIST);
    });

    it('Event emitted', async () => {
      await expect(
        RegistryAsSomeone.registerParticipant(
          ...(await registerParams(RegistryV1, virtualParticipant)),
        ),
      )
        .to.emit(RegistryV1, PARTICIPANT_REGISTERED)
        .withArgs(virtualParticipant.address);
    });
  });

  describe('validateParticipant', () => {
    it('Successfuly validate participant', async () => {
      await RegistryAsValidator.validateParticipant(pendingParticipant.address);
      const data = await RegistryV1.getParticipantData(pendingParticipant.address);

      expect(data.status).to.equal(Status.Active);
    });

    it('Revert if caller is not validator', async () => {
      await expect(
        RegistryAsSomeone.validateParticipant(pendingParticipant.address),
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, VALIDATOR_ROLE));
    });

    it('Revert if participant is not present', async () => {
      await expect(
        RegistryAsValidator.validateParticipant(notPresentPartipant.address),
      ).to.be.revertedWith(NO_PARTICIPANT);
    });

    it('Revert if status is not Pending', async () => {
      await expect(
        RegistryAsValidator.validateParticipant(activePartipant.address),
      ).to.be.revertedWith(INVALID_STATUS);
    });

    it('Event emitted', async () => {
      await expect(RegistryAsValidator.validateParticipant(pendingParticipant.address))
        .to.emit(RegistryV1, PARTICIPANT_STATUS_CHANGED)
        .withArgs(pendingParticipant.address, Status.Active);
    });
  });

  describe('suspendParticipant', () => {
    it('Successfuly suspend participant', async () => {
      await RegistryAsAuditor.suspendParticipant(activePartipant.address);
      const data = await RegistryV1.getParticipantData(activePartipant.address);

      expect(data.status).to.equal(Status.Suspended);
    });

    it('Revert if caller is not autidor', async () => {
      await expect(
        RegistryAsSomeone.suspendParticipant(activePartipant.address),
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, AUDITOR_ROLE));
    });

    it('Revert if participant is not present', async () => {
      await expect(
        RegistryAsAuditor.suspendParticipant(notPresentPartipant.address),
      ).to.be.revertedWith(NO_PARTICIPANT);
    });

    it('Revert if status is None', async () => {
      await expect(
        RegistryAsAuditor.suspendParticipant(noneParticipant.address),
      ).to.be.revertedWith(NO_PARTICIPANT);
    });

    it('Revert if status is Suspended', async () => {
      await expect(
        RegistryAsAuditor.suspendParticipant(suspendedParticipant.address),
      ).to.be.revertedWith(INVALID_STATUS);
    });

    it('Revert if status is Migrated', async () => {
      await expect(
        RegistryAsAuditor.suspendParticipant(migratedParticipant.address),
      ).to.be.revertedWith(INVALID_STATUS);
    });

    it('Event emitted', async () => {
      await expect(RegistryAsAuditor.suspendParticipant(activePartipant.address))
        .to.emit(RegistryV1, PARTICIPANT_STATUS_CHANGED)
        .withArgs(activePartipant.address, Status.Suspended);
    });
  });

  describe('reinstateParticipant', () => {
    it('Successfuly reinstate participant', async () => {
      await RegistryAsAuditor.reinstateParticipant(suspendedParticipant.address);
      const data = await RegistryV1.getParticipantData(suspendedParticipant.address);

      expect(data.status).to.equal(Status.Active);
    });

    it('Revert if caller is not auditor', async () => {
      await expect(
        RegistryAsSomeone.reinstateParticipant(suspendedParticipant.address),
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, AUDITOR_ROLE));
    });

    it('Revert if participant is not present', async () => {
      await expect(
        RegistryAsAuditor.reinstateParticipant(notPresentPartipant.address),
      ).to.be.revertedWith(NO_PARTICIPANT);
    });

    it('Revert if status is not Suspended', async () => {
      await expect(
        RegistryAsAuditor.reinstateParticipant(activePartipant.address),
      ).to.be.revertedWith(INVALID_STATUS);
    });

    it('Event emitted', async () => {
      await expect(RegistryAsAuditor.reinstateParticipant(suspendedParticipant.address))
        .to.emit(RegistryV1, PARTICIPANT_STATUS_CHANGED)
        .withArgs(suspendedParticipant.address, Status.Active);
    });
  });

  describe('setParticipantData', () => {
    it('Succeed if caller is maintainer', async () => {
      await expect(RegistryV1.setParticipantData(someone.address, MockData(Status.Active))).not.to
        .be.reverted;
    });

    it('Revert if caller is not maintainer', async () => {
      await expect(
        RegistryAsSomeone.setParticipantData(someother.address, MockData(Status.Active)),
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE));
    });

    it('Revert on setting zero address account', async () => {
      await expect(
        RegistryV1.setParticipantData(AddressZero, MockData(Status.Active)),
      ).to.be.revertedWith(INVALID_PARTICIPANT_ADDRESS);
    });

    it('Revert on setting data of migrated participant', async () => {
      await RegistryV1.setParticipantData(someone.address, MockData(Status.Migrated));

      await expect(
        RegistryV1.setParticipantData(someone.address, MockData(Status.Active)),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_MIGRATED);
    });

    it('Event emitted', async () => {
      const data = MockData(Status.Active);

      await expect(RegistryV1.setParticipantData(someone.address, data)).to.emit(
        RegistryV1,
        PARTICIPANT_DATA_SET,
      );
      // REVIEW: add when migrated to jest or hardhat-chai-matchers
      // now does not work as waffle reading event.logs[i].args, which is array, but we expect it to be an object
      //.withArgs(someone.address, data);
    });
  });

  describe('migrateParticipant', () => {
    let RegistryV2: TESTYellowClearingV2;
    let RegistryV3: TESTYellowClearingV3;

    beforeEach(async () => {
      RegistryV2 = (await deployAndLinkNextRegistry(
        RegistryV1,
        2,
        registryAdmin,
      )) as TESTYellowClearingV2;

      RegistryV3 = (await deployNextRegistry(RegistryV2, 3, registryAdmin)) as TESTYellowClearingV3;
    });

    it('Succeed if all requirements are met', async () => {
      await expect(
        RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant))),
      ).not.to.be.reverted;
    });

    it('Participant data is copied', async () => {
      await RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant)));
      const data = await RegistryV2.getParticipantData(activePartipant.address);

      expect(data.status).to.equal(Status.Active);
    });

    it('Participant is marked as migrated', async () => {
      await RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant)));
      const data = await RegistryV1.getParticipantData(activePartipant.address);

      expect(data.status).to.equal(Status.Migrated);
    });

    it('Migrate is successful with intermediate impl', async () => {
      await RegistryV2.setNextImplementation(RegistryV3.address);
      expect(await RegistryV2.getNextImplementation()).to.equal(RegistryV3.address);

      // migrate
      await RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant)));

      // data copied
      const dataV3 = await RegistryV3.getParticipantData(activePartipant.address);
      expect(dataV3.status).to.equal(Status.Active);

      // marked as migrated in first
      const dataV1 = await RegistryV1.getParticipantData(activePartipant.address);
      expect(dataV1.status).to.equal(Status.Migrated);

      // not appeared in second
      expect(await RegistryV2.hasParticipant(activePartipant.address)).to.be.false;
    });

    it('Revert if next impl is not set', async () => {
      const NotLinkedRegistry = await deployRegistry(1, registryAdmin);
      await NotLinkedRegistry.setParticipantData(someone.address, MockData(Status.Active));

      await expect(
        NotLinkedRegistry.migrateParticipant(...(await migrateParams(NotLinkedRegistry, someone))),
      ).to.be.revertedWith(NO_NEXT_IMPL);
    });

    it('Revert if participant is not present', async () => {
      await expect(
        RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, someone))),
      ).to.be.revertedWith(NO_PARTICIPANT);
    });

    it('Revert if signer is not participant', async () => {
      await expect(
        RegistryV1.migrateParticipant(
          activePartipant.address,
          await signEncoded(
            someone,
            utils.defaultAbiCoder.encode(['address'], [activePartipant.address]),
          ),
        ),
      ).to.be.revertedWith(INVALID_SIGNER);
    });

    it('Revert if participant already migrated', async () => {
      await RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant)));

      await expect(
        RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant))),
      ).to.be.revertedWith(PARTICIPANT_ALREADY_MIGRATED);
    });

    it('Succesfully migrate with overriden migrateData', async () => {
      await RegistryV2.setNextImplementation(RegistryV3.address);

      // migrate
      await RegistryV1.migrateParticipant(...(await migrateParams(RegistryV1, activePartipant)));

      // registration time migrated
      const dataV3 = await RegistryV3.getParticipantData(activePartipant.address);
      expect(dataV3.registrationTime).to.equal(42);
    });

    it('Events emitted', async () => {
      const tx = RegistryV1.migrateParticipant(
        ...(await migrateParams(RegistryV1, activePartipant)),
      );

      await expect(tx)
        .to.emit(RegistryV1, PARTICIPANT_MIGRATED_FROM)
        .withArgs(activePartipant.address, RegistryV1.address);

      await expect(tx)
        // we expect RegistryV2 to emit this event as it is the contract participant migrates to
        .to.emit(RegistryV2, PARTICIPANT_MIGRATED_TO)
        .withArgs(activePartipant.address, RegistryV2.address);
    });
  });
});
