import type {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {constants, ContractFactory, BigNumber} from 'ethers';
import {ethers, upgrades} from 'hardhat';

import type {Vesting, VestingERC20, Vesting__factory} from '../../typechain';

import {deployVesting} from './src/deploy';
import {DAY, getWillEnd, getWillStart, VESTING_PERIOD_DAYS} from './src/time';

describe('Vesting Contract', function () {
  // need to define for `before` hooks to work
  let willStart: number;
  let willEnd: number;

  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let someone: SignerWithAddress;

  let Token: VestingERC20;

  before(async function () {
    willStart = await getWillStart();
    willEnd = getWillEnd(willStart);

    [owner, user, someone] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory('VestingERC20');
    Token = (await TokenFactory.deploy('Yellow', 'YLW')) as VestingERC20;
    await Token.deployed();
  });

  beforeEach(async () => {
    willStart = await getWillStart();
    willEnd = getWillEnd(willStart);
  });

  describe('initializer', function () {
    let VestingFactory: ContractFactory & Vesting__factory;

    before(async function () {
      VestingFactory = await ethers.getContractFactory('Vesting');
    });

    it('revert on zero token address', async function () {
      await expect(
        upgrades.deployProxy(VestingFactory, [
          ethers.constants.AddressZero,
          willStart,
          VESTING_PERIOD_DAYS,
          0,
          1,
        ]),
      ).to.be.revertedWith('initializer: token is 0x0');
    });

    it('revert on start < now', async function () {
      await expect(
        upgrades.deployProxy(VestingFactory, [
          Token.address,
          willStart - DAY, // basically, one day earlier that now
          VESTING_PERIOD_DAYS,
          0,
          1,
        ]),
      ).to.be.revertedWith('initializer: start <= now');
    });

    it('revert on period days = 0', async function () {
      await expect(
        upgrades.deployProxy(VestingFactory, [Token.address, willStart, 0, 0, 1]),
      ).to.be.revertedWith('initializer: period days <= 0');
    });

    it('revert on cliff >= period', async function () {
      await expect(
        upgrades.deployProxy(VestingFactory, [
          Token.address,
          willStart,
          VESTING_PERIOD_DAYS,
          VESTING_PERIOD_DAYS + 1,
          1,
        ]),
      ).to.be.revertedWith('initializer: cliff >= vesting period');
    });

    it('revert on claimingIntervalDays = 0', async function () {
      await expect(
        upgrades.deployProxy(VestingFactory, [Token.address, willStart, VESTING_PERIOD_DAYS, 0, 0]),
      ).to.be.revertedWith('initializer: claiming interval days <= 0');
    });

    it('revert on interval days not being a divider of period days after vesting cliff', async function () {
      await expect(
        upgrades.deployProxy(VestingFactory, [
          Token.address,
          willStart,
          VESTING_PERIOD_DAYS,
          0,
          VESTING_PERIOD_DAYS - 1,
        ]),
      ).to.be.revertedWith('initializer: activeVestingPeriod % claimingIntervalDays != 0');
    });
  });

  describe('upgradeable', function () {
    it('contract is upgradeable', async function () {
      const VestingFactoryV1 = await ethers.getContractFactory('Vesting');
      const ContractV1: Vesting = (await upgrades.deployProxy(VestingFactoryV1, [
        Token.address,
        willStart,
        VESTING_PERIOD_DAYS,
        0,
        1,
      ])) as Vesting;
      await ContractV1.deployed();

      const [tokenAmount1, tokenAmount2] = [500, 1000];
      await ContractV1.addInvestor(user.address, tokenAmount1, 0);
      await ContractV1.addInvestor(someone.address, tokenAmount2, 0);
      const toPayTokensV1 = await ContractV1.getToPayTokens();

      const VestingFactoryV2 = await ethers.getContractFactory('TestVestingV2');
      const ContractV2 = await upgrades.upgradeProxy(ContractV1.address, VestingFactoryV2);

      await ContractV2.deployed();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const toPayTokensV2: BigNumber = (await ContractV2.getToPayTokens()) as BigNumber;

      expect(ContractV2.address).to.equal(ContractV1.address);
      expect(ContractV2.AVAILABLE_AFTER_UPGRADE).to.not.undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      expect(await ContractV2.AVAILABLE_AFTER_UPGRADE()).to.equal(true);

      expect(toPayTokensV1).to.be.equal(toPayTokensV2);
    });
  });

  describe('main logic', function () {
    const cliffDays = 10;

    let VestingContract: Vesting;

    before(async function () {
      VestingContract = await deployVesting(willStart, Token, cliffDays);
    });

    describe('roles', function () {
      it('revert on user adding investor', async function () {
        await expect(
          VestingContract.connect(user).addInvestor(someone.address, 1, 0),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('revert on user removing investor', async function () {
        await VestingContract.addInvestor(someone.address, 1, 0);
        await expect(
          VestingContract.connect(user).removeInvestor(someone.address),
        ).to.be.revertedWith('Ownable: caller is not the owner');

        // cleanup
        await VestingContract.removeInvestor(someone.address);
      });
    });

    describe('vesting properties', function () {
      it('Start time is correct', async function () {
        // deploy separate instance to get correct `willStart`
        const VestingContract = await deployVesting(willStart, Token);
        expect(await VestingContract.getStartTime()).to.equal(willStart);
      });

      it('Vesting period is correct', async function () {
        expect(await VestingContract.getPeriodDays()).to.equal(VESTING_PERIOD_DAYS);
      });

      it('Vesting cliff is correct', async function () {
        expect(await VestingContract.getCliffDays()).to.be.equal(cliffDays);
      });

      it('Total token amount to pay is correct', async function () {
        const [tokenAmount1, tokenAmount2] = [500, 1000];
        await VestingContract.addInvestor(user.address, tokenAmount1, 0);
        await VestingContract.addInvestor(someone.address, tokenAmount2, 0);

        expect(await VestingContract.getToPayTokens()).to.equal(tokenAmount1 + tokenAmount2);
      });
    });

    describe('investors (non time-related)', function () {
      const tokenAmount = 1000;

      beforeEach(async function () {
        VestingContract = await deployVesting(willStart, Token);

        await Token.connect(owner).mint(VestingContract.address, tokenAmount);
        await VestingContract.addInvestor(user.address, tokenAmount, 0);
      });

      it('revert on addInvestor address 0x0', async function () {
        const investor = constants.AddressZero; // 0x0 address
        const amount = 1;
        const iuPercent = 0;

        await expect(VestingContract.addInvestor(investor, amount, iuPercent)).to.be.revertedWith(
          'addInvestor: investor is 0x0',
        );
      });

      it('revert on addInvestor amount 0', async function () {
        const investor = someone.address;
        const amount = 0; // zero amount
        const iuPercent = 0;

        await expect(VestingContract.addInvestor(investor, amount, iuPercent)).to.be.revertedWith(
          'addInvestor: amount is 0',
        );
      });

      it('revert on addInvestor iuPercent >= 100%', async function () {
        const investor = someone.address;
        const amount = 1;
        const iuPercent = 10_100; // >= 100%

        await expect(VestingContract.addInvestor(investor, amount, iuPercent)).to.be.revertedWith(
          'addInvestor: iuPercent >= 100%',
        );
      });

      it('revert on addInvestors arrays length mismatch', async function () {
        const investors = [user.address, someone.address];
        const amounts = [100, 100, 100]; // amounts length mismatch
        const iuPercent = 0;

        await expect(
          VestingContract.addInvestors(investors, amounts, iuPercent),
        ).to.be.revertedWith('addInvestors: arrays length mismatch');
      });

      it('locked amount after adding investor is correct', async function () {
        const [, , tokens] = await VestingContract.getInvestorData(user.address);
        expect(tokens.toNumber()).to.be.equal(tokenAmount);
      });

      it('investor is not present after their removal', async function () {
        await VestingContract.removeInvestor(user.address);
        const [, , tokens] = await VestingContract.getInvestorData(user.address);
        expect(tokens.toNumber()).to.be.equal(0);
      });

      it('overwrite investor data if adding them second time', async function () {
        // User has already been added as investor in beforeEach
        const investorData = await VestingContract.getInvestorData(user.address);
        const tokensBefore = investorData[2];

        const [, , tokensBefore] = await VestingContract.getInvestorData(user.address);
        // precondition
        expect(tokensBefore.toNumber()).to.be.equal(tokenAmount);

        const newTokenAmount = tokenAmount + 10;
        await VestingContract.addInvestor(user.address, newTokenAmount, 0);

        const [, , tokensAfter] = await VestingContract.getInvestorData(user.address);
        expect(tokensAfter.toNumber()).to.be.equal(newTokenAmount);
      });

      it('revert when claiming locked tokens before start', async function () {
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: claiming before cliff date',
        );
      });
    });

    describe('investors (time-related)', function () {
      const tokenAmount = 1000;

      let VestingContract: Vesting;

      beforeEach(async function () {
        VestingContract = await deployVesting(willStart, Token);
        await Token.connect(owner).mint(VestingContract.address, tokenAmount);
        await VestingContract.addInvestor(user.address, tokenAmount, 0);
      });

      afterEach(async function () {
        const balance = await Token.balanceOf(user.address);
        await Token.connect(owner).burnFrom(user.address, balance);
      });

      it('revert on adding investor after vesting start', async function () {
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(VestingContract.addInvestor(someone.address, 1, 0)).to.be.revertedWith(
          'addInvestor: adding investor after vesting start',
        );
      });

      it('releasing amount is correct', async function () {
        const daysPassed = 1;
        await ethers.provider.send('evm_mine', [willStart + DAY * daysPassed + 1]);
        const toBeReleased = await VestingContract.getReleasableLockedTokens(user.address);
        expect(toBeReleased).to.be.equal(
          Math.round((tokenAmount * daysPassed) / VESTING_PERIOD_DAYS),
        );
      });

      it('tokens released to user balance', async function () {
        const daysPassed = 1;
        await ethers.provider.send('evm_mine', [willStart + DAY * daysPassed + 1]);
        expect(await Token.balanceOf(user.address)).to.be.equal(0);
        await VestingContract.connect(user).claimLockedTokens();
        const balance = await Token.balanceOf(user.address);
        expect(balance).to.be.equal(Math.round((tokenAmount * daysPassed) / VESTING_PERIOD_DAYS));
      });

      it('revert when no releasable tokens available', async function () {
        // no days have passed since vesting period started
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens',
        );
      });

      it('revert on reclaiming tokens the same day', async function () {
        const daysPassed = 1;
        await ethers.provider.send('evm_mine', [willStart + DAY * daysPassed + 1]);
        // claim now
        await VestingContract.connect(user).claimLockedTokens();
        // and claim right again
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens',
        );
      });

      it("unadded investor can't release tokens", async function () {
        // creating new contract not to have an investor added
        VestingContract = await deployVesting(willStart, Token);
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens',
        );
      });

      it("removed investor can't release tokens", async function () {
        await VestingContract.connect(owner).removeInvestor(user.address);
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens',
        );
      });
    });

    describe('vesting cliff', function () {
      const tokenAmount = 1000;
      const cliffDays = 10;

      afterEach(async function () {
        const balance = await Token.balanceOf(user.address);
        await Token.connect(owner).burnFrom(user.address, balance);
      });

      beforeEach(async function () {
        VestingContract = await deployVesting(willStart, Token, cliffDays);
        await Token.connect(owner).mint(VestingContract.address, tokenAmount);
        await VestingContract.addInvestor(user.address, tokenAmount, 0);
      });

      it('0 tokens are available during cliff', async function () {
        await ethers.provider.send('evm_mine', [willStart + 1]);
        expect(await VestingContract.getReleasableLockedTokens(user.address)).to.be.equal(0);
      });

      it('reverts on claiming locked tokens during cliff', async function () {
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: claiming before cliff date',
        );
      });

      it('reverts on claiming right after cliff ends (no tokens)', async function () {
        await ethers.provider.send('evm_mine', [willStart + DAY * cliffDays + 1]);
        expect(await Token.balanceOf(user.address)).to.be.equal(0);
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens',
        );
      });

      it('receive correct amount after some time after cliff ends', async function () {
        const receiveDelayDays = cliffDays + 5;

        await ethers.provider.send('evm_mine', [willStart + DAY * receiveDelayDays + 1]);
        expect(await Token.balanceOf(user.address)).to.be.equal(0);
        await VestingContract.connect(user).claimLockedTokens();
        expect(await Token.balanceOf(user.address)).to.be.equal(
          Math.floor(
            (tokenAmount * (receiveDelayDays - cliffDays)) / (VESTING_PERIOD_DAYS - cliffDays),
          ),
        );
      });

      it('receive full amount after vesting ends', async function () {
        await ethers.provider.send('evm_mine', [willEnd]);
        expect(await Token.balanceOf(user.address)).to.be.equal(0);
        await VestingContract.connect(user).claimLockedTokens();
        expect(await Token.balanceOf(user.address)).to.be.equal(Math.floor(tokenAmount));
      });
    });

    describe('token claim interval', function () {
      const tokenAmount = 1000;

      afterEach(async function () {
        const balance = await Token.balanceOf(user.address);
        await Token.connect(owner).burnFrom(user.address, balance);
      });

      it('reverts on claim before set interval', async function () {
        const cliffDays = 0;
        const claimingIntervalDays = 2;

        const VestingContract = await deployVesting(
          willStart,
          Token,
          cliffDays,
          claimingIntervalDays,
        );
        await Token.connect(owner).mint(VestingContract.address, tokenAmount);

        await VestingContract.addInvestor(user.address, tokenAmount, 0);

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(VestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens',
        );
      });

      it('first claim only after set interval', async function () {
        const cliffDays = 0;
        const claimingIntervalDays = 2;
        const claimDelayDays = 2;

        const VestingContract = await deployVesting(
          willStart,
          Token,
          cliffDays,
          claimingIntervalDays,
        );
        await Token.connect(owner).mint(VestingContract.address, tokenAmount);

        await VestingContract.addInvestor(user.address, tokenAmount, 0);

        await ethers.provider.send('evm_mine', [willStart + DAY * claimDelayDays + 1]);
        await VestingContract.connect(user).claimLockedTokens();
        expect(await Token.balanceOf(user.address)).to.be.equal(
          Math.floor((tokenAmount * claimDelayDays) / (VESTING_PERIOD_DAYS - cliffDays)),
        );
      });
    });

    describe('Initial Unlock tokens', function () {
      const tokenAmount = 1000;
      // 1000 = 10.00%
      const iuPercent = 1250;
      // 10000 = 100.00%
      const baseRate = 10000;

      afterEach(async function () {
        const balance = await Token.balanceOf(user.address);
        await Token.connect(owner).burnFrom(user.address, balance);
      });

      beforeEach(async function () {
        VestingContract = await deployVesting(willStart, Token);
        await Token.connect(owner).mint(VestingContract.address, tokenAmount);
        await VestingContract.addInvestor(user.address, tokenAmount, iuPercent);
      });

      it('reverts on claiming iu tokens before cliff date', async function () {
        await expect(VestingContract.connect(user).claimIuTokens()).to.be.revertedWith(
          'claimIuTokens: claiming before cliff date',
        );
      });

      it('claimed amount is correct', async function () {
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await VestingContract.connect(user).claimIuTokens();
        expect(await Token.balanceOf(user.address)).to.be.equal(
          (tokenAmount * iuPercent) / baseRate,
        );
      });

      it('claimed amount is correct after vesting end', async function () {
        await ethers.provider.send('evm_mine', [willEnd + 1]);
        await VestingContract.connect(user).claimIuTokens();
        expect(await Token.balanceOf(user.address)).to.be.equal(
          (tokenAmount * iuPercent) / baseRate,
        );
      });

      it('reverts on claiming second time', async function () {
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await VestingContract.connect(user).claimIuTokens();
        await expect(VestingContract.connect(user).claimIuTokens()).to.be.revertedWith(
          'claimIuTokens: no available tokens',
        );
      });

      it('get investor data returns correct iu token amount', async function () {
        let [tgeTokens] = await VestingContract.getInvestorData(user.address);
        expect(tgeTokens.toNumber()).to.be.equal((tokenAmount * iuPercent) / baseRate);

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await VestingContract.connect(user).claimIuTokens();

        [tgeTokens] = await VestingContract.getInvestorData(user.address);
        expect(tgeTokens.toNumber()).to.be.equal(0);
      });
    });

    describe('vesting cliff and iu tokens', function () {
      // lock start and end timestamps
      let willStart: number;
      let willEnd: number;

      // 1000 = 10.00%
      const iuPercent = 2000;
      // 10000 = 100.00%
      const baseRate = 10000;

      const tokenAmount = 1000;
      const initialUnlockTockens = (tokenAmount * iuPercent) / baseRate;
      const lockedTokens = tokenAmount - initialUnlockTockens;
      const cliffDays = 10;

      const iuClaimDelayDays = cliffDays;
      const firstClaimDelayDays = cliffDays + 10;
      const secondClaimDelayDays = cliffDays + 15;

      before(async function () {
        willStart = await getWillStart();
        willEnd = getWillEnd(willStart);

        VestingContract = await deployVesting(willStart, Token, cliffDays);
        await Token.connect(owner).mint(VestingContract.address, tokenAmount);
        await VestingContract.addInvestor(user.address, tokenAmount, iuPercent);
      });

      it('zero balance before', async function () {
        // before vesting starts
        expect(await Token.balanceOf(user.address)).to.be.equal(0);
      });

      it('claim initial unlocked tokens', async function () {
        await ethers.provider.send('evm_mine', [willStart + DAY * iuClaimDelayDays + 1]);
        await VestingContract.connect(user).claimIuTokens();

        expect(await Token.balanceOf(user.address)).to.be.equal(initialUnlockTockens);
      });

      it('first locked claim', async function () {
        await ethers.provider.send('evm_mine', [willStart + DAY * firstClaimDelayDays + 1]);
        await VestingContract.connect(user).claimLockedTokens();

        expect(await Token.balanceOf(user.address)).to.be.equal(
          initialUnlockTockens +
            Math.floor(
              (lockedTokens * (firstClaimDelayDays - cliffDays)) /
                (VESTING_PERIOD_DAYS - cliffDays),
            ),
        );
      });

      it('second locked claim', async function () {
        await ethers.provider.send('evm_mine', [willStart + DAY * secondClaimDelayDays + 1]);
        await VestingContract.connect(user).claimLockedTokens();

        expect(await Token.balanceOf(user.address)).to.be.equal(
          initialUnlockTockens +
            Math.floor(
              (lockedTokens * (secondClaimDelayDays - cliffDays)) /
                (VESTING_PERIOD_DAYS - cliffDays),
            ),
        );
      });

      it('third (last) locked claim', async function () {
        await ethers.provider.send('evm_mine', [willEnd + 1]);
        await VestingContract.connect(user).claimLockedTokens();

        expect(await Token.balanceOf(user.address)).to.be.equal(tokenAmount);
      });
    });
  });
});
