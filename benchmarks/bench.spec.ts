import { expect } from 'chai';
import { ethers } from 'hardhat';

import './setup';

import { gasUsed } from './helpers';

import type { TestERC20 } from '../typechain';

describe('benchmark test', () => {
  it('Deployment', async () => {
    const tokenFactory = await ethers.getContractFactory('TestERC20');
    const token = await tokenFactory.deploy('Yellow', 'YLW', 16);
    await token.deployed();
    expect(token.deployTransaction).to.consumeGas(2_224_727);
  });
  it('Deposit', async () => {
    const [user, someone] = await ethers.getSigners();

    // start setup
    const tokenFactory = await ethers.getContractFactory('TestERC20');
    const token = (await tokenFactory.deploy('Yellow', 'YLW', 16)) as TestERC20;
    await token.deployed();

    await token.setUserBalance(user.address, 1000);
    // end setup

    expect(await gasUsed(await token.connect(user).transfer(someone.address, 15))).to.equalGas(
      15_000,
    );
  });
});
