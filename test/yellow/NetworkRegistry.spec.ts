import {expect} from 'chai';
import {Contract} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import {TESTYellowClearingV1, TESTYellowClearingV2, TESTYellowClearingV3} from '../../typechain';

import {deployNextRegistry, deployRegistry} from './src/NetworkRegistry/helpers';
import {MockData, Status} from './src/NetworkRegistry/participantData';
import {ACCOUNT_MISSING_ROLE, INVALID_NEXT_IMPL, NEXT_IMPL_SET, PREV_IMPL_ROLE_REQUIRED} from './src/revert-reasons';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('REGISTRY_MAINTAINER_ROLE');
const PREV_IMPL_ROLE = ethers.utils.id('PREVIOUS_IMPLEMENTATION_ROLE');

describe('Network Registry', () => {
  let registryAdmin: SignerWithAddress;
  let registryMaintrainer: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;
  let presentPartipant: SignerWithAddress;
  let noneParticipant: SignerWithAddress;

  before(async () => {
    [registryAdmin, registryMaintrainer, someone, someother, presentPartipant, noneParticipant] =
      await ethers.getSigners();
  });

  let RegistryV1: Contract & TESTYellowClearingV1;

  beforeEach(async () => {
    RegistryV1 = await deployRegistry(1, registryAdmin);
    await RegistryV1.setParticipantData(presentPartipant.address, MockData(Status.Active));
    await RegistryV1.setParticipantData(noneParticipant.address, MockData(Status.None));
  });

  describe('constructor', () => {
    it('Deployer is admin', async () => {
      expect(await RegistryV1.hasRole(ADM_ROLE, registryAdmin.address)).to.be.true;
    });

    it('Deployer is maintainer', async () => {
      expect(await RegistryV1.hasRole(MNTR_ROLE, registryAdmin.address)).to.be.true;
    });

    it('If prev impl is not 0, set PREV_IMPL role', async () => {
      const RegistryV2 = await deployNextRegistry(2, RegistryV1.address, registryAdmin);
      expect(await RegistryV2.hasRole(PREV_IMPL_ROLE, RegistryV1.address)).to.be.true;
    });
  });

  describe('getNextImplementation', () => {
    it('Next impl address is zero after deployment', async () => {
      expect(await RegistryV1.getNextImplementation()).to.equal(AddressZero);
    });
  });

  describe('setNextImplementation', () => {
    let RegistryV2: Contract & TESTYellowClearingV2;

    beforeEach(async () => {
      RegistryV2 = (await deployNextRegistry(
        2,
        RegistryV1.address,
        registryAdmin
      )) as TESTYellowClearingV2;
    });

    it('Succeed when caller is admin and address is correct', async () => {
      await RegistryV1.setNextImplementation(RegistryV2.address);
      expect(await RegistryV1.getNextImplementation()).to.equal(RegistryV2.address);
    });

    it('Revert when caller is missing required role', async () => {
      await expect(
        RegistryV1.connect(someone).setNextImplementation(RegistryV2.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE));
    });

    it('Revert on next impl contract missing required role', async () => {
      const RegistryV2NotLinked = await deployRegistry(2, registryAdmin);

      await expect(
        RegistryV1.setNextImplementation(RegistryV2NotLinked.address)
      ).to.be.revertedWith(PREV_IMPL_ROLE_REQUIRED);
    });

    it('Revert when setting to not YellowClearingBase SC', async () => {
      await expect(RegistryV1.setNextImplementation(someone.address)).to.be.reverted;
    });

    it('Revert when setting twice', async () => {
      await RegistryV1.setNextImplementation(RegistryV2.address);
      await expect(RegistryV1.setNextImplementation(RegistryV2.address)).to.be.revertedWith(
        NEXT_IMPL_SET
      );
    });

    it('Revert when setting to address 0', async () => {
      await expect(RegistryV1.setNextImplementation(AddressZero)).to.be.revertedWith(
        INVALID_NEXT_IMPL
      );
    });

    it('Revert when setting to self', async () => {
      await expect(RegistryV1.setNextImplementation(RegistryV1.address)).to.be.revertedWith(
        INVALID_NEXT_IMPL
      );
    });

    it('Event emmited', async () => {
      const tx = await RegistryV1.setNextImplementation(RegistryV2.address);

      const receipt = await tx.wait();
      expect(receipt).to.emit(RegistryV1, NEXT_IMPL_SET).withArgs(RegistryV2.address);
    });
  });

  describe('hasParticipant', () => {
    it('Return true if participant is present', async () => {
      expect(await RegistryV1.hasParticipant(presentPartipant.address)).to.be.true;
    });

    it('Return false if participant is not present', async () => {
      expect(await RegistryV1.hasParticipant(someone.address)).to.be.false;
    });

    it('Return false if participant is present and with status "None"', async () => {
      expect(await RegistryV1.hasParticipant(noneParticipant.address)).to.be.false;
    });
  });

  describe('getParticipantData', () => {
    it('Successfully return present participant data');

    it('Revert if participant is not present');

    it('Revert if participant status is None');
  });

  describe('requireParticipantNotPresent', () => {
    it('Succeed if participant is not present in this impl');

    it('Succeed if participant is not present in 2 consequent impls');

    it('Succeed if participant is not present in 3 consequent impls');

    it('Revert if participant is present in this impl');

    it('Revert if participant is present in 2nd consequent impl');

    it('Revert if participant is present in 3rd consequent impl');
  });

  describe('registerParticipant', () => {
    it('Can register participant');

    it('Block timestamp is stored');

    it('Revert on signer not broker');

    it('Revert on supplying vault with different broker');

    it('Revert on incorrect signed value');

    it('Revert when participant already present');

    it('Revert on supplying not vault address');

    it('Event emmited');
  });

  describe('setParticipantData', () => {
    it('Succeed when maintainer is caller');

    it('Revert when caller is not maintainer');

    it('Revert on setting to zero address');

    it('Revert on setting data of migrated participant');

    it('Event emmited');
  });

  describe('migrateParticipant', () => {
    let RegistryV2: Contract & TESTYellowClearingV2;
    let RegistryV3: Contract & TESTYellowClearingV3;

    beforeEach(async () => {
      RegistryV2 = (await deployRegistry(2, registryAdmin)) as TESTYellowClearingV2;
      RegistryV3 = (await deployRegistry(3, registryAdmin)) as TESTYellowClearingV3;
    });

    it('Participant data is copied');

    it('Participant is marked as migrated');

    it('Migrate is successful with intermediate impl');

    it('Revert when next impl is not set', async () => {
      // TODO:
      // await RegistryV1.connect(presentPartipant).migrateParticipant();
    });

    it('Revert when participant is not present');

    it('Revert when participant signer is not participant');

    it('Revert when participant already migrated');

    it('Succesfully migrate with overriden migrateData');

    it('Event emmited');
  });
});
