import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ROBINHOOD_TESTNET_RPC as string,
      },
    },
    robinhoodTestnet: {
      url: process.env.ROBINHOOD_TESTNET_RPC as string,
      chainId: 46630,
    },
    robinhoodMainnet: {
      url: process.env.ROBINHOOD_MAINNET_RPC as string,
      chainId: 4663,
    }
  }
};

export default config;
