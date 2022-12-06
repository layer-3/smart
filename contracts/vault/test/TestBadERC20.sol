// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import './BadERC20.sol';

contract TestBadERC20 is BadERC20, Ownable {
	constructor(
		string memory name_,
		string memory symbol_,
		uint256 amountToMint
	) BadERC20(name_, symbol_) {
		_setBalance(msg.sender, amountToMint);
	}

	function setBalance(uint256 amount) public {
		_setBalance(msg.sender, amount);
	}

	function setUserBalance(address to, uint256 amount) public onlyOwner {
		_setBalance(to, amount);
	}

	function _setBalance(address to, uint256 amount) internal {
		uint256 old = balanceOf(to);
		if (old < amount) {
			_mint(to, amount - old);
		} else if (old > amount) {
			_burn(to, old - amount);
		}
	}
}
