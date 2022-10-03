import {expect} from 'chai';
import {Contract} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import {TESTYellowClearingV1, TESTYellowClearingV2, TESTYellowClearingV3} from '../../typechain';

import {deployRegistry} from './src/NetworkRegistry/helpers';
import {Data, Status} from './src/NetworkRegistry/participantData';
import {ACCOUNT_MISSING_ROLE, INVALID_NEXT_VERSION, NEXT_VERSION_SET} from './src/revert-reasons';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('MAINTAINER_ROLE');
const PREV_VER_ROLE = ethers.utils.id('PREVIOUS_VERSION_ROLE');

describe('Network Registry', () => {
  let registryAdmin: SignerWithAddress;
  let registryMaintrainer: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;
  let storedPartipant: SignerWithAddress;

  before(async () => {
    [registryAdmin, registryMaintrainer, someone, someother, storedPartipant] =
      await ethers.getSigners();
  });

  let RegistryV1: Contract & TESTYellowClearingV1;

  beforeEach(async () => {
    RegistryV1 = await deployRegistry(1, registryAdmin);
    await RegistryV1.setParticipantData(storedPartipant.address, Data(Status.Active, '0xtest'));
  });

  describe('constructor', () => {
    it('Deployer is admin', async () => {
      expect(await RegistryV1.hasRole(ADM_ROLE, registryAdmin.address)).to.be.true;
    });

    it('Deployer is maintainer', async () => {
      expect(await RegistryV1.hasRole(MNTR_ROLE, registryAdmin.address)).to.be.true;
    });
  });

  describe.only('nextImplementation', () => {
    let RegistryV2: Contract & TESTYellowClearingV2;

    beforeEach(async () => {
      RegistryV2 = (await deployRegistry(2, registryAdmin)) as TESTYellowClearingV2;
    });

    it('Next version address is zero after deployment', async () => {
      expect(await RegistryV1.getNextVersion()).to.equal(AddressZero);
    });

    it('Admin can set next version address', async () => {
      await RegistryV1.setNextVersion(RegistryV2.address);
      expect(await RegistryV1.getNextVersion()).to.equal(RegistryV2.address);
    });

    it('Revert on supply not YellowClearingBase SC', async () => {
      await expect(RegistryV1.setNextVersion(someone.address)).to.be.reverted;
    });

    it('Revert on set next version without required role', async () => {
      await expect(
        RegistryV1.connect(someone).setNextAddress(RegistryV2.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE));
    });

    it('Revert on set already set next version address', async () => {
      await RegistryV1.setNextVersion(RegistryV2.address);
      await expect(RegistryV1.setNextVersion(RegistryV2.address)).to.be.revertedWith(
        NEXT_VERSION_SET
      );
    });

    it('Revert on set next version address to 0', async () => {
      await expect(RegistryV1.setNextVersion(AddressZero)).to.be.revertedWith(INVALID_NEXT_VERSION);
    });

    it('Revert on set next version address to self', async () => {
      await expect(RegistryV1.setNextVersion(RegistryV1.address)).to.be.revertedWith(
        INVALID_NEXT_VERSION
      );
    });

    it('Event emmited on next version address set', async () => {
      const tx = await RegistryV1.setNextVersion(RegistryV2.address);

      const receipt = await tx.wait();
      expect(receipt).to.emit(RegistryV1, NEXT_VERSION_SET).withArgs(RegistryV2.address);
    });
  });

  describe('participant data manipulation', () => {
    it('Return true if participant is present');

    it('Return false if participant is not present');

    it('Return false if participant is present and with status "None"');

    it('Return existing participant data');

    it('Revert when getting unexisting participant data');

    it('Maintainer can set participant data');

    it('Revert on not maintainer setting participant data');

    it('Revert on setting data of zero address');

    it('Revert on setting data of migrated participant');

    it('Event emmited on participant data set');
  });

  describe('migrate participant', () => {
    let RegistryV2: Contract & TESTYellowClearingV2;
    let RegistryV3: Contract & TESTYellowClearingV3;

    beforeEach(async () => {
      RegistryV2 = (await deployRegistry(2, registryAdmin)) as TESTYellowClearingV2;
      RegistryV3 = (await deployRegistry(3, registryAdmin)) as TESTYellowClearingV3;
    });

    it('Revert on migrate call without next version set', async () => {
      await RegistryV1.connect(storedPartipant).migrateParticipant();
    });

    it('Participant data is copied on migrate');

    it('Participant is marked as migrated on migrate');

    it('Migrate is successful with intermediate version');

    it('Revert on migrating unexisting participant');

    it('Revert on migrating already migrated participant');

    it('Event emmited on participant migrate');
  });
});
