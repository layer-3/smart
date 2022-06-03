//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
 * @notice IVault is the interface to implement custody
 */
interface IVault {
    /**
     * Deposited event
     * @param id Ledger id
     * @param account Account address
     * @param asset Asset address to deposit
     * @param amount Quantity of assets to be deposited
     * @param rid Request id from broker
     */
    event Deposited(
        uint256 indexed id,
        address indexed account,
        address indexed asset,
        uint256 amount,
        bytes32 rid
    );

    /**
     * Withdrawn event
     * @param id Ledger id
     * @param account Account address
     * @param asset Asset address to deposit
     * @param amount Quantity of assets to be deposited
     * @param rid Request id from broker
     */
    event Withdrawn(
        uint256 indexed id,
        address indexed account,
        address indexed asset,
        uint256 amount,
        bytes32 rid
    );

    /**
     * Get last ledger id (deposits and withdrawals id).
     * @return uint256 Ledger id.
     */
    function getLastId() external view returns (uint256);
}
