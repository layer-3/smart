/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'chai';
import {ethers} from 'hardhat';

import './setup';
import {gasUsed} from './helpers';

describe('benchmark test', () => {
  it('Deployment', async () => {
    const tokenFactory = await ethers.getContractFactory('SimpleERC20');
    const token = await tokenFactory.deploy('Yellow', 'YLW', 16);
    await token.deployed();
    await expect(token.deployTransaction).to.consumeGas(2224727);
  });
  it('Deposit', async () => {
    const [user, someone] = await ethers.getSigners();

    // start setup
    const tokenFactory = await ethers.getContractFactory('SimpleERC20');
    const token = await tokenFactory.deploy('Yellow', 'YLW', 16);
    await token.deployed();

    await token.mintTo(user.address, 1000);
    // end setup

    await expect(
      await gasUsed(await token.connect(user).transfer(someone.address, 15))
    ).to.equalGas(15000);
  });
});
