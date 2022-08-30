import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import TESTVaultImpl1Artifact from '../../artifacts/contracts/yellow/test/TESTVaultImpl1.sol/TESTVaultImpl1.json';
import TESTVaultImpl2Artifact from '../../artifacts/contracts/yellow/test/TESTVaultImpl2.sol/TESTVaultImpl2.json';

import {NEWER_IMPL_SET, NEWER_IMPL_ZERO, NOT_ADMIN, PROP_NEWER_IMPL_ZERO} from './revert-reasons';

const AddressZero = ethers.constants.AddressZero;

describe('Vault Upgradability Contracts', async () => {
  let implAdmin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let user: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;

  let VaultImpl1: Contract;

  beforeEach(async () => {
    const VaultImpl1Factory = await ethers.getContractFactory('TESTVaultImpl1');
    VaultImpl1 = await VaultImpl1Factory.connect(implAdmin).deploy();
    await VaultImpl1.deployed();
  });

  before(async () => {
    [implAdmin, proxyAdmin, user, someone, someother] = await ethers.getSigners();
  });

  describe('Implementation', () => {
    // ======================
    // ADMIN
    // ======================
    it('deployer is admin', async () => {
      expect(await VaultImpl1.getAdmin()).to.be.equal(implAdmin.address);
    });

    it('admin can change admin', async () => {
      await VaultImpl1.connect(implAdmin).changeAdmin(someone.address);
      expect(await VaultImpl1.getAdmin()).to.be.equal(someone.address);
    });

    it('revert on someone changing admin', async () => {
      await expect(VaultImpl1.connect(someone).changeAdmin(someother.address)).to.be.revertedWith(
        NOT_ADMIN
      );
    });

    it.skip('event emitted on admin change', async () => {
      // TODO
    });

    // ======================
    // ERC1822
    // ======================
    it('ERC1822 compliant', async () => {
      const ImplementationSlot =
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      expect(await VaultImpl1.proxiableUUID()).to.be.equal(ImplementationSlot);
    });

    // ======================
    // Newer implementation
    // ======================
    it('newer implementation is 0x0', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
    });

    it('admin can set newer implementation', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplAddress = Wallet.createRandom().address;
      await VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress);
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(newerImplAddress);
    });

    it('revert on someone set newer implementation', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplAddress = Wallet.createRandom().address;
      await expect(
        VaultImpl1.connect(someone).setNewerImplementation(newerImplAddress)
      ).to.be.revertedWith(NOT_ADMIN);
    });

    it('revert on setting newer implementation twice', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplAddress = Wallet.createRandom().address;
      await VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress);
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(newerImplAddress);
      await expect(
        VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress)
      ).to.be.revertedWith(NEWER_IMPL_SET);
    });

    it('revert on setting newer implementation to zero address', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplZero = ethers.constants.AddressZero;
      await expect(
        VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplZero)
      ).to.be.revertedWith(PROP_NEWER_IMPL_ZERO);
    });

    it.skip('event emitted on newer implementation set', async () => {
      // TODO
    });

    // ======================
    // Only proxy
    // ======================
    // TODO
  });

  describe('Proxy', () => {
    let VaultProxy: Contract;

    beforeEach(async () => {
      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();
    });

    // ======================
    // ADMIN
    // ======================
    it('deployer is admin', async () => {
      expect(await VaultProxy.getAdmin()).to.be.equal(proxyAdmin.address);
    });

    it('admin can change admin', async () => {
      await VaultProxy.connect(proxyAdmin).changeAdmin(someone.address);
      expect(await VaultProxy.getAdmin()).to.be.equal(someone.address);
    });

    it('revert on someone changing admin', async () => {
      await expect(VaultProxy.connect(someone).changeAdmin(someother.address)).to.be.revertedWith(
        NOT_ADMIN
      );
    });

    it.skip('event emitted on admin change', async () => {
      // TODO
    });

    // ======================
    // Implementation address
    // ======================
    it('returns correct implementation address', async () => {
      expect(await VaultProxy.getImplementation()).to.be.equal(VaultImpl1.address);
    });
  });

  describe('Vault upgradability', () => {
    let VaultImpl2: Contract;
    let VaultProxy: Contract;
    let VaultImpl1Proxied: Contract;
    let VaultImpl2Proxied: Contract;

    beforeEach(async () => {
      const VaultImpl2Factory = await ethers.getContractFactory('TESTVaultImpl2');
      VaultImpl2 = await VaultImpl2Factory.connect(implAdmin).deploy();
      await VaultImpl2.deployed();

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      VaultImpl1Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl1Artifact.abi);

      // Defining early to be accessible further in the code
      VaultImpl2Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl2Artifact.abi);
    });

    // ======================
    // ADMIN
    // ======================
    it('admin is proxy deployer', async () => {
      expect(await VaultImpl1Proxied.connect(implAdmin).getAdmin()).to.be.equal(proxyAdmin.address);
      expect(await VaultImpl1Proxied.connect(proxyAdmin).getAdmin()).to.be.equal(
        proxyAdmin.address
      );
    });

    // ======================
    // Not delegated
    // ======================
    // TODO

    // ======================
    // Initialize
    // ======================
    it('implementation is initialized', async () => {
      expect(await VaultImpl1Proxied.connect(user).initialized()).to.be.true;
    });

    // ======================
    // Upgrade
    // ======================
    it('can upgrade', async () => {
      // v1
      // Note: connecting user (3rd party address) to avoid any address collisions
      expect(await VaultImpl1Proxied.connect(user).version()).to.be.equal(1);

      expect(await VaultImpl1Proxied.connect(user).presentV1AbsentV2()).to.be.true;
      try {
        VaultImpl1Proxied.connect(user).presentV2AbsentV1();
      } catch (e) {
        expect(e).not.to.be.null;
      }

      // upgrading
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      // v2
      expect(await VaultImpl1Proxied.connect(user).version()).to.be.equal(2);

      // NOTE: using VaultImpl2Proxied here as we upgraded to it
      expect(await VaultImpl2Proxied.connect(user).presentV2AbsentV1()).to.be.true;
      try {
        VaultImpl2Proxied.connect(user).presentV1AbsentV2();
      } catch (e) {
        expect(e).not.to.be.undefined;
      }
    });

    it('revert on upgrade to zero address', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      await expect(VaultImpl1Proxied.connect(proxyAdmin).upgrade()).to.be.revertedWith(
        NEWER_IMPL_ZERO
      );
    });

    it('revert on someone upgrading', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await expect(VaultImpl1Proxied.connect(someone).upgrade()).to.be.revertedWith(NOT_ADMIN);
    });

    it('revert on upgrading right after upgrading', async () => {
      expect(await VaultImpl1Proxied.connect(user).version()).to.be.equal(1);

      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      expect(await VaultImpl2Proxied.connect(user).version()).to.be.equal(2);

      await expect(VaultImpl2Proxied.connect(proxyAdmin).upgrade()).to.be.revertedWith(
        NEWER_IMPL_ZERO
      );
    });

    // ======================
    // Migrate
    // ======================
    it('can migrate', async () => {
      expect(await VaultImpl1Proxied.connect(user).currentVersion()).to.be.equal(1);

      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      expect(await VaultImpl2Proxied.connect(user).currentVersion()).to.be.equal(2);
    });
  });
});
