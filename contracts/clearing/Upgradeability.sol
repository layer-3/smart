//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

import './interfaces/IPrevImplementation.sol';
import './interfaces/INextImplementation.sol';

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
	IPrevImplementation public immutable prevImplementation;
	INextImplementation public nextImplementation;

	// Address of this contract
	address internal immutable _self = address(this);

	/**
	 * @notice Grant DEFAULT_ADMIN_ROLE and REGISTRY_MAINTAINER_ROLE roles to deployer, link previous implementation it supplied.
	 *
	 */
	constructor(IPrevImplementation _prevImplementation) {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(UPGRADEABILITY_MAINTAINER_ROLE, msg.sender);

		prevImplementation = _prevImplementation;
	}

	// ======================
	// Modifiers
	// ======================

	modifier onlyRightImplementation(Upgradeability impl) {
		require(isRightImplementation(impl), 'Not a right implementation');
		_;
	}

	modifier onlyLeftImplementation(Upgradeability impl) {
		require(isLeftImplementation(impl), 'Not a left implementation');
		_;
	}

	// ======================
	// Next Implementation
	// ======================

	/**
	 * @notice Get next implementation address if set, zero address if not.
	 * @dev Get next implementation address if set, zero address if not.
	 * @return YellowClearingBase Next implementation address if set, zero address if not.
	 */
	function getNextImplementation() external view returns (INextImplementation) {
		return nextImplementation;
	}

	/**
	 * @notice Set next implementation address. Must not be zero address or self. Emit `NextImplementationSet` event.
	 * @dev Require REGISTRY_MAINTAINER_ROLE to be invoked. Require next implementation not to be already set. Require supplied next implementation contract to have granted this contract PREVIOUS_IMPLEMENTATION_ROLE.
	 * @param _nextImplementation Next implementation address.
	 */
	function setNextImplementation(INextImplementation _nextImplementation)
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
	function getRightmostImplementation() public view returns (address) {
		if (address(nextImplementation) != address(0)) {
			return nextImplementation.getRightmostImplementation();
		} else {
			return _self;
		}
	}

	function isRightImplementation(Upgradeability impl) public returns (bool) {
		return _isRightImplementation(Upgradeability(_self), impl);
	}

	function isLeftImplementation(Upgradeability impl) public returns (bool) {
		return _isRightImplementation(impl, Upgradeability(_self));
	}

	// ======================
	// Internal
	// ======================

	// the second in an ancestor, maybe indirect, of the first
	function _isRightImplementation(Upgradeability first, Upgradeability second)
		internal
		returns (bool)
	{
		address first_nextImpl = address(first.nextImplementation());

		if (
			first_nextImpl == address(0) || first_nextImpl == _self || address(second) == address(0)
		) {
			return false;
		} else if (Upgradeability(first_nextImpl) == second) {
			return true;
		} else {
			return INextImplementation(first_nextImpl).isRightImplementation(second);
		}
	}

	// ======================
	// Events
	// ======================

	event NextImplementationSet(INextImplementation nextImplementation);
}
