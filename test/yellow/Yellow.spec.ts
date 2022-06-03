/* eslint no-unused-expressions: 0 */

import {expect} from 'chai';
import {ethers, upgrades} from 'hardhat';

describe('Yellow Contract', function () {
  beforeEach(async function () {
    const [owner, user, minter, burner, someone] = await ethers.getSigners();
    this.owner = owner;
    this.user = user;
    this.minter = minter;
    this.burner = burner;
    this.someone = someone;
    this.AdminRole = ethers.constants.HashZero;
    this.MinterRole = ethers.utils.id('MINTER_ROLE');
    this.BurnerRole = ethers.utils.id('BURNER_ROLE');
    this.maxTotalSupply = ethers.utils.parseEther('1000000000');

    const yellowFactory = await ethers.getContractFactory('Yellow');
    const yellowContract = await upgrades.deployProxy(
      yellowFactory,
      ['Yellow', 'YLW', owner.address, this.maxTotalSupply],
      {
        initializer: 'init(string, string, address, uint256)',
      }
    );
    await yellowContract.deployed();
    this.yellowContract = yellowContract;

    // add minter
    await yellowContract.connect(owner).grantRole(this.MinterRole, minter.address);
    // add burner
    await yellowContract.connect(owner).grantRole(this.BurnerRole, burner.address);
  });

  function accessControlError(account: any, role: string) {
    return `AccessControl: account ${account.address.toLowerCase()} is missing role ${role}`;
  }

  it('contract is upgradable', async function () {
    const {yellowContract} = this;

    const v2Factory = await ethers.getContractFactory('YellowTest');
    const v2Contract = await upgrades.upgradeProxy(yellowContract.address, v2Factory);
    await v2Contract.deployed();

    expect(v2Contract.address).to.equal(yellowContract.address);
    expect(v2Contract.AVAILABLE_AFTER_UPGRADE).to.not.undefined;
    expect(await v2Contract.AVAILABLE_AFTER_UPGRADE()).to.equal(true);
  });

  it('has right admin', async function () {
    const {owner, user, minter, burner, yellowContract, AdminRole} = this;
    expect(await yellowContract.hasRole(AdminRole, owner.address)).to.equal(true);
    expect(await yellowContract.hasRole(AdminRole, user.address)).to.equal(false);
    expect(await yellowContract.hasRole(AdminRole, minter.address)).to.equal(false);
    expect(await yellowContract.hasRole(AdminRole, burner.address)).to.equal(false);
  });

  it('has right minter', async function () {
    const {owner, user, minter, burner, yellowContract, MinterRole} = this;
    expect(await yellowContract.hasRole(MinterRole, owner.address)).to.equal(true);
    expect(await yellowContract.hasRole(MinterRole, minter.address)).to.equal(true);
    expect(await yellowContract.hasRole(MinterRole, user.address)).to.equal(false);
    expect(await yellowContract.hasRole(MinterRole, burner.address)).to.equal(false);
  });

  it('has right burner', async function () {
    const {owner, user, minter, burner, yellowContract, BurnerRole} = this;
    expect(await yellowContract.hasRole(BurnerRole, owner.address)).to.equal(true);
    expect(await yellowContract.hasRole(BurnerRole, burner.address)).to.equal(true);
    expect(await yellowContract.hasRole(BurnerRole, user.address)).to.equal(false);
    expect(await yellowContract.hasRole(BurnerRole, minter.address)).to.equal(false);
  });

  it('only minter can mint', async function () {
    const {owner, user, minter, someone, yellowContract, MinterRole} = this;
    const amount = ethers.utils.parseEther('100');

    expect(await yellowContract.connect(owner).mint(someone.address, amount)).to.not.be.undefined;
    expect(await yellowContract.balanceOf(someone.address)).to.equal(amount);

    expect(await yellowContract.connect(minter).mint(someone.address, amount)).to.not.be.undefined;
    expect(await yellowContract.balanceOf(someone.address)).to.equal(amount.mul(2));

    await expect(yellowContract.connect(user).mint(someone.address, amount)).to.be.revertedWith(
      accessControlError(user, MinterRole)
    );
  });

  it('can not mint exceed max total supply', async function () {
    const {minter, someone, yellowContract, maxTotalSupply} = this;
    const amount = maxTotalSupply.mul('1000');

    await expect(yellowContract.connect(minter).mint(someone.address, amount)).to.be.revertedWith(
      `ERC20Capped: cap exceeded`
    );
  });

  it('only burner can burn', async function () {
    const {owner, user, burner, someone, yellowContract, BurnerRole} = this;
    const initialAmount = ethers.utils.parseEther('100');
    const burnAmount = ethers.utils.parseEther('10');
    expect(await yellowContract.connect(owner).mint(someone.address, initialAmount)).to.not.be
      .undefined;
    expect(await yellowContract.connect(owner).mint(burner.address, initialAmount)).to.not.be
      .undefined;

    // burn
    expect(await yellowContract.connect(burner).burn(burnAmount)).to.not.be.undefined;
    expect(await yellowContract.balanceOf(burner.address)).to.equal(initialAmount.sub(burnAmount));

    await expect(yellowContract.connect(user).burn(burnAmount)).to.be.revertedWith(
      accessControlError(user, BurnerRole)
    );

    // burnFrom
    expect(await yellowContract.connect(owner).burnFrom(someone.address, burnAmount)).to.not.be
      .undefined;
    expect(await yellowContract.balanceOf(someone.address)).to.equal(initialAmount.sub(burnAmount));

    expect(await yellowContract.connect(burner).burnFrom(someone.address, burnAmount)).to.not.be
      .undefined;
    expect(await yellowContract.balanceOf(someone.address)).to.equal(
      initialAmount.sub(burnAmount).sub(burnAmount)
    );

    await expect(
      yellowContract.connect(user).burnFrom(someone.address, burnAmount)
    ).to.be.revertedWith(accessControlError(user, BurnerRole));
  });
});
