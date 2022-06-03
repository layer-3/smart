/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {ethers} from 'hardhat';

async function main() {
  const TestTokenContract = await ethers.getContractFactory('TestERC20');

  const token = await TestTokenContract.attach(process.env.TOKEN_ADDRESS!);
  await token.setUserBalance(
    process.env.MINT_TO!,
    ethers.utils.parseEther(process.env.MINT_AMOUNT!)
  );

  console.log(
    `Minted ${await token.name()} to ${process.env.MINT_TO} amount ${process.env.MINT_AMOUNT}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
