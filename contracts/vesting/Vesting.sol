//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './IVesting.sol';

/**
 * @notice Vesting smart contract allows to grand investors their tokens gradually during some period of time.
 * Before vesting starts, an admin must verify that Vesting smart contract has enough tokens on vesting token (ERC20) balance.
 * Tokens can be claimed whenever convenient, though new tokens are released once per specified *Claiming interval*. Thus, there would be no available tokens right after previous claiming.
 * Vesting process is linear, meaning that for equal periods of time investors will receive equal amount of tokens (except for vesting cliff).
 * During *Vesting cliff* no tokens are released. E.g. for 10 days vesting cliff, investors can receive their tokens on 11th day.
 * *Initial Unlock (IU) tokens* are tokens granted to investors right after cliff date.
 * *Claiming interval* is a time frequency when users can claim their tokens. If interval is equal 30 days, new tokens will be released and available for claiming every 30 days after cliff date.
 *
 * To deploy a contract one need to specify address of ERC20 token, which will be vested, vesting start (seconds since epoch time),
 * vesting period (in days), vesting cliff (in days) and claiming interval (in days).
 * To add an investor an admin must specify their address, vesting token amount and percentage of IU tokens of that amount.
 *
 * NOTE: Investors can be added only before vesting starts.
 * NOTE: Contract is upgradeable to ensure if any security issues are found, they can be patched right away.
 */
