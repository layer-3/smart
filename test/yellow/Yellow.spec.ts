import type {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import type {Contract} from 'ethers';
import {ethers, upgrades} from 'hardhat';

import {connectGroup} from '../../src/contracts';
import {ACCOUNT_MISSING_ROLE} from '../../src/revert-reasons';
import type {Yellow} from '../../typechain';

const AdminRole = ethers.constants.HashZero;
const MinterRole = ethers.utils.id('MINTER_ROLE');
const BurnerRole = ethers.utils.id('BURNER_ROLE');
const maxTotalSupply = ethers.utils.parseEther('10000000000');

describe('Yellow Contract', function () {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let minter: SignerWithAddress;
  let burner: SignerWithAddress;
  let someone: SignerWithAddress;

  let YellowContract: Contract & Yellow;
  let YellowAsOwner: Contract & Yellow;
  let YellowAsMinter: Contract & Yellow;
  let YellowAsSomeone: Contract & Yellow;
  let YellowAsUser: Contract & Yellow;

  beforeEach(async function () {
    [owner, user, minter, burner, someone] = await ethers.getSigners();

    const YellowFactory = await ethers.getContractFactory('Yellow');
    YellowContract = (await upgrades.deployProxy(YellowFactory, ['Yellow', 'YLW', owner.address], {
      initializer: 'init(string, string, address)',
    })) as Contract & Yellow;
    await YellowContract.deployed();

    [YellowAsOwner, YellowAsMinter, YellowAsSomeone, YellowAsUser] = connectGroup(YellowContract, [
      owner,
      minter,
      someone,
      user,
    ]);

    // add minter
    await YellowAsOwner.grantRole(MinterRole, minter.address);
    // add burner
    await YellowAsOwner.grantRole(BurnerRole, burner.address);
  });

  function insufficientAllowanceError() {
    return `ERC20: insufficient allowance`;
  }

  it('contract is upgradable', async function () {
    const v2Factory = await ethers.getContractFactory('TestYellowV2');
    const v2Contract: Contract = await upgrades.upgradeProxy(YellowContract.address, v2Factory);
    await v2Contract.deployed();

    expect(v2Contract.address).to.equal(YellowContract.address);
    expect(v2Contract.AVAILABLE_AFTER_UPGRADE).to.not.undefined;
    // TODO: remove eslint disable
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(await v2Contract.AVAILABLE_AFTER_UPGRADE()).to.equal(true);
  });

  it('has right admin', async function () {
    expect(await YellowContract.hasRole(AdminRole, owner.address)).to.equal(true);
    expect(await YellowContract.hasRole(AdminRole, user.address)).to.equal(false);
    expect(await YellowContract.hasRole(AdminRole, minter.address)).to.equal(false);
    expect(await YellowContract.hasRole(AdminRole, burner.address)).to.equal(false);
  });

  it('has right minter', async function () {
    expect(await YellowContract.hasRole(MinterRole, owner.address)).to.equal(true);
    expect(await YellowContract.hasRole(MinterRole, minter.address)).to.equal(true);
    expect(await YellowContract.hasRole(MinterRole, user.address)).to.equal(false);
    expect(await YellowContract.hasRole(MinterRole, burner.address)).to.equal(false);
  });

  it('only minter can mint', async function () {
    const amount = ethers.utils.parseEther('100');

    expect(await YellowAsOwner.mint(someone.address, amount)).to.not.be.undefined;
    expect(await YellowContract.balanceOf(someone.address)).to.equal(amount);

    expect(await YellowAsOwner.mint(someone.address, amount)).to.not.be.undefined;
    expect(await YellowContract.balanceOf(someone.address)).to.equal(amount.mul(2));

    await expect(YellowAsSomeone.mint(someone.address, amount)).to.be.revertedWith(
      ACCOUNT_MISSING_ROLE(someone.address, MinterRole),
    );
  });

  it('can not mint exceed max total supply', async function () {
    const amount = maxTotalSupply.mul('1000');

    await expect(YellowAsMinter.mint(someone.address, amount)).to.be.revertedWith(
      `ERC20Capped: cap exceeded`,
    );
  });

  it('anyone can burn and only burner can burnFrom', async function () {
    const initialAmount = ethers.utils.parseEther('100');
    const burnAmount = ethers.utils.parseEther('10');
    expect(await YellowAsOwner.mint(someone.address, initialAmount)).to.not.be.undefined;
    expect(await YellowAsOwner.mint(burner.address, initialAmount)).to.not.be.undefined;
    expect(await YellowAsOwner.mint(user.address, initialAmount)).to.not.be.undefined;

    // burn
    expect(await YellowAsUser.burn(burnAmount)).to.not.be.undefined;
    expect(await YellowContract.balanceOf(user.address)).to.equal(initialAmount.sub(burnAmount));

    // burnFrom
    await expect(YellowAsSomeone.burnFrom(user.address, burnAmount)).to.be.revertedWith(
      insufficientAllowanceError(),
    );
    expect(await YellowAsUser.approve(someone.address, burnAmount)).to.not.be.undefined;
    expect(await YellowAsSomeone.burnFrom(user.address, burnAmount)).to.not.be.undefined;
    await expect(YellowAsSomeone.burnFrom(user.address, burnAmount)).to.be.revertedWith(
      insufficientAllowanceError(),
    );
    expect(await YellowContract.balanceOf(user.address)).to.equal(
      initialAmount.sub(burnAmount).sub(burnAmount),
    );
    await expect(YellowAsUser.burnFrom(user.address, burnAmount)).to.be.revertedWith(
      insufficientAllowanceError(),
    );
  });
});
