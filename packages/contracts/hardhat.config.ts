import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
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
      viaIR: true,
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
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    robinhoodMainnet: {
      url: process.env.ROBINHOOD_MAINNET_RPC as string,
      chainId: 4663,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    }
  }
};

export default config;
