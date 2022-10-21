//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract VestingERC20 is ERC20, Ownable {
	//solhint-disable-next-line no-empty-blocks
	constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

	function mint(address to, uint256 amount) public {
		_mint(to, amount);
	}

	function burnFrom(address from, uint256 amount) public {
		_burn(from, amount);
	}
}
