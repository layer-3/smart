import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import TESTVaultUpgradability1Artifact from '../../artifacts/contracts/yellow/test/TESTVaultUpgradability1.sol/TESTVaultUpgradability1.json';
import TESTVaultUpgradability2Artifact from '../../artifacts/contracts/yellow/test/TESTVaultUpgradability2.sol/TESTVaultUpgradability2.json';
import TESTVaultUpgradability3Artifact from '../../artifacts/contracts/yellow/test/TESTVaultUpgradability3.sol/TESTVaultUpgradability3.json';

import {
  ALREADY_INITIALIZED,
  ALREADY_MIGRATED,
  MUST_NOT_THROUGH_DELEGATECALL,
  MUST_THROUGH_DELEGATECALL,
  NEWER_IMPL_IS_SET,
  NEWER_IMPL_ZERO,
  NOT_ADMIN,
  NOT_MAINTAINER,
  INVALID_NEWER_IMPL,
  ACCOUNT_MISSING_ROLE,
} from './revert-reasons';
import {NEWER_IMPL_SET, ROLE_GRANTED, UPGRADED} from './event-names';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('MAINTAINER_ROLE');

describe('Vault Upgradability Contracts', async () => {
  let implAdmin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let user: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;

  let VaultImpl1: Contract;

  beforeEach(async () => {
    const VaultImpl1Factory = await ethers.getContractFactory('TESTVaultUpgradability1');
    VaultImpl1 = await VaultImpl1Factory.connect(implAdmin).deploy();
    await VaultImpl1.deployed();
  });

  before(async () => {
    [implAdmin, proxyAdmin, user, someone, someother] = await ethers.getSigners();
  });

  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  // Implementation
  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  describe('Implementation', () => {
    // ======================
    // Roles
    // ======================
    it('deployer is admin', async () => {
      expect(await VaultImpl1.hasRole(ADM_ROLE, implAdmin.address)).to.be.true;
    });

    it('deployer is maintainer', async () => {
      expect(await VaultImpl1.hasRole(MNTR_ROLE, implAdmin.address)).to.be.true;
    });

    it('admin can grant admin and maintainer', async () => {
      await VaultImpl1.connect(implAdmin).grantRole(ADM_ROLE, someone.address);
      expect(await VaultImpl1.hasRole(ADM_ROLE, someone.address)).to.be.true;

      await VaultImpl1.connect(implAdmin).grantRole(MNTR_ROLE, someother.address);
      expect(await VaultImpl1.hasRole(MNTR_ROLE, someother.address)).to.be.true;
    });

    it('revert on maintainer granting any role', async () => {
      await VaultImpl1.connect(implAdmin).grantRole(MNTR_ROLE, someone.address);
      expect(await VaultImpl1.hasRole(MNTR_ROLE, someone.address)).to.be.true;

      await expect(
        VaultImpl1.connect(someone).grantRole(MNTR_ROLE, someother.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE));

      await expect(
        VaultImpl1.connect(someone).grantRole(ADM_ROLE, someother.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE));
    });

    it('revert on someone granting any role', async () => {
      await expect(
        VaultImpl1.connect(someone).grantRole(ADM_ROLE, someother.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE));

      await expect(
        VaultImpl1.connect(someone).grantRole(MNTR_ROLE, someother.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE));
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

    it('maintainer can set newer implementation', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);

      await VaultImpl1.connect(implAdmin).grantRole(MNTR_ROLE, someone.address);
      expect(await VaultImpl1.hasRole(MNTR_ROLE, someone.address)).to.be.true;

      const newerImplAddress = Wallet.createRandom().address;
      await VaultImpl1.connect(someone).setNewerImplementation(newerImplAddress);
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(newerImplAddress);
    });

    it('revert on someone set newer implementation', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplAddress = Wallet.createRandom().address;
      await expect(
        VaultImpl1.connect(someone).setNewerImplementation(newerImplAddress)
      ).to.be.revertedWith(NOT_MAINTAINER);
    });

    it('revert on setting different newer implementations twice', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const oneNewerImplAddress = Wallet.createRandom().address;
      await VaultImpl1.connect(implAdmin).setNewerImplementation(oneNewerImplAddress);
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(oneNewerImplAddress);

      const otherNewerImplAddress = Wallet.createRandom().address;
      await expect(
        VaultImpl1.connect(implAdmin).setNewerImplementation(otherNewerImplAddress)
      ).to.be.revertedWith(NEWER_IMPL_IS_SET);
    });

    it('revert on setting the same newer implementation twice', async () => {
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(AddressZero);
      const newerImplAddress = Wallet.createRandom().address;
      await VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress);
      expect(await VaultImpl1.getNewerImplementation()).to.be.equal(newerImplAddress);
      await expect(
        VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress)
      ).to.be.revertedWith(NEWER_IMPL_IS_SET);
    });

    /** @dev This testcase it present to avoid emitting NewerImplementationSet event */
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
    it('event emitted on grant role', async () => {
      const tx = await VaultImpl1.connect(implAdmin).grantRole(ADM_ROLE, someone.address);

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event != undefined && event.args != undefined) {
        expect(event.event).to.be.equal(ROLE_GRANTED);
        const {role, account, sender} = event.args;
        expect(role).to.be.equal(ADM_ROLE);
        expect(sender).to.be.equal(implAdmin.address);
        expect(account).to.be.equal(someone.address);
      }
    });

    it('event emitted on newer implementation set', async () => {
      const newerImplAddress = Wallet.createRandom().address;
      const tx = await VaultImpl1.connect(implAdmin).setNewerImplementation(newerImplAddress);

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event != undefined && event.args != undefined) {
        expect(event.event).to.be.equal(NEWER_IMPL_SET);
        const {newerImplementation} = event.args;
        expect(newerImplementation).to.be.equal(newerImplAddress);
      }
    });
  });

  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  // Proxy
  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  describe('Proxy', () => {
    let VaultProxy: Contract;
    let VaultImplProxied: Contract;

    beforeEach(async () => {
      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      VaultImplProxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability1Artifact.abi
      );
    });

    // ======================
    // Roles
    // ======================
    /**
     * @dev As Proxy contract is always deployed with a reference to the implementation, Proxy admin logic must be used with the Proxied interface.
     */
    it('deployer is admin', async () => {
      expect(await VaultImplProxied.connect(proxyAdmin).hasRole(ADM_ROLE, proxyAdmin.address)).to.be
        .true;
    });

    it('deployer is maintainer', async () => {
      expect(await VaultImplProxied.connect(proxyAdmin).hasRole(MNTR_ROLE, proxyAdmin.address)).to
        .be.true;
    });

    it('admin can grant admin and maintainer', async () => {
      await VaultImplProxied.connect(proxyAdmin).grantRole(ADM_ROLE, someone.address);
      expect(await VaultImplProxied.connect(proxyAdmin).hasRole(ADM_ROLE, someone.address)).to.be
        .true;

      await VaultImplProxied.connect(proxyAdmin).grantRole(MNTR_ROLE, someother.address);
      expect(await VaultImplProxied.connect(proxyAdmin).hasRole(MNTR_ROLE, someother.address)).to.be
        .true;
    });

    it('revert on someone granting roles', async () => {
      await expect(
        VaultImplProxied.connect(someone).grantRole(ADM_ROLE, someother.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE));

      await expect(
        VaultImplProxied.connect(someone).grantRole(MNTR_ROLE, someother.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE));
    });

    // ======================
    // Implementation address
    // ======================
    it('return correct implementation address', async () => {
      expect(await VaultProxy.getImplementation()).to.be.equal(VaultImpl1.address);
    });

    // ======================
    // Not delegated
    // ======================
    it('revert on call `getNewerImplementation` via proxy', async () => {
      await expect(VaultImplProxied.connect(user).getNewerImplementation()).to.be.revertedWith(
        MUST_NOT_THROUGH_DELEGATECALL
      );
    });

    it('revert on call `setNewerImplementation` via proxy', async () => {
      const newerImplAddress = Wallet.createRandom().address;
      await expect(
        VaultImplProxied.connect(implAdmin).setNewerImplementation(newerImplAddress)
      ).to.be.revertedWith(MUST_NOT_THROUGH_DELEGATECALL);
    });

    // ======================
    // Events
    // ======================
    /**
     * @dev As Proxy contract is always deployed with a reference to the implementation, Proxy admin logic must be seek using the Proxied interface.
     */
    it('event emitted on grant role', async () => {
      const tx = await VaultImplProxied.connect(proxyAdmin).grantRole(ADM_ROLE, someone.address);

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event != undefined && event.args != undefined) {
        expect(event.event).to.be.equal(ROLE_GRANTED);
        const {role, account, sender} = event.args;
        expect(role).to.be.equal(ADM_ROLE);
        expect(account).to.be.equal(someone.address);
        expect(sender).to.be.equal(proxyAdmin.address);
      }
    });
  });

  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  // Vault upgradability
  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  describe('Vault upgradability', () => {
    let VaultImpl2: Contract;
    let VaultImpl3: Contract;
    let VaultProxy: Contract;
    let VaultImpl1Proxied: Contract;
    let VaultImpl2Proxied: Contract;
    let VaultImpl3Proxied: Contract;

    beforeEach(async () => {
      const VaultImpl2Factory = await ethers.getContractFactory('TESTVaultUpgradability2');
      VaultImpl2 = await VaultImpl2Factory.connect(implAdmin).deploy();
      await VaultImpl2.deployed();

      const VaultImpl3Factory = await ethers.getContractFactory('TESTVaultUpgradability3');
      VaultImpl3 = await VaultImpl3Factory.connect(implAdmin).deploy();
      await VaultImpl3.deployed();

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      VaultImpl1Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability1Artifact.abi
      );

      // Defining early to be accessible further in the code
      VaultImpl2Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability2Artifact.abi
      );
      VaultImpl3Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability3Artifact.abi
      );
    });

    // ======================
    // Roles
    // ======================
    it('proxy deployer is admin and maintainer', async () => {
      expect(await VaultImpl1Proxied.connect(implAdmin).hasRole(ADM_ROLE, proxyAdmin.address)).to.be
        .true;
      expect(await VaultImpl1Proxied.connect(implAdmin).hasRole(MNTR_ROLE, proxyAdmin.address)).to
        .be.true;

      expect(await VaultImpl1Proxied.connect(proxyAdmin).hasRole(ADM_ROLE, proxyAdmin.address)).to
        .be.true;
      expect(await VaultImpl1Proxied.connect(proxyAdmin).hasRole(MNTR_ROLE, proxyAdmin.address)).to
        .be.true;
    });

    it('proxy admin can grant proxy roles', async () => {
      await VaultImpl1Proxied.connect(proxyAdmin).grantRole(ADM_ROLE, someone.address);
      expect(await VaultImpl1Proxied.connect(proxyAdmin).hasRole(ADM_ROLE, someone.address)).to.be
        .true;

      await VaultImpl1Proxied.connect(proxyAdmin).grantRole(MNTR_ROLE, someother.address);
      expect(await VaultImpl1Proxied.connect(proxyAdmin).hasRole(MNTR_ROLE, someother.address)).to
        .be.true;
    });

    it('revert on impl admin granting roles', async () => {
      await expect(
        VaultImpl1Proxied.connect(implAdmin).grantRole(ADM_ROLE, someone.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(implAdmin.address, ADM_ROLE));

      await expect(
        VaultImpl1Proxied.connect(implAdmin).grantRole(MNTR_ROLE, someone.address)
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(implAdmin.address, ADM_ROLE));
    });

    it('proxy roles does not overlap impl roles', async () => {
      expect(await VaultImpl1Proxied.connect(implAdmin).hasRole(ADM_ROLE, proxyAdmin.address)).to.be
        .true;
      await VaultImpl1.connect(implAdmin).grantRole(ADM_ROLE, someone.address);

      expect(await VaultImpl1.hasRole(ADM_ROLE, someone.address)).to.be.true;
      expect(await VaultImpl1Proxied.connect(implAdmin).hasRole(ADM_ROLE, someone.address)).to.be
        .false;
      expect(await VaultImpl1Proxied.connect(implAdmin).hasRole(ADM_ROLE, proxyAdmin.address)).to.be
        .true;

      await VaultImpl1Proxied.connect(proxyAdmin).grantRole(ADM_ROLE, someother.address);
      expect(await VaultImpl1.hasRole(ADM_ROLE, someother.address)).to.be.false;
      expect(await VaultImpl1Proxied.connect(proxyAdmin).hasRole(ADM_ROLE, someother.address)).to.be
        .true;
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
      VaultImpl2Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability2Artifact.abi
      );

      expect(await VaultImpl2Proxied.connect(user).initializedVersion()).to.be.equal(2);
    });

    it('initialize when 2 newer impl available', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl2.connect(implAdmin).setNewerImplementation(VaultImpl3.address);

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = await VaultProxyFactory.connect(proxyAdmin).deploy(VaultImpl1.address);
      await VaultProxy.deployed();

      const VaultImpl3Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability3Artifact.abi
      );

      expect(await VaultImpl3Proxied.connect(user).initializedVersion()).to.be.equal(3);
    });

    // ======================
    // Upgrade
    // ======================
    it('admin can upgrade', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(proxyAdmin).upgrade();
    });

    it('maintainer can upgrade', async () => {
      await VaultImpl1Proxied.connect(proxyAdmin).grantRole(MNTR_ROLE, someone.address);
      expect(await VaultImpl1Proxied.connect(proxyAdmin).hasRole(MNTR_ROLE, someone.address)).to.be
        .true;

      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      await VaultImpl1Proxied.connect(someone).upgrade();
    });

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

    // ======================
    // Events
    // ======================
    it('event emitted on upgrade', async () => {
      await VaultImpl1.connect(implAdmin).setNewerImplementation(VaultImpl2.address);
      const tx = await VaultImpl1Proxied.connect(proxyAdmin).upgrade();

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event != undefined && event.args != undefined) {
        expect(event.event).to.be.equal(UPGRADED);
        const {implementation} = event.args;
        expect(implementation).to.be.equal(VaultImpl2.address);
      }
    });
  });
});
