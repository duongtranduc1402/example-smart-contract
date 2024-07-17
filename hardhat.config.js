require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();
require('solidity-coverage');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    mchTestnet: {
      url: process.env.URL_RPC_MCH_TESTNET,
      chainId: 420,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 0,
    },
    mchMainnet: {
      url: process.env.URL_RPC_MCH_MAINNET,
      chainId: 29548,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 0,
    },
  }
};
