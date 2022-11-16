//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface INextImplementation {
	function getRightmostImplementation() external view returns (address);
}
