import {expect} from 'chai';
import {Contract, utils} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import {
  TESTYellowClearingV1,
  TESTYellowClearingV2,
  TESTYellowClearingV3,
  VaultProxyBase,
} from '../../typechain';

import {
  deployAndLinkNextRegistry,
  deployNextRegistry,
  deployRegistry,
} from './src/NetworkRegistry/deploy';
import {MockData, setParticipantStatus, Status} from './src/NetworkRegistry/participantData';
import {
  ACCOUNT_MISSING_ROLE,
  INVALID_NEXT_IMPL,
  INVALID_PARTICIPANT_ADDRESS,
  NEXT_IMPL_SET,
  NO_PARTICIPANT,
  PARTICIPANT_ALREADY_MIGRATED,
  PARTICIPANT_ALREADY_REGISTERED,
  PREV_IMPL_ROLE_REQUIRED,
  SIGNER_NOT_BROKER,
} from './src/revert-reasons';
import {deployAndSetupVault} from './src/VaultImpl/deploy';
import {registerParams} from './src/NetworkRegistry/transactions';
import {randomSignerWithAddress} from './src/signers';
import {signEncoded} from './src/signatures';
import {PARTICIPANT_DATA_SET, PARTICIPANT_REGISTERED} from './src/event-names';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = utils.id('REGISTRY_MAINTAINER_ROLE');
const PREV_IMPL_ROLE = utils.id('PREVIOUS_IMPLEMENTATION_ROLE');

