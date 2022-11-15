//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/access/AccessControl.sol';

abstract contract Upgradeability is AccessControl {
	bytes32 public constant UPGRADEABILITY_MAINTAINER_ROLE =
		keccak256('UPGRADEABILITY_MAINTAINER_ROLE');
	bytes32 public constant NEXT_IMPLEMENTATION_ROLE = keccak256('NEXT_IMPLEMENTATION_ROLE');

	address public nextImplementation;

	function setNextImplementation(address nextImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(nextImpl == address(0), 'next implementation is already set');
		require(nextImpl != address(0) && nextImpl != address(this), 'invalid next implementation');

		nextImplementation = nextImpl;

		_grantRole(NEXT_IMPLEMENTATION_ROLE, nextImplementation);

		emit NextImplementationSet(nextImplementation);
	}

	event NextImplementationSet(address nextImplementation);
}
