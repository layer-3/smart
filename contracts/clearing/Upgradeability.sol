//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @notice Base contract for Yellow Clearing. Responsible for all operations regarding Yellow Network.
 * @dev The actual implementation must derive from YellowClearingUpgradeability and can override `_migrateParticipantData` function.
 */
abstract contract Upgradeability is AccessControl {
	// ======================
	// Roles
	// ======================

	bytes32 public constant UPGRADEABILITY_MAINTAINER_ROLE =
		keccak256('UPGRADEABILITY_MAINTAINER_ROLE');

	// ======================
	// Fields
	// ======================

	// Prev and next implementations
	Upgradeability public immutable prevImplementation;
	Upgradeability public nextImplementation;

	// Address of this contract
	address internal immutable _self = address(this);

	/**
	 * @notice Grant DEFAULT_ADMIN_ROLE and REGISTRY_MAINTAINER_ROLE roles to deployer, link previous implementation it supplied.
	 *
	 */
	constructor(Upgradeability _prevImplementation) {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(UPGRADEABILITY_MAINTAINER_ROLE, msg.sender);

		prevImplementation = _prevImplementation;
	}

	// ======================
	// Modifiers
	// ======================

	modifier onlyLeftImplementation(Upgradeability impl) {
		require(isLeftImplementation(impl), 'Not a left implementation');
		_;
	}

	// ======================
	// Next Implementation
	// ======================

	/**
	 * @notice Set next implementation address. Must not be zero address or self. Emit `NextImplementationSet` event.
	 * @dev Require REGISTRY_MAINTAINER_ROLE to be invoked. Require next implementation not to be already set. Require supplied next implementation contract to have granted this contract PREVIOUS_IMPLEMENTATION_ROLE.
	 * @param _nextImplementation Next implementation address.
	 */
	function setNextImplementation(Upgradeability _nextImplementation)
		external
		onlyRole(UPGRADEABILITY_MAINTAINER_ROLE)
	{
		require(address(nextImplementation) == address(0), 'Next implementation already set');
		require(
			address(_nextImplementation) != address(0) && address(_nextImplementation) != _self,
			'Invalid nextImplementation supplied'
		);

		nextImplementation = _nextImplementation;

		emit NextImplementationSet(nextImplementation);
	}

	// ======================
	// Next or Prev checks
	// ======================

	// rightmost implementation - the newest impl in the upgradeability chain
	function getRightmostImplementation() public returns (Upgradeability) {
		if (address(nextImplementation) != address(0)) {
			return nextImplementation.getRightmostImplementation();
		} else {
			return Upgradeability(_self);
		}
	}

	// left implementation - supplied impl is an ancestor, including indirect, in relation to this one
	function isLeftImplementation(Upgradeability impl) public returns (bool) {
		if (address(prevImplementation) == address(0)) {
			return false;
		} else if (prevImplementation == impl) {
			return true;
		} else {
			return prevImplementation.isLeftImplementation(impl);
		}
	}

	// ======================
	// Events
	// ======================

	event NextImplementationSet(Upgradeability nextImplementation);
}
