.PHONY=smart-contracts

ABIGEN_VERSION = 1.10.26-e5eb32ac
SOLC_VERSION = 0.8.16

OUT_DIR = ./bindings/

SOLC_BIN = cache/solc
ABIGEN_BIN = cache/abigen

PLATFORM = linux

install-solc-lin:
	mkdir -p cache
	curl -L https://github.com/ethereum/solidity/releases/download/v${SOLC_VERSION}/solc-static-linux -o cache/solc
	chmod +x cache/solc

install-solc-mac:
	mkdir -p cache
	curl -L https://github.com/ethereum/solidity/releases/download/v${SOLC_VERSION}/solc-macos -o cache/solc
	chmod +x cache/solc

install-abigen-lin:
	mkdir -p cache
	curl -L https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-amd64-$(ABIGEN_VERSION).tar.gz -o cache/geth-alltools.tar.gz
	tar zxvf cache/geth-alltools.tar.gz --directory cache --strip-components=1 geth-alltools-linux-amd64-$(ABIGEN_VERSION)/abigen
	rm -r cache/geth-alltools.tar.gz
	chmod +x cache/abigen

install-abigen-mac:
	mkdir -p cache
	curl -L https://gethstore.blob.core.windows.net/builds/geth-alltools-darwin-amd64-$(ABIGEN_VERSION).tar.gz -o cache/geth-alltools.tar.gz
	tar zxvf cache/geth-alltools.tar.gz --directory cache --strip-components=1 geth-alltools-darwin-amd64-$(ABIGEN_VERSION)/abigen
	rm -r cache/geth-alltools.tar.gz
	chmod +x cache/abigen

solc-all:
	${SOLC_BIN} --combined-json abi,bin --base-path . --include-path ./node_modules -o ./cache/solcoutput/YellowClearingV1 contracts/clearing/YellowClearingV1.sol --overwrite
	${SOLC_BIN} --combined-json abi,bin --base-path . --include-path ./node_modules -o ./cache/solcoutput/VaultImplV1 contracts/vault/VaultImplV1.sol --overwrite

abigen-all:
	mkdir -p ${OUT_DIR}
	${ABIGEN_BIN} --combined-json ./cache/solcoutput/YellowClearingV1/combined.json --pkg YellowClearing --type Contract --out ${OUT_DIR}YellowClearingV1.go
	${ABIGEN_BIN} --combined-json ./cache/solcoutput/VaultImplV1/combined.json --pkg VaultImpl --type Contract --out ${OUT_DIR}VaultImplV1.go

# require changed `SOLC_BIN` and `ABIGEN_BIN`
bindings-local: solc-all abigen-all

bindings-lin: install-solc-lin solc-all install-abigen-lin abigen-all

bindings-mac: install-solc-mac solc-all install-abigen-mac abigen-all

bindings-cache: solc-all abigen-all

bindings-docker: install-solc-lin solc-all install-abigen-lin abigen-all
