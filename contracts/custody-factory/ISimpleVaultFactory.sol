//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '../custody/SimpleVault.sol';
import './SimpleERC20.sol';

/**
 * @notice Interface descibing structures and events used in SimpleFaultFactory contract
 */
contract ISimpleVaultFactory {
    // broker to deployed vault
    struct BrokerAndVault {
        address broker;
        SimpleVault vault;
    }

    // added tokens to mint amount per deployment
    struct TokenAndMint {
        SimpleERC20 token;
        uint256 mint_per_deployment; //solhint-disable-line var-name-mixedcase
    }

    /**
     * Vault Deployed event
     * @param vaultAddress Address of deployed SimpleVault
     * @param name Name of deployed SimpleVault
     * @param broker Broker of deployed SimpleVault
     */
    event VaultDeployed(address vaultAddress, string name, address broker);

    /**
     * SimpleToken Deployed event
     * @param tokenAddress Address of deployed SimpleToken
     * @param name Name of deployed SimpleToken
     * @param symbol Symbol of deployed SimpleToken
     * @param decimals Decimal representation of deployed SimpleToken
     */
    event TokenDeployed(address tokenAddress, string name, string symbol, uint256 decimals);
}
