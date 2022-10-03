import {expect} from 'chai';
import {Contract} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import {TESTYellowClearingV1, TESTYellowClearingV2, TESTYellowClearingV3} from '../../typechain';

import {deployRegistry} from './src/NetworkRegistry/helpers';
import {Data, Status} from './src/NetworkRegistry/participantData';
import {ACCOUNT_MISSING_ROLE, INVALID_NEXT_IMPL, NEXT_IMPL_SET} from './src/revert-reasons';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('REGISTRY_MAINTAINER_ROLE');
const PREV_IMPL_ROLE = ethers.utils.id('PREVIOUS_IMPLEMENTATION_ROLE');

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

    it('Next impl address is zero after deployment', async () => {
      expect(await RegistryV1.getNextImplementation()).to.equal(AddressZero);
    });

    it('Admin can set next impl address', async () => {
      await RegistryV1.setNextImplementation(RegistryV2.address);
      expect(await RegistryV1.getNextImplementation()).to.equal(RegistryV2.address);
    });

    it('Revert on supply not YellowClearingBase SC', async () => {
      await expect(RegistryV1.setNextImplementation(someone.address)).to.be.reverted;
    });

    it.skip('Revert on set next impl missing required role', async () => {
      // TODO:
      await expect(
        RegistryV1.connect(someone).setNextAddress(RegistryV2.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE));
    });

    it.skip('Revert on set next impl by account missing required role', async () => {
      // TODO:
      await expect(
        RegistryV1.connect(someone).setNextAddress(RegistryV2.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE));
    });

    it('Revert on set already set next impl address', async () => {
      await RegistryV1.setNextImplementation(RegistryV2.address);
      await expect(RegistryV1.setNextImplementation(RegistryV2.address)).to.be.revertedWith(
        NEXT_IMPL_SET
      );
    });

    it('Revert on set next impl address to 0', async () => {
      await expect(RegistryV1.setNextImplementation(AddressZero)).to.be.revertedWith(INVALID_NEXT_IMPL);
    });

    it('Revert on set next impl address to self', async () => {
      await expect(RegistryV1.setNextImplementation(RegistryV1.address)).to.be.revertedWith(
        INVALID_NEXT_IMPL
      );
    });

    it('Event emmited on next impl address set', async () => {
      const tx = await RegistryV1.setNextImplementation(RegistryV2.address);

      const receipt = await tx.wait();
      expect(receipt).to.emit(RegistryV1, NEXT_IMPL_SET).withArgs(RegistryV2.address);
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

    it('Revert on migrate call without next impl set', async () => {
      await RegistryV1.connect(storedPartipant).migrateParticipant();
    });

    it('Participant data is copied on migrate');

    it('Participant is marked as migrated on migrate');

    it('Migrate is successful with intermediate impl');

    it('Revert on migrating unexisting participant');

    it('Revert on migrating already migrated participant');

    it('Event emmited on participant migrate');
  });
});
