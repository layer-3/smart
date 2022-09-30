import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('REGISTRY_MAINTAINER_ROLE');

describe('Network Registry', () => {
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
    it('Revert on migrate call to the first version');

    it('Participant data is copied on migrate');

    it('Participant is marked as migrated on migrate');

    it('Revert on migrating unexisting participant');

    it('Revert on migrating already migrated participant');

    it('Event emmited on participant migrate');
  });
});
