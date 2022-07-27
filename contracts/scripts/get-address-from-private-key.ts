import { ethers } from 'hardhat'

async function main() {
  if (process.env.PRIVATE_KEY) {
    console.log(await new ethers.Wallet(process.env.PRIVATE_KEY!).getAddress())
  } else {
    const [signer] = await ethers.getSigners()
    console.log(signer.address)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
