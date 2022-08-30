import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import TESTVaultImpl1Artifact from '../../artifacts/contracts/yellow/test/TESTVaultImpl1.sol/TESTVaultImpl1.json';
import TESTVaultImpl2Artifact from '../../artifacts/contracts/yellow/test/TESTVaultImpl2.sol/TESTVaultImpl2.json';
import TESTVaultImpl3Artifact from '../../artifacts/contracts/yellow/test/TESTVaultImpl3.sol/TESTVaultImpl3.json';

import {
  ALREADY_INITIALIZED,
  ALREADY_MIGRATED,
  MUST_NOT_THROUGH_DELEGATECALL,
  MUST_THROUGH_DELEGATECALL,
  NEWER_IMPL_SET,
  NEWER_IMPL_ZERO,
  NOT_ADMIN,
  INVALID_NEWER_IMPL,
} from './revert-reasons';

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
      ).to.be.revertedWith(INVALID_NEWER_IMPL);
    });

    it('revert on setting newer implementation to itself', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      await expect(
        VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl1.address)
      ).to.be.revertedWith(INVALID_NEWER_IMPL);
    });

    it('revert on setting newer implementation to same address', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplAddress = Wallet.createRandom().address;
      await VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress);
      await expect(
        VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress)
      ).to.be.revertedWith(NEWER_IMPL_SET);
    });

    // ======================
    // Only proxy
    // ======================
    it('revert on call `initialize` not via proxy', async () => {
      await expect(VaultImpl1.initialize()).to.be.revertedWith(MUST_THROUGH_DELEGATECALL);
    });

    it('revert on call `applyUpgrade` not via proxy', async () => {
      await expect(VaultImpl1.applyUpgrade()).to.be.revertedWith(MUST_THROUGH_DELEGATECALL);
    });

    it('revert on call `upgrade` not via proxy', async () => {
      await expect(VaultImpl1.upgrade()).to.be.revertedWith(MUST_THROUGH_DELEGATECALL);
    });

    // ======================
    // Events
    // ======================
    it.skip('event emitted on admin change', async () => {
      // TODO
    });

    it.skip('event emitted on newer implementation set', async () => {
      // TODO
    });
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

    // ======================
    // Implementation address
    // ======================
    it('returns correct implementation address', async () => {
      expect(await VaultProxy.getImplementation()).to.be.equal(VaultImpl1.address);
    });

    // ======================
    // Events
    // ======================
    it.skip('event emitted on admin change', async () => {
      // TODO
    });
  });

  describe('Vault upgradability', () => {
    let VaultImpl2: Contract;
    let VaultImpl3: Contract;
    let VaultProxy: Contract;
    let VaultImpl1Proxied: Contract;
    let VaultImpl2Proxied: Contract;
    let VaultImpl3Proxied: Contract;

    beforeEach(async () => {
      const VaultImpl2Factory = await ethers.getContractFactory('TESTVaultImpl2');
      VaultImpl2 = await VaultImpl2Factory.connect(implAdmin).deploy();
      await VaultImpl2.deployed();

      const VaultImpl3Factory = await ethers.getContractFactory('TESTVaultImpl3');
      VaultImpl3 = await VaultImpl3Factory.connect(implAdmin).deploy();
      await VaultImpl3.deployed();

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      VaultImpl1Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl1Artifact.abi);

      // Defining early to be accessible further in the code
      VaultImpl2Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl2Artifact.abi);
      VaultImpl3Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl3Artifact.abi);
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
    it('revert on call `getNewerImplementation` via proxy', async () => {
      await expect(VaultImpl1Proxied.connect(user).getNewerImplementation()).to.be.revertedWith(
        MUST_NOT_THROUGH_DELEGATECALL
      );
    });

    it('revert on call `setNewerImplementation` via proxy', async () => {
      await expect(
        VaultImpl1Proxied.connect(implAdmin).setNewerImplementation(VaultImpl2.address)
      ).to.be.revertedWith(MUST_NOT_THROUGH_DELEGATECALL);
    });

    // ======================
    // Initialize
    // ======================
    it('implementation is initialized', async () => {
      expect(await VaultImpl1Proxied.connect(user).initializedVersion()).to.be.equal(1);
    });

    it('revert on call `initialize` when initialized', async () => {
      expect(await VaultImpl1Proxied.connect(user).initializedVersion()).to.be.equal(1);
      await expect(VaultImpl1Proxied.connect(proxyAdmin).initialize()).to.be.revertedWith(
        ALREADY_INITIALIZED
      );
    });

    it('initialize when 1 newer impl available', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      // overwrite value set in `beforeAll` hook
      VaultImpl2Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl2Artifact.abi);

      expect(await VaultImpl2Proxied.connect(user).initializedVersion()).to.be.equal(2);
    });

    it('initialize when 2 newer impl available', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl2.connect(implAdmin).setNewerImplementation(VaultImpl3.address);

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      const VaultImpl3Proxied = new ethers.Contract(VaultProxy.address, TESTVaultImpl3Artifact.abi);

      expect(await VaultImpl3Proxied.connect(user).initializedVersion()).to.be.equal(3);
    });

    // ======================
    // Upgrade
    // ======================
    it('upgrade when 1 newer contract available', async () => {
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
      expect(await VaultImpl2Proxied.connect(user).version()).to.be.equal(2);
      // NOTE: using VaultImpl2Proxied here as we upgraded to it
      expect(await VaultImpl2Proxied.connect(user).presentV2AbsentV1()).to.be.true;
      try {
        VaultImpl2Proxied.connect(user).presentV1AbsentV2();
      } catch (e) {
        expect(e).not.to.be.undefined;
      }
    });

    it('upgrade when 2 newer contracts available', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl2.connect(implAdmin).setNewerImplementation(VaultImpl3.address);

      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      expect(await VaultImpl3Proxied.connect(user).version()).to.be.equal(3);
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

    it('revert on second upgrading without impl address set', async () => {
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
    it('migrate when 1 newer implementation available', async () => {
      expect(await VaultImpl1Proxied.connect(user).version()).to.be.equal(1);
      expect(await VaultImpl1Proxied.connect(user).migrationInvoked()).to.be.equal(0);

      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      expect(await VaultImpl2Proxied.connect(user).version()).to.be.equal(2);
      expect(await VaultImpl2Proxied.connect(user).migrationInvoked()).to.be.equal(1);
    });

    it('migrate when 2 newer implementation available', async () => {
      expect(await VaultImpl1Proxied.connect(user).version()).to.be.equal(1);
      expect(await VaultImpl1Proxied.connect(user).migrationInvoked()).to.be.equal(0);

      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl2.connect(implAdmin).setNewerImplementation(VaultImpl3.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      expect(await VaultImpl3Proxied.connect(user).version()).to.be.equal(3);
      expect(await VaultImpl3Proxied.connect(user).migrationInvoked()).to.be.equal(2);
    });

    it('revert on call `applyUpgrade` after initialization', async () => {
      await expect(VaultImpl1Proxied.connect(implAdmin).applyUpgrade()).to.be.revertedWith(
        ALREADY_MIGRATED
      );
    });

    it('revert on migrating called after migration', async () => {
      await expect(VaultImpl1Proxied.connect(implAdmin).applyUpgrade()).to.be.revertedWith(
        ALREADY_MIGRATED
      );

      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      await expect(VaultImpl2Proxied.connect(implAdmin).applyUpgrade()).to.be.revertedWith(
        ALREADY_MIGRATED
      );
    });
  });
});
