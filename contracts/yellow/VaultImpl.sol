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
    bytes32 public constant DEPOSIT_ACTION = keccak256('YELLOW_VAULT_DEPOSIT_ACTION');

    /**
     * Withdrawal type identifier value.
     */
    bytes32 public constant WITHDRAW_ACTION = keccak256('YELLOW_VAULT_DEPOSIT_ACTION');

    // Not a real address, only public key exists.
    address private _brokerVirtualAddress;
    // Not a real address, only public key exists.
    address private _coSignerVirtualAddress;

    Counters.Counter private _ledgerId;

    // Keep track of used signatures to prevent reuse before expiration.
    mapping(address => mapping(bytes32 => bool)) private _sigUsage;

    /**
     * The constructor function sets the contract name and broker's address.
     * @param brokerVirtualAddress_ Address derived from Broker public key.
     * @param coSignerVirtualAddress_ Address derived from coSigner public key.
     */
    constructor(address brokerVirtualAddress_, address coSignerVirtualAddress_) {
        _brokerVirtualAddress = brokerVirtualAddress_;
        _coSignerVirtualAddress = coSignerVirtualAddress_;
    }

    /**
     * @notice Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view override returns (uint256) {
        return _ledgerId.current();
    }

    /**
     * @notice Set the address derived from the broker's new public key. Emits `BrokerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by broker's current public key.
     * @param encodedAddress Encoded new virtual broker address.
     * @param signature New virtual address signed by broker's current public key.
     */
    function setBrokerVirtualAddress(bytes memory encodedAddress, bytes calldata signature) external {
      bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedAddress));
      address recoveredSigner = ECDSA.recover(digest, signature);
      require(recoveredSigner == _brokerVirtualAddress, 'Vault: signer is not broker');

      address newBrokerVirtualAddress = abi.decode(encodedAddress, (address));
      _brokerVirtualAddress = newBrokerVirtualAddress;
      emit BrokerVirtualAddressSet(newBrokerVirtualAddress);
    }

    /**
     * @notice Set the address derived from the soSigner's new public key. Emits `CoSignerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by soSigner's current public key.
     * @param encodedAddress Encoded new virtual soSigner address.
     * @param signature New virtual address signed by soSigner's current public key.
     */
    function setCoSignerVirtualAddress(bytes memory encodedAddress, bytes calldata signature) external {
      bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedAddress));
      address recoveredSigner = ECDSA.recover(digest, signature);
      require(recoveredSigner == _coSignerVirtualAddress, 'Vault: signer is not coSigner');

      address newCoSignerVirtualAddress = abi.decode(encodedAddress, (address));
      _coSignerVirtualAddress = newCoSignerVirtualAddress;
      emit CoSignerVirtualAddressSet(newCoSignerVirtualAddress);
    }

    /**
     * @notice Get broker virtual (only public key it is derived from exists) key for this vault.
     * @dev Get broker virtual (only public key it is derived from exists) key for this vault.
     * @return address Broker virtual (only public key it is derived from exists) key.
     */
    function getBrokerVirtualAddress() external view returns (address) {
      return _brokerVirtualAddress;
    }

    /**
     * @notice Get coSigner virtual (only public key it is derived from exists) key for this vault.
     * @dev Get coSigner virtual (only public key it is derived from exists) key for this vault.
     * @return address CoSigner virtual (only public key it is derived from exists) key.
     */
    function getCoSignerVirtualAddress() external view returns (address) {
      return _coSignerVirtualAddress;
    }

    /**
     * @notice Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Payload signed by the broker.
     * @param coSignerSignature Payload signed by the coSigner.
     * @return bool Return 'true' if deposited successfully.
     */
    function deposit(
        bytes calldata encodedPayload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable returns (bool) {
        address issuer = msg.sender;
        (bytes32 rid, address destination, Allocation[] memory allocations) = _deposit_checks(encodedPayload, issuer, brokerSignature, coSignerSignature);
        return _deposit_effects_and_interactions(issuer, rid, destination, allocations, brokerSignature);
    }

    /**
     * @notice Conduct payload decoding, checks and deposit checks, namely whether action specified is deposit action and destination specified is issuer.
     * @dev Conduct payload decoding, checks and deposit checks, namely whether action specified is deposit action and destination specified is issuer.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param issuer Account invoking the action in the vault.
     * @param brokerSignature Payload signed by the broker.
     * @param coSignerSignature Payload signed by the coSigner.
     * @return bytes32 rid (unique identifier id).
     * @return address Destination address.
     * @return Asset Array of allocations.
     */
    function _deposit_checks(
      bytes memory encodedPayload,
      address issuer,
      bytes memory brokerSignature,
      bytes memory coSignerSignature
    ) internal view returns(bytes32, address, Allocation[] memory) {
      _requireSigNotUsed(issuer, brokerSignature);
      _requireValidSignatures(encodedPayload, brokerSignature, coSignerSignature);

      (bytes32 action, bytes32 rid, address destination, Allocation[] memory allocations) = _payload_decode_and_checks(encodedPayload);
      require(action == DEPOSIT_ACTION, 'Vault: invalid action');
      require(destination == issuer, 'Vault: invalid destination');

      return (rid, destination, allocations);
    }

    /**
     * @notice Mark the signature as used and transfer assets from destination to the vault.
     * @dev Mark the signature as used and transfer assets from destination to the vault.
     * @param issuer User issuer address.
     * @param rid rid (unique identifier id).
     * @param destination Destination address.
     * @param allocations Array of allocations.
     * @param signature Signature used as identifier for action requested from vault.
     * @return bool Return 'true' if deposited successfully.
     */
    function _deposit_effects_and_interactions(
        address issuer,
        bytes32 rid,
        address destination,
        Allocation[] memory allocations,
        bytes memory signature
    ) internal returns (bool) {
        // effects
        bytes32 sigHash = keccak256(signature);
        _sigUsage[issuer][sigHash] = true;

        // interactions
        for (uint256 i = 0; i < allocations.length; i++) {
            _transferAssetFrom(allocations[i].asset, destination, allocations[i].amount);
            _ledgerId.increment();
            emit Deposited(_ledgerId.current(), destination, allocations[i].asset, allocations[i].amount, rid);
        }

        return true;
    }

    /**
     * @notice Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Payload signed by the Broker.
     * @param coSignerSignature Payload signed by the coSigner.
     * @return bool Return 'true' if withdrawn successfully.
     */
    function withdraw(
        bytes calldata encodedPayload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable returns (bool) {
        address issuer = msg.sender;
        (bytes32 rid, address destination, Allocation[] memory allocations) = _withdraw_checks(encodedPayload, issuer, brokerSignature, coSignerSignature);
        return _withdraw_effects_and_interactions(issuer, rid, destination, allocations, brokerSignature);
    }

    /**
     * @notice Conduct payload decoding, checks and withdraw checks, namely whether action specified is deposit action.
     * @dev Conduct payload decoding, checks and withdraw checks, namely whether action specified is deposit action.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param issuer Account invoking the action in the vault.
     * @param brokerSignature Payload signed by the broker.
     * @param coSignerSignature Payload signed by the coSigner.
     * @return bytes32 rid (unique identifier id).
     * @return address Destination address.
     * @return Asset Array of allocations.
     */
    function _withdraw_checks(
      bytes memory encodedPayload,
      address issuer,
      bytes memory brokerSignature,
      bytes memory coSignerSignature
    ) internal view returns(bytes32, address, Allocation[] memory) {
      _requireSigNotUsed(issuer, brokerSignature);
      _requireValidSignatures(encodedPayload, brokerSignature, coSignerSignature);

      (bytes32 action, bytes32 rid, address destination, Allocation[] memory allocations) = _payload_decode_and_checks(encodedPayload);
      require(action == WITHDRAW_ACTION, 'Vault: invalid action');

      return (rid, destination, allocations);
    }

    /**
     * @notice Mark the signature as used and transfer assets from the vault to the destination.
     * @dev Mark the signature as used and transfer assets from the vault to the destination.
     * @param issuer User issuer address.
     * @param rid rid (unique identifier id).
     * @param destination Destination address.
     * @param allocations Array of allocations.
     * @param signature Signature used as identifier for action requested from vault.
     * @return bool Return 'true' if deposited successfully.
     */
    function _withdraw_effects_and_interactions(
        address issuer,
        bytes32 rid,
        address destination,
        Allocation[] memory allocations,
        bytes memory signature
    ) internal returns (bool) {
        // effects
        bytes32 sigHash = keccak256(signature);
        _sigUsage[issuer][sigHash] = true;

        // interactions
        for (uint256 i = 0; i < allocations.length; i++) {
            _transferAssetTo(allocations[i].asset, destination, allocations[i].amount);
            _ledgerId.increment();
            emit Withdrawn(_ledgerId.current(), destination, allocations[i].asset, allocations[i].amount, rid);
        }

        return true;
    }

    /**
     * @notice Revert if hash of supplied signature was already used by the issuer.
     * @dev Revert if hash of supplied signature was already used by the issuer.
     * @param issuer Account using supplied signature.
     * @param signature Signature used as identifier for action requested from vault.
     */
    function _requireSigNotUsed(address issuer, bytes memory signature) internal view {
      require(!_sigUsage[issuer][keccak256(signature)], 'Vault: sig already used');
    }

    /**
     * @notice Check supplied signatures to be indeed signed by Broker and CoSigner service.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Broker signature.
     * @param coSignerSignature CoSigner signature.
     */
    function _requireValidSignatures(
        bytes memory encodedPayload,
        bytes memory brokerSignature,
        bytes memory coSignerSignature
    ) internal view {
        bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedPayload));

        address recoveredBrokerAddress = ECDSA.recover(digest, brokerSignature);
        require(recoveredBrokerAddress == _brokerVirtualAddress, 'Vault: invalid broker signature');
        address recoveredCoSignerAddress = ECDSA.recover(digest, coSignerSignature);
        require(recoveredCoSignerAddress == _coSignerVirtualAddress, 'Vault: invalid coSigner signature');
    }

    /**
     * @notice Internal function to extract payload data.
     * @dev Internal function to extract payload data.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @return action Payload action (Deposit or Withdraw).
     * @return bytes32 rid (unique identifier id).
     * @return address Destination address.
     * @return Asset Array of allocations.
     */
    function _payload_decode_and_checks(
        bytes memory encodedPayload
    ) internal view returns (bytes32, bytes32, address, Allocation[] memory) {
        Payload memory payload = abi.decode(
            encodedPayload,
            (Payload)
        );

        require(payload.expire > block.timestamp, 'Vault: request is expired'); //solhint-disable-line not-rely-on-time
        require(payload.destination != address(0), 'Vault: destination is zero address');

        for (uint256 i = 0; i < payload.allocations.length; i++) {
            require(payload.allocations[i].amount > 0, 'Vault: amount is zero');
        }

        require(payload.implAddress == address(this), 'Vault: invalid Vault address');
        require(payload.chainId == getChainId(), 'Vault: incorrect chain id');

        return (payload.action, payload.rid, payload.destination, payload.allocations);
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

    /**
     * @notice Return chain id.
     * @dev Return chain id.
     * @return uint256 Chain id.
     */
    function getChainId() internal view returns (uint256) {
        uint256 id;
        /* solhint-disable no-inline-assembly */
        assembly {
            id := chainid()
        }
        /* solhint-disable no-inline-assembly */
        return id;
    }
}
