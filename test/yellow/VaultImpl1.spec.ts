import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import VaultImplArtifact from '../../artifacts/contracts/yellow/VaultImpl.sol/VaultImpl.json';
import {VaultImpl as VaultImplT, TESTVaultProxy} from '../../typechain/';

const AddressZero = ethers.constants.AddressZero;

describe('Vault implementation', () => {
  let implAdmin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;
  let broker1: SignerWithAddress;
  let broker2: SignerWithAddress;
  let otp1: SignerWithAddress;
  let otp2: SignerWithAddress;

  let VaultProxy1: Contract & TESTVaultProxy;
  let VaultImpl: Contract & VaultImplT;

  beforeEach(async () => {
    const VaultImplFactory = await ethers.getContractFactory('VaultImpl');
    const VaultImplDirect = await VaultImplFactory.connect(implAdmin).deploy();
    await VaultImplDirect.deployed();

    const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
    VaultProxy1 = (await VaultProxyFactory.connect(proxyAdmin).deploy()) as Contract &
      TESTVaultProxy;
    await VaultProxy1.deployed();

    // proxied implementation
    VaultImpl = new ethers.Contract(VaultProxy1.address, VaultImplArtifact.abi) as Contract &
      VaultImplT;
  });

  before(async () => {
    [implAdmin, proxyAdmin, someone, someother, broker1, broker2, otp1, otp2] =
      await ethers.getSigners();
  });

  describe('Proxied Vault logic', () => {
    // ======================
    // derived addresses
    // ======================
    describe('derived addresses', () => {
      it('broker can set broker derived address', async () => {
        //todo
      });

      it('otp can set otp derived address', async () => {
        //todo
      });

      it('revert on not broker set broker derived address', async () => {
        //todo
      });

      it('revert on not otp set otp derived address', async () => {
        //todo
      });
    });

    // ======================
    // Deposit
    // ======================
    describe('deposit', () => {
      it('can deposit ETH', async () => {
        //todo
      });

      it('can deposit ERC20', async () => {
        //todo
      });

      it('revert when supplied and specified ETH differ', async () => {
        //todo
      });

      it('revert on deposit from zero address', async () => {
        //todo
      });

      it('revert after request has expired', async () => {
        //todo
      });

      it('revert when signature has been used', async () => {
        //todo
      });

      it('revert when specified amount is zero', async () => {
        //todo
      });

      it('revert on wrong broker signature', async () => {
        //todo
      });

      it('revert on wrong otp signature', async () => {
        //todo
      });

      it('revert when broker and otp signatures are swapped', async () => {
        //todo
      });
    });

    // ======================
    // Withdraw
    // ======================
    describe('withdraw', () => {
      it('can partial withdraw ETH', async () => {
        //todo
      });

      it('can partial withdraw ERC20', async () => {
        //todo
      });

      it('can fully withdraw ETH', async () => {
        //todo
      });

      it('can fully withdraw ERC20', async () => {
        //todo
      });

      it('revert on withdraw to zero address', async () => {
        //todo
      });

      it('revert after request has expired', async () => {
        //todo
      });

      it('revert when signature has been used', async () => {
        //todo
      });

      it('revert when specified amount is zero', async () => {
        //todo
      });

      it('revert on wrong broker signature', async () => {
        //todo
      });

      it('revert on wrong otp signature', async () => {
        //todo
      });

      it('revert when broker and otp signatures are swapped', async () => {
        //todo
      });
    });

    // ======================
    // _requireValidInput
    // ======================
    it('revert on wrong action on deposit/withdraw', async () => {
      //todo
    });
  });

  describe('Multiple proxies interaction', () => {
    it('revert on supply signature from wrong broker', async () => {
      //todo
    });

    // other tests?
  });
});
