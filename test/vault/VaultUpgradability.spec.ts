import {expect} from 'chai';
import {Contract, Wallet} from 'ethers';
import type {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import TESTVaultUpgradability1Artifact from '../../artifacts/contracts/vault/test/TESTVaultUpgradeability1.sol/TESTVaultUpgradeability1.json';
import TESTVaultUpgradability2Artifact from '../../artifacts/contracts/vault/test/TESTVaultUpgradeability2.sol/TESTVaultUpgradeability2.json';
import TESTVaultUpgradability3Artifact from '../../artifacts/contracts/vault/test/TESTVaultUpgradeability3.sol/TESTVaultUpgradeability3.json';
import {
  ACCOUNT_MISSING_ROLE,
  ALREADY_INITIALIZED,
  ALREADY_MIGRATED,
  INVALID_NEXT_IMPL,
  MUST_NOT_THROUGH_DELEGATECALL,
  MUST_THROUGH_DELEGATECALL,
  NEXT_IMPL_IS_SET,
  NEXT_IMPL_ZERO,
  NOT_ADMIN,
  NOT_MAINTAINER,
} from '../../src/revert-reasons';
import {NEXT_IMPL_SET, ROLE_GRANTED, UPGRADED} from '../../src/event-names';
import type {
  TESTVaultUpgradeability1,
  TESTVaultUpgradeability2,
  TESTVaultUpgradeability3,
  VaultImplV1,
  VaultProxy,
} from '../../typechain';
import {connect, connectGroup} from '../../src/contracts';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;
const MNTR_ROLE = ethers.utils.id('MAINTAINER_ROLE');

describe('Vault Upgradeability Contracts', () => {
  let implAdmin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let user: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;

  let VaultImpl1: VaultImplV1;
  let VaultImplAsImplAdmin: VaultImplV1;
  let VaultImplAsSomeone: VaultImplV1;

  beforeEach(async () => {
    const VaultImpl1Factory = await ethers.getContractFactory('TESTVaultUpgradeability1');
    VaultImpl1 = (await VaultImpl1Factory.connect(implAdmin).deploy()) as VaultImplV1;
    await VaultImpl1.deployed();

    [VaultImplAsImplAdmin, VaultImplAsSomeone] = connectGroup(VaultImpl1, [implAdmin, someone]);
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
      await VaultImplAsImplAdmin.grantRole(ADM_ROLE, someone.address);
      expect(await VaultImpl1.hasRole(ADM_ROLE, someone.address)).to.be.true;

      await VaultImplAsImplAdmin.grantRole(MNTR_ROLE, someother.address);
      expect(await VaultImpl1.hasRole(MNTR_ROLE, someother.address)).to.be.true;
    });

    it('revert on maintainer granting any role', async () => {
      await VaultImplAsImplAdmin.grantRole(MNTR_ROLE, someone.address);
      expect(await VaultImpl1.hasRole(MNTR_ROLE, someone.address)).to.be.true;

      await expect(VaultImplAsSomeone.grantRole(MNTR_ROLE, someother.address)).to.be.revertedWith(
        ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE),
      );

      await expect(VaultImplAsSomeone.grantRole(ADM_ROLE, someother.address)).to.be.revertedWith(
        ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE),
      );
    });

    it('revert on someone granting any role', async () => {
      await expect(VaultImplAsSomeone.grantRole(ADM_ROLE, someother.address)).to.be.revertedWith(
        ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE),
      );

      await expect(VaultImplAsSomeone.grantRole(MNTR_ROLE, someother.address)).to.be.revertedWith(
        ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE),
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
    // Next implementation
    // ======================
    it('next implementation is 0x0', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
    });

    it('admin can set next implementation', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      const nextImplAddress = Wallet.createRandom().address;
      await VaultImplAsImplAdmin.setNextImplementation(nextImplAddress);
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(nextImplAddress);
    });

    it('maintainer can set next implementation', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);

      await VaultImplAsImplAdmin.grantRole(MNTR_ROLE, someone.address);
      expect(await VaultImpl1.hasRole(MNTR_ROLE, someone.address)).to.be.true;

      const nextImplAddress = Wallet.createRandom().address;
      await VaultImplAsSomeone.setNextImplementation(nextImplAddress);
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(nextImplAddress);
    });

    it('revert on someone set next implementation', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      const nextImplAddress = Wallet.createRandom().address;
      await expect(VaultImplAsSomeone.setNextImplementation(nextImplAddress)).to.be.revertedWith(
        NOT_MAINTAINER,
      );
    });

    it('revert on setting different next implementations twice', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      const oneNextImplAddress = Wallet.createRandom().address;
      await VaultImplAsImplAdmin.setNextImplementation(oneNextImplAddress);
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(oneNextImplAddress);

      const otherNextImplAddress = Wallet.createRandom().address;
      await expect(
        VaultImplAsImplAdmin.setNextImplementation(otherNextImplAddress),
      ).to.be.revertedWith(NEXT_IMPL_IS_SET);
    });

    it('revert on setting the same next implementation twice', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      const nextImplAddress = Wallet.createRandom().address;
      await VaultImplAsImplAdmin.setNextImplementation(nextImplAddress);
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(nextImplAddress);
      await expect(VaultImplAsImplAdmin.setNextImplementation(nextImplAddress)).to.be.revertedWith(
        NEXT_IMPL_IS_SET,
      );
    });

    /** @dev This test case it present to avoid emitting NextImplementationSet event */
    it('revert on setting next implementation to zero address', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      const nextImplZero = ethers.constants.AddressZero;
      await expect(VaultImplAsImplAdmin.setNextImplementation(nextImplZero)).to.be.revertedWith(
        INVALID_NEXT_IMPL,
      );
    });

    it('revert on setting next implementation to itself', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      await expect(
        VaultImplAsImplAdmin.setNextImplementation(VaultImpl1.address),
      ).to.be.revertedWith(INVALID_NEXT_IMPL);
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
      const tx = await VaultImplAsImplAdmin.grantRole(ADM_ROLE, someone.address);

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event?.args != undefined) {
        expect(event.event).to.be.equal(ROLE_GRANTED);
        const { role, account, sender } = event.args;
        expect(role).to.be.equal(ADM_ROLE);
        expect(sender).to.be.equal(implAdmin.address);
        expect(account).to.be.equal(someone.address);
      }
    });

    it('event emitted on next implementation set', async () => {
      const nextImplAddress = Wallet.createRandom().address;
      const tx = await VaultImplAsImplAdmin.setNextImplementation(nextImplAddress);

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event?.args != undefined) {
        expect(event.event).to.be.equal(NEXT_IMPL_SET);
        const { nextImplementation } = event.args;
        expect(nextImplementation).to.be.equal(nextImplAddress);
      }
    });
  });

  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  // Proxy
  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  describe('Proxy', () => {
    let VaultProxy: VaultProxy;
    let VaultImplProxied: VaultImplV1;

    let VaultProxiedAsProxyAdmin: VaultImplV1;
    let VaultProxiedAsImplAdmin: VaultImplV1;
    let VaultProxiedAsSomeone: VaultImplV1;

    beforeEach(async () => {
      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = (await VaultProxyFactory.connect(proxyAdmin).deploy(
        VaultImpl1.address,
      )) as VaultProxy;
      await VaultProxy.deployed();

      VaultImplProxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability1Artifact.abi,
      ) as VaultImplV1;

      [VaultProxiedAsProxyAdmin, VaultProxiedAsImplAdmin, VaultProxiedAsSomeone] = connectGroup(
        VaultImplProxied,
        [proxyAdmin, implAdmin, someone],
      );
    });

    // ======================
    // Roles
    // ======================
    /**
     * @dev As Proxy contract is always deployed with a reference to the implementation, Proxy admin logic must be used with the Proxied interface.
     */
    it('deployer is admin', async () => {
      expect(await VaultProxiedAsProxyAdmin.hasRole(ADM_ROLE, proxyAdmin.address)).to.be.true;
    });

    it('deployer is maintainer', async () => {
      expect(await VaultProxiedAsProxyAdmin.hasRole(MNTR_ROLE, proxyAdmin.address)).to.be.true;
    });

    it('admin can grant admin and maintainer', async () => {
      await VaultProxiedAsProxyAdmin.grantRole(ADM_ROLE, someone.address);
      expect(await VaultProxiedAsProxyAdmin.hasRole(ADM_ROLE, someone.address)).to.be.true;

      await VaultProxiedAsProxyAdmin.grantRole(MNTR_ROLE, someother.address);
      expect(await VaultProxiedAsProxyAdmin.hasRole(MNTR_ROLE, someother.address)).to.be.true;
    });

    it('revert on someone granting roles', async () => {
      await expect(VaultProxiedAsSomeone.grantRole(ADM_ROLE, someother.address)).to.be.revertedWith(
        ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE),
      );

      await expect(
        VaultProxiedAsSomeone.grantRole(MNTR_ROLE, someother.address),
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
    it('revert on call `getNextImplementation` via proxy', async () => {
      await expect(VaultProxiedAsSomeone.getNextImplementation()).to.be.revertedWith(
        MUST_NOT_THROUGH_DELEGATECALL,
      );
    });

    it('revert on call `setNextImplementation` via proxy', async () => {
      const nextImplAddress = Wallet.createRandom().address;
      await expect(
        VaultProxiedAsImplAdmin.setNextImplementation(nextImplAddress),
      ).to.be.revertedWith(MUST_NOT_THROUGH_DELEGATECALL);
    });

    // ======================
    // Events
    // ======================
    /**
     * @dev As Proxy contract is always deployed with a reference to the implementation, Proxy admin logic must be seek using the Proxied interface.
     */
    it('event emitted on grant role', async () => {
      const tx = await VaultProxiedAsProxyAdmin.grantRole(ADM_ROLE, someone.address);

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event?.args != undefined) {
        expect(event.event).to.be.equal(ROLE_GRANTED);
        const { role, account, sender } = event.args;
        expect(role).to.be.equal(ADM_ROLE);
        expect(account).to.be.equal(someone.address);
        expect(sender).to.be.equal(proxyAdmin.address);
      }
    });
  });

  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  // Vault upgradeability
  // =*=*=*=*=*=*=*=*=*=*=*=*=*=*=
  describe('Vault upgradability', () => {
    let VaultImpl2: TESTVaultUpgradeability1;
    let VaultImpl3: TESTVaultUpgradeability2;
    let VaultProxy: TESTVaultUpgradeability3;
    let VaultImpl1Proxied: TESTVaultUpgradeability1;
    let VaultImpl2Proxied: TESTVaultUpgradeability2;
    let VaultImpl3Proxied: TESTVaultUpgradeability3;

    let Vault1ProxiedAsProxyAdmin: TESTVaultUpgradeability1;
    let Vault1ProxiedAsImplAdmin: TESTVaultUpgradeability1;
    let Vault1ProxiedAsSomeone: TESTVaultUpgradeability1;
    let Vault1ProxiedAsUser: TESTVaultUpgradeability1;

    let Vault2ProxiedAsProxyAdmin: TESTVaultUpgradeability2;
    let Vault2ProxiedAsImplAdmin: TESTVaultUpgradeability2;
    let Vault2ProxiedAsUser: TESTVaultUpgradeability2;

    let Vault3ProxiedAsUser: TESTVaultUpgradeability3;

    beforeEach(async () => {
      const VaultImpl2Factory = await ethers.getContractFactory('TESTVaultUpgradeability2');
      VaultImpl2 = (await VaultImpl2Factory.connect(implAdmin).deploy()) as Contract &
        TESTVaultUpgradeability1;
      await VaultImpl2.deployed();

      const VaultImpl3Factory = await ethers.getContractFactory('TESTVaultUpgradeability3');
      VaultImpl3 = (await VaultImpl3Factory.connect(implAdmin).deploy()) as Contract &
        TESTVaultUpgradeability2;
      await VaultImpl3.deployed();

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = (await VaultProxyFactory.connect(proxyAdmin).deploy(
        VaultImpl1.address,
      )) as TESTVaultUpgradeability3;
      await VaultProxy.deployed();

      VaultImpl1Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability1Artifact.abi,
      ) as TESTVaultUpgradeability1;

      [
        Vault1ProxiedAsProxyAdmin,
        Vault1ProxiedAsImplAdmin,
        Vault1ProxiedAsSomeone,
        Vault1ProxiedAsUser,
      ] = connectGroup(VaultImpl1Proxied, [proxyAdmin, implAdmin, someone, user]);

      // Defining early to be accessible further in the code
      VaultImpl2Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability2Artifact.abi,
      ) as TESTVaultUpgradeability2;

      [Vault2ProxiedAsProxyAdmin, Vault2ProxiedAsImplAdmin, Vault2ProxiedAsUser] = connectGroup(
        VaultImpl2Proxied,
        [proxyAdmin, implAdmin, user],
      );

      VaultImpl3Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability3Artifact.abi,
      ) as TESTVaultUpgradeability3;

      Vault3ProxiedAsUser = connect(VaultImpl3Proxied, user);
    });

    // ======================
    // Roles
    // ======================
    it('proxy deployer is admin and maintainer', async () => {
      expect(await Vault1ProxiedAsImplAdmin.hasRole(ADM_ROLE, proxyAdmin.address)).to.be.true;
      expect(await Vault1ProxiedAsImplAdmin.hasRole(MNTR_ROLE, proxyAdmin.address)).to.be.true;

      expect(await Vault1ProxiedAsProxyAdmin.hasRole(ADM_ROLE, proxyAdmin.address)).to.be.true;
      expect(await Vault1ProxiedAsProxyAdmin.hasRole(MNTR_ROLE, proxyAdmin.address)).to.be.true;
    });

    it('proxy admin can grant proxy roles', async () => {
      await Vault1ProxiedAsProxyAdmin.grantRole(ADM_ROLE, someone.address);
      expect(await Vault1ProxiedAsProxyAdmin.hasRole(ADM_ROLE, someone.address)).to.be.true;

      await Vault1ProxiedAsProxyAdmin.grantRole(MNTR_ROLE, someother.address);
      expect(await Vault1ProxiedAsProxyAdmin.hasRole(MNTR_ROLE, someother.address)).to.be.true;
    });

    it('revert on impl admin granting roles', async () => {
      await expect(
        Vault1ProxiedAsImplAdmin.grantRole(ADM_ROLE, someone.address),
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(implAdmin.address, ADM_ROLE));

      await expect(
        Vault1ProxiedAsImplAdmin.grantRole(MNTR_ROLE, someone.address),
      ).to.be.revertedWith(ACCOUNT_MISSING_ROLE(implAdmin.address, ADM_ROLE));
    });

    it('proxy roles does not overlap impl roles', async () => {
      expect(await Vault1ProxiedAsImplAdmin.hasRole(ADM_ROLE, proxyAdmin.address)).to.be.true;
      await VaultImplAsImplAdmin.grantRole(ADM_ROLE, someone.address);

      expect(await VaultImpl1.hasRole(ADM_ROLE, someone.address)).to.be.true;
      expect(await Vault1ProxiedAsImplAdmin.hasRole(ADM_ROLE, someone.address)).to.be.false;
      expect(await Vault1ProxiedAsImplAdmin.hasRole(ADM_ROLE, proxyAdmin.address)).to.be.true;

      await Vault1ProxiedAsProxyAdmin.grantRole(ADM_ROLE, someother.address);
      expect(await VaultImpl1.hasRole(ADM_ROLE, someother.address)).to.be.false;
      expect(await Vault1ProxiedAsProxyAdmin.hasRole(ADM_ROLE, someother.address)).to.be.true;
    });

    // ======================
    // Initialize
    // ======================
    it('implementation is initialized', async () => {
      expect(await Vault1ProxiedAsUser.initializedVersion()).to.be.equal(1);
    });

    it('revert on call `initialize` when initialized', async () => {
      expect(await Vault1ProxiedAsUser.initializedVersion()).to.be.equal(1);
      await expect(Vault1ProxiedAsProxyAdmin.initialize()).to.be.revertedWith(ALREADY_INITIALIZED);
    });

    it('initialize when 1 next impl available', async () => {
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = (await VaultProxyFactory.connect(proxyAdmin).deploy(
        VaultImpl1.address,
      )) as TESTVaultUpgradeability1;
      await VaultProxy.deployed();

      // overwrite value set in `beforeAll` hook
      VaultImpl2Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability2Artifact.abi,
      ) as TESTVaultUpgradeability2;

      expect(await connect(VaultImpl2Proxied, user).initializedVersion()).to.be.equal(2);
    });

    it('initialize when 2 next impl available', async () => {
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await connect(VaultImpl2, implAdmin).setNextImplementation(VaultImpl3.address);

      const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
      VaultProxy = (await VaultProxyFactory.connect(proxyAdmin).deploy(
        VaultImpl1.address,
      )) as TESTVaultUpgradeability1;
      await VaultProxy.deployed();

      const VaultImpl3Proxied = new ethers.Contract(
        VaultProxy.address,
        TESTVaultUpgradability3Artifact.abi,
      ) as TESTVaultUpgradeability3;

      expect(await connect(VaultImpl3Proxied, user).initializedVersion()).to.be.equal(3);
    });

    // ======================
    // Upgrade
    // ======================
    it('admin can upgrade', async () => {
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await Vault1ProxiedAsProxyAdmin.upgrade();
    });

    it('maintainer can upgrade', async () => {
      await Vault1ProxiedAsProxyAdmin.grantRole(MNTR_ROLE, someone.address);
      expect(await Vault1ProxiedAsProxyAdmin.hasRole(MNTR_ROLE, someone.address)).to.be.true;

      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await Vault1ProxiedAsSomeone.upgrade();
    });

    it('upgrade when 1 next contract available', async () => {
      // v1
      // Note: connecting user (3rd party address) to avoid any address collisions
      expect(await Vault1ProxiedAsUser.version()).to.be.equal(1);
      expect(await Vault1ProxiedAsUser.presentV1AbsentV2()).to.be.true;

      // upgrading
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await Vault1ProxiedAsProxyAdmin.upgrade();

      // v2
      expect(await Vault2ProxiedAsUser.version()).to.be.equal(2);
      // NOTE: using VaultImpl2Proxied here as we upgraded to it
      expect(await Vault2ProxiedAsUser.presentV2AbsentV1()).to.be.true;
    });

    it('upgrade when 2 next contracts available', async () => {
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await connect(VaultImpl2, implAdmin).setNextImplementation(VaultImpl3.address);

      await Vault1ProxiedAsProxyAdmin.upgrade();

      expect(await Vault3ProxiedAsUser.version()).to.be.equal(3);
    });

    it('revert on upgrade to zero address', async () => {
      expect(await VaultImpl1.getNextImplementation()).to.be.equal(AddressZero);
      await expect(Vault1ProxiedAsProxyAdmin.upgrade()).to.be.revertedWith(NEXT_IMPL_ZERO);
    });

    it('revert on someone upgrading', async () => {
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await expect(Vault1ProxiedAsSomeone.upgrade()).to.be.revertedWith(NOT_ADMIN);
    });

    it('revert on second upgrading without impl address set', async () => {
      expect(await Vault1ProxiedAsUser.version()).to.be.equal(1);

      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await Vault1ProxiedAsProxyAdmin.upgrade();

      expect(await Vault2ProxiedAsUser.version()).to.be.equal(2);

      await expect(Vault2ProxiedAsProxyAdmin.upgrade()).to.be.revertedWith(NEXT_IMPL_ZERO);
    });

    // ======================
    // Migrate
    // ======================
    it('migrate when 1 next implementation available', async () => {
      expect(await Vault1ProxiedAsUser.version()).to.be.equal(1);
      expect(await Vault1ProxiedAsUser.migrationInvoked()).to.be.equal(0);

      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await Vault1ProxiedAsProxyAdmin.upgrade();

      expect(await Vault2ProxiedAsUser.version()).to.be.equal(2);
      expect(await Vault2ProxiedAsUser.migrationInvoked()).to.be.equal(1);
    });

    it('migrate when 2 next implementation available', async () => {
      expect(await Vault1ProxiedAsUser.version()).to.be.equal(1);
      expect(await Vault1ProxiedAsUser.migrationInvoked()).to.be.equal(0);

      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await connect(VaultImpl2, implAdmin).setNextImplementation(VaultImpl3.address);
      await Vault1ProxiedAsProxyAdmin.upgrade();

      expect(await Vault3ProxiedAsUser.version()).to.be.equal(3);
      expect(await Vault3ProxiedAsUser.migrationInvoked()).to.be.equal(2);
    });

    it('revert on call `applyUpgrade` after initialization', async () => {
      await expect(Vault1ProxiedAsImplAdmin.applyUpgrade()).to.be.revertedWith(ALREADY_MIGRATED);
    });

    it('revert on migrating called after migration', async () => {
      await expect(Vault1ProxiedAsImplAdmin.applyUpgrade()).to.be.revertedWith(ALREADY_MIGRATED);

      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      await Vault1ProxiedAsProxyAdmin.upgrade();

      await expect(Vault2ProxiedAsImplAdmin.applyUpgrade()).to.be.revertedWith(ALREADY_MIGRATED);
    });

    // ======================
    // Events
    // ======================
    it('event emitted on upgrade', async () => {
      await VaultImplAsImplAdmin.setNextImplementation(VaultImpl2.address);
      const tx = await Vault1ProxiedAsProxyAdmin.upgrade();

      const receipt = await tx.wait();
      const event = receipt.events?.pop();

      expect(event).not.to.be.undefined;

      // workaround ts undefined checks
      if (event?.args != undefined) {
        expect(event.event).to.be.equal(UPGRADED);
        const { implementation } = event.args;
        expect(implementation).to.be.equal(VaultImpl2.address);
      }
    });
  });
});
