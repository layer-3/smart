## IVault

IVault is the interface to implement custody

### Contents

<!-- START doctoc -->
<!-- END doctoc -->

### Functions

#### `getLastId`

📋 &nbsp;&nbsp;
Get last ledger id (deposits and withdrawals id).

##### Declaration

```solidity
  function getLastId(
  ) external returns (uint256)
```

##### Returns:

| Type      | Description |
| --------- | ----------- |
| `uint256` | Ledger id.  |

### Events

#### `Deposited`

📋 &nbsp;&nbsp;
Deposited event

##### Params:

| Param     | Type    |      Indexed       | Description                        |
| --------- | ------- | :----------------: | ---------------------------------- |
| `id`      | uint256 | :white_check_mark: | Ledger id                          |
| `account` | address | :white_check_mark: | Account address                    |
| `asset`   | address | :white_check_mark: | Asset address to deposit           |
| `amount`  | uint256 |                    | Quantity of assets to be deposited |
| `rid`     | bytes32 |                    | Request id from broker             |

#### `Withdrawn`

📋 &nbsp;&nbsp;
Withdrawn event

##### Params:

| Param     | Type    |      Indexed       | Description                        |
| --------- | ------- | :----------------: | ---------------------------------- |
| `id`      | uint256 | :white_check_mark: | Ledger id                          |
| `account` | address | :white_check_mark: | Account address                    |
| `asset`   | address | :white_check_mark: | Asset address to deposit           |
| `amount`  | uint256 |                    | Quantity of assets to be deposited |
| `rid`     | bytes32 |                    | Request id from broker             |
