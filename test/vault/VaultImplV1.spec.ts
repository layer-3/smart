import { expect } from 'chai';
import { providers, utils } from 'ethers';
import { ethers } from 'hardhat';

import VaultImplArtifact from '../../artifacts/contracts/vault/VaultImplV1.sol/VaultImplV1.json';
import {
  ACCOUNT_MISSING_ROLE,
  AMOUNT_ZERO,
  DESTINATION_ZERO_ADDRESS,
  INVALID_ACTION,
  INVALID_ADDRESS,
  INVALID_CHAIN_ID,
  INVALID_ETH_AMOUNT,
  INVALID_IMPL_ADDRESS,
  INVALID_SIGNATURE,
  REQUEST_EXPIRED,
  SIGNATURE_ALREAD_USED,
  VAULT_ALREADY_SETUP,
} from '../../src/revert-reasons';
import {
  BROKER_ADDRESS_SET,
  COSIGNER_ADDRESS_SET,
  DEPOSITED,
  WITHDRAWN,
} from '../../src/event-names';
import { connect, connectGroup } from '../../src/contracts';

import { depositParams, setAddressParams, withdrawParams } from './src/transactions';
import { PartialPayload, addAllocation, generalPayload } from './src/payload';

import type {
  TESTVaultProxy,
  TestERC20,
  TestUnstandardizedERC20,
  VaultImplV1 as VaultImplT,
} from '../../typechain';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;

describe('Vault implementation V1', () => {
  let provider: providers.Provider;

  let implAdmin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let tokenAdmin: SignerWithAddress;
  let someone: SignerWithAddress;
  let broker1: SignerWithAddress;
  let broker2: SignerWithAddress;
  let coSigner1: SignerWithAddress;
  let coSigner2: SignerWithAddress;

  let VaultImplAddress: string;
  let VaultProxy: TESTVaultProxy;
  let VaultImpl: VaultImplT;

  let VaultImplAsProxyAdmin: VaultImplT;
  let VaultImplAsSomeone: VaultImplT;

  let ERC20: TestERC20;

  let ERC20AsAdmin: TestERC20;
  let ERC20AsSomeone: TestERC20;

  let UnstandardizedERC20: TestUnstandardizedERC20;

  beforeEach(async () => {
    const VaultImplFactory = await ethers.getContractFactory('VaultImplV1');
    const VaultImplDirect = await VaultImplFactory.connect(implAdmin).deploy();
    await VaultImplDirect.deployed();

    VaultImplAddress = VaultImplDirect.address;

    const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
    VaultProxy = (await VaultProxyFactory.connect(proxyAdmin).deploy(
      VaultImplDirect.address,
    )) as TESTVaultProxy;
    await VaultProxy.deployed();

    // proxied implementation
    VaultImpl = new ethers.Contract(VaultProxy.address, VaultImplArtifact.abi) as VaultImplT;

    [VaultImplAsProxyAdmin, VaultImplAsSomeone] = connectGroup(VaultImpl, [proxyAdmin, someone]);

    const ERC20Factory = await ethers.getContractFactory(
      'contracts/yellow/test/TestERC20.sol:TestERC20',
    );
    ERC20 = (await ERC20Factory.connect(tokenAdmin).deploy(
      'TestToken',
      'TOK',
      ethers.utils.parseEther('1000'),
    )) as TestERC20;

    [ERC20AsAdmin, ERC20AsSomeone] = connectGroup(ERC20, [tokenAdmin, someone]);

    const UnstandardizedERC20Factory = await ethers.getContractFactory('TestUnstandardizedERC20');
    UnstandardizedERC20 = (await UnstandardizedERC20Factory.connect(tokenAdmin).deploy(
      'BadTestToken',
      'BTOK',
      ethers.utils.parseEther('1000'),
    )) as TestUnstandardizedERC20;
  });

  before(async () => {
    [implAdmin, proxyAdmin, tokenAdmin, someone, broker1, broker2, coSigner1, coSigner2] =
      await ethers.getSigners();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    provider = someone.provider!;
  });

  describe('Proxied Vault logic', () => {
    // ======================
    // Signer addresses
    // ======================
    describe('signer addresses before setup', () => {
      async function setup(
        caller: SignerWithAddress,
        brokerAddress: string,
        coSignerAddress: string,
        reason?: string,
      ): Promise<void> {
        if (reason) {
          await expect(
            connect(VaultImpl, caller).setup(brokerAddress, coSignerAddress),
          ).to.be.revertedWith(reason);
        } else {
          // must not revert
          await connect(VaultImpl, caller).setup(brokerAddress, coSignerAddress);
        }
      }

      it('signer addresses are not setup', async () => {
        expect(await VaultImplAsSomeone.getBrokerAddress()).to.equal(AddressZero);
        expect(await VaultImplAsSomeone.getCoSignerAddress()).to.equal(AddressZero);
      });

      it('accept when proxy admin setup', async () =>
        await setup(proxyAdmin, broker1.address, coSigner1.address));

      it('revert on setup broker to zero address', async () =>
        await setup(proxyAdmin, AddressZero, coSigner1.address, INVALID_ADDRESS));

      it('revert on setup coSigner to zero address', async () =>
        await setup(proxyAdmin, broker1.address, AddressZero, INVALID_ADDRESS));

      it('revert on not admin setup', async () =>
        await setup(
          someone,
          broker1.address,
          coSigner1.address,
          ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE),
        ));

      it('revert on second setup', async () => {
        await VaultImplAsProxyAdmin.setup(broker1.address, coSigner1.address);
        await setup(proxyAdmin, broker1.address, coSigner1.address, VAULT_ALREADY_SETUP);
      });
    });

    describe('signer addresses after setup', () => {
      beforeEach(async () => {
        await VaultImplAsProxyAdmin.setup(broker1.address, coSigner1.address);
      });

      it('broker address is set after setup', async () => {
        expect(await VaultImplAsSomeone.getBrokerAddress()).to.equal(broker1.address);
      });

      it('coSigner address is set after setup', async () => {
        expect(await VaultImplAsSomeone.getCoSignerAddress()).to.equal(coSigner1.address);
      });

      it('can set broker address with broker sig', async () => {
        // must not revert
        await VaultImplAsSomeone.setBrokerAddress(
          ...(await setAddressParams(broker1, broker2.address)),
        );
      });

      it('can set coSigner address with coSigner sig', async () => {
        // must not revert
        await VaultImplAsSomeone.setCoSignerAddress(
          ...(await setAddressParams(coSigner1, coSigner2.address)),
        );
      });

      it('revert on set broker address with not broker sig', async () => {
        await expect(
          VaultImplAsSomeone.setBrokerAddress(
            ...(await setAddressParams(someone, broker2.address)),
          ),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on set coSigner address with not coSigner sig', async () => {
        await expect(
          VaultImplAsSomeone.setCoSignerAddress(
            ...(await setAddressParams(someone, coSigner2.address)),
          ),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on set broker address to zero address', async () => {
        await expect(
          VaultImplAsSomeone.setBrokerAddress(...(await setAddressParams(broker1, AddressZero))),
        ).to.be.revertedWith(INVALID_ADDRESS);
      });

      it('revert on set coSigner address to zero address', async () => {
        await expect(
          VaultImplAsSomeone.setCoSignerAddress(
            ...(await setAddressParams(coSigner1, AddressZero)),
          ),
        ).to.be.revertedWith(INVALID_ADDRESS);
      });

      // signer address events
      it('emit event on successful set broker address', async () => {
        const tx = await VaultImplAsSomeone.setBrokerAddress(
          ...(await setAddressParams(broker1, broker2.address)),
        );

        const receipt = await tx.wait();

        void expect(receipt).to.emit(VaultImpl, BROKER_ADDRESS_SET).withArgs(broker2.address);
      });

      it('emit event on successful set broker address', async () => {
        const tx = await VaultImplAsSomeone.setCoSignerAddress(
          ...(await setAddressParams(coSigner1, coSigner2.address)),
        );

        const receipt = await tx.wait();

        void expect(receipt).to.emit(VaultImpl, COSIGNER_ADDRESS_SET).withArgs(coSigner2.address);
      });
    });

    // ======================
    // Deposit
    // ======================
    describe('deposit', () => {
      const AMOUNT = utils.parseUnits('1000', 'gwei');

      let payload: PartialPayload;

      beforeEach(async () => {
        payload = generalPayload(someone.address, VaultImplAddress);

        await VaultImplAsProxyAdmin.setup(broker1.address, coSigner1.address);
      });

      it('can deposit ETH', async () => {
        const balanceBefore = await someone.getBalance();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImplAsSomeone.deposit(
          ...(await depositParams(payload, broker1, coSigner1)),
          { value: AMOUNT },
        );

        const receipt = await tx.wait();

        expect(await provider.getBalance(VaultImpl.address)).to.equal(AMOUNT);
        expect(await someone.getBalance()).to.equal(
          balanceBefore.sub(AMOUNT).sub(receipt.gasUsed.mul(receipt.effectiveGasPrice)),
        );
      });

      it('can deposit ERC20', async () => {
        await ERC20AsAdmin.setUserBalance(someone.address, AMOUNT);

        const balanceBefore = await ERC20.balanceOf(someone.address);

        await ERC20AsSomeone.approve(VaultImpl.address, AMOUNT);

        payload = addAllocation(payload, ERC20.address, AMOUNT.toNumber());

        await VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)));

        expect(await ERC20.balanceOf(VaultImpl.address)).to.equal(AMOUNT);
        expect(await ERC20.balanceOf(someone.address)).to.equal(balanceBefore.sub(AMOUNT));
      });

      it('can deposit BAD ERC20', async () => {
        await UnstandardizedERC20.connect(tokenAdmin).setUserBalance(someone.address, AMOUNT);

        const balanceBefore = await UnstandardizedERC20.balanceOf(someone.address);

        await UnstandardizedERC20.connect(someone).approve(VaultImpl.address, AMOUNT);

        payload = addAllocation(payload, UnstandardizedERC20.address, AMOUNT.toNumber());

        await VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)));

        expect(await UnstandardizedERC20.balanceOf(VaultImpl.address)).to.equal(AMOUNT);
        expect(await UnstandardizedERC20.balanceOf(someone.address)).to.equal(
          balanceBefore.sub(AMOUNT),
        );
      });

      it('revert when supplied and specified ETH differ', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT.add(1),
          }),
        ).to.be.revertedWith(INVALID_ETH_AMOUNT);

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(INVALID_ETH_AMOUNT);
      });

      it('revert on deposit from zero address', async () => {
        payload.destination = AddressZero;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(DESTINATION_ZERO_ADDRESS);
      });

      it('revert on action not deposit', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await withdrawParams(payload, broker1, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(INVALID_ACTION);
      });

      it('revert on request id already used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.div(2).toNumber());

        await VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
          value: AMOUNT.div(2),
        });

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT.div(2),
          }),
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        payload.rid = utils.formatBytes32String(Date.now().toString());

        await expect(
          await VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT.div(2),
          }),
          // TODO: Update all tests to use ethers chai specific methods
        ).to.changeEtherBalances(
          [VaultImplAsSomeone, someone],
          [AMOUNT.div(2), AMOUNT.div(2).mul(-1)],
        );
      });

      it('revert after request has expired', async () => {
        payload.expire = 0;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(REQUEST_EXPIRED);
      });

      it('revert when signature has been used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const usedParams = await depositParams(payload, broker1, coSigner1);

        await VaultImplAsSomeone.deposit(...usedParams, { value: AMOUNT });

        let otherPayload = generalPayload(someone.address, VaultImplAddress);
        otherPayload = addAllocation(otherPayload, AddressZero, AMOUNT.toNumber());

        const newParams = await depositParams(otherPayload, broker1, coSigner1);

        await expect(
          VaultImplAsSomeone.deposit(newParams[0], usedParams[1], newParams[2]),
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        await expect(
          VaultImplAsSomeone.deposit(usedParams[0], newParams[1], usedParams[2]),
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);
      });

      it('revert when specified amount is zero', async () => {
        payload = addAllocation(payload, AddressZero, 0);

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(AMOUNT_ZERO);
      });

      it('revert on wrong impl address', async () => {
        payload.implAddress = broker1.address;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(INVALID_IMPL_ADDRESS);
      });

      it('revert on wrong chain id', async () => {
        payload.chainId = 42;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(INVALID_CHAIN_ID);
      });

      it('revert on wrong broker signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, someone, coSigner1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on wrong coSigner signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, broker1, someone)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert when broker and coSigner signatures are swapped', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.deposit(...(await depositParams(payload, coSigner1, broker1)), {
            value: AMOUNT,
          }),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('emit event on successful deposit', async () => {
        const prevLedgerId = await VaultImplAsSomeone.getLastId();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImplAsSomeone.deposit(
          ...(await depositParams(payload, broker1, coSigner1)),
          { value: AMOUNT },
        );

        const receipt = await tx.wait();

        void expect(receipt)
          .to.emit(VaultImpl, DEPOSITED)
          .withArgs(prevLedgerId.add(1), someone.address, AddressZero, AMOUNT, payload.rid);
      });
    });

    // ======================
    // Withdraw
    // ======================
    describe('withdraw', () => {
      const AMOUNT = utils.parseUnits('1000', 'gwei');

      let payload: PartialPayload;

      beforeEach(async () => {
        payload = generalPayload(someone.address, VaultImplAddress);

        await VaultImplAsProxyAdmin.setup(broker1.address, coSigner1.address);

        let depositPayload = generalPayload(someone.address, VaultImplAddress);
        depositPayload = addAllocation(depositPayload, AddressZero, AMOUNT.toNumber());

        await VaultImplAsSomeone.deposit(
          ...(await depositParams(depositPayload, broker1, coSigner1)),
          { value: AMOUNT },
        );
      });

      it('can withdraw ETH', async () => {
        const balanceBefore = await someone.getBalance();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImplAsSomeone.withdraw(
          ...(await withdrawParams(payload, broker1, coSigner1)),
        );

        const receipt = await tx.wait();

        if (tx.gasPrice) {
          expect(await someone.getBalance()).to.equal(
            balanceBefore.add(AMOUNT).sub(receipt.gasUsed.mul(tx.gasPrice)),
          );
        }
      });

      it('can withdraw ERC20', async () => {
        await ERC20AsAdmin.setUserBalance(VaultImpl.address, AMOUNT);

        const balanceBefore = await ERC20.balanceOf(someone.address);

        payload = addAllocation(payload, ERC20.address, AMOUNT.toNumber());

        await VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1)));

        expect(await ERC20.balanceOf(someone.address)).to.equal(balanceBefore.add(AMOUNT));
      });

      it('can withdraw BAD ERC20', async () => {
        await UnstandardizedERC20.connect(tokenAdmin).setUserBalance(VaultImpl.address, AMOUNT);

        const balanceBefore = await UnstandardizedERC20.balanceOf(someone.address);

        payload = addAllocation(payload, UnstandardizedERC20.address, AMOUNT.toNumber());

        await VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1)));

        expect(await UnstandardizedERC20.balanceOf(someone.address)).to.equal(
          balanceBefore.add(AMOUNT),
        );
      });

      it('revert on withdraw to zero address', async () => {
        payload.destination = AddressZero;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(DESTINATION_ZERO_ADDRESS);
      });

      it('revert on action not withdraw', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await depositParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(INVALID_ACTION);
      });

      it('revert on request id already used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.div(2).toNumber());

        await VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1)));

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        payload.rid = utils.formatBytes32String(Date.now().toString());

        await expect(
          await VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.changeEtherBalances(
          [VaultImplAsSomeone, someone],
          [AMOUNT.div(2).mul(-1), AMOUNT.div(2)],
        );
      });

      it('revert after request has expired', async () => {
        payload.expire = 0;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(REQUEST_EXPIRED);
      });

      it('revert when signature has been used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const usedParams = await withdrawParams(payload, broker1, coSigner1);

        await VaultImplAsSomeone.withdraw(...usedParams);

        let otherPayload = generalPayload(someone.address, VaultImplAddress);
        otherPayload = addAllocation(otherPayload, AddressZero, AMOUNT.toNumber());

        const newParams = await withdrawParams(otherPayload, broker1, coSigner1);

        await expect(
          VaultImplAsSomeone.withdraw(newParams[0], usedParams[1], newParams[2]),
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        await expect(
          VaultImplAsSomeone.withdraw(usedParams[0], newParams[1], usedParams[2]),
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);
      });

      it('revert when specified amount is zero', async () => {
        payload = addAllocation(payload, AddressZero, 0);

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(AMOUNT_ZERO);
      });

      it('revert on wrong impl address', async () => {
        payload.implAddress = broker1.address;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(INVALID_IMPL_ADDRESS);
      });

      it('revert on wrong chain id', async () => {
        payload.chainId = 42;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, broker1, coSigner1))),
        ).to.be.revertedWith(INVALID_CHAIN_ID);
      });

      it('revert on wrong broker signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await depositParams(payload, someone, coSigner1))),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on wrong coSigner signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await depositParams(payload, broker1, someone))),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert when broker and coSigner signatures are swapped', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImplAsSomeone.withdraw(...(await withdrawParams(payload, coSigner1, broker1))),
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('emit event on successful withdraw', async () => {
        const prevLedgerId = await VaultImplAsSomeone.getLastId();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImplAsSomeone.withdraw(
          ...(await withdrawParams(payload, broker1, coSigner1)),
        );

        const receipt = await tx.wait();

        void expect(receipt)
          .to.emit(VaultImpl, WITHDRAWN)
          .withArgs(prevLedgerId.add(1), someone.address, AddressZero, AMOUNT, payload.rid);
      });
    });
  });
});
