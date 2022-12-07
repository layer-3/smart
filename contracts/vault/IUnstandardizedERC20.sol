//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IUnstandardizedERC20 {
	function transfer(address to, uint256 amount) external;

	function transferFrom(address from, address to, uint256 amount) external;
}