describe('Network Registry', () => {
  let registryAdmin: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;
  let presentPartipant: SignerWithAddress;
  let notPresentPartipant: SignerWithAddress;
  let noneParticipant: SignerWithAddress;
  let virtualParticipant: SignerWithAddress;

  before(async () => {
    [
      registryAdmin,
      someone,
      someother,
      presentPartipant,
      notPresentPartipant,
      noneParticipant,
      virtualParticipant,
    ] = await ethers.getSigners();
  });

  let RegistryV1: Contract & TESTYellowClearingV1;

  beforeEach(async () => {
    RegistryV1 = await deployRegistry(1, registryAdmin);
    await setParticipantStatus(RegistryV1, presentPartipant, Status.Active);
    await setParticipantStatus(RegistryV1, noneParticipant, Status.None);
  });

  describe('constructor', () => {
    it('Deployer is admin', async () => {
      expect(await RegistryV1.hasRole(ADM_ROLE, registryAdmin.address)).to.be.true;
    });

    it('Deployer is maintainer', async () => {
      expect(await RegistryV1.hasRole(MNTR_ROLE, registryAdmin.address)).to.be.true;
    });

    it('If prev impl is not 0, set PREV_IMPL role', async () => {
      const RegistryV2 = await deployNextRegistry(2, RegistryV1, registryAdmin);
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
      RegistryV2 = (await deployNextRegistry(2, RegistryV1, registryAdmin)) as TESTYellowClearingV2;
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
      expect(await RegistryV1.hasParticipant(notPresentPartipant.address)).to.be.false;
    });

    it('Return false if participant is present and with status "None"', async () => {
      expect(await RegistryV1.hasParticipant(noneParticipant.address)).to.be.false;
    });
  });

  describe.only('requireParticipantNotPresent', () => {
    it('Succeed if participant is not present in this impl', async () => {
      await expect(RegistryV1.requireParticipantNotPresent(notPresentPartipant.address)).not.to.be
        .reverted;
    });

    it('Succeed if participant is not present in 2 consequent impls', async () => {
      await deployAndLinkNextRegistry(2, RegistryV1, registryAdmin);

      await expect(RegistryV1.requireParticipantNotPresent(notPresentPartipant.address)).not.to.be
        .reverted;
    });

    it('Succeed if participant is not present in 3 consequent impls', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(2, RegistryV1, registryAdmin);
      await deployAndLinkNextRegistry(3, RegistryV2, registryAdmin);

      await expect(RegistryV1.requireParticipantNotPresent(notPresentPartipant.address)).not.to.be
        .reverted;
    });

    it('Revert if participant is present in this impl', async () => {
      await expect(
        RegistryV1.requireParticipantNotPresent(presentPartipant.address)
      ).to.be.revertedWith(PARTICIPANT_ALREADY_REGISTERED);
    });

    it('Revert if participant is present in 2nd consequent impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(2, RegistryV1, registryAdmin);
      await setParticipantStatus(RegistryV2, someone, Status.Active);

      await expect(RegistryV1.requireParticipantNotPresent(someone.address)).to.be.revertedWith(
        PARTICIPANT_ALREADY_REGISTERED
      );
    });

    it('Revert if participant is present in 3rd consequent impl', async () => {
      const RegistryV2 = await deployAndLinkNextRegistry(2, RegistryV1, registryAdmin);
      const RegistryV3 = await deployAndLinkNextRegistry(3, RegistryV2, registryAdmin);
      await setParticipantStatus(RegistryV3, someone, Status.Active);

      await expect(RegistryV1.requireParticipantNotPresent(someone.address)).to.be.revertedWith(
        PARTICIPANT_ALREADY_REGISTERED
      );
    });
  });

  describe('getParticipantData', () => {
    it('Successfully return present participant data', async () => {
      await expect(RegistryV1.getParticipantData(presentPartipant.address)).to.not.be.reverted;
    });

    it('Returned participant data has all required fields', async () => {
      const data = await RegistryV1.getParticipantData(presentPartipant.address);

      expect(data.status).not.to.be.undefined;
      expect(data.status).not.to.equal(Status.None);

      expect(data.vault).not.to.be.undefined;

      expect(data.registrationTime).not.to.be.undefined;
      expect(data.registrationTime).not.to.equal(0);
    });

    it('Revert if participant is not present', async () => {
      await expect(RegistryV1.getParticipantData(notPresentPartipant.address)).to.be.revertedWith(
        NO_PARTICIPANT
      );
    });

    it('Revert if participant status is None', async () => {
      await expect(RegistryV1.getParticipantData(noneParticipant.address)).to.be.revertedWith(
        NO_PARTICIPANT
      );
    });
  });

  describe('registerParticipant', () => {
    let VaultProxy: VaultProxyBase, broker: SignerWithAddress;

    beforeEach(async () => {
      ({proxy: VaultProxy, broker} = await deployAndSetupVault());
    });

    it('Can register participant', async () => {
      await expect(
        RegistryV1.connect(someone).registerParticipant(
          ...(await registerParams(virtualParticipant, VaultProxy, broker))
        )
      ).not.to.be.reverted;
    });

    it('Participant is marked Pending', async () => {
      await RegistryV1.connect(someone).registerParticipant(
        ...(await registerParams(virtualParticipant, VaultProxy, broker))
      );

      expect((await RegistryV1.getParticipantData(virtualParticipant.address)).status).to.equal(
        Status.Pending
      );
    });

    it('Revert on signer not broker', async () => {
      const notBroker = await randomSignerWithAddress();
      await expect(
        RegistryV1.connect(someone).registerParticipant(virtualParticipant.address, {
          vault: VaultProxy.address,
          vaultBrokerSignature: await signEncoded(
            notBroker,
            utils.defaultAbiCoder.encode(['address'], [someother.address])
          ),
        })
      ).to.be.revertedWith(SIGNER_NOT_BROKER);
    });

    it('Revert on incorrect signed value', async () => {
      await expect(
        RegistryV1.connect(someone).registerParticipant(virtualParticipant.address, {
          vault: VaultProxy.address,
          vaultBrokerSignature: await signEncoded(
            broker,
            utils.defaultAbiCoder.encode(['address'], [someother.address])
          ),
        })
      ).to.be.revertedWith(SIGNER_NOT_BROKER);
    });

    it('Revert when participant already present', async () => {
      await expect(
        RegistryV1.connect(someone).registerParticipant(
          ...(await registerParams(presentPartipant, VaultProxy, broker))
        )
      ).to.be.revertedWith(PARTICIPANT_ALREADY_REGISTERED);
    });

    it('Revert on supplying not vault address', async () => {
      await expect(
        RegistryV1.connect(someone).registerParticipant(virtualParticipant.address, {
          vault: someother.address,
          vaultBrokerSignature: await signEncoded(
            broker,
            utils.defaultAbiCoder.encode(['address'], [virtualParticipant.address])
          ),
        })
      ).to.be.reverted;
    });

    it('Event emitted', async () => {
      const tx = await RegistryV1.connect(someone).registerParticipant(
        ...(await registerParams(virtualParticipant, VaultProxy, broker))
      );

      const receipt = await tx.wait();
      expect(receipt)
        .to.emit(RegistryV1, PARTICIPANT_REGISTERED)
        .withArgs(virtualParticipant.address);
    });
  });

  describe.only('setParticipantData', () => {
    it('Succeed when caller is maintainer', async () => {
      await expect(RegistryV1.setParticipantData(someone.address, MockData(Status.Active))).not.to
        .be.reverted;
    });

    it('Revert when caller is not maintainer', async () => {
      await expect(
        RegistryV1.connect(someone).setParticipantData(someother.address, MockData(Status.Active))
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, MNTR_ROLE));
    });

    it('Revert on setting zero address account', async () => {
      await expect(
        RegistryV1.setParticipantData(AddressZero, MockData(Status.Active))
      ).to.be.revertedWith(INVALID_PARTICIPANT_ADDRESS);
    });

    it('Revert on setting data of migrated participant', async () => {
      await RegistryV1.setParticipantData(someone.address, MockData(Status.Migrated));

      await expect(
        RegistryV1.setParticipantData(someone.address, MockData(Status.Active))
      ).to.be.revertedWith(PARTICIPANT_ALREADY_MIGRATED);
    });

    it('Event emitted', async () => {
      const data = MockData(Status.Active);
      const tx = await RegistryV1.setParticipantData(someone.address, data);

      const receipt = await tx.wait();
      expect(receipt).to.emit(RegistryV1, PARTICIPANT_DATA_SET).withArgs(someone.address, data);
    });
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

    it('Event emitted');
  });
});
