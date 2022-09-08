//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './VaultImplBase.sol';
import './IVault.sol';

/**
 * @dev Implementation for the Proxy. Version 1.0.
 */
contract VaultImpl is VaultImplBase, IVault {
    using Counters for Counters.Counter;

    /**
     * Deposit type identifier value.
     */
    bytes32 public constant DEPOSIT_TYPE = keccak256('CUSTODY_DEPOSIT_TYPE');

    /**
     * Withdrawal type identifier value.
     */
    bytes32 public constant WITHDRAW_TYPE = keccak256('CUSTODY_WITHDRAW_TYPE');

    // Not a real address, only public key exists.
    address private _brokerKeyDerivedAddress;
    // Not a real address, only public key exists.
    address private _otpKeyDerivedAddress;

    Counters.Counter private _ledgerId;

    // Keep track of used signatures to prevent reuse before expiration.
    mapping(address => mapping(bytes32 => bool)) private _sigUsage;

    /**
     * The constructor function sets the contract name and broker's address.
     * @param brokerKeyDerivedAddress_ Address derived from Broker public key.
     * @param otpKeyDerivedAddress_ Address derived from OTP public key.
     */
    constructor(address brokerKeyDerivedAddress_, address otpKeyDerivedAddress_) {
        _brokerKeyDerivedAddress = brokerKeyDerivedAddress_;
        _otpKeyDerivedAddress = otpKeyDerivedAddress_;
    }

    /**
     * @notice Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view override returns (uint256) {
        return _ledgerId.current();
    }

    /**
     * @notice Set the address derived from the broker's new public key. Emits `BrokerKeyDerivedAddressSet` event.
     * @dev Supplied payload must be signed by broker's current public key.
     * @param encodedAddress Encoded address to set.
     * @param signature Encoded address signed by broker's current public key.
     */
    function setBrokerKeyDerivedAddress(bytes calldata encodedAddress, bytes calldata signature) external {
      bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedAddress));
      address recoveredBrokerDerivedKey = ECDSA.recover(digest, signature);
      require(recoveredBrokerDerivedKey == _brokerKeyDerivedAddress, 'Vault: signer is not broker');
      _brokerKeyDerivedAddress = recoveredBrokerDerivedKey;

      emit BrokerKeyDerivedAddressSet(recoveredBrokerDerivedKey);
    }

    /**
     * @notice Set the address derived from the OTP's new public key. Emits `OTPKeyDerivedAddressSet` event.
     * @dev Supplied payload must be signed by OTP's current public key.
     * @param encodedAddress Encoded address to set.
     * @param signature Encoded address signed by OTP's current public key.
     */
    function setOTPKeyDerivedAddress(bytes calldata encodedAddress, bytes calldata signature) external {
      bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedAddress));
      address recoveredOTPDerivedKey = ECDSA.recover(digest, signature);
      require(recoveredOTPDerivedKey == _otpKeyDerivedAddress, 'Vault: signer is not otp');
      _otpKeyDerivedAddress = recoveredOTPDerivedKey;

      emit OTPKeyDerivedAddressSet(recoveredOTPDerivedKey);
    }

    /**
     * @notice Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, deposit address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @param otpSignature Payload signed by the OTP service.
     * @return bool Return 'true' if deposited successfully.
     */
    function deposit(
        bytes calldata payload,
        bytes calldata brokerSignature,
        bytes calldata otpSignature
    ) external payable returns (bool) {
        _requireValidInput(DEPOSIT_TYPE, payload, brokerSignature, otpSignature);
        return _deposit_interactions(msg.sender, payload, brokerSignature);
    }

    /**
     * @notice Deposit interactions. Internal function.
     * @param account User issuer address.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @return bool Return 'true' if deposited successfully.
     */
    function _deposit_interactions(
        address account,
        bytes memory payload,
        bytes memory brokerSignature
    ) internal returns (bool) {
        bytes32 sigHash = keccak256(brokerSignature);
        (bytes32 rid, , address from, Allocation[] memory assets) = _extractPayload(account, sigHash, payload);

        require(from == account, 'Vault: invalid destination');

        _sigUsage[account][sigHash] = true;

        for (uint256 i = 0; i < assets.length; i++) {
            _transferAssetFrom(assets[i].asset, account, assets[i].amount);
            _ledgerId.increment();
            emit Deposited(_ledgerId.current(), account, assets[i].asset, assets[i].amount, rid);
        }

        return true;
    }

    /**
     * @notice Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @param otpSignature Payload signed by the OTP service.
     * @return bool Return 'true' if withdrawn successfully.
     */
    function withdraw(
        bytes calldata payload,
        bytes calldata brokerSignature,
        bytes calldata otpSignature
    ) external payable returns (bool) {
        _requireValidInput(WITHDRAW_TYPE, payload, brokerSignature, otpSignature);
        return _withdraw_interactions(msg.sender, payload, brokerSignature);
    }

    /**
     * Withdraw interactions. Internal method.
     * @param account User issuer address.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @return bool Return 'true' if withdrawn successfully.
     */
    function _withdraw_interactions(
        address account,
        bytes memory payload,
        bytes memory brokerSignature
    ) internal returns (bool) {
        bytes32 sigHash = keccak256(brokerSignature);
        (bytes32 rid, , address destination, Allocation[] memory assets) = _extractPayload(account, sigHash, payload);

        _sigUsage[account][sigHash] = true;

        for (uint256 i = 0; i < assets.length; i++) {
            _transferAssetTo(assets[i].asset, destination, assets[i].amount);
            _ledgerId.increment();
            emit Withdrawn(_ledgerId.current(), destination, assets[i].asset, assets[i].amount, rid);
        }

        return true;
    }

    /**
     * @notice Check supplied signatures to be indeed signed by Broker and OTP service.
     * @param action Action type. One of DEPOSIT_TYPE and WITHDRAW_TYPE.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @param brokerSignature Broker signature.
     * @param otpSignature OTP signature.
     */
    function _requireValidInput(
        bytes32 action,
        bytes memory payload,
        bytes memory brokerSignature,
        bytes memory otpSignature
    ) internal view {
        require(action != 0, 'Vault: action is required');

        bytes32 digest = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encodePacked(action, payload))
        );
        address recoveredBrokerAddress = ECDSA.recover(digest, brokerSignature);
        require(recoveredBrokerAddress == _brokerKeyDerivedAddress, 'Vault: invalid broker signature');
        address recoveredOTPAddress = ECDSA.recover(digest, otpSignature);
        require(recoveredOTPAddress == _otpKeyDerivedAddress, 'Vault: invalid OTP signature');
    }

    /**
     * @notice Internal function to extract payload data.
     * @param account Account address.
     * @param sigHash Broker signature keccak256 hash.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @return bytes32 rid (unique identifier id).
     * @return uint64 expire timestamp.
     * @return address destination address.
     * @return Asset Array of allocations.
     */
    function _extractPayload(
        address account,
        bytes32 sigHash,
        bytes memory payload
    ) internal view returns (bytes32, uint64, address, Allocation[] memory) {
        (bytes32 rid, uint64 expire, address destination, Allocation[] memory assets) = abi.decode(
            payload,
            (bytes32, uint64, address, Allocation[])
        );

        require(expire > block.timestamp, 'Vault: request is expired'); //solhint-disable-line not-rely-on-time
        require(!_sigUsage[account][sigHash], 'Vault: signature has been used');

        for (uint256 i = 0; i < assets.length; i++) {
            require(assets[i].amount > 0, 'Vault: amount is zero');
        }

        return (rid, expire, destination, assets);
    }

    /**
     * @notice Transfer given amount of this AssetHolders's asset type from a supplied ethereum address.
     * @param asset Asset address to transfer.
     * @param from Ethereum address to be credited.
     * @param amount Quantity of assets to be transferred.
     */
    function _transferAssetFrom(
        address asset,
        address from,
        uint256 amount
    ) internal {
        require(from != address(0), 'Vault: transfer is zero address');
        if (asset == address(0)) {
            require(msg.value == amount, 'Vault: incorrect msg.value');
        } else {
            // require successful deposit before updating holdings (protect against reentrancy)
            require(
                IERC20(asset).transferFrom(from, address(this), amount),
                'Vault: Could not deposit ERC20'
            );
        }
    }

    /**
     * @notice Transfer the given amount of this AssetHolders's asset type to a supplied ethereum address.
     * @param asset Asset address to transfer.
     * @param destination Ethereum address to be credited.
     * @param amount Quantity of assets to be transferred.
     */
    function _transferAssetTo(
        address asset,
        address destination,
        uint256 amount
    ) internal {
        require(destination != address(0), 'Vault: transfer is zero address');
        if (asset == address(0)) {
            (bool success, ) = destination.call{value: amount}(''); //solhint-disable-line avoid-low-level-calls
            require(success, 'Vault: could not transfer ETH');
        } else {
            IERC20(asset).transfer(destination, amount);
        }
    }
}
