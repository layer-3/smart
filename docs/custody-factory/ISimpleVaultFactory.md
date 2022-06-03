## ISimpleVaultFactory

Interface descibing structures and events used in SimpleFaultFactory contract

### Contents

<!-- START doctoc -->
<!-- END doctoc -->

### Events

#### `VaultDeployed`

📋 &nbsp;&nbsp;
Vault Deployed event

##### Params:

| Param          | Type    | Indexed | Description                     |
| -------------- | ------- | :-----: | ------------------------------- |
| `vaultAddress` | address |         | Address of deployed SimpleVault |
| `name`         | string  |         | Name of deployed SimpleVault    |
| `broker`       | address |         | Broker of deployed SimpleVault  |

#### `TokenDeployed`

📋 &nbsp;&nbsp;
SimpleToken Deployed event

##### Params:

| Param          | Type    | Indexed | Description                                    |
| -------------- | ------- | :-----: | ---------------------------------------------- |
| `tokenAddress` | address |         | Address of deployed SimpleToken                |
| `name`         | string  |         | Name of deployed SimpleToken                   |
| `symbol`       | string  |         | Symbol of deployed SimpleToken                 |
| `decimals`     | uint256 |         | Decimal representation of deployed SimpleToken |
