import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import { vars } from "hardhat/config"
import "solidity-docgen"
import "hardhat-gas-reporter"

const POLYGON_TESTNET_RPC_URL = vars.get("POLYGON_TESTNET_RPC_URL") || ""
const ADMIN_PRIVATE_KEY = vars.get("ADMIN_PRIVATE_KEY") || ""
const POLYGONSCAN_API_KEY = vars.get("POLYGONSCAN_API_KEY") || ""

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            chainId: 31337,
        },
        amoy: {
            url: POLYGON_TESTNET_RPC_URL,
            accounts: ADMIN_PRIVATE_KEY !== undefined ? [ADMIN_PRIVATE_KEY] : [],
            chainId: 80002,
        },
    },
    etherscan: {
        apiKey: {
            polygon: POLYGONSCAN_API_KEY,
            amoy: POLYGONSCAN_API_KEY,
        },
        customChains: [
            {
                network: "amoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.oklink.io/api",
                    browserURL: "https://www.oklink.com/amoy/",
                },
            },
        ],
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        forceTerminalOutput: true,
        reportFormat: "terminal",
        forceTerminalOutputFormat: "markdown",
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        token: "MATIC",
    },

    docgen: {
        outputDir: "./docs",
        pages: "items",
        collapseNewlines: true,
    },
}

export default config
