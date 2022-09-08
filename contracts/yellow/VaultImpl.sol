//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

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
     * Broker role identifier value
     */
    bytes32 public constant BROKER_ROLE = keccak256('CUSTODY_BROKER_ROLE');

    /**
     * Deposit type identifier value
     */
    bytes32 public constant DEPOSIT_TYPE = keccak256('CUSTODY_DEPOSIT_TYPE');

    /**
     * Withdrawal type identifier value
     */
    bytes32 public constant WITHDRAW_TYPE = keccak256('CUSTODY_WITHDRAW_TYPE');

    struct Asset {
        address asset;
        uint256 amount;
    }

    string private _name;
    address private _broker;
    Counters.Counter private _ledgerId;

    // Keep track of used signatures to prevent reuse before expiration.
    mapping(address => mapping(bytes32 => bool)) private _sigUsage;

    /**
     * Modifier to check information required for deposits and withdrawals.
     * @param account Account address to check
     * @param action Action type. One of DEPOSIT_TYPE and WITHDRAW_TYPE
     * @param payload Payload consists of rid (unique identifier id), expire, destination, and the assets list with amount
     * @param signature Broker signature
     */
    modifier onlyValidSignature(
        address account,
        bytes32 action,
        bytes calldata payload,
        bytes memory signature
    ) {
        require(account != address(0), 'Vault: account is zero address');
        require(action != 0, 'Vault: action is required');
        {
            bytes32 digest = ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked(action, payload))
            );
            address recovered = ECDSA.recover(digest, signature);
            require(recovered == _broker, 'Vault: invalid signature');
        }
        require(hasRole(BROKER_ROLE, _broker), 'Vault: invalid broker');
        _;
    }

    /**
     * The constructor function sets the contract name and broker's address.
     * @param name_ Contract name
     * @param broker_ Broker name
     */
    constructor(string memory name_, address broker_) {
        _name = name_;
        _broker = broker_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BROKER_ROLE, _broker);
    }

    /**
     * Get contract name.
     * @return string Contract name
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * Change broker address who signed the withdrawal signature.
     * @param newBroker Broker address
     */
    function changeBroker(address newBroker) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(BROKER_ROLE, _broker);
        _grantRole(BROKER_ROLE, newBroker);
        _broker = newBroker;
    }

    /**
     * Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view override returns (uint256) {
        return _ledgerId.current();
    }

    /**
     * Deposit the assets with given payload from the caller
     * @param payload Deposit payload consists of rid (unique identifier id), expire, destination, and the list of deposit asset and amount
     * @param signature Broker signature
     * @return bool Return 'true' when deposited
     */
    function deposit(bytes calldata payload, bytes memory signature) public payable returns (bool) {
        return _deposit(msg.sender, payload, signature);
    }

    /**
     * Internal deposit process and increment ledger id
     * @param account Account address
     * @param payload Deposit payload consists of rid (unique identifier id), expire, destination, and the list of deposit asset and amount
     * @param signature Broker signature
     * @return bool Return 'true' when deposited
     */
    function _deposit(
        address account,
        bytes calldata payload,
        bytes memory signature
    ) internal onlyValidSignature(account, DEPOSIT_TYPE, payload, signature) returns (bool) {
        bytes32 sigHash = keccak256(signature);
        (bytes32 rid, , , Asset[] memory assets) = _extractPayload(account, sigHash, payload);

        _sigUsage[account][sigHash] = true;

        for (uint256 i = 0; i < assets.length; i++) {
            _transferAssetFrom(assets[i].asset, account, assets[i].amount);
            _ledgerId.increment();
            emit Deposited(_ledgerId.current(), account, assets[i].asset, assets[i].amount, rid);
        }

        return true;
    }

    /**
     * Withdraw the assets with given payload to the caller
     * @param payload Withdrawal payload consists of rid (unique identifier id), expire, destination, and the list of withdrawal asset and amount
     * @param signature Broker signature
     * @return bool Return 'true' when withdrawn
     */
    function withdraw(bytes calldata payload, bytes memory signature)
        public
        payable
        returns (bool)
    {
        return _withdraw(msg.sender, payload, signature);
    }

    /**
     * Internal withdraw process and increment ledger id
     * @param account Account address
     * @param payload Withdrawal payload consists of rid (unique identifier id), expire, destination, and the list of withdrawal asset and amount
     * @param signature Broker signature
     * @return bool Return 'true' when withdrawn
     */
    function _withdraw(
        address account,
        bytes calldata payload,
        bytes memory signature
    ) internal onlyValidSignature(account, WITHDRAW_TYPE, payload, signature) returns (bool) {
        bytes32 sigHash = keccak256(signature);
        (bytes32 rid, , , Asset[] memory assets) = _extractPayload(account, sigHash, payload);

        _sigUsage[account][sigHash] = true;

        for (uint256 i = 0; i < assets.length; i++) {
            _transferAssetTo(assets[i].asset, account, assets[i].amount);
            _ledgerId.increment();
            emit Withdrawn(_ledgerId.current(), account, assets[i].asset, assets[i].amount, rid);
        }

        return true;
    }

    /**
     * Internal function to extract payload data
     * @param account Account address
     * @param sigHash Broker signature keccak256 hash
     * @param payload Payload consists of rid (unique identifier id), expire, destination, and the assets list with amount
     * @return bytes32 rid
     * @return uint64 expire
     * @return address destination
     * @return Asset Array of assets
     */
    function _extractPayload(
        address account,
        bytes32 sigHash,
        bytes calldata payload
    )
        internal
        view
        returns (
            bytes32,
            uint64,
            address,
            Asset[] memory
        )
    {
        (bytes32 rid, uint64 expire, address destination, Asset[] memory assets) = abi.decode(
            payload,
            (bytes32, uint64, address, Asset[])
        );

        require(expire > block.timestamp, 'Vault: request is expired'); //solhint-disable-line not-rely-on-time
        require(account == destination, 'Vault: invalid request');
        require(!_sigUsage[account][sigHash], 'Vault: signature has been used');

        for (uint256 i = 0; i < assets.length; i++) {
            require(assets[i].amount > 0, 'Vault: amount is zero');
        }

        return (rid, expire, destination, assets);
    }

    /**
     * Transfers the given amount of this AssetHolders's asset type from a supplied ethereum address.
     * @param asset Asset address to transfer
     * @param from Ethereum address to be credited
     * @param amount Quantity of assets to be transferred
     */
    function _transferAssetFrom(
        address asset,
        address from,
        uint256 amount
    ) internal {
        require(from != address(0), 'Vault: transfer is zero address');
        if (asset == address(0)) {
            require(msg.value == amount, 'Vault: Incorrect msg.value');
        } else {
            // require successful deposit before updating holdings (protect against reentrancy)
            require(
                IERC20(asset).transferFrom(from, address(this), amount),
                'Vault: Could not deposit ERC20'
            );
        }
    }

    /**
     * Transfers the given amount of this AssetHolders's asset type to a supplied ethereum address.
     * @param asset Asset address to transfer
     * @param destination Ethereum address to be credited
     * @param amount Quantity of assets to be transferred
     */
    function _transferAssetTo(
        address asset,
        address destination,
        uint256 amount
    ) internal {
        require(destination != address(0), 'Vault: transfer is zero address');
        if (asset == address(0)) {
            (bool success, ) = destination.call{value: amount}(''); //solhint-disable-line avoid-low-level-calls
            require(success, 'Vault: Could not transfer ETH');
        } else {
            IERC20(asset).transfer(destination, amount);
        }
    }
}
