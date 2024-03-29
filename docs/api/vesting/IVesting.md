# IVesting



## Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Functions](#functions)
  - [`addInvestor`](#addinvestor)
  - [`addInvestors`](#addinvestors)
  - [`removeInvestor`](#removeinvestor)
  - [`claimIuTokens`](#claimiutokens)
  - [`claimLockedTokens`](#claimlockedtokens)
  - [`getToPayTokens`](#gettopaytokens)
  - [`getReleasableLockedTokens`](#getreleasablelockedtokens)
  - [`getInvestorData`](#getinvestordata)
  - [`getStartTime`](#getstarttime)
  - [`getPeriodDays`](#getperioddays)
  - [`getCliffDays`](#getcliffdays)
  - [`getClaimingIntervalDays`](#getclaimingintervaldays)
- [Events](#events)
  - [`TokensReceived`](#tokensreceived)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Functions

### `addInvestor`

📋   &nbsp;&nbsp;
Add investor and receivable amount for future claiming

> Can be called only before vesting process starts. If called twice for the same investor, the second call overwrites the data


#### Declaration

```solidity
  function addInvestor(
    address investor,
    uint256 amount,
    uint256 iuPercent
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`investor` | address | Address of investor
|
|`amount` | uint256 | Tokens amount which investor should receive in general
|
|`iuPercent` | uint256 | Which percent of tokens should be available immediately after vesting cliff (represented with 2 decimals: 1000 = 10.00%)|

### `addInvestors`

📋   &nbsp;&nbsp;
The same as addInvestor, but for multiple investors

> Provided arrays should have the same length


#### Declaration

```solidity
  function addInvestors(
    address[] investors,
    uint256[] amounts,
    uint256 iuPercent
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`investors` | address[] | Array of investors
|
|`amounts` | uint256[] | Array of receivable amounts
|
|`iuPercent` | uint256 | Which percent of tokens should be available immediately after vesting cliff (represented with 2 decimals: 1000 = 10.00%)|

### `removeInvestor`

📋   &nbsp;&nbsp;
Remove investor


#### Declaration

```solidity
  function removeInvestor(
    address investor
  ) external
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`investor` | address | Address of investor|

### `claimIuTokens`

📋   &nbsp;&nbsp;
Claim Initial Unlock tokens immediately after vesting cliff

> Can be called once for each investor

#### Declaration

```solidity
  function claimIuTokens(
  ) external
```

### `claimLockedTokens`

📋   &nbsp;&nbsp;
Claim locked tokens

#### Declaration

```solidity
  function claimLockedTokens(
  ) external
```

### `getToPayTokens`

📋   &nbsp;&nbsp;
Get total amount of tokens this contract will pay investors after vesting is started

> NOTE: toPayTokens is not updated when tokens are transferred to investors


#### Declaration

```solidity
  function getToPayTokens(
  ) external returns (uint256)
```

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | Total tokens

### `getReleasableLockedTokens`

📋   &nbsp;&nbsp;
Get current available locked tokens


#### Declaration

```solidity
  function getReleasableLockedTokens(
    address investor
  ) external returns (uint256)
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`investor` | address | address
|

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | Amount of tokens ready to be released

### `getInvestorData`

📋   &nbsp;&nbsp;
Get investor data


#### Declaration

```solidity
  function getInvestorData(
    address investor
  ) external returns (uint256 iuAmount, uint256 releasedLockedTokens, uint256 totalLockedTokens)
```

#### Args

| Arg | Type | Description |
| --- | --- | --- |
|`investor` | address | address
|

#### Returns

| Type | Description |
| --- | --- |
|`iuAmount` | uint256 Initial Unlock token amount

|`releasedLockedTokens` | uint256 Released tokens

|`totalLockedTokens` | uint256 Total locked tokens

### `getStartTime`

📋   &nbsp;&nbsp;
Get vesting start time


#### Declaration

```solidity
  function getStartTime(
  ) external returns (uint256)
```

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | start time in seconds from epoch

### `getPeriodDays`

📋   &nbsp;&nbsp;
Get vesting period in days


#### Declaration

```solidity
  function getPeriodDays(
  ) external returns (uint256)
```

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | vesting period in days

### `getCliffDays`

📋   &nbsp;&nbsp;
Get vesting cliff in days


#### Declaration

```solidity
  function getCliffDays(
  ) external returns (uint256)
```

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | vesting cliff in days

### `getClaimingIntervalDays`

📋   &nbsp;&nbsp;
Get claiming interval in days


#### Declaration

```solidity
  function getClaimingIntervalDays(
  ) external returns (uint256)
```

#### Returns

| Type | Description |
| --- | --- |
|`uint256` | claiming interval in days

## Events

### `TokensReceived`

📋   &nbsp;&nbsp;
An investor received tokens


#### Params

| Param | Type | Indexed | Description |
| --- | --- | :---: | --- |
|`investor` | address |  | Address of investor, who received tokens
|`amount` | uint256 |  | Amount of tokens received
|`isLockedTokens` | bool |  | Whether received tokens were locked- or iu-tokens
