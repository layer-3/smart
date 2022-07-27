#!/bin/bash

set -e

echo "⚪ Compiling smart contracts..."
npx hardhat compile

acc_address=$(npx hardhat run scripts/get-address-from-private-key.ts --no-compile)
echo "ℹ️  Account address: $acc_address"

if [[ "$SKIP_NONCE_CHECK" == "1" ]]; then
  echo "ℹ️  Skip nonce check on networks: $NETWORKS"
else
  echo "⚪ Checking nonce on networks: $NETWORKS"
  ## loop through each networks with space spearator. e.g. "rinkeby avax_tesnet"
  for network in $NETWORKS
  do
    nonce=$(npx hardhat run scripts/get-nonce.ts --network $network --no-compile | grep -o 'pending: [[:digit:]]*' | grep -o '[[:digit:]]*')
    if [[ "$nonce" == "0" ]]; then
      echo "- ✅ $network: $nonce nonce"
    else
      echo "- 🚨 $network: $nonce nonce. it has to be 0."
      echo "exiting the process..."
      exit 1
    fi
  done
fi

echo "⚪ Deploy YELLOW token as upgradable contract"
declare -a implContractAddressMap
for network in $NETWORKS
do
  echo "- ⬜ $network: deploying contract"
  deployment_log="$(CONTRACT_FACTORY=Yellow CONTRACT_ARGS=Yellow,YELLOW,$acc_address,10000000000000000000000000000 npx hardhat run scripts/deploy-upgradable-contract.ts --network $network --no-compile)"
  echo $deployment_log
  proxy_address=$(echo $deployment_log | sed 's/.*deployed to: \(.*\)/\1/')
  impl_address="$(PROXY_ADDRESS=$proxy_address npx hardhat run scripts/get-impl-address-from-proxy.ts --network $network --no-compile)"
  echo "- ✅ $network: YELLOW token implementation address: $impl_address"
  implContractAddressMap[$network]=$impl_address
  echo "- ✅ $network: deployed successfully"
done

echo "⚪ Verify contract with Etherscan API"
for network in $NETWORKS
do
  impl_address=${implContractAddressMap[$network]}
  echo "- ⬜ $network: verifying contract address: $impl_address"
  npx hardhat verify --network $network $impl_address
  echo "- ✅ $network: verified successfully"
done

echo "✅ Deployment finished"
