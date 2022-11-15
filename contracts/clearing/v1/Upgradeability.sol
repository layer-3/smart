//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

abstract contract Upgradeability is AccessControl {
	bytes32 public constant UPGRADEABILITY_MAINTAINER_ROLE =
		keccak256('UPGRADEABILITY_MAINTAINER_ROLE');
	bytes32 public constant NEXT_IMPLEMENTATION_ROLE = keccak256('NEXT_IMPLEMENTATION_ROLE');

	address internal _nextImplementation;

	function getNextImplementation() external view returns (address) {
		return _nextImplementation;
	}

	function setNextImplementation(address nextImplementation)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		require(_nextImplementation == address(0), 'next implementation is already set');
		require(
			nextImplementation != address(0) && nextImplementation != address(this),
			'invalid next implementation'
		);

		_nextImplementation = nextImplementation;

		_grantRole(NEXT_IMPLEMENTATION_ROLE, _nextImplementation);

		emit NextImplementationSet(_nextImplementation);
	}

	event NextImplementationSet(address nextImplementation);
}
