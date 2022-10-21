//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IVesting {
	// ------------------------
	// EVENTS
	// ------------------------

	/**
	 * An investor received tokens
	 * @param investor Address of investor, who received tokens
	 * @param amount Amount of tokens received
	 * @param isLockedTokens Whether received tokens were locked- or iu-tokens
	 */
	event TokensReceived(address investor, uint256 amount, bool isLockedTokens);

	// ------------------------
	// SETTERS (ONLY PRE-SALE)
	// ------------------------

	/**
	 * @notice Add investor and receivable amount for future claiming
	 * @dev Can be called only before vesting process starts. If called twice for the same investor, the second call overwrites the data
	 * @param investor Address of investor
	 * @param amount Tokens amount which investor should receive in general
	 * @param iuPercent Which percent of tokens should be available immediately after vesting cliff (represented with 2 decimals: 1000 = 10.00%)
	 */
	function addInvestor(
		address investor,
		uint256 amount,
		uint256 iuPercent
	) external;

	/**
	 * @notice The same as addInvestor, but for multiple investors
	 * @dev Provided arrays should have the same length
	 * @param investors Array of investors
	 * @param amounts Array of receivable amounts
	 * @param iuPercent Which percent of tokens should be available immediately after vesting cliff (represented with 2 decimals: 1000 = 10.00%)
	 */
	function addInvestors(
		address[] memory investors,
		uint256[] memory amounts,
		uint256 iuPercent
	) external;

	/**
	 * @notice Remove investor
	 * @param investor Address of investor
	 */
	function removeInvestor(address investor) external;

	// ------------------------
	// SETTERS (ONLY CONTRIBUTOR)
	// ------------------------

	/**
	 * @notice Claim Initial Unlock tokens immediately after vesting cliff
	 * @dev Can be called once for each investor
	 */
	function claimIuTokens() external;

	/// @notice Claim locked tokens
	function claimLockedTokens() external;

	// ------------------------
	// GETTERS
	// ------------------------

	/**
	 * @notice Get total amount of tokens this contract will pay investors after vesting is started
	 * @dev NOTE: toPayTokens is not updated when tokens are transferred to investors
	 * @return uint256 Total tokens
	 */
	function getToPayTokens() external view returns (uint256);

	/**
	 * @notice Get current available locked tokens
	 * @param investor address
	 * @return uint256 Amount of tokens ready to be released
	 */
	function getReleasableLockedTokens(address investor) external view returns (uint256);

	/**
	 * @notice Get investor data
	 * @param investor address
	 * @return iuAmount uint256 Initial Unlock token amount
	 * @return releasedLockedTokens uint256 Released tokens
	 * @return totalLockedTokens uint256 Total locked tokens
	 */
	function getInvestorData(address investor)
		external
		view
		returns (
			uint256 iuAmount,
			uint256 releasedLockedTokens,
			uint256 totalLockedTokens
		);

	/**
	 * @notice Get vesting start time
	 * @return uint256 start time in seconds from epoch
	 */
	function getStartTime() external view returns (uint256);

	/**
	 * @notice Get vesting period in days
	 * @return uint256 vesting period in days
	 */
	function getPeriodDays() external view returns (uint256);

	/**
	 * @notice Get vesting cliff in days
	 * @return uint256 vesting cliff in days
	 */
	function getCliffDays() external view returns (uint256);

	/**
	 * @notice Get claiming interval in days
	 * @return uint256 claiming interval in days
	 */
	function getClaimingIntervalDays() external view returns (uint256);
}
