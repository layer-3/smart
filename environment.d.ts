declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // json-rpc provider urls
      ETHEREUM_URL: string | undefined;
      GOERLI_URL: string | undefined;
      POLYGON_URL: string | undefined;
      MUMBAI_URL: string | undefined;

      PRIVATE_KEY: string | undefined;
      ETHERSCAN_API_KEY: string | undefined;
    }
  }
}

export {};
