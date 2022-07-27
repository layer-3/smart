import { ethers } from 'hardhat'

async function main() {
  console.log(await new ethers.Wallet(process.env.PRIVATE_KEY!).getAddress())
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
