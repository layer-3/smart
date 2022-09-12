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

    bool private isSetup = false;

    /**
     * Deposit type identifier value.
     */
    bytes32 public constant DEPOSIT_ACTION = keccak256('YELLOW_VAULT_DEPOSIT_ACTION');

    /**
     * Withdrawal type identifier value.
     */
    bytes32 public constant WITHDRAW_ACTION = keccak256('YELLOW_VAULT_WITHDRAW_ACTION');

    // Not a real address, only public key exists.
    address private _brokerVirtualAddress;
    // Not a real address, only public key exists.
    address private _coSignerVirtualAddress;

    Counters.Counter private _ledgerId;

    // Keep track of used signatures to prevent reuse before expiration.
    mapping(address => mapping(bytes32 => bool)) private _sigUsage;

    /**
     * The setup function sets virtual addresses of the broker and coSigner.
     * @param brokerVirtualAddress Address derived from broker public key.
     * @param coSignerVirtualAddress Address derived from coSigner public key.
     */
    function setup(address brokerVirtualAddress, address coSignerVirtualAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
      require(!isSetup, 'Vault is already setup');

      isSetup = true;

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
     * @notice Set the address derived from the broker's new public key. Emits `BrokerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by broker's current public key.
     * @param encodedAddress Encoded new virtual broker address.
     * @param signature New virtual address signed by broker's current public key.
     */
    function setBrokerVirtualAddress(bytes memory encodedAddress, bytes calldata signature)
        external
    {
        bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedAddress));
        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == _brokerVirtualAddress, 'Signer is not broker');

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
    function setCoSignerVirtualAddress(bytes memory encodedAddress, bytes calldata signature)
        external
    {
        bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedAddress));
        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == _coSignerVirtualAddress, 'Signer is not coSigner');

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
     * @dev Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Payload signed by the broker.
     * @param coSignerSignature Payload signed by the coSigner.
     */
    function deposit(
        bytes calldata encodedPayload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable {
        address issuer = msg.sender;

        // check signatures
        _requireSigNotUsed(issuer, brokerSignature);
        _requireSigNotUsed(issuer, coSignerSignature);

        _requireValidSignature(encodedPayload, _brokerVirtualAddress, brokerSignature);
        _requireValidSignature(encodedPayload, _coSignerVirtualAddress, coSignerSignature);

        // extract payload
        Payload memory payload = abi.decode(encodedPayload, (Payload));

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
                payload.allocations[i].asset,
                payload.destination,
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
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Payload signed by the Broker.
     * @param coSignerSignature Payload signed by the coSigner.
     */
    function withdraw(
        bytes calldata encodedPayload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable {
        address issuer = msg.sender;

        // check signatures
        _requireSigNotUsed(issuer, brokerSignature);
        _requireSigNotUsed(issuer, coSignerSignature);

        _requireValidSignature(encodedPayload, _brokerVirtualAddress, brokerSignature);
        _requireValidSignature(encodedPayload, _coSignerVirtualAddress, coSignerSignature);

        // extract payload
        Payload memory payload = abi.decode(encodedPayload, (Payload));

        // check payload
        _checkPayload(payload);

        require(payload.action == WITHDRAW_ACTION, 'Invalid action');

        // use signatures
        _useSignature(issuer, brokerSignature);
        _useSignature(issuer, coSignerSignature);

        // withdraw allocations
        for (uint256 i = 0; i < payload.allocations.length; i++) {
            _transferAssetTo(
                payload.allocations[i].asset,
                payload.destination,
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

    /**
     * @notice Revert if hash of supplied signature was already used by the issuer.
     * @dev Revert if hash of supplied signature was already used by the issuer.
     * @param issuer Account using supplied signature.
     * @param signature Signature used as identifier for action requested from vault.
     */
    function _requireSigNotUsed(address issuer, bytes memory signature) internal view {
        require(!_sigUsage[issuer][keccak256(signature)], 'Sig already used');
    }

    /**
     * @notice Check supplied signature to be indeed signed by claimed signer.
     * @dev Check supplied signature to be indeed signed by claimed signer.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param signer Signer claimed to have signed the payload.
     * @param signature Payload signed by claimed signer.
     */
    function _requireValidSignature(
        bytes memory encodedPayload,
        address signer,
        bytes memory signature
    ) internal pure {
        bytes32 digest = ECDSA.toEthSignedMessageHash(keccak256(encodedPayload));

        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == signer, 'invalid signature');
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
        bytes32 sigHash = keccak256(signature);
        _sigUsage[issuer][sigHash] = true;
    }

    /**
     * @notice Transfer given amount of the asset from a supplied address.
     * @dev Succeed if supplied account has allowed the vault to operate `amount` of their funds.
     * @param asset Asset address to transfer.
     * @param from Ethereum address to be credited.
     * @param amount Quantity of assets to be transferred.
     */
    function _transferAssetFrom(
        address asset,
        address from,
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
     * @param asset Asset address to transfer.
     * @param destination Ethereum address to be credited.
     * @param amount Quantity of assets to be transferred.
     */
    function _transferAssetTo(
        address asset,
        address destination,
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
}
