require("dotenv").config();
const hardhat = require("hardhat");
const { ethers } = hardhat;

// ADDRESS CURRENCY
const ADDRESSCURRENCY = process.env.CURRENCY_CONTRACT_ADDRESS;

// ABI AND PROVIDER
const CONTRACT = require("../../artifacts/contracts/PNFT.sol/PNFT.json");
const PROVIDER = new ethers.providers.JsonRpcBatchProvider(process.env.URL_RPC_MCH_TESTNET);

const OWNERWALLET = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  PROVIDER
);

// CONTRACT
const PCONTRACT = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  CONTRACT.abi,
  OWNERWALLET
);

async function main() {
  const addCurrency = await PCONTRACT.connect(OWNERWALLET).addCurrency(ADDRESSCURRENCY);

  await addCurrency.wait();
  console.log("check addCurrency: ", addCurrency);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});