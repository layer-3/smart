import {expect} from 'chai';
import {Contract, providers, utils} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

import VaultImplArtifact from '../../artifacts/contracts/yellow/VaultImplV1.sol/VaultImplV1.json';
import {VaultImplV1 as VaultImplT, TESTVaultProxy, TestERC20} from '../../typechain';

import {
  ACCOUNT_MISSING_ROLE,
  INVALID_ADDRESS,
  INVALID_SIGNATURE,
  VAULT_ALREADY_SETUP,
  INVALID_ETH_AMOUNT,
  DESTINATION_ZERO_ADDRESS,
  INVALID_ACTION,
  REQUEST_EXPIRED,
  SIGNATURE_ALREAD_USED,
  AMOUNT_ZERO,
  INVALID_IMPL_ADDRESS,
  INVALID_CHAIN_ID,
} from './src/revert-reasons';
import {depositParams, setAddressParams, withdrawParams} from './src/transactions';
import {BROKER_ADDRESS_SET, COSIGNER_ADDRESS_SET, DEPOSITED, WITHDRAWN} from './src/event-names';
import {addAllocation, generalPayload, PartialPayload} from './src/payload';

const AddressZero = ethers.constants.AddressZero;
const ADM_ROLE = ethers.constants.HashZero;

describe('Vault implementation V1', () => {
  let provider: providers.Provider;

  let implAdmin: SignerWithAddress;
  let proxyAdmin: SignerWithAddress;
  let tokenAdmin: SignerWithAddress;
  let someone: SignerWithAddress;
  let someother: SignerWithAddress;
  let broker1: SignerWithAddress;
  let broker2: SignerWithAddress;
  let coSigner1: SignerWithAddress;
  let coSigner2: SignerWithAddress;

  let VaultProxy: Contract & TESTVaultProxy;
  let VaultImpl: Contract & VaultImplT;

  let ERC20: Contract & TestERC20;

  beforeEach(async () => {
    const VaultImplFactory = await ethers.getContractFactory('VaultImplV1');
    const VaultImplDirect = await VaultImplFactory.connect(implAdmin).deploy();
    await VaultImplDirect.deployed();

    const VaultProxyFactory = await ethers.getContractFactory('TESTVaultProxy');
    VaultProxy = (await VaultProxyFactory.connect(proxyAdmin).deploy(
      VaultImplDirect.address
    )) as Contract & TESTVaultProxy;
    await VaultProxy.deployed();

    // proxied implementation
    VaultImpl = new ethers.Contract(VaultProxy.address, VaultImplArtifact.abi) as Contract &
      VaultImplT;

    const ERC20Factory = await ethers.getContractFactory(
      'contracts/yellow/test/TestERC20.sol:TestERC20'
    );
    ERC20 = (await ERC20Factory.connect(tokenAdmin).deploy(
      'TestToken',
      'TOK',
      ethers.utils.parseEther('1000')
    )) as Contract & TestERC20;
  });

  before(async () => {
    [
      implAdmin,
      proxyAdmin,
      tokenAdmin,
      someone,
      someother,
      broker1,
      broker2,
      coSigner1,
      coSigner2,
    ] = await ethers.getSigners();

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
        reason: string | undefined
      ) {
        if (reason) {
          await expect(
            VaultImpl.connect(caller).setup(brokerAddress, coSignerAddress)
          ).to.be.revertedWith(reason);
        } else {
          // must not revert
          await VaultImpl.connect(caller).setup(brokerAddress, coSignerAddress);
        }
      }

      it('signer addresses are not setup', async () => {
        expect(await VaultImpl.connect(someone).getBrokerAddress()).to.equal(AddressZero);
        expect(await VaultImpl.connect(someone).getCoSignerAddress()).to.equal(AddressZero);
      });

      it('accept when proxy admin setup', async () =>
        await setup(proxyAdmin, broker1.address, coSigner1.address, undefined));

      it('revert on setup broker to zero address', async () =>
        await setup(proxyAdmin, AddressZero, coSigner1.address, INVALID_ADDRESS));

      it('revert on setup coSigner to zero address', async () =>
        await setup(proxyAdmin, broker1.address, AddressZero, INVALID_ADDRESS));

      it('revert on not admin setup', async () =>
        await setup(
          someone,
          broker1.address,
          coSigner1.address,
          ACCOUNT_MISSING_ROLE(someone.address, ADM_ROLE)
        ));

      it('revert on second setup', async () => {
        await VaultImpl.connect(proxyAdmin).setup(broker1.address, coSigner1.address);
        await setup(proxyAdmin, broker1.address, coSigner1.address, VAULT_ALREADY_SETUP);
      });
    });

    describe('signer addresses after setup', () => {
      beforeEach(async () => {
        await VaultImpl.connect(proxyAdmin).setup(broker1.address, coSigner1.address);
      });

      it('broker address is set after setup', async () => {
        expect(await VaultImpl.connect(someone).getBrokerAddress()).to.equal(broker1.address);
      });

      it('coSigner address is set after setup', async () => {
        expect(await VaultImpl.connect(someone).getCoSignerAddress()).to.equal(coSigner1.address);
      });

      it('can set broker address with broker sig', async () => {
        // must not revert
        await VaultImpl.connect(someone).setBrokerAddress(
          ...(await setAddressParams(broker1, broker2.address))
        );
      });

      it('can set coSigner address with coSigner sig', async () => {
        // must not revert
        await VaultImpl.connect(someone).setCoSignerAddress(
          ...(await setAddressParams(coSigner1, coSigner2.address))
        );
      });

      it('revert on set broker address with not broker sig', async () => {
        await expect(
          VaultImpl.connect(someone).setBrokerAddress(
            ...(await setAddressParams(someone, broker2.address))
          )
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on set coSigner address with not coSigner sig', async () => {
        await expect(
          VaultImpl.connect(someone).setCoSignerAddress(
            ...(await setAddressParams(someone, coSigner2.address))
          )
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on set broker address to zero address', async () => {
        await expect(
          VaultImpl.connect(someone).setBrokerAddress(
            ...(await setAddressParams(broker1, AddressZero))
          )
        ).to.be.revertedWith(INVALID_ADDRESS);
      });

      it('revert on set coSigner address to zero address', async () => {
        await expect(
          VaultImpl.connect(someone).setCoSignerAddress(
            ...(await setAddressParams(coSigner1, AddressZero))
          )
        ).to.be.revertedWith(INVALID_ADDRESS);
      });

      // signer address events
      it('emit event on successful set broker address', async () => {
        const tx = await VaultImpl.connect(someone).setBrokerAddress(
          ...(await setAddressParams(broker1, broker2.address))
        );

        const receipt = await tx.wait();

        expect(receipt).to.emit(VaultImpl, BROKER_ADDRESS_SET).withArgs(broker2.address);
      });

      it('emit event on successful set broker address', async () => {
        const tx = await VaultImpl.connect(someone).setCoSignerAddress(
          ...(await setAddressParams(coSigner1, coSigner2.address))
        );

        const receipt = await tx.wait();

        expect(receipt).to.emit(VaultImpl, COSIGNER_ADDRESS_SET).withArgs(coSigner2.address);
      });
    });

    // ======================
    // Deposit
    // ======================
    describe('deposit', () => {
      const AMOUNT = utils.parseUnits('1000', 'gwei');

      let payload: PartialPayload;

      beforeEach(async () => {
        payload = await generalPayload(someone.address, VaultImpl.address);

        await VaultImpl.connect(proxyAdmin).setup(broker1.address, coSigner1.address);
      });

      it('can deposit ETH', async () => {
        const balanceBefore = await someone.getBalance();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImpl.connect(someone).deposit(
          ...(await depositParams(payload, broker1, coSigner1)),
          {value: AMOUNT}
        );

        const receipt = await tx.wait();

        expect(await provider.getBalance(VaultImpl.address)).to.equal(AMOUNT);
        expect(await someone.getBalance()).to.equal(
          balanceBefore.sub(AMOUNT).sub(receipt.gasUsed.mul(receipt.effectiveGasPrice))
        );
      });

      it('can deposit ERC20', async () => {
        await ERC20.connect(tokenAdmin).setUserBalance(someone.address, AMOUNT);

        const balanceBefore = await ERC20.balanceOf(someone.address);

        await ERC20.connect(someone).approve(VaultImpl.address, AMOUNT);

        payload = addAllocation(payload, ERC20.address, AMOUNT.toNumber());

        await VaultImpl.connect(someone).deposit(
          ...(await depositParams(payload, broker1, coSigner1))
        );

        expect(await ERC20.balanceOf(VaultImpl.address)).to.equal(AMOUNT);
        expect(await ERC20.balanceOf(someone.address)).to.equal(balanceBefore.sub(AMOUNT));
      });

      it('revert when supplied and specified ETH differ', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT.add(1)}
          )
        ).to.be.revertedWith(INVALID_ETH_AMOUNT);

        await expect(
          VaultImpl.connect(someone).deposit(...(await depositParams(payload, broker1, coSigner1)))
        ).to.be.revertedWith(INVALID_ETH_AMOUNT);
      });

      it('revert on deposit from zero address', async () => {
        payload.destination = AddressZero;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(DESTINATION_ZERO_ADDRESS);
      });

      it('revert on action not deposit', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await withdrawParams(payload, broker1, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(INVALID_ACTION);
      });

      it('revert on request id already used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.div(2).toNumber());

        await VaultImpl.connect(someone).deposit(
          ...(await depositParams(payload, broker1, coSigner1)),
          {value: AMOUNT.div(2)}
        );

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT.div(2)}
          )
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        payload.rid = utils.formatBytes32String(Date.now().toString());

        await expect(
          await VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT.div(2)}
          )
          // TODO: Update all tests to use ethers chai specific methods
        ).to.changeEtherBalances(
          [VaultImpl.connect(someone), someone],
          [AMOUNT.div(2), AMOUNT.div(2).mul(-1)]
        );
      });

      it('revert after request has expired', async () => {
        payload.expire = 0;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(REQUEST_EXPIRED);
      });

      it('revert when signature has been used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const usedParams = await depositParams(payload, broker1, coSigner1);

        await VaultImpl.connect(someone).deposit(...usedParams, {value: AMOUNT});

        let otherPayload = await generalPayload(someone.address, VaultImpl.address);
        otherPayload = addAllocation(otherPayload, AddressZero, AMOUNT.toNumber());

        const newParams = await depositParams(otherPayload, broker1, coSigner1);

        await expect(
          VaultImpl.connect(someone).deposit(newParams[0], usedParams[1], newParams[2])
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        await expect(
          VaultImpl.connect(someone).deposit(usedParams[0], newParams[1], usedParams[2])
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);
      });

      it('revert when specified amount is zero', async () => {
        payload = addAllocation(payload, AddressZero, 0);

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(AMOUNT_ZERO);
      });

      it('revert on wrong impl address', async () => {
        payload.implAddress = broker1.address;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(INVALID_IMPL_ADDRESS);
      });

      it('revert on wrong chain id', async () => {
        payload.chainId = 42;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, broker1, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(INVALID_CHAIN_ID);
      });

      it('revert on wrong broker signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, someone, coSigner1)),
            {value: AMOUNT}
          )
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on wrong coSigner signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(...(await depositParams(payload, broker1, someone)), {
            value: AMOUNT,
          })
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert when broker and coSigner signatures are swapped', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).deposit(
            ...(await depositParams(payload, coSigner1, broker1)),
            {
              value: AMOUNT,
            }
          )
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('emit event on successful deposit', async () => {
        const prevLedgerId = await VaultImpl.connect(someone).getLastId();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImpl.connect(someone).deposit(
          ...(await depositParams(payload, broker1, coSigner1)),
          {value: AMOUNT}
        );

        const receipt = await tx.wait();

        expect(receipt)
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
        payload = await generalPayload(someone.address, VaultImpl.address);

        await VaultImpl.connect(proxyAdmin).setup(broker1.address, coSigner1.address);

        let depositPayload = await generalPayload(someone.address, VaultImpl.address);
        depositPayload = addAllocation(depositPayload, AddressZero, AMOUNT.toNumber());

        await VaultImpl.connect(someone).deposit(
          ...(await depositParams(depositPayload, broker1, coSigner1)),
          {value: AMOUNT}
        );
      });

      it('can withdraw ETH', async () => {
        const balanceBefore = await someone.getBalance();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImpl.connect(someone).withdraw(
          ...(await withdrawParams(payload, broker1, coSigner1))
        );

        const receipt = await tx.wait();

        expect(await someone.getBalance()).to.equal(
          balanceBefore.add(AMOUNT).sub(receipt.gasUsed.mul(tx.gasPrice))
        );
      });

      it('can withdraw ERC20', async () => {
        await ERC20.connect(tokenAdmin).setUserBalance(VaultImpl.address, AMOUNT);

        const balanceBefore = await ERC20.balanceOf(someone.address);

        payload = addAllocation(payload, ERC20.address, AMOUNT.toNumber());

        await VaultImpl.connect(someone).withdraw(
          ...(await withdrawParams(payload, broker1, coSigner1))
        );

        expect(await ERC20.balanceOf(someone.address)).to.equal(balanceBefore.add(AMOUNT));
      });

      it('revert on withdraw to zero address', async () => {
        payload.destination = AddressZero;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.be.revertedWith(DESTINATION_ZERO_ADDRESS);
      });

      it('revert on action not withdraw', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(...(await depositParams(payload, broker1, coSigner1)))
        ).to.be.revertedWith(INVALID_ACTION);
      });

      it('revert on request id already used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.div(2).toNumber());

        await VaultImpl.connect(someone).withdraw(
          ...(await withdrawParams(payload, broker1, coSigner1))
        );

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        payload.rid = utils.formatBytes32String(Date.now().toString());

        await expect(
          await VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.changeEtherBalances(
          [VaultImpl.connect(someone), someone],
          [AMOUNT.div(2).mul(-1), AMOUNT.div(2)]
        );
      });

      it('revert after request has expired', async () => {
        payload.expire = 0;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.be.revertedWith(REQUEST_EXPIRED);
      });

      it('revert when signature has been used', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const usedParams = await withdrawParams(payload, broker1, coSigner1);

        await VaultImpl.connect(someone).withdraw(...usedParams);

        let otherPayload = await generalPayload(someone.address, VaultImpl.address);
        otherPayload = addAllocation(otherPayload, AddressZero, AMOUNT.toNumber());

        const newParams = await withdrawParams(otherPayload, broker1, coSigner1);

        await expect(
          VaultImpl.connect(someone).withdraw(newParams[0], usedParams[1], newParams[2])
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);

        await expect(
          VaultImpl.connect(someone).withdraw(usedParams[0], newParams[1], usedParams[2])
        ).to.be.revertedWith(SIGNATURE_ALREAD_USED);
      });

      it('revert when specified amount is zero', async () => {
        payload = addAllocation(payload, AddressZero, 0);

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.be.revertedWith(AMOUNT_ZERO);
      });

      it('revert on wrong impl address', async () => {
        payload.implAddress = broker1.address;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.be.revertedWith(INVALID_IMPL_ADDRESS);
      });

      it('revert on wrong chain id', async () => {
        payload.chainId = 42;
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, broker1, coSigner1))
          )
        ).to.be.revertedWith(INVALID_CHAIN_ID);
      });

      it('revert on wrong broker signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(...(await depositParams(payload, someone, coSigner1)))
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert on wrong coSigner signature', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(...(await depositParams(payload, broker1, someone)))
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('revert when broker and coSigner signatures are swapped', async () => {
        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        await expect(
          VaultImpl.connect(someone).withdraw(
            ...(await withdrawParams(payload, coSigner1, broker1))
          )
        ).to.be.revertedWith(INVALID_SIGNATURE);
      });

      it('emit event on successful withdraw', async () => {
        const prevLedgerId = await VaultImpl.connect(someone).getLastId();

        payload = addAllocation(payload, AddressZero, AMOUNT.toNumber());

        const tx = await VaultImpl.connect(someone).withdraw(
          ...(await withdrawParams(payload, broker1, coSigner1))
        );

        const receipt = await tx.wait();

        expect(receipt)
          .to.emit(VaultImpl, WITHDRAWN)
          .withArgs(prevLedgerId.add(1), someone.address, AddressZero, AMOUNT, payload.rid);
      });
    });
  });
});
