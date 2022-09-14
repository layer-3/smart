import {expect} from 'chai';
import {Contract} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import VaultImplArtifact from '../../artifacts/contracts/yellow/VaultImpl.sol/VaultImpl.json';
import {VaultImpl as VaultImplT, TESTVaultProxy} from '../../typechain/';

import {
  ACCOUNT_MISSING_ROLE,
  INVALID_VIRTUAL_ADDRESS,
  SIGNER_NOT_BROKER,
  SIGNER_NOT_COSIGNER,
  VAULT_ALREADY_SETUP,
} from './src/revert-reasons';
import {encodeAndSign} from './src/signatures';
import {BROKER_ADDRESS_SET, COSIGNER_ADDRESS_SET} from './src/event-names';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;

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
    const VaultImplDirect = await VaultImplFactory.connect(implAdmin).deploy();
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
    // virtual addresses
    // ======================
    describe('virtual addresses before setup', () => {
      async function setup(
        caller: SignerWithAddress,
        brokerVirtualAddress: string,
        coSignerVirtualAddress: string,
        reason: string | undefined
      ) {
        if (reason) {
          await expect(
            VaultImpl.connect(caller).setup(brokerVirtualAddress, coSignerVirtualAddress)
          ).to.be.revertedWith(reason);
        } else {
          // must not revert
          await VaultImpl.connect(caller).setup(brokerVirtualAddress, coSignerVirtualAddress);
        }
      }

      it('virtual addresses are not setup', async () => {
        expect(await VaultImpl.connect(someone).getBrokerVirtualAddress()).to.equal(AddressZero);
        expect(await VaultImpl.connect(someone).getCoSignerVirtualAddress()).to.equal(AddressZero);
      });

      it('accept when proxy admin setup', async () =>
        await setup(proxyAdmin, broker1.address, coSigner1.address, undefined));

      it('revert on setup broker to zero address', async () =>
        await setup(proxyAdmin, AddressZero, coSigner1.address, INVALID_VIRTUAL_ADDRESS));

      it('revert on setup coSigner to zero address', async () =>
        await setup(proxyAdmin, broker1.address, AddressZero, INVALID_VIRTUAL_ADDRESS));

      it('revert on not admin setup', async () =>
        await setup(
          someone,
          broker1.address,
          coSigner1.address,
          ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE)
        ));

      it('revert on second setup', async () => {
        await VaultImpl.connect(proxyAdmin).setup(broker1.address, coSigner1.address);
        await setup(proxyAdmin, broker1.address, coSigner1.address, VAULT_ALREADY_SETUP);
      });
    });

    describe('virtual addresses after setup', () => {
      beforeEach(async () => {
        await VaultImpl.connect(proxyAdmin).setup(broker1.address, coSigner1.address);
      });

      it('broker virtual address is set after setup', async () => {
        expect(await VaultImpl.connect(someone).getBrokerVirtualAddress()).to.equal(
          broker1.address
        );
      });

      it('coSigner virtual address is set after setup', async () => {
        expect(await VaultImpl.connect(someone).getCoSignerVirtualAddress()).to.equal(
          coSigner1.address
        );
      });

      it('can set broker virtual address with broker sig', async () => {
        // must not revert
        await VaultImpl.connect(someone).setBrokerVirtualAddress(
          ...(await encodeAndSign(broker2.address, broker1))
        );
      });

      it('can set coSigner virtual address with coSigner sig', async () => {
        // must not revert
        await VaultImpl.connect(someone).setCoSignerVirtualAddress(
          ...(await encodeAndSign(coSigner2.address, coSigner1))
        );
      });

      it('revert on set broker virtual address with not broker sig', async () => {
        await expect(
          VaultImpl.connect(someone).setBrokerVirtualAddress(
            ...(await encodeAndSign(broker2.address, someone))
          )
        ).to.be.revertedWith(SIGNER_NOT_BROKER);
      });

      it('revert on set coSigner virtual address with not coSigner sig', async () => {
        await expect(
          VaultImpl.connect(someone).setCoSignerVirtualAddress(
            ...(await encodeAndSign(coSigner2.address, someone))
          )
        ).to.be.revertedWith(SIGNER_NOT_COSIGNER);
      });

      it('revert on set broker virtual address to zero address', async () => {
        await expect(
          VaultImpl.connect(someone).setBrokerVirtualAddress(
            ...(await encodeAndSign(AddressZero, broker1))
          )
        ).to.be.revertedWith(INVALID_VIRTUAL_ADDRESS);
      });

      it('revert on set coSigner virtual address to zero address', async () => {
        await expect(
          VaultImpl.connect(someone).setCoSignerVirtualAddress(
            ...(await encodeAndSign(AddressZero, coSigner1))
          )
        ).to.be.revertedWith(INVALID_VIRTUAL_ADDRESS);
      });

      // virtual address events
      it('emit event on successful set broker address', async () => {
        const tx = await VaultImpl.connect(someone).setBrokerVirtualAddress(
          ...(await encodeAndSign(broker2.address, broker1))
        );

        const receipt = await tx.wait();
        const event = receipt.events?.pop();

        expect(event).not.to.be.undefined;

        // workaround ts undefined checks
        if (event != undefined && event.args != undefined) {
          expect(event.event).to.be.equal(BROKER_ADDRESS_SET);
          const {newBrokerVirtualAddress} = event.args;
          expect(newBrokerVirtualAddress).to.be.equal(broker2.address);
        }
      });

      it('emit event on successful set broker address', async () => {
        const tx = await VaultImpl.connect(someone).setCoSignerVirtualAddress(
          ...(await encodeAndSign(coSigner2.address, coSigner1))
        );

        const receipt = await tx.wait();
        const event = receipt.events?.pop();

        expect(event).not.to.be.undefined;

        // workaround ts undefined checks
        if (event != undefined && event.args != undefined) {
          expect(event.event).to.be.equal(COSIGNER_ADDRESS_SET);
          const {newCoSignerVirtualAddress} = event.args;
          expect(newCoSignerVirtualAddress).to.be.equal(coSigner2.address);
        }
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

      it('revert on action not deposit', async () => {
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

      it('revert on wrong impl address', async () => {
        //todo
      });

      it('revert on wrong chain id', async () => {
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

      it('revert on action not withdraw', async () => {
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

      it('revert on wrong impl address', async () => {
        //todo
      });

      it('revert on wrong chain id', async () => {
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

      it('revert when withdrawing with anothers signature', async () => {
        //todo
      });
    });
  });

  describe('Multiple proxies interaction', () => {
    it('revert on supply signature from wrong broker', async () => {
      //todo
    });

    // other tests?
  });
});
