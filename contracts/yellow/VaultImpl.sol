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
     * @notice Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, deposit address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @param coSignerSignature Payload signed by the coSigner.
     * @return bool Return 'true' if deposited successfully.
     */
    function deposit(
        bytes calldata payload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable returns (bool) {
        _requireValidInput(DEPOSIT_TYPE, payload, brokerSignature, coSignerSignature);
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
     * @param coSignerSignature Payload signed by the coSigner.
     * @return bool Return 'true' if withdrawn successfully.
     */
    function withdraw(
        bytes calldata payload,
        bytes calldata brokerSignature,
        bytes calldata coSignerSignature
    ) external payable returns (bool) {
        _requireValidInput(WITHDRAW_TYPE, payload, brokerSignature, coSignerSignature);
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
     * @notice Check supplied signatures to be indeed signed by Broker and CoSigner service.
     * @param action Action type. One of DEPOSIT_TYPE and WITHDRAW_TYPE.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @param brokerSignature Broker signature.
     * @param coSignerSignature CoSigner signature.
     */
    function _requireValidInput(
        bytes32 action,
        bytes memory payload,
        bytes memory brokerSignature,
        bytes memory coSignerSignature
    ) internal view {
        require(action != 0, 'Vault: action is required');

        bytes32 digest = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encodePacked(action, payload))
        );
        address recoveredBrokerAddress = ECDSA.recover(digest, brokerSignature);
        require(recoveredBrokerAddress == _brokerVirtualAddress, 'Vault: invalid broker signature');
        address recoveredCoSignerAddress = ECDSA.recover(digest, coSignerSignature);
        require(recoveredCoSignerAddress == _coSignerVirtualAddress, 'Vault: invalid coSigner signature');
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
        require(destination != address(0), 'Vault: destination is zero address');
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
