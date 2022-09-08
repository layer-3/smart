//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

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

    struct AssetOperationArgs {
        address account;
        bytes payload;
        bytes brokerSignature;
        bytes otpSignature;
    }

    // ======================
    // Functions
    // ======================
    /**
     * Get contract name.
     * @return string Contract name.
     */
    function name() public view returns (string memory);

    /**
     * @notice Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view returns (uint256);

    /**
     * @notice Set the address derived from the broker's new public key. Emits `BrokerKeyDerivedAddressSet` event.
     * @dev Supplied payload must be signed by broker's current public key.
     * @param encodedAddress Encoded address to set.
     * @param signature Encoded address signed by broker's current public key.
     */
    function setBrokerKeyDerivedAddress(bytes calldata encodedAddress, bytes calldata signature) external;

    /**
     * @notice Set the address derived from the OTP's new public key. Emits `OTPKeyDerivedAddressSet` event.
     * @dev Supplied payload must be signed by OTP's current public key.
     * @param encodedAddress Encoded address to set.
     * @param signature Encoded address signed by OTP's current public key.
     */
    function setOTPKeyDerivedAddress(bytes calldata encodedAddress, bytes calldata signature) external;

    /**
     * @notice Deposit assets with given payload from the caller. Emits `Deposited` event.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, deposit address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @param otpSignature Payload signed by the OTP service.
     * @return bool Return 'true' if deposited successfully.
     */
    function deposit(
        bytes calldata payload,
        bytes memory brokerSignature,
        bytes memory otpSignature
    ) public payable returns (bool);

    /**
     * @notice Withdraw assets with given payload to the destination specified in the payload. Emits `Withdrawn` event.
     * @param payload Encoded payload, which consists of rid (unique identifier id), expire timestamp, destination address and an array of allocations.
     * @param brokerSignature Payload signed by the Broker.
     * @param otpSignature Payload signed by the OTP service.
     * @return bool Return 'true' if withdrawn successfully.
     */
    function withdraw(
        bytes calldata payload,
        bytes memory brokerSignature,
        bytes memory otpSignature
    ) public payable returns (bool);

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
     * @param destionation Destination address.
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
     */
    event BrokerKeyDerivedAddressSet();

    /**
     * @notice Address derived from OTP's new public key is set.
     */
    event OTPKeyDerivedAddressSet();
}
