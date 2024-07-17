require("dotenv").config();
const hardhat = require("hardhat");
const { ethers } = hardhat;

// ADDRESS CURRENCY
const ADDRESSCURRENCY = process.env.CURRENCY_CONTRACT_ADDRESS;

// ABI AND PROVIDER
const CONTRACT = require("../../artifacts/contracts/DToken.sol/DToken.json");
const PROVIDER = new ethers.providers.JsonRpcBatchProvider(process.env.URL_RPC_MCH_TESTNET);

const OWNERWALLET = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  PROVIDER
);

// CONTRACT
const PCONTRACT = new ethers.Contract(
  process.env.D_CONTRACT_ADDRESS,
  CONTRACT.abi,
  OWNERWALLET
);

async function main() {
  const removeCurrency = await PCONTRACT.connect(OWNERWALLET).removeCurrency(ADDRESSCURRENCY);

  await removeCurrency.wait();
  console.log("check removeCurrency: ", removeCurrency);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});