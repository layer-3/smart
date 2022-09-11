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
  let coSigner1: SignerWithAddress;
  let coSigner2: SignerWithAddress;

  let VaultProxy1: Contract & TESTVaultProxy;
  let VaultImpl: Contract & VaultImplT;

  beforeEach(async () => {
    const VaultImplFactory = await ethers.getContractFactory('VaultImpl');
    const VaultImplDirect = await VaultImplFactory.connect(implAdmin).deploy(
      broker1.address,
      coSigner1.address
    );
    await VaultImplDirect.deployed();

    const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
    VaultProxy1 = (await VaultProxyFactory.connect(proxyAdmin).deploy(
      VaultImplDirect.address
    )) as Contract & TESTVaultProxy;
    await VaultProxy1.deployed();

    // proxied implementation
    VaultImpl = new ethers.Contract(VaultProxy1.address, VaultImplArtifact.abi) as Contract &
      VaultImplT;
  });

  before(async () => {
    [implAdmin, proxyAdmin, someone, someother, broker1, broker2, coSigner1, coSigner2] =
      await ethers.getSigners();
  });

  describe('Proxied Vault logic', () => {
    // ======================
    // derived addresses
    // ======================
    describe.only('derived addresses', () => {
      it.only('broker virtual address is set after initialization', async () => {
        expect(await VaultImpl.connect(someone).getBrokerVirtualAddress()).to.equal(
          broker1.address
        );
      });

      it.only('coSigner virtual address is set after initialization', async () => {
        //todo
      });

      it.only('can set broker virtual address with broker sig', async () => {
        const msg = ethers.utils.defaultAbiCoder.encode(['address'], [broker2.address]);
        const msgHash = ethers.utils.keccak256(msg);
        const msgHashBytes = ethers.utils.arrayify(msgHash);
        const sig = await broker1.signMessage(msgHashBytes);

        console.log('broker1', broker1.address);
        console.log('msg', msg);
        console.log('msgHash', msgHash);
        console.log('sig', sig);

        // should not revert
        await VaultImpl.connect(someone).setBrokerKeyDerivedAddress(msg, sig);
      });

      it('can set coSigner virtual address with coSigner sig', async () => {
        const encodedAddress = ethers.utils.defaultAbiCoder.encode(['address'], [coSigner2.address]);
        const sig = await coSigner1.signMessage(encodedAddress);

        // should not revert
        await VaultImpl.connect(someone).setBrokerKeyDerivedAddress(encodedAddress, sig);
      });

      it('revert on set broker virtual address with not broker sig', async () => {
        //todo
      });

      it('revert on set coSigner virtual address with not coSigner sig', async () => {
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

      it('revert when withdrowing with anothers signature', async () => {
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
