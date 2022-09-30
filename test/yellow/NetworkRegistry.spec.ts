import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import {TESTYellowClearingV1, TESTYellowClearingV2, TESTYellowClearingV3} from '../../typechain';
import { deployRegistry } from './src/NetworkRegistry/helpers';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('MAINTAINER_ROLE');
const PREV_VER_ROLE = ethers.utils.id('PREVIOUS_VERSION_ROLE');

describe('Network Registry', () => {
  let registryAdmin: SignerWithAddress;
  let registryMaintrainer: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;

  before(async () => {
    [registryAdmin, registryMaintrainer, someone, someother] = await ethers.getSigners();
  });

  let RegistryV1: Contract & TESTYellowClearingV1;

  beforeEach(async () => {
    RegistryV1 = await deployRegistry(1);
  });

  describe('constructor', () => {
    it('Revert on supplying not YellowClearingBase address');

    it('Deployer is admin');

    it('Deployer is maintainer');
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

  describe('migrate', () => {
    let RegistryV2: Contract & TESTYellowClearingV2;
    let RegistryV3: Contract & TESTYellowClearingV3;

    beforeEach(async () => {
      RegistryV2 = (await deployRegistry(2)) as TESTYellowClearingV2;
      RegistryV3 = (await deployRegistry(3)) as TESTYellowClearingV3;
    });

    it('Revert on migrate call to the first version');

    it('Participant data is copied on migrate');

    it('Participant is marked as migrated on migrate');

    it('Migrate is successful with intermediate version', async () => {
      // todo
    });

    it('Revert on migrating unexisting participant');

    it('Revert on migrating already migrated participant');

    it('Event emmited on participant migrate');
  });
});
