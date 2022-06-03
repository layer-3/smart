import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('SimpleERC20', async function () {
  const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
  const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
  const BURNER_ROLE = ethers.utils.id('BURNER_ROLE');
  const TOKEN_AMOUNT = 1000;
  const DECIMALS = 10;

  before(async function () {
    const [owner, minter, burner, user, someone] = await ethers.getSigners();
    this.owner = owner;
    this.minter = minter;
    this.burner = burner;
    this.user = user;
    this.someone = someone;

    const tokenFactory = await ethers.getContractFactory('SimpleERC20');
    const SimpleERC20 = await tokenFactory.deploy('token', 'TKN', DECIMALS);
    await SimpleERC20.deployed();
    this.SimpleERC20 = SimpleERC20;
  });

  describe('Roles', function () {
    before(async function () {
      const {SimpleERC20, owner, minter, burner} = this;

      await SimpleERC20.connect(owner).grantRole(MINTER_ROLE, minter.address);
      await SimpleERC20.connect(owner).grantRole(BURNER_ROLE, burner.address);
    });

    it('owner has admin, minter, burner rights', async function () {
      const {SimpleERC20, owner} = this;

      expect(await SimpleERC20.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await SimpleERC20.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await SimpleERC20.hasRole(BURNER_ROLE, owner.address)).to.be.true;
    });

    it('minter can mint', async function () {
      const {SimpleERC20, minter, user} = this;

      expect(await SimpleERC20.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      await SimpleERC20.connect(minter).mintTo(user.address, TOKEN_AMOUNT);
      expect(await SimpleERC20.balanceOf(user.address)).to.be.equal(TOKEN_AMOUNT);
    });

    it('burner can burn', async function () {
      const {SimpleERC20, burner, user} = this;

      expect(await SimpleERC20.hasRole(BURNER_ROLE, burner.address)).to.be.true;
      await SimpleERC20.connect(burner).burnFrom(user.address, TOKEN_AMOUNT);
      expect(await SimpleERC20.balanceOf(user.address)).to.be.equal(0);
    });

    it("user can't change rights, mint or burn", async function () {
      const {SimpleERC20, user, someone} = this;

      await expect(SimpleERC20.connect(user).grantRole(MINTER_ROLE, someone.address)).to.be
        .reverted;
      await expect(SimpleERC20.connect(user).mintTo(someone.address, TOKEN_AMOUNT)).to.be.reverted;
      await expect(SimpleERC20.connect(user).burnFrom(someone.address, TOKEN_AMOUNT)).to.be
        .reverted;
    });
  });

  describe('Properties', function () {
    it('has correct decimals', async function () {
      const {SimpleERC20} = this;

      expect(await SimpleERC20.decimals()).to.be.equal(DECIMALS);
    });
  });
});
