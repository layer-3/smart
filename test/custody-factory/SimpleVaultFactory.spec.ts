import {Wallet} from '@ethersproject/wallet';
import {expect} from 'chai';
import {ethers, upgrades} from 'hardhat';

import {
  DEFAULT_ADMIN_ROLE,
  deployAndAddToken,
  deployTokenGrantRoles,
  deployVault,
  MINTER_ROLE,
  redeployVault,
} from '../../src/FactoryHelpers';
import {SimpleVaultFactory} from '../../typechain';

const {
  utils: {parseUnits},
} = ethers;

describe('SimpleVaultFactory', function () {
  const MINT_PER_DEPLOYMENT = 1000;

  const TOKEN1_NAME = 'TestToken';
  const TOKEN1_SYMBOL = 'TSTTKN';
  const TOKEN1_DECIMALS = 18;

  const TOKEN2_NAME = 'TOKEN2';
  const TOKEN2_SYMBOL = 'TKN2';
  const TOKEN2_DECIMALS = 16;

  beforeEach(async function () {
    const [owner, broker, user, someone] = await ethers.getSigners();
    this.owner = owner;
    this.broker = broker;
    this.user = user;
    this.someone = someone;

    const factoryFactory = await ethers.getContractFactory('SimpleVaultFactory');
    const SimpleVaultFactory = await upgrades.deployProxy(factoryFactory, []);
    await SimpleVaultFactory.deployed();
    this.SimpleVaultFactory = SimpleVaultFactory;

    this.Token1 = await deployTokenGrantRoles(
      SimpleVaultFactory as SimpleVaultFactory,
      TOKEN1_NAME,
      TOKEN1_SYMBOL,
      TOKEN1_DECIMALS
    );
  });

  describe('Upgrades', function () {
    beforeEach(async function () {
      const {SimpleVaultFactory} = this;

      this.AddedToken = await deployAndAddToken(
        SimpleVaultFactory,
        TOKEN1_NAME,
        TOKEN1_SYMBOL,
        TOKEN1_DECIMALS,
        MINT_PER_DEPLOYMENT
      );

      const v2FactoryFactory = await ethers.getContractFactory('SimpleVaultFactoryTest');
      const v2Factory = await upgrades.upgradeProxy(SimpleVaultFactory.address, v2FactoryFactory);
      await v2Factory.deployed();
      this.v2Factory = v2Factory;
    });

    it('contract is upgradable', async function () {
      const {SimpleVaultFactory, v2Factory} = this;

      expect(v2Factory.address).to.equal(SimpleVaultFactory.address);
      expect(v2Factory.AVAILABLE_AFTER_UPGRADE).to.not.undefined;
      expect(await v2Factory.AVAILABLE_AFTER_UPGRADE()).to.equal(true);
    });

    it('token admin has not changed', async function () {
      const {SimpleVaultFactory, v2Factory, AddedToken} = this;

      expect(await AddedToken.hasRole(DEFAULT_ADMIN_ROLE, SimpleVaultFactory.address)).to.be.true;
      expect(await AddedToken.hasRole(DEFAULT_ADMIN_ROLE, v2Factory.address)).to.be.true;
    });
  });

  describe('Roles', function () {
    it('admin can add admin', async function () {
      const {SimpleVaultFactory, user} = this;

      await SimpleVaultFactory.addAdmin(user.address);
      expect(await SimpleVaultFactory.hasRole(DEFAULT_ADMIN_ROLE, user.address));
    });

    it("3rd party can't add/deploy/remove tokens, add admin", async function () {
      const {SimpleVaultFactory, Token1, user, someone} = this;

      await expect(SimpleVaultFactory.connect(user).addToken(Token1.address, MINT_PER_DEPLOYMENT))
        .to.be.reverted;
      await expect(
        SimpleVaultFactory.connect(user).deployAndAddToken('any', 'any', 18, MINT_PER_DEPLOYMENT)
      ).to.be.reverted;
      await expect(SimpleVaultFactory.connect(user).removeToken(Token1.address)).to.be.reverted;
      await expect(SimpleVaultFactory.connect(user).addAdmin(someone)).to.be.reverted;
    });
  });

  describe('Vaults', function () {
    beforeEach(async function () {
      const {SimpleVaultFactory} = this;

      this.Token2 = await deployTokenGrantRoles(
        SimpleVaultFactory,
        TOKEN2_NAME,
        TOKEN2_SYMBOL,
        TOKEN2_DECIMALS
      );
    });

    it('vault can be deployed', async function () {
      const {SimpleVaultFactory, broker} = this;

      const vaultName = 'vault name';
      const vaultAddress = (await deployVault(SimpleVaultFactory, vaultName, broker.address))
        .address;

      const VaultFactory = await ethers.getContractFactory('SimpleVault');
      const VaultContract = VaultFactory.attach(vaultAddress);
      expect(await VaultContract.name()).to.be.equal(vaultName);
    });

    it('grants admin role of deployed Vault to deployer', async function () {
      const {SimpleVaultFactory, owner, broker} = this;

      const vaultName = 'vault name';
      const vaultAddress = (await deployVault(SimpleVaultFactory, vaultName, broker.address))
        .address;

      const VaultFactory = await ethers.getContractFactory('SimpleVault');
      const VaultContract = VaultFactory.attach(vaultAddress);
      expect(await VaultContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it('adding new vault mints all tokens to it', async function () {
      const {SimpleVaultFactory, Token1, Token2, broker} = this;

      await SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT);
      await SimpleVaultFactory.addToken(Token2.address, MINT_PER_DEPLOYMENT);

      const vaultName = 'vault name';

      const vaultAddress = (await deployVault(SimpleVaultFactory, vaultName, broker.address))
        .address;
      expect(await Token1.balanceOf(vaultAddress)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN1_DECIMALS)
      );
      expect(await Token2.balanceOf(vaultAddress)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN2_DECIMALS)
      );
    });

    it('can deploy two vaults with the same name for the same broker', async function () {
      const {SimpleVaultFactory, broker} = this;

      const vaultName = 'vault name';
      await SimpleVaultFactory.deployVault(vaultName, broker.address);
      await expect(SimpleVaultFactory.deployVault(vaultName, broker.address)).not.to.be.reverted;
    });

    it('vault can be redeployed', async function () {
      const {SimpleVaultFactory, broker, Token1} = this;

      await SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT);

      const vaultName = 'vault name';
      const OldVault = await deployVault(SimpleVaultFactory, vaultName, broker.address);
      const NewVault = await redeployVault(SimpleVaultFactory, OldVault.address);

      // new Vault has the same name, but different address
      expect(await NewVault.name()).to.be.equal(vaultName);
      expect(OldVault.address).not.to.be.equal(NewVault.address);

      // old Vault has no tokens, but new one does
      expect(await Token1.balanceOf(OldVault.address)).to.be.equal(0);
      expect(await Token1.balanceOf(NewVault.address)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN1_DECIMALS)
      );
    });

    it("can't redeploy unadded vault", async function () {
      const {SimpleVaultFactory} = this;

      const unexistingVaultAddress = Wallet.createRandom().address;
      await expect(SimpleVaultFactory.redeployVault(unexistingVaultAddress)).to.be.revertedWith(
        'vault is not present'
      );
    });

    it("can't redeploy vault not having admin role in it", async function () {
      const {SimpleVaultFactory, broker, someone} = this;

      const vaultName = 'vault name';
      const OldVault = await deployVault(SimpleVaultFactory, vaultName, broker.address);
      await expect(
        SimpleVaultFactory.connect(someone).redeployVault(OldVault.address)
      ).to.be.revertedWith('account is not vault admin');
    });

    it('vault can be removed', async function () {
      const {SimpleVaultFactory, broker, Token1} = this;

      await SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT);

      const vaultName = 'vault name';
      const OldVault = await deployVault(SimpleVaultFactory, vaultName, broker.address);
      await SimpleVaultFactory.removeVault(OldVault.address);

      // removed Vault does not have any tokens added previously
      expect(await Token1.balanceOf(OldVault.address)).to.be.equal(0);
    });

    it("can't remove unadded vault", async function () {
      const {SimpleVaultFactory} = this;

      const unexistingVaultAddress = Wallet.createRandom().address;
      await expect(SimpleVaultFactory.removeVault(unexistingVaultAddress)).to.be.revertedWith(
        'vault is not present'
      );
    });

    it("can't remove vault not having adming role in it", async function () {
      const {SimpleVaultFactory, broker, someone} = this;

      const vaultName = 'vault name';
      const OldVault = await deployVault(SimpleVaultFactory, vaultName, broker.address);
      await expect(
        SimpleVaultFactory.connect(someone).removeVault(OldVault.address)
      ).to.be.revertedWith('account is not vault admin');
    });
  });

  describe('Tokens', function () {
    it('token can be deployed', async function () {
      const {SimpleVaultFactory} = this;

      const TokenContract = await deployAndAddToken(
        SimpleVaultFactory,
        TOKEN1_NAME,
        TOKEN1_SYMBOL,
        TOKEN1_DECIMALS,
        MINT_PER_DEPLOYMENT
      );

      expect(await TokenContract.name()).to.be.equal(TOKEN1_NAME);
    });

    it('deploying token grants deployer admin role', async function () {
      const {SimpleVaultFactory, owner} = this;

      const TokenContract = await deployAndAddToken(
        SimpleVaultFactory,
        TOKEN1_NAME,
        TOKEN1_SYMBOL,
        TOKEN1_DECIMALS,
        MINT_PER_DEPLOYMENT
      );

      expect(await TokenContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it('reverts when factory does not have minter & burner roles on token being added', async function () {
      const {SimpleVaultFactory} = this;

      const TokenFactory = await ethers.getContractFactory('SimpleERC20');
      const Token = await TokenFactory.deploy(TOKEN1_NAME, TOKEN1_SYMBOL, TOKEN1_DECIMALS);
      await Token.deployed();

      await expect(
        SimpleVaultFactory.addToken(Token.address, MINT_PER_DEPLOYMENT)
      ).to.be.revertedWith('factory is not minter');
      await Token.grantRole(MINTER_ROLE, SimpleVaultFactory.address);
      await expect(
        SimpleVaultFactory.addToken(Token.address, MINT_PER_DEPLOYMENT)
      ).to.be.revertedWith('factory is not burner');
    });

    it('adding new token mints amount to vaults', async function () {
      const {SimpleVaultFactory, Token1, broker} = this;

      const vault1Name = 'v1';
      const vault2Name = 'v2';

      const vault1Address = (await deployVault(SimpleVaultFactory, vault1Name, broker.address))
        .address;
      const vault2Address = (await deployVault(SimpleVaultFactory, vault2Name, broker.address))
        .address;

      await SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT);

      expect(await Token1.balanceOf(vault1Address)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN1_DECIMALS)
      );
      expect(await Token1.balanceOf(vault2Address)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN1_DECIMALS)
      );
    });

    it('removing token burns tokens from vaults', async function () {
      const {SimpleVaultFactory, Token1, broker} = this;

      const vault1Name = 'v1';
      const vault2Name = 'v2';

      const vault1Address = (await deployVault(SimpleVaultFactory, vault1Name, broker.address))
        .address;
      const vault2Address = (await deployVault(SimpleVaultFactory, vault2Name, broker.address))
        .address;

      await SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT);

      expect(await Token1.balanceOf(vault1Address)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN1_DECIMALS)
      );
      expect(await Token1.balanceOf(vault2Address)).to.be.equal(
        parseUnits(MINT_PER_DEPLOYMENT.toString(), TOKEN1_DECIMALS)
      );

      await SimpleVaultFactory.removeToken(Token1.address);

      expect(await Token1.balanceOf(vault1Address)).to.be.equal(0);
      expect(await Token1.balanceOf(vault2Address)).to.be.equal(0);
    });

    it('reverts on adding existing token', async function () {
      const {SimpleVaultFactory, Token1} = this;

      await SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT);
      await expect(
        SimpleVaultFactory.addToken(Token1.address, MINT_PER_DEPLOYMENT)
      ).to.be.revertedWith('token is already present');
    });

    it('reverts on removing unexisted token', async function () {
      const {SimpleVaultFactory, Token1} = this;

      await expect(SimpleVaultFactory.removeToken(Token1.address)).to.be.revertedWith(
        'token is not present'
      );
    });
  });
});
