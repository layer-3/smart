//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './YellowAccessControl.sol';

/**
 * @notice Base contract for Yellow Clearing. Responsible for all operations regarding Yellow Network.
 * @dev The actual implementation must derive from YellowClearingUpgradeability and can override `_migrateParticipantData` function.
 */
abstract contract YellowClearingUpgradeability is YellowAccessControl {
	// Prev and next implementations
	YellowClearingUpgradeability internal immutable _prevImplementation;
	YellowClearingUpgradeability internal _nextImplementation;

	// Address of this contract
	address internal immutable _self = address(this);

	/**
	 * @notice Grant DEFAULT_ADMIN_ROLE and REGISTRY_MAINTAINER_ROLE roles to deployer, link previous implementation it supplied.
	 *
	 */
	constructor(YellowClearingUpgradeability previousImplementation) {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(REGISTRY_MAINTAINER_ROLE, msg.sender);

		_prevImplementation = previousImplementation;
	}

	// ======================
	// Modifiers
	// ======================

	modifier onlyLeftImplementation(YellowClearingUpgradeability impl) {
		require(isLeftImplementation(impl), 'Not a left implementation');
		_;
	}

	// ======================
	// Next Implementation
	// ======================

	/**
	 * @notice Get next implementation address if set, zero address if not.
	 * @dev Get next implementation address if set, zero address if not.
	 * @return YellowClearingUpgradeability Next implementation address if set, zero address if not.
	 */
	function getNextImplementation() external view returns (YellowClearingUpgradeability) {
		return _nextImplementation;
	}

	/**
	 * @notice Set next implementation address. Must not be zero address or self. Emit `NextImplementationSet` event.
	 * @dev Require REGISTRY_MAINTAINER_ROLE to be invoked. Require next implementation not to be already set. Require supplied next implementation contract to have granted this contract PREVIOUS_IMPLEMENTATION_ROLE.
	 * @param nextImplementation Next implementation address.
	 */
	function setNextImplementation(YellowClearingUpgradeability nextImplementation)
		external
		onlyRole(REGISTRY_MAINTAINER_ROLE)
	{
		require(address(_nextImplementation) == address(0), 'Next implementation already set');
		require(
			address(nextImplementation) != address(0) && address(nextImplementation) != _self,
			'Invalid nextImplementation supplied'
		);

		_nextImplementation = nextImplementation;

		emit NextImplementationSet(nextImplementation);
	}

	function getRightmostImplementation() public returns (YellowClearingUpgradeability) {
		if (address(_nextImplementation) != address(0)) {
			return _nextImplementation.getRightmostImplementation();
		} else {
			return YellowClearingUpgradeability(_self);
		}
	}

	function isLeftImplementation(YellowClearingUpgradeability impl) public returns (bool) {
		if (address(_prevImplementation) == address(0)) {
			return false;
		} else if (_prevImplementation == impl) {
			return true;
		} else {
			return _prevImplementation.isLeftImplementation(impl);
		}
	}

	event NextImplementationSet(YellowClearingUpgradeability nextImplementation);
}
