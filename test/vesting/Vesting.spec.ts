import {expect} from 'chai';
import {Contract, constants} from 'ethers';
import {ethers, upgrades} from 'hardhat';

describe('Vesting Contract', function () {
  // for contract to compile and be tested during this period
  const TIMESHIFT_SECONDS = 1800;

  // vesting period of 30 days
  const VESTING_PERIOD_DAYS = 30;

  // seconds in day
  const DAY = 60 * 60 * 24;

  before(async function () {
    const [owner, user, someone] = await ethers.getSigners();
    this.owner = owner;
    this.user = user;
    this.someone = someone;
    this.AdminRole = ethers.constants.HashZero;

    const tokenFactory = await ethers.getContractFactory('VestingERC20');
    const tokenContract = await tokenFactory.deploy('Yellow', 'YLW');
    await tokenContract.deployed();
    this.tokenContract = tokenContract;
  });

  before(function () {
    this.epoch = Math.round(new Date().getTime() / 1000);
    this.willStart = this.epoch + TIMESHIFT_SECONDS;

    this.getWillStart = async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;
      console.log(timestampBefore);
      return timestampBefore + TIMESHIFT_SECONDS;
    };

    this.getWillEnd = (willStart: number): number => {
      return willStart + DAY * VESTING_PERIOD_DAYS;
    };

    // vesting period of 30 days
    this.willEnd = this.getWillEnd(this.willStart);
  });

  describe('initializer', function () {
    before(async function () {
      this.vestingFactory = await ethers.getContractFactory('Vesting');
    });

    it('revert on zero token address', async function () {
      const {vestingFactory, willStart} = this;
      await expect(
        upgrades.deployProxy(vestingFactory, [
          ethers.constants.AddressZero,
          willStart,
          VESTING_PERIOD_DAYS,
          0,
          1,
        ])
      ).to.be.revertedWith('initializer: token is 0x0');
    });

    it('revert on start < now', async function () {
      const {vestingFactory, tokenContract, willStart} = this;
      await expect(
        upgrades.deployProxy(vestingFactory, [
          tokenContract.address,
          willStart - DAY, // basically, one day earlier that now
          VESTING_PERIOD_DAYS,
          0,
          1,
        ])
      ).to.be.revertedWith('initializer: start <= now');
    });

    it('revert on period days = 0', async function () {
      const {vestingFactory, tokenContract, willStart} = this;
      await expect(
        upgrades.deployProxy(vestingFactory, [tokenContract.address, willStart, 0, 0, 1])
      ).to.be.revertedWith('initializer: period days <= 0');
    });

    it('revert on cliff >= period', async function () {
      const {vestingFactory, tokenContract, willStart} = this;
      await expect(
        upgrades.deployProxy(vestingFactory, [
          tokenContract.address,
          willStart,
          VESTING_PERIOD_DAYS,
          VESTING_PERIOD_DAYS + 1,
          1,
        ])
      ).to.be.revertedWith('initializer: cliff >= vesting period');
    });

    it('revert on claimingIntervalDays = 0', async function () {
      const {vestingFactory, tokenContract, willStart} = this;
      await expect(
        upgrades.deployProxy(vestingFactory, [
          tokenContract.address,
          willStart,
          VESTING_PERIOD_DAYS,
          0,
          0,
        ])
      ).to.be.revertedWith('initializer: claiming interval days <= 0');
    });

    it('revert on interval days not being a divider of period days after vesting cliff', async function () {
      const {vestingFactory, tokenContract, willStart} = this;
      await expect(
        upgrades.deployProxy(vestingFactory, [
          tokenContract.address,
          willStart,
          VESTING_PERIOD_DAYS,
          0,
          VESTING_PERIOD_DAYS - 1,
        ])
      ).to.be.revertedWith('initializer: activeVestingPeriod % claimingIntervalDays != 0');
    });
  });

  describe('upgradeable', function () {
    it('contract is upgradeable', async function () {
      const {tokenContract, willStart} = this;
      const vestingFactoryV1 = await ethers.getContractFactory('Vesting');
      const contractV1 = await upgrades.deployProxy(vestingFactoryV1, [
        tokenContract.address,
        willStart,
        VESTING_PERIOD_DAYS,
        0,
        1,
      ]);
      await contractV1.deployed();

      const {user, someone} = this;
      const [tokenAmount1, tokenAmount2] = [500, 1000];
      await contractV1.addInvestor(user.address, tokenAmount1, 0);
      await contractV1.addInvestor(someone.address, tokenAmount2, 0);
      const toPayTokensV1 = await contractV1.getToPayTokens();

      const vestingFactoryV2 = await ethers.getContractFactory('VestingV2Test');
      const contractV2 = await upgrades.upgradeProxy(contractV1.address, vestingFactoryV2);

      await contractV2.deployed();

      const toPayTokensV2 = await contractV2.getToPayTokens();

      expect(contractV2.address).to.equal(contractV1.address);
      expect(contractV2.AVAILABLE_AFTER_UPGRADE).to.not.undefined;
      expect(await contractV2.AVAILABLE_AFTER_UPGRADE()).to.equal(true);

      expect(toPayTokensV1).to.be.equal(toPayTokensV2);
    });
  });

  describe('main logic', function () {
    before(async function () {
      const {tokenContract} = this;
      this.createVestingContract = async (
        willStart: number,
        cliff = 0,
        claimingInterval = 1
      ): Promise<Contract> => {
        const vestingFactory = await ethers.getContractFactory('Vesting');
        const vestingContract = await upgrades.deployProxy(vestingFactory, [
          tokenContract.address,
          willStart,
          VESTING_PERIOD_DAYS,
          cliff,
          claimingInterval,
        ]);
        await vestingContract.deployed();
        return vestingContract;
      };

      this.getWillStart = async (): Promise<number> => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const epoch = blockBefore.timestamp;
        return epoch + TIMESHIFT_SECONDS;
      };

      this.cliffDays = 10;
      this.vestingContract = await this.createVestingContract(this.willStart, this.cliffDays);
    });

    describe('roles', function () {
      it('revert on user adding investor', async function () {
        const {vestingContract, user, someone} = this;
        await expect(
          vestingContract.connect(user).addInvestor(someone.address, 1, 0)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('revert on user removing investor', async function () {
        const {vestingContract, user, someone} = this;
        await vestingContract.addInvestor(someone.address, 1, 0);
        await expect(
          vestingContract.connect(user).removeInvestor(someone.address)
        ).to.be.revertedWith('Ownable: caller is not the owner');

        // cleanup
        await vestingContract.removeInvestor(someone.address);
      });
    });

    describe('vesting properties', function () {
      it('Start time is correct', async function () {
        const {vestingContract, willStart} = this;
        expect(await vestingContract.getStartTime()).to.equal(willStart);
      });

      it('Vesting period is correct', async function () {
        const {vestingContract} = this;
        expect(await vestingContract.getPeriodDays()).to.equal(VESTING_PERIOD_DAYS);
      });

      it('Vesting cliff is correct', async function () {
        const {vestingContract, cliffDays} = this;
        expect(await vestingContract.getCliffDays()).to.be.equal(cliffDays);
      });

      it('Total token amount to pay is correct', async function () {
        const {vestingContract, user, someone} = this;
        const [tokenAmount1, tokenAmount2] = [500, 1000];
        await vestingContract.addInvestor(user.address, tokenAmount1, 0);
        await vestingContract.addInvestor(someone.address, tokenAmount2, 0);
        expect(await vestingContract.getToPayTokens()).to.equal(tokenAmount1 + tokenAmount2);
      });
    });

    describe('investors (non time-related)', function () {
      beforeEach(async function () {
        this.vestingContract = await this.createVestingContract(this.willStart);
        this.tokenAmount = 1000;
        const {tokenContract, vestingContract, owner, user, tokenAmount} = this;

        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);
        await vestingContract.addInvestor(user.address, tokenAmount, 0);
      });

      it('revert on addInvestor address 0x0', async function () {
        const {vestingContract} = this;

        const investor = constants.AddressZero; // 0x0 address
        const amount = 1;
        const iuPercent = 0;

        await expect(vestingContract.addInvestor(investor, amount, iuPercent)).to.be.revertedWith(
          'addInvestor: investor is 0x0'
        );
      });

      it('revert on addInvestor amount 0', async function () {
        const {vestingContract, someone} = this;

        const investor = someone.address;
        const amount = 0; // zero amount
        const iuPercent = 0;

        await expect(vestingContract.addInvestor(investor, amount, iuPercent)).to.be.revertedWith(
          'addInvestor: amount is 0'
        );
      });

      it('revert on addInvestor iuPercent >= 100%', async function () {
        const {vestingContract, someone} = this;

        const investor = someone.address;
        const amount = 1;
        const iuPercent = 10100; // >= 100%

        await expect(vestingContract.addInvestor(investor, amount, iuPercent)).to.be.revertedWith(
          'addInvestor: iuPercent >= 100%'
        );
      });

      it('revert on addInvestors arrays length mismatch', async function () {
        const {vestingContract, user, someone} = this;

        const investors = [user.address, someone.address];
        const amounts = [100, 100, 100]; // amounts length mismatch
        const iuPercent = 0;

        await expect(
          vestingContract.addInvestors(investors, amounts, iuPercent)
        ).to.be.revertedWith('addInvestors: arrays length mismatch');
      });

      it('locked amount after adding investor is correct', async function () {
        const {vestingContract, user, tokenAmount} = this;

        const [, , tokens] = await vestingContract.getInvestorData(user.address);
        expect(tokens.toNumber()).to.be.equal(tokenAmount);
      });

      it('investor is not present after their removal', async function () {
        const {vestingContract, user} = this;

        await vestingContract.removeInvestor(user.address);
        const [, , tokens] = await vestingContract.getInvestorData(user.address);
        expect(tokens.toNumber()).to.be.equal(0);
      });

      it('overwrite investor data if adding them second time', async function () {
        const {vestingContract, user, tokenAmount} = this;

        // User has already been added as investor in beforeEach

        const [, , tokensBefore] = await vestingContract.getInvestorData(user.address);
        // precondition
        expect(tokensBefore.toNumber()).to.be.equal(tokenAmount);

        const newTokenAmount = tokenAmount + 10;
        await vestingContract.addInvestor(user.address, newTokenAmount, 0);

        const [, , tokensAfter] = await vestingContract.getInvestorData(user.address);
        expect(tokensAfter.toNumber()).to.be.equal(newTokenAmount);
      });

      it('revert when claiming locked tokens before start', async function () {
        const {vestingContract, user} = this;

        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: claiming before cliff date'
        );
      });
    });

    describe('investors (time-related)', function () {
      before(async function () {
        this.tokenAmount = 1000;
      });

      beforeEach(async function () {
        const willStart = await this.getWillStart();
        const willEnd = this.getWillEnd(willStart);

        const vestingContract = await this.createVestingContract(willStart);
        const {tokenAmount, tokenContract, owner, user} = this;
        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);
        await vestingContract.addInvestor(user.address, tokenAmount, 0);

        this.willStart = willStart;
        this.willEnd = willEnd;
        this.vestingContract = vestingContract;
      });

      afterEach(async function () {
        const {tokenContract, user, owner} = this;
        const balance = await tokenContract.balanceOf(user.address);
        await tokenContract.connect(owner).burnFrom(user.address, balance);
      });

      it('revert on adding investor after vesting start', async function () {
        const {vestingContract, willStart, someone} = this;

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(vestingContract.addInvestor(someone.address, 1, 0)).to.be.revertedWith(
          'addInvestor: adding investor after vesting start'
        );
      });

      it('releasing amount is correct', async function () {
        const {vestingContract, willStart, user} = this;

        const daysPassed = 1;
        await ethers.provider.send('evm_mine', [willStart + DAY * daysPassed + 1]);
        const toBeReleased = await vestingContract.getReleasableLockedTokens(user.address);
        expect(toBeReleased).to.be.equal(
          Math.round((this.tokenAmount * daysPassed) / VESTING_PERIOD_DAYS)
        );
      });

      it('tokens released to user balance', async function () {
        const {vestingContract, tokenContract, willStart, user} = this;

        const daysPassed = 1;
        await ethers.provider.send('evm_mine', [willStart + DAY * daysPassed + 1]);
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(0);
        await vestingContract.connect(user).claimLockedTokens();
        const balance = await tokenContract.balanceOf(user.address);
        expect(balance).to.be.equal(
          Math.round((this.tokenAmount * daysPassed) / VESTING_PERIOD_DAYS)
        );
      });

      it('revert when no releasable tokens available', async function () {
        const {vestingContract, willStart, user} = this;

        // no days have passed since vesting period started
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens'
        );
      });

      it('revert on reclaiming tokens the same day', async function () {
        const {vestingContract, willStart, user} = this;

        const daysPassed = 1;
        await ethers.provider.send('evm_mine', [willStart + DAY * daysPassed + 1]);
        // claim now
        await vestingContract.connect(user).claimLockedTokens();
        // and claim right again
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens'
        );
      });

      it("unadded investor can't release tokens", async function () {
        const {getWillStart, createVestingContract, user} = this;

        const willStart = await getWillStart();
        // creating new contract not to have an investor added
        const vestingContract = await createVestingContract(willStart);
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens'
        );
      });

      it("removed investor can't release tokens", async function () {
        const {vestingContract, willStart, user, owner} = this;

        await vestingContract.connect(owner).removeInvestor(user.address);
        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens'
        );
      });
    });

    describe('vesting cliff', function () {
      before(function () {
        this.tokenAmount = 1000;
        this.cliffDays = 10;
      });

      afterEach(async function () {
        const {tokenContract, user, owner} = this;
        const balance = await tokenContract.balanceOf(user.address);
        await tokenContract.connect(owner).burnFrom(user.address, balance);
      });

      beforeEach(async function () {
        const willStart = await this.getWillStart();
        const willEnd = this.getWillEnd(willStart);

        const vestingContract = await this.createVestingContract(willStart, this.cliffDays);
        const {tokenAmount, tokenContract, owner, user} = this;
        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);
        await vestingContract.addInvestor(user.address, tokenAmount, 0);

        this.willStart = willStart;
        this.willEnd = willEnd;
        this.vestingContract = vestingContract;
      });

      it('0 tokens are available during cliff', async function () {
        const {vestingContract, user, willStart} = this;

        await ethers.provider.send('evm_mine', [willStart + 1]);
        expect(await vestingContract.getReleasableLockedTokens(user.address)).to.be.equal(0);
      });

      it('reverts on claiming locked tokens during cliff', async function () {
        const {vestingContract, user, willStart} = this;

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: claiming before cliff date'
        );
      });

      it('reverts on claiming right after cliff ends (no tokens)', async function () {
        const {vestingContract, tokenContract, user, willStart, cliffDays} = this;

        await ethers.provider.send('evm_mine', [willStart + DAY * cliffDays + 1]);
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(0);
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens'
        );
      });

      it('receive correct amount after some time after cliff ends', async function () {
        const {vestingContract, tokenContract, user, willStart, tokenAmount, cliffDays} = this;
        const receiveDelayDays = cliffDays + 5;

        await ethers.provider.send('evm_mine', [willStart + DAY * receiveDelayDays + 1]);
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(0);
        await vestingContract.connect(user).claimLockedTokens();
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(
          Math.floor(
            (tokenAmount * (receiveDelayDays - cliffDays)) / (VESTING_PERIOD_DAYS - cliffDays)
          )
        );
      });

      it('receive full amount after vesting ends', async function () {
        const {vestingContract, tokenContract, user, willEnd, tokenAmount} = this;

        await ethers.provider.send('evm_mine', [willEnd]);
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(0);
        await vestingContract.connect(user).claimLockedTokens();
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(Math.floor(tokenAmount));
      });
    });

    describe('token claim interval', function () {
      before(function () {
        this.tokenAmount = 1000;
      });

      afterEach(async function () {
        const {tokenContract, user, owner} = this;
        const balance = await tokenContract.balanceOf(user.address);
        await tokenContract.connect(owner).burnFrom(user.address, balance);
      });

      it('reverts on claim before set interval', async function () {
        const willStart = await this.getWillStart();
        const {createVestingContract, tokenContract, owner, user, tokenAmount} = this;

        const cliffDays = 0;
        const claimingIntervalDays = 2;

        const vestingContract = await createVestingContract(
          willStart,
          cliffDays,
          claimingIntervalDays
        );
        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);

        await vestingContract.addInvestor(user.address, tokenAmount, 0);

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await expect(vestingContract.connect(user).claimLockedTokens()).to.be.revertedWith(
          'claimLockedTokens: no available tokens'
        );
      });

      it('first claim only after set interval', async function () {
        const willStart = await this.getWillStart();
        const {createVestingContract, tokenContract, owner, user, tokenAmount} = this;

        const cliffDays = 0;
        const claimingIntervalDays = 2;
        const claimDelayDays = 2;

        const vestingContract = await createVestingContract(
          willStart,
          cliffDays,
          claimingIntervalDays
        );
        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);

        await vestingContract.addInvestor(user.address, tokenAmount, 0);

        await ethers.provider.send('evm_mine', [willStart + DAY * claimDelayDays + 1]);
        await vestingContract.connect(user).claimLockedTokens();
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(
          Math.floor((tokenAmount * claimDelayDays) / (VESTING_PERIOD_DAYS - cliffDays))
        );
      });
    });

    describe('Initial Unlock tokens', function () {
      before(async function () {
        this.tokenAmount = 1000;
        // 1000 = 10.00%
        this.iuPercent = 1250;
        // 10000 = 100.00%
        this.baseRate = 10000;
      });

      afterEach(async function () {
        const {tokenContract, user, owner} = this;
        const balance = await tokenContract.balanceOf(user.address);
        await tokenContract.connect(owner).burnFrom(user.address, balance);
      });

      beforeEach(async function () {
        const willStart = await this.getWillStart();
        const willEnd = this.getWillEnd(willStart);

        const vestingContract = await this.createVestingContract(willStart);
        const {tokenAmount, tokenContract, owner, user, iuPercent} = this;
        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);
        await vestingContract.addInvestor(user.address, tokenAmount, iuPercent);

        this.willStart = willStart;
        this.willEnd = willEnd;
        this.vestingContract = vestingContract;
      });

      it('reverts on claiming iu tokens before cliff date', async function () {
        const {vestingContract, user} = this;

        await expect(vestingContract.connect(user).claimIuTokens()).to.be.revertedWith(
          'claimIuTokens: claiming before cliff date'
        );
      });

      it('claimed amount is correct', async function () {
        const {vestingContract, tokenContract, user, willStart, tokenAmount, iuPercent, baseRate} =
          this;

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await vestingContract.connect(user).claimIuTokens();
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(
          (tokenAmount * iuPercent) / baseRate
        );
      });

      it('claimed amount is correct after vesting end', async function () {
        const {vestingContract, tokenContract, user, willEnd, tokenAmount, iuPercent, baseRate} =
          this;

        await ethers.provider.send('evm_mine', [willEnd + 1]);
        await vestingContract.connect(user).claimIuTokens();
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(
          (tokenAmount * iuPercent) / baseRate
        );
      });

      it('reverts on claiming second time', async function () {
        const {vestingContract, user, willStart} = this;

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await vestingContract.connect(user).claimIuTokens();
        await expect(vestingContract.connect(user).claimIuTokens()).to.be.revertedWith(
          'claimIuTokens: no available tokens'
        );
      });

      it('get investor data returns correct iu token amount', async function () {
        const {vestingContract, user, willStart, tokenAmount, iuPercent, baseRate} = this;

        let [tgeTokens] = await vestingContract.getInvestorData(user.address);
        expect(tgeTokens.toNumber()).to.be.equal((tokenAmount * iuPercent) / baseRate);

        await ethers.provider.send('evm_mine', [willStart + 1]);
        await vestingContract.connect(user).claimIuTokens();

        [tgeTokens] = await vestingContract.getInvestorData(user.address);
        expect(tgeTokens.toNumber()).to.be.equal(0);
      });
    });

    describe('vesting cliff and iu tokens', function () {
      before(async function () {
        // 1000 = 10.00%
        this.iuPercent = 2000;
        // 10000 = 100.00%
        this.baseRate = 10000;

        this.tokenAmount = 1000;
        this.initialUnlockTockens = (this.tokenAmount * this.iuPercent) / this.baseRate;
        this.lockedTokens = this.tokenAmount - this.initialUnlockTockens;
        this.cliffDays = 10;

        const willStart = await this.getWillStart();
        const willEnd = this.getWillEnd(willStart);

        const vestingContract = await this.createVestingContract(willStart, this.cliffDays);
        const {tokenAmount, tokenContract, owner, user, iuPercent} = this;
        await tokenContract.connect(owner).mint(vestingContract.address, tokenAmount);
        await vestingContract.addInvestor(user.address, tokenAmount, iuPercent);

        this.willStart = willStart;
        this.willEnd = willEnd;
        this.vestingContract = vestingContract;

        this.iuClaimDelayDays = this.cliffDays;
        this.firstClaimDelayDays = this.cliffDays + 10;
        this.secondClaimDelayDays = this.cliffDays + 15;
      });

      it('zero balance before', async function () {
        const {tokenContract, user} = this;

        // before vesting starts
        expect(await tokenContract.balanceOf(user.address)).to.be.equal(0);
      });

      it('claim initial unlocked tokens', async function () {
        const {
          vestingContract,
          tokenContract,
          user,
          willStart,
          iuClaimDelayDays,
          initialUnlockTockens,
        } = this;
        await ethers.provider.send('evm_mine', [willStart + DAY * iuClaimDelayDays + 1]);
        await vestingContract.connect(user).claimIuTokens();

        expect(await tokenContract.balanceOf(user.address)).to.be.equal(initialUnlockTockens);
      });

      it('first locked claim', async function () {
        const {
          vestingContract,
          tokenContract,
          user,
          willStart,
          firstClaimDelayDays,
          cliffDays,
          lockedTokens,
          initialUnlockTockens,
        } = this;

        await ethers.provider.send('evm_mine', [willStart + DAY * firstClaimDelayDays + 1]);
        await vestingContract.connect(user).claimLockedTokens();

        expect(await tokenContract.balanceOf(user.address)).to.be.equal(
          initialUnlockTockens +
            Math.floor(
              (lockedTokens * (firstClaimDelayDays - cliffDays)) / (VESTING_PERIOD_DAYS - cliffDays)
            )
        );
      });

      it('second locked claim', async function () {
        const {
          vestingContract,
          tokenContract,
          user,
          willStart,
          secondClaimDelayDays,
          cliffDays,
          lockedTokens,
          initialUnlockTockens,
        } = this;

        await ethers.provider.send('evm_mine', [willStart + DAY * secondClaimDelayDays + 1]);
        await vestingContract.connect(user).claimLockedTokens();

        expect(await tokenContract.balanceOf(user.address)).to.be.equal(
          initialUnlockTockens +
            Math.floor(
              (lockedTokens * (secondClaimDelayDays - cliffDays)) /
                (VESTING_PERIOD_DAYS - cliffDays)
            )
        );
      });

      it('third (last) locked claim', async function () {
        const {vestingContract, tokenContract, user, willEnd, tokenAmount} = this;

        await ethers.provider.send('evm_mine', [willEnd + 1]);
        await vestingContract.connect(user).claimLockedTokens();

        expect(await tokenContract.balanceOf(user.address)).to.be.equal(tokenAmount);
      });
    });
  });
});
