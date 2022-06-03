import {ethers} from 'hardhat';

async function main() {
  const tokenName = 'TestToken';
  const TestTokenContract = await ethers.getContractFactory('TestERC20');
  const token = await TestTokenContract.deploy(tokenName, 'TOK', '0');

  await token.deployed();

  console.log(`${tokenName} deployed to:`, token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