contract Vesting is Initializable, OwnableUpgradeable, IVesting {
    uint256 public start;
    uint256 public end;
    uint256 public periodDays;
    uint256 public cliffDate;

    uint256 public claimingIntervalDays;

    // Total amount of tokens the contract will pay investors after vesting is started
    uint256 public toPayTokens;

    // Percentage throughout the contract is represented with 2 decimals as solidity does not support numbers with floating point for now
    uint256 public constant RATE_BASE = 10000; // 100.00%

    IERC20 public token;

    struct Investor {
        // Initial Unlock (IU) tokens will be available for claiming immediately after vesting cliff
        // Users will receive all available IU tokens with 1 transaction
        uint256 iuTokens;
        // Already received amount of tokens
        uint256 releasedLockedTokens;
        // Total amount, which user should receive in general
        uint256 totalLockedTokens;
    }

    mapping(address => Investor) internal _investors;

    // ------------------------
    // Initializer
    // ------------------------

    /// @notice initialize function to support upgrading
    function initialize(
        address _token,
        uint256 _start,
        uint256 _periodDays,
        uint256 _cliffDays,
        uint256 _claimingIntervalDays
    ) public initializer {
        require(_token != address(0), 'initializer: token is 0x0');
        require(_start > block.timestamp, 'initializer: start <= now'); //solhint-disable-line not-rely-on-time
        require(_periodDays > 0, 'initializer: period days <= 0');
        require(_cliffDays < _periodDays, 'initializer: cliff >= vesting period');
        require(_claimingIntervalDays > 0, 'initializer: claiming interval days <= 0');
        uint256 activeVestingPeriod = _periodDays - _cliffDays;
        require(
            activeVestingPeriod % _claimingIntervalDays == 0,
            'initializer: activeVestingPeriod % claimingIntervalDays != 0'
        );

        __Ownable_init();

        uint256 _end = _start + _periodDays * 1 days;
        token = IERC20(_token);
        start = _start;
        end = _end;
        periodDays = _periodDays;
        cliffDate = _start + _cliffDays * 1 days;
        claimingIntervalDays = _claimingIntervalDays;
    }

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
    ) public override onlyOwner {
        require(investor != address(0), 'addInvestor: investor is 0x0');
        require(amount != 0, 'addInvestor: amount is 0');
        require(iuPercent < 10000, 'addInvestor: iuPercent >= 100%');

        //solhint-disable-next-line not-rely-on-time
        require(block.timestamp < start, 'addInvestor: adding investor after vesting start');

        // If investor already exists, overwrite him
        if (_investors[investor].totalLockedTokens != 0 || _investors[investor].iuTokens != 0) {
            removeInvestor(investor);
        }

        uint256 iuTokens = (amount * iuPercent) / RATE_BASE;
        uint256 lockedAmount = amount - iuTokens;

        _investors[investor].iuTokens = iuTokens;
        _investors[investor].totalLockedTokens = lockedAmount;
        toPayTokens += amount;
    }

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
    ) external override onlyOwner {
        uint256 investorsLength = investors.length;
        require(investorsLength == amounts.length, 'addInvestors: arrays length mismatch');

        for (uint256 i = 0; i < investorsLength; i++) {
            addInvestor(investors[i], amounts[i], iuPercent);
        }
    }

    /**
     * @notice Remove investor
     * @param investor Address of investor
     */
    function removeInvestor(address investor) public override onlyOwner {
        toPayTokens -= (_investors[investor].iuTokens + _investors[investor].totalLockedTokens);
        delete _investors[investor];
    }

    // ------------------------
    // SETTERS (ONLY CONTRIBUTOR)
    // ------------------------

    /**
     * @notice Claim Initial Unlock tokens immediately after vesting cliff
     * @dev Can be called once for each investor
     */
    function claimIuTokens() external override {
        //solhint-disable-next-line not-rely-on-time
        require(cliffDate < block.timestamp, 'claimIuTokens: claiming before cliff date');

        // Get investor's available IU tokens
        uint256 amount = _investors[msg.sender].iuTokens;
        require(amount > 0, 'claimIuTokens: no available tokens');

        // Update investor's available IU balance
        _investors[msg.sender].iuTokens = 0;

        // Transfer tokens to investor's address
        token.transfer(msg.sender, amount);

        emit TokensReceived(msg.sender, amount, false);
    }

    /// @notice Claim locked tokens
    function claimLockedTokens() external override {
        //solhint-disable-next-line not-rely-on-time
        require(cliffDate < block.timestamp, 'claimLockedTokens: claiming before cliff date');

        // Get user releasable tokens
        uint256 availableAmount = _releasableAmount(msg.sender);
        require(availableAmount > 0, 'claimLockedTokens: no available tokens');

        // Update user released locked tokens amount
        _investors[msg.sender].releasedLockedTokens += availableAmount;

        // Transfer tokens to user address
        token.transfer(msg.sender, availableAmount);

        emit TokensReceived(msg.sender, availableAmount, true);
    }

    // ------------------------
    // GETTERS
    // ------------------------

    /**
     * @notice Get total amount of tokens this contract will pay investors after vesting is started
     * @dev NOTE: toPayTokens is not updated when tokens are transferred to investors
     * @return uint256 Total tokens
     */
    function getToPayTokens() external view override returns (uint256) {
        return toPayTokens;
    }

    /**
     * @notice Get current available locked tokens
     * @param investor address
     * @return uint256 Amount of tokens ready to be released
     */
    function getReleasableLockedTokens(address investor) external view override returns (uint256) {
        return _releasableAmount(investor);
    }

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
        override
        returns (
            uint256 iuAmount,
            uint256 releasedLockedTokens,
            uint256 totalLockedTokens
        )
    {
        return (
            _investors[investor].iuTokens,
            _investors[investor].releasedLockedTokens,
            _investors[investor].totalLockedTokens
        );
    }

    /**
     * @notice Get vesting start time
     * @return uint256 start time in seconds from epoch
     */
    function getStartTime() external view override returns (uint256) {
        return start;
    }

    /**
     * @notice Get vesting period in days
     * @return uint256 vesting pedion in days
     */
    function getPeriodDays() external view override returns (uint256) {
        return periodDays;
    }

    /**
     * @notice Get vesting cliff in days
     * @return uint256 vesting cliff in days
     */
    function getCliffDays() external view override returns (uint256) {
        return (cliffDate - start) / 1 days;
    }

    /**
     * @notice Get claiming interval in days
     * @return uint256 claiming interval in days
     */
    function getClaimingIntervalDays() external view override returns (uint256) {
        return claimingIntervalDays;
    }

    // ------------------------
    // INTERNAL
    // ------------------------

    /**
     * @notice Amount of tokens ready to be released to investor
     * @param investor Investor's address
     * @return uint256 Ready to be released tokens
     */
    function _releasableAmount(address investor) private view returns (uint256) {
        return _vestedAmount(investor) - _investors[investor].releasedLockedTokens;
    }

    /**
     * @notice Amount of tokens vested to investor since start so far
     * @param investor Investor address
     * @return uint256 Vested tokens so far
     */
    function _vestedAmount(address investor) private view returns (uint256) {
        uint256 userMaxTokens = _investors[investor].totalLockedTokens;

        if (block.timestamp < cliffDate) { //solhint-disable-line not-rely-on-time
            return 0;
        } else if (block.timestamp >= end) { //solhint-disable-line not-rely-on-time
            return userMaxTokens;
        } else {
            uint256 cliffDays = (cliffDate - start) / 1 days;
            uint256 daysSinceCliffDate = (block.timestamp - cliffDate) / //solhint-disable-line not-rely-on-time
                (1 days * claimingIntervalDays);
            return
                (userMaxTokens * daysSinceCliffDate) /
                ((periodDays - cliffDays) / claimingIntervalDays);
        }
    }
}
