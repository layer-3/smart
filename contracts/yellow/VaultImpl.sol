//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import './VaultImplBase.sol';
import './IVault.sol';

// TODO: Benchmark if storing error messages as constants is cheaper than using string literals.

/**
 * @dev Implementation for the Proxy. Version 1.0.
 */
contract VaultImpl is VaultImplBase, IVault {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    /**
     * Deposit type identifier value.
     */
    bytes32 public constant DEPOSIT_ACTION = keccak256('YELLOW_VAULT_DEPOSIT_ACTION');

    /**
     * Withdrawal type identifier value.
     */
    bytes32 public constant WITHDRAW_ACTION = keccak256('YELLOW_VAULT_WITHDRAW_ACTION');

    bool private _isSetup = false;

    // Not a real address, only public key exists.
    address private _brokerVirtualAddress;
    // Not a real address, only public key exists.
    address private _coSignerVirtualAddress;

    Counters.Counter private _ledgerId;

    // Keep track of used signatures to prevent reuse before expiration.
    mapping(address => mapping(bytes32 => bool)) private _sigUsage;

    /**
     * @notice Revert if hash of supplied signature was already used by the issuer.
     * @dev Revert if hash of supplied signature was already used by the issuer.
     * @param issuer Account using supplied signature.
     * @param signature Signature used as identifier for action requested from vault.
     */
    function _requireSigNotUsed(address issuer, bytes memory signature) internal view {
        require(!_sigUsage[issuer][keccak256(signature)], 'Signature has been already used');
    }

    /**
     * @notice Check supplied signature to be indeed signed by claimed signer.
     * @dev Check supplied signature to be indeed signed by claimed signer.
     * @param signer Signer claimed to have signed the payload.
     * @param encodedData Encoded data, which denotes action to be performed.
     * @param signature Payload signed by claimed signer.
     */
    function _requireValidSignature(
        address signer,
        bytes memory encodedData,
        bytes memory signature
    ) internal pure {
        require(
            keccak256(encodedData).toEthSignedMessageHash().recover(signature) == signer,
            'Invalid signature'
        );
    }

    function _requireValidVirtualAddress(address virtualAddress) internal pure {
        require(virtualAddress != address(0), 'Invalid virtual address');
    }

    /**
     * @notice Check that payload data is correct: expire timestamp is due, destination is not zero address, there is no zero allocation amount, implementation address specified is this contract and chain id is indeed this chain's id.
     * @dev Check that payload data is correct: expire timestamp is due, destination is not zero address, there is no zero allocation amount, implementation address specified is this contract and chain id is indeed this chain's id.
     * @param payload Payload structure, which denotes action to be performed.
     */
    function _checkPayload(Payload memory payload) internal view {
        require(payload.expire > block.timestamp, 'Request is expired'); //solhint-disable-line not-rely-on-time
        require(payload.destination != address(0), 'Destination is zero address');

        for (uint256 i = 0; i < payload.allocations.length; i++) {
            require(payload.allocations[i].amount > 0, 'Amount is zero');
        }

        require(payload.implAddress == address(this), 'Invalid vault address');
        require(payload.chainId == getChainId(), 'Incorrect chain id');
    }

    /**
     * @notice Mark the signature as used by the issuer.
     * @dev Mark the signature as used by the issuer.
     * @param issuer User issuer address.
     * @param signature Signature used as identifier for action requested from vault.
     */
    function _useSignature(address issuer, bytes memory signature) internal {
        _sigUsage[issuer][keccak256(signature)] = true;
    }

    /**
     * @notice Transfer given amount of the asset from a supplied address.
     * @dev Succeed if supplied account has allowed the vault to operate `amount` of their funds.
     * @param from Ethereum address to be debited.
     * @param asset Asset address to transfer.
     * @param amount Quantity of assets to be transferred.
     */
    function _transferAssetFrom(
        address from,
        address asset,
        uint256 amount
    ) internal {
        require(from != address(0), 'Transfer is zero address');

        if (asset == address(0)) {
            require(msg.value == amount, 'Incorrect msg.value');
        } else {
            // require successful deposit before updating holdings (protect against reentrancy)
            require(
                IERC20(asset).transferFrom(from, address(this), amount),
                'Could not deposit ERC20'
            );
        }
    }

    /**
     * @notice Transfer the given amount of the asset to a supplied address.
     * @dev Transfer the given amount of the asset to a supplied address.
     * @param destination Ethereum address to be credited.
     * @param asset Asset address to transfer.
     * @param amount Quantity of assets to be transferred.
     */
    function _transferAssetTo(
        address destination,
        address asset,
        uint256 amount
    ) internal {
        require(destination != address(0), 'Transfer is zero address');

        if (asset == address(0)) {
            (bool success, ) = destination.call{value: amount}(''); //solhint-disable-line avoid-low-level-calls

            require(success, 'Could not transfer ETH');
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

    /**
     * @notice The setup function sets virtual addresses of the broker and coSigner.
     * @dev Require DEFAULT_ADMIN_ROLE to invoke. NOTE: once virtual addresses are set, there is no way to change them if their private key is lost. In such case, vault implementation contract becomes useless and requires an upgrade.
     * @param brokerVirtualAddress Address derived from broker public key.
     * @param coSignerVirtualAddress Address derived from coSigner public key.
     */
    function setup(address brokerVirtualAddress, address coSignerVirtualAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!_isSetup, 'Vault is already setup');

        _requireValidVirtualAddress(brokerVirtualAddress);
        _requireValidVirtualAddress(coSignerVirtualAddress);

        _isSetup = true;

        _brokerVirtualAddress = brokerVirtualAddress;
        _coSignerVirtualAddress = coSignerVirtualAddress;
    }

    /**
     * @notice Get last ledger id (deposits and withdrawals id).
     * @dev Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view override returns (uint256) {
        return _ledgerId.current();
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
     * @notice Set the address derived from the broker's new public key. Emits `BrokerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by broker's current public key.
     * @param virtualAddress New virtual broker address.
     * @param signature New virtual address signed by broker's current public key.
     */
    function setBrokerVirtualAddress(address virtualAddress, bytes calldata signature) external {
        _requireValidSignature(_brokerVirtualAddress, abi.encode(virtualAddress), signature);
        _requireValidVirtualAddress(virtualAddress);

        _brokerVirtualAddress = virtualAddress;

        emit BrokerVirtualAddressSet(virtualAddress);
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
     * @notice Set the address derived from the coSigner's new public key. Emits `CoSignerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by coSigner's current public key.
     * @param virtualAddress New virtual coSigner address.
     * @param signature New virtual address signed by coSigner's current public key.
     */
    function setCoSignerVirtualAddress(address virtualAddress, bytes calldata signature) external {
        _requireValidSignature(_coSignerVirtualAddress, abi.encode(virtualAddress), signature);
        _requireValidVirtualAddress(virtualAddress);

        _coSignerVirtualAddress = virtualAddress;

        emit CoSignerVirtualAddressSet(virtualAddress);
    }

    /**
     * @notice Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @dev Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param payload Deposit payload.
     * @param brokerSignature Payload signed by the broker.
     * @param coSignerSignature Payload signed by the coSigner.
     */
    function deposit(
        Payload calldata payload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable {
        address issuer = msg.sender;

        // check signatures
        _requireSigNotUsed(issuer, brokerSignature);
        _requireSigNotUsed(issuer, coSignerSignature);

        bytes memory encodedPayload = abi.encode(payload);
        _requireValidSignature(_brokerVirtualAddress, encodedPayload, brokerSignature);
        _requireValidSignature(_coSignerVirtualAddress, encodedPayload, coSignerSignature);

        // check payload
        _checkPayload(payload);

        require(payload.action == DEPOSIT_ACTION, 'Invalid action');
        require(payload.destination == issuer, 'Invalid destination');

        // use signatures
        _useSignature(issuer, brokerSignature);
        _useSignature(issuer, coSignerSignature);

        // deposit allocations
        for (uint256 i = 0; i < payload.allocations.length; i++) {
            _transferAssetFrom(
                payload.destination,
                payload.allocations[i].asset,
                payload.allocations[i].amount
            );

            _ledgerId.increment();

            emit Deposited(
                _ledgerId.current(),
                payload.destination,
                payload.allocations[i].asset,
                payload.allocations[i].amount,
                payload.rid
            );
        }
    }

    /**
     * @notice Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.
     * @dev Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.
     * @param payload Withdraw payload.
     * @param brokerSignature Payload signed by the Broker.
     * @param coSignerSignature Payload signed by the coSigner.
     */
    function withdraw(
        Payload calldata payload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable {
        address issuer = msg.sender;

        // check signatures
        _requireSigNotUsed(issuer, brokerSignature);
        _requireSigNotUsed(issuer, coSignerSignature);

        bytes memory encodedPayload = abi.encode(payload);
        _requireValidSignature(_brokerVirtualAddress, encodedPayload, brokerSignature);
        _requireValidSignature(_coSignerVirtualAddress, encodedPayload, coSignerSignature);

        // check payload
        _checkPayload(payload);

        require(payload.action == WITHDRAW_ACTION, 'Invalid action');

        // use signatures
        _useSignature(issuer, brokerSignature);
        _useSignature(issuer, coSignerSignature);

        // withdraw allocations
        for (uint256 i = 0; i < payload.allocations.length; i++) {
            _transferAssetTo(
                payload.destination,
                payload.allocations[i].asset,
                payload.allocations[i].amount
            );

            _ledgerId.increment();

            emit Withdrawn(
                _ledgerId.current(),
                payload.destination,
                payload.allocations[i].asset,
                payload.allocations[i].amount,
                payload.rid
            );
        }
    }
}
