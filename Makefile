.PHONY=smart-contracts

ABIGEN_VERSION = 1.10.26-e5eb32ac
SOLC_VERSION = 0.8.16

OUT_DIR = ./bindings/

CACHE_DIR = ./cache

SOLC_BIN = ${CACHE_DIR}/solc
ABIGEN_BIN = ${CACHE_DIR}/abigen

install-solc-lin:
	mkdir -p ${CACHE_DIR}
	curl -L https://github.com/ethereum/solidity/releases/download/v${SOLC_VERSION}/solc-static-linux -o ${SOLC_BIN}
	chmod +x ${SOLC_BIN}

install-solc-mac:
	mkdir -p ${CACHE_DIR}
	curl -L https://github.com/ethereum/solidity/releases/download/v${SOLC_VERSION}/solc-macos -o ${SOLC_BIN}
	chmod +x ${SOLC_BIN}

install-abigen-lin:
	mkdir -p ${CACHE_DIR}
	curl -L https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-amd64-$(ABIGEN_VERSION).tar.gz -o ${CACHE_DIR}/geth-alltools.tar.gz
	tar zxvf ${CACHE_DIR}/geth-alltools.tar.gz --directory ${CACHE_DIR} --strip-components=1 geth-alltools-linux-amd64-$(ABIGEN_VERSION)/abigen
	rm -r ${CACHE_DIR}/geth-alltools.tar.gz
	chmod +x ${ABIGEN_BIN}

install-abigen-mac:
	mkdir -p ${CACHE_DIR}
	curl -L https://gethstore.blob.core.windows.net/builds/geth-alltools-darwin-amd64-$(ABIGEN_VERSION).tar.gz -o ${CACHE_DIR}/geth-alltools.tar.gz
	tar zxvf ${CACHE_DIR}/geth-alltools.tar.gz --directory ${CACHE_DIR} --strip-components=1 geth-alltools-darwin-amd64-$(ABIGEN_VERSION)/abigen
	rm -r ${CACHE_DIR}/geth-alltools.tar.gz
	chmod +x ${ABIGEN_BIN}

solc-all:
	${SOLC_BIN} --combined-json abi,bin --base-path . --include-path ./node_modules -o ${CACHE_DIR}/solcoutput/YellowClearingV1 contracts/clearing/YellowClearingV1.sol --overwrite
	${SOLC_BIN} --combined-json abi,bin --base-path . --include-path ./node_modules -o ${CACHE_DIR}/solcoutput/VaultImplV1 contracts/vault/VaultImplV1.sol --overwrite

abigen-all:
	mkdir -p ${OUT_DIR}
	${ABIGEN_BIN} --combined-json ${CACHE_DIR}/solcoutput/YellowClearingV1/combined.json --pkg YellowClearing --type Contract --out ${OUT_DIR}YellowClearing.go
	${ABIGEN_BIN} --combined-json ${CACHE_DIR}/solcoutput/VaultImplV1/combined.json --pkg Vault --type Contract --out ${OUT_DIR}Vault.go

# require changed `SOLC_BIN` and `ABIGEN_BIN`
bindings-local: solc-all abigen-all

bindings-lin: install-solc-lin solc-all install-abigen-lin abigen-all

bindings-mac: install-solc-mac solc-all install-abigen-mac abigen-all

bindings-cache: solc-all abigen-all

bindings-docker: install-solc-lin solc-all install-abigen-lin abigen-all
