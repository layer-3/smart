.PHONY=custody

ABIGEN_VERSION=1.10.11-7231b3ef
ABIGEN_FILE=geth-alltools-linux-amd64-$(ABIGEN_VERSION)
ABIGEN_URL=https://gethstore.blob.core.windows.net/builds/$(ABIGEN_FILE).tar.gz

fetch-abigen:
	mkdir -p cache
	curl -L https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-amd64-$(ABIGEN_VERSION).tar.gz -o cache/geth-alltools.tar.gz
	tar zxvf cache/geth-alltools.tar.gz --directory cache --strip-components=1
	chmod +x cache/abigen

abigen:
	./cache/abigen --abi abi/contracts/custody/IVault.sol/IVault.json --pkg vault --type IVault --out IVault.go
	./cache/abigen --abi abi/contracts/nitro-ptorocol/NitroAdjudicator.sol/NitroAdjudicator.json --pkg nitro --type NitroAdjudicator --out NitroAdjudicator.go

compile:
	npm i
	npx hardhat compile

custody: compile fetch-abigen abigen

test:
	npx hardhat test
