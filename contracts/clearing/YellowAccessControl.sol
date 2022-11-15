//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

abstract contract YellowAccessControl is AccessControl {
	// Roles
	bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');
	bytes32 public constant REGISTRY_VALIDATOR_ROLE = keccak256('REGISTRY_VALIDATOR_ROLE');
	bytes32 public constant AUDITOR_ROLE = keccak256('AUDITOR_ROLE');
	bytes32 public constant LOCKING_MAINTAINER_ROLE = keccak256('LOCKING_MAINTAINER_ROLE');
}
