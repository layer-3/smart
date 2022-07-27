import { ethers } from 'hardhat'
import { getImplementationAddress } from '@openzeppelin/upgrades-core'

async function main() {
  console.log(await getImplementationAddress(ethers.provider, process.env.PROXY_ADDRESS!))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
