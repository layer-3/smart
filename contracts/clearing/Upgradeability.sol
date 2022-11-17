//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

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

	// note: relation is reversed as Subject and Object are opposite here and in functions called
	// A -> B
	// B.foo onlyPrevImplementation(A) == B.isNextImplementation(A)

	modifier onlyPrevImplementation(Upgradeability impl) {
		require(isNextImplementation(impl), 'Not previous implementation');
		_;
	}

	modifier onlyLeftImplementation(Upgradeability impl) {
		require(isRightImplementation(impl), 'Not left implementation');
		_;
	}

	modifier onlyNextImplementation(Upgradeability impl) {
		require(isPrevImplementation(impl), 'Not next implementation');
		_;
	}

	modifier onlyRightImplementation(Upgradeability impl) {
		require(isLeftImplementation(impl), 'Not right implementation');
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

	function isPrevImplementation(Upgradeability impl) public view returns (bool) {
		return _isNextImplementation(impl, Upgradeability(_self));
	}

	// _self is a predecessor, maybe indirect, of impl supplied
	function isLeftImplementation(Upgradeability impl) public view returns (bool) {
		return _isRightImplementation(impl, Upgradeability(_self));
	}

	function isNextImplementation(Upgradeability impl) public view returns (bool) {
		return _isNextImplementation(Upgradeability(_self), impl);
	}

	// _self is an ancestor, maybe indirect, of impl supplied
	function isRightImplementation(Upgradeability impl) public view returns (bool) {
		return _isRightImplementation(Upgradeability(_self), impl);
	}

	// ======================
	// Internal
	// ======================

	// A -> B
	function _isNextImplementation(Upgradeability b, Upgradeability a)
		internal
		view
		returns (bool)
	{
		if (address(b) == address(0) || address(a) == address(0)) {
			return false;
		}

		return Upgradeability(address(a.nextImplementation())) == b;
	}

	// A -> ... -> B
	// the B is an ancestor, maybe indirect, of the A
	function _isRightImplementation(Upgradeability b, Upgradeability a)
		internal
		view
		returns (bool)
	{
		if (address(b) == address(0) || address(a) == address(0)) {
			return false;
		}

		address a_nextImpl = address(a.nextImplementation());

		if (a_nextImpl == address(0) || a_nextImpl == _self) {
			return false;
		} else if (Upgradeability(a_nextImpl) == a) {
			return true;
		} else {
			return INextImplementation(a_nextImpl).isRightImplementation(b);
		}
	}

	// ======================
	// Events
	// ======================

	event NextImplementationSet(INextImplementation nextImplementation);
}
