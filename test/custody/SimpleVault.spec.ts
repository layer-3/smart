/* eslint no-unused-expressions: 0 */

import {expect} from 'chai';
import {ethers} from 'hardhat';

import {
  BrokerRole,
  DepositType,
  WithdrawType,
  depositWithPayload,
  deposit,
  generatePayload,
  withdrawWithPayload,
  approve,
  getGasFee,
} from './common';

describe('SimpleVault Contract', function () {
  beforeEach(async function () {
    const [owner, user, broker, someone] = await ethers.getSigners();
    this.owner = owner;
    this.user = user;
    this.broker = broker;
    this.someone = someone;
    this.BrokerRole = BrokerRole;
    this.DepositType = DepositType;
    this.WithdrawType = WithdrawType;

    const vaultName = 'SimpleVault';
    const vaultFactory = await ethers.getContractFactory('SimpleVault');
    const vaultContract = await vaultFactory.deploy(vaultName, broker.address);
    await vaultContract.deployed();
    this.vaultContract = vaultContract;

    const tokenFactory = await ethers.getContractFactory('TestERC20');
    const tokenContract = await tokenFactory.deploy(
      'TestToken',
      'TOK',
      ethers.utils.parseEther('2000000')
    );
    await tokenContract.deployed();
    this.tokenContract = tokenContract;

    await tokenContract.setUserBalance(user.address, ethers.utils.parseEther('100'));
  });

  it('has right admin', async function () {
    const {owner, vaultContract} = this;
    expect(await vaultContract.hasRole(ethers.constants.HashZero, owner.address)).to.equal(true);
  });

  it('has right broker', async function () {
    const {broker, BrokerRole, vaultContract} = this;
    expect(await vaultContract.hasRole(BrokerRole, broker.address)).to.equal(true);
  });

  it('can change broker', async function () {
    const {broker, someone, BrokerRole, vaultContract} = this;
    expect(await vaultContract.changeBroker(someone.address)).to.not.undefined;
    expect(await vaultContract.hasRole(BrokerRole, someone.address)).to.equal(true);
    expect(await vaultContract.hasRole(BrokerRole, broker.address)).to.equal(false);
  });

  it('can deposit token', async function () {
    const {user, broker, vaultContract, tokenContract, DepositType} = this;
    const amount = ethers.utils.parseEther('10');

    await approve(user, vaultContract, tokenContract);
    const initialETHBalance = await user.getBalance();
    const result = await deposit(user, DepositType, amount, broker, vaultContract, tokenContract);
    const depositEvent = result.events.find((e: any) => e.event === 'Deposited');

    expect(depositEvent).to.not.undefined;
    expect(depositEvent.args.account).to.equal(user.address);
    expect(depositEvent.args.asset).to.equal(tokenContract.address);
    expect(depositEvent.args.amount).to.equal(amount);

    // check balance
    expect(await user.getBalance()).to.equal(initialETHBalance.sub(getGasFee(result)));
  });

  it('can deposit eth', async function () {
    const {user, broker, vaultContract, DepositType} = this;
    const amount = ethers.utils.parseEther('10');

    const initialETHBalance = await user.getBalance();
    const result = await deposit(user, DepositType, amount, broker, vaultContract, {
      address: ethers.constants.AddressZero,
    });
    const depositEvent = result.events.find((e: any) => e.event === 'Deposited');

    expect(depositEvent).to.not.undefined;
    expect(depositEvent.args.account).to.equal(user.address);
    expect(depositEvent.args.asset).to.equal(ethers.constants.AddressZero);
    expect(depositEvent.args.amount).to.equal(amount);

    // check balance
    expect(await user.getBalance()).to.equal(initialETHBalance.sub(amount).sub(getGasFee(result)));
  });

  it('can fully withdraw token', async function () {
    const {user, broker, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const amount = ethers.utils.parseEther('10');
    const initialTokenBalance = await tokenContract.balanceOf(user.address);

    await approve(user, vaultContract, tokenContract);
    await deposit(user, DepositType, amount, broker, vaultContract, tokenContract);

    // withdraw
    const {payload} = generatePayload({
      destination: user.address,
      asset: tokenContract.address,
      amount,
    });
    const result = await withdrawWithPayload(user, WithdrawType, broker, payload, vaultContract);
    const withdrawEvent = result.events.find((e: any) => e.event === 'Withdrawn');

    expect(withdrawEvent).to.not.undefined;
    expect(withdrawEvent.args.id).to.equal(2);
    expect(withdrawEvent.args.account).to.equal(user.address);

    // check balance
    const finalBalance = await tokenContract.balanceOf(user.address);
    expect(finalBalance).to.equal(initialTokenBalance);
  });

  it('can fully withdraw eth', async function () {
    const {user, broker, WithdrawType, vaultContract, DepositType} = this;
    const initialETHBalance = await user.getBalance();
    const amount = ethers.utils.parseEther('10');

    const depositTx = await deposit(user, DepositType, amount, broker, vaultContract, {
      address: ethers.constants.AddressZero,
    });

    // withdraw
    const {payload} = generatePayload({
      destination: user.address,
      asset: ethers.constants.AddressZero,
      amount,
    });
    const result = await withdrawWithPayload(user, WithdrawType, broker, payload, vaultContract);
    const withdrawEvent = result.events.find((e: any) => e.event === 'Withdrawn');

    expect(withdrawEvent).to.not.undefined;
    expect(withdrawEvent.args.id).to.equal(2);
    expect(withdrawEvent.args.account).to.equal(user.address);

    // check balance
    const finalBalance = await user.getBalance();
    expect(finalBalance).to.equal(
      initialETHBalance.sub(amount).sub(getGasFee(depositTx)).add(amount).sub(getGasFee(result))
    );
  });

  it('can partial withdraw', async function () {
    const {user, broker, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const depositAmount = ethers.utils.parseEther('10');
    const firstWithdrawAmount = ethers.utils.parseEther('6');
    const secondWithdrawAmount = ethers.utils.parseEther('1');
    const initialETHBalance = await user.getBalance();
    const initialTokenBalance = await tokenContract.balanceOf(user.address);

    const approveTx = await approve(user, vaultContract, tokenContract);
    const depositTokenTx = await deposit(
      user,
      DepositType,
      depositAmount,
      broker,
      vaultContract,
      tokenContract
    );
    const depositETHTx = await deposit(user, DepositType, depositAmount, broker, vaultContract, {
      address: ethers.constants.AddressZero,
    });

    // withdraw
    const {payload} = generatePayload({
      destination: user.address,
      asset: tokenContract.address,
      amount: firstWithdrawAmount,
    });
    const withdrawTokenTx = await withdrawWithPayload(
      user,
      WithdrawType,
      broker,
      payload,
      vaultContract
    );
    const withdrawTokenEvent = withdrawTokenTx.events.find((e: any) => e.event === 'Withdrawn');

    expect(withdrawTokenEvent).to.not.undefined;

    const {payload: secondPayload} = generatePayload({
      destination: user.address,
      assets: [
        [tokenContract.address, secondWithdrawAmount.toString()],
        [ethers.constants.AddressZero, secondWithdrawAmount.toString()],
      ],
    });
    const withdrawBothTx = await withdrawWithPayload(
      user,
      WithdrawType,
      broker,
      secondPayload,
      vaultContract
    );

    const withdrawEvents = withdrawBothTx.events.filter((e: any) => e.event === 'Withdrawn');

    expect(withdrawEvents.length).to.equal(2);

    // check balance
    const finalETHBalance = await user.getBalance();
    const finalTokenBalance = await tokenContract.balanceOf(user.address);
    expect(finalTokenBalance).to.equal(
      initialTokenBalance.sub(depositAmount).add(firstWithdrawAmount).add(secondWithdrawAmount)
    );
    expect(finalETHBalance).to.equal(
      initialETHBalance
        .sub(getGasFee(approveTx))
        .sub(getGasFee(depositTokenTx))
        .sub(depositAmount)
        .sub(getGasFee(depositETHTx))
        .sub(getGasFee(withdrawTokenTx))
        .add(secondWithdrawAmount)
        .sub(getGasFee(withdrawBothTx))
    );
  });

  it('can not deposit with malicious broker', async function () {
    const {user, broker, someone, DepositType, vaultContract, tokenContract} = this;
    const depositAmount = ethers.BigNumber.from('2000');
    const depositTo = someone;

    await approve(user, vaultContract, tokenContract);

    const {payload} = generatePayload({
      destination: depositTo.address,
      asset: tokenContract.address,
      amount: depositAmount,
    });

    await expect(
      depositWithPayload(user, DepositType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: invalid request');
    await expect(
      depositWithPayload(
        user,
        ethers.utils.id('INVALID_REQUEST_TYPE'),
        broker,
        payload,
        vaultContract,
        false
      )
    ).to.be.revertedWith('Vault: invalid signature');
  });

  it('can not withdraw with malicious broker', async function () {
    const {user, broker, someone, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const depositAmount = ethers.BigNumber.from('2000');
    const withdrawAmount = ethers.BigNumber.from('100');
    const withdrawTo = someone;

    await approve(user, vaultContract, tokenContract);
    await deposit(user, DepositType, depositAmount, broker, vaultContract, tokenContract);

    const {payload} = generatePayload({
      destination: withdrawTo.address,
      asset: tokenContract.address,
      amount: withdrawAmount,
    });
    await expect(
      withdrawWithPayload(user, WithdrawType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: invalid request');
    await expect(
      withdrawWithPayload(
        user,
        ethers.utils.id('INVALID_REQUEST_TYPE'),
        broker,
        payload,
        vaultContract,
        false
      )
    ).to.be.revertedWith('Vault: invalid signature');
  });

  it('can not deposit with malicious user', async function () {
    const {user, broker, someone, DepositType, vaultContract, tokenContract} = this;
    const depositAmount = ethers.BigNumber.from('2000');

    await approve(user, vaultContract, tokenContract);

    const {payload} = generatePayload({
      destination: user.address,
      asset: tokenContract.address,
      amount: depositAmount,
    });
    await expect(
      depositWithPayload(someone, DepositType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: invalid request');
  });

  it('can not withdraw with malicious user', async function () {
    const {user, broker, someone, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const depositAmount = ethers.BigNumber.from('2000');
    const withdrawAmount = ethers.BigNumber.from('100');

    await approve(user, vaultContract, tokenContract);
    await deposit(user, DepositType, depositAmount, broker, vaultContract, tokenContract);

    const {payload} = generatePayload({
      destination: user.address,
      asset: tokenContract.address,
      amount: withdrawAmount,
    });
    await expect(
      withdrawWithPayload(someone, WithdrawType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: invalid request');
  });

  it('can not deposit when timeout', async function () {
    const {user, broker, DepositType, vaultContract, tokenContract} = this;
    const depositAmount = ethers.BigNumber.from('2000');

    await approve(user, vaultContract, tokenContract);

    const {payload} = generatePayload({
      destination: user.address,
      asset: tokenContract.address,
      amount: depositAmount,
      deadline: Date.now() - 60_000,
    });
    await expect(
      depositWithPayload(user, DepositType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: request is expired');
  });

  it('can not withdraw when timeout', async function () {
    const {user, broker, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const depositAmount = ethers.BigNumber.from('2000');
    const withdrawAmount = ethers.BigNumber.from('100');

    await approve(user, vaultContract, tokenContract);
    await deposit(user, DepositType, depositAmount, broker, vaultContract, tokenContract);

    const {payload} = generatePayload({
      destination: user.address,
      asset: tokenContract.address,
      amount: withdrawAmount,
      deadline: Date.now() - 60_000,
    });
    await expect(
      withdrawWithPayload(user, WithdrawType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: request is expired');
  });

  it('can not deposit when repeat use of payload & signature', async function () {
    const {user, broker, DepositType, vaultContract, tokenContract} = this;
    const depositAmount = ethers.BigNumber.from('2000');

    await approve(user, vaultContract, tokenContract);

    const {payload} = generatePayload({
      rid: ethers.utils.formatBytes32String('1'),
      destination: user.address,
      asset: tokenContract.address,
      amount: depositAmount,
    });
    await depositWithPayload(user, DepositType, broker, payload, vaultContract);
    await expect(
      depositWithPayload(user, DepositType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: signature has been used');
  });

  it('can not withdraw when repeat use of payload & signature', async function () {
    const {user, broker, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const depositAmount = ethers.BigNumber.from('2000');
    const withdrawAmount = ethers.BigNumber.from('100');

    await approve(user, vaultContract, tokenContract);
    await deposit(user, DepositType, depositAmount, broker, vaultContract, tokenContract);

    const {payload} = generatePayload({
      rid: ethers.utils.formatBytes32String('1'),
      destination: user.address,
      asset: tokenContract.address,
      amount: withdrawAmount,
    });
    await withdrawWithPayload(user, WithdrawType, broker, payload, vaultContract);
    await expect(
      withdrawWithPayload(user, WithdrawType, broker, payload, vaultContract, false)
    ).to.be.revertedWith('Vault: signature has been used');
  });

  it('can getLastId()', async function () {
    const {user, broker, WithdrawType, vaultContract, tokenContract, DepositType} = this;
    const depositAmount = ethers.BigNumber.from('2000');
    const withdrawAmount = ethers.BigNumber.from('100');
    const getPayload = () =>
      generatePayload({
        destination: user.address,
        asset: tokenContract.address,
        amount: withdrawAmount,
      }).payload;

    await approve(user, vaultContract, tokenContract);
    await deposit(user, DepositType, depositAmount, broker, vaultContract, tokenContract);
    expect(await vaultContract.getLastId()).to.equal(1);
    await withdrawWithPayload(user, WithdrawType, broker, getPayload(), vaultContract);
    expect(await vaultContract.getLastId()).to.equal(2);
    const dTx = deposit(user, DepositType, depositAmount, broker, vaultContract, tokenContract);
    const wTx = withdrawWithPayload(user, WithdrawType, broker, getPayload(), vaultContract);
    await Promise.all([dTx, wTx]);
    expect(await vaultContract.getLastId()).to.equal(4);
  });
});
