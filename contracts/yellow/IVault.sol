//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.16;

/**
 * @notice IVault is the interface to implement custody.
 */
interface IVault {
    // ======================
    // Structs
    // ======================
    struct Allocation {
        address asset;
        uint256 amount;
    }

    struct Payload {
      bytes32 action;
      bytes32 rid;
      uint48 expire;
      address destination;
      Allocation[] allocations;
      address implAddress;
      uint256 chainId;
    }

    // ======================
    // Functions
    // ======================
    /**
     * @notice Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view returns (uint256);

    /**
     * @notice Set broker virtual (only public key it is derived from exists) key for this vault. Emits `BrokerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by broker's current public key.
     * @param encodedAddress Encoded new virtual broker address.
     * @param signature New virtual address signed by broker's current public key.
     */
    function setBrokerVirtualAddress(bytes memory encodedAddress, bytes calldata signature) external;

    /**
     * @notice Set coSigner virtual (only public key it is derived from exists) key for this vault. Emits `CoSignerVirtualAddressSet` event.
     * @dev Supplied payload must be signed by coSigner's current public key.
     * @param encodedAddress Encoded new virtual coSigner address.
     * @param signature New virtual address signed by coSigner's current public key.
     */
    function setCoSignerVirtualAddress(bytes memory encodedAddress, bytes calldata signature) external;

    /**
     * @notice Get broker virtual (only public key it is derived from exists) key for this vault.
     * @dev Get broker virtual (only public key it is derived from exists) key for this vault.
     * @return address Broker virtual key for this vault.
     */
    function getBrokerVirtualAddress() external view returns (address);

    /**
     * @notice Get coSigner virtual (only public key it is derived from exists) key for this vault.
     * @dev Get coSigner virtual (only public key it is derived from exists) key for this vault.
     * @return address CoSigner virtual key for this vault.
     */
    function getCoSignerVirtualAddress() external view returns (address);

    /**
     * @notice Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Payload signed by the Broker.
     * @param otpSignature Payload signed by the CoSigner service.
     */
    function deposit(
        bytes calldata encodedPayload,
        bytes memory brokerSignature,
        bytes memory otpSignature
    ) external payable;

    /**
     * @notice Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.
     * @param encodedPayload Encoded payload, which denotes action to be performed.
     * @param brokerSignature Payload signed by the Broker.
     * @param otpSignature Payload signed by the CoSigner service.
     */
    function withdraw(
        bytes calldata encodedPayload,
        bytes memory brokerSignature,
        bytes memory otpSignature
    ) external payable;

    // ======================
    // Events
    // ======================
    /**
     * @notice Deposited event.
     * @param id Ledger id.
     * @param account Account address.
     * @param asset Asset address deposited.
     * @param amount Quantity of assets deposited.
     * @param rid Request id from broker.
     */
    event Deposited(
        uint256 indexed id,
        address indexed account,
        address indexed asset,
        uint256 amount,
        bytes32 rid
    );

    /**
     * @notice Withdrawn event.
     * @param id Ledger id.
     * @param destination Destination address.
     * @param asset Asset address withdrawn.
     * @param amount Quantity of assets withdrawn.
     * @param rid Request id from broker.
     */
    event Withdrawn(
        uint256 indexed id,
        address indexed destination,
        address indexed asset,
        uint256 amount,
        bytes32 rid
    );

    /**
     * @notice Address derived from broker's new public key is set.
     * @param newBrokerVirtualAddress Updated virtual Broker address.
     */
    event BrokerVirtualAddressSet(address indexed newBrokerVirtualAddress);

    /**
     * @notice Address derived from CoSigner's new public key is set.
     * @param newCoSignerVirtualAddress Updated virtual CoSigner address.
     */
    event CoSignerVirtualAddressSet(address indexed newCoSignerVirtualAddress);
}
