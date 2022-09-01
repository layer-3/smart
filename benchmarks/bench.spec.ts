/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'chai';
import {ethers} from 'hardhat';

import {gasUsed} from './setup';

describe('benchmark test', () => {
  it('blah', async () => {
    const tokenFactory = await ethers.getContractFactory('SimpleERC20');
    const token = await tokenFactory.deploy('Yellow', 'YLW', 16);
    await token.deployed();
    await expect(token.deployTransaction).to.consumeGas(2224727);
    await expect(await gasUsed(token.deployTransaction)).to.equalGas(2224727);
  });
});
