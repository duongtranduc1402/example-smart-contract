require("dotenv").config();
const hardhat = require("hardhat");
const { ethers } = hardhat;

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
  const addMinter = await PCONTRACT.connect(OWNERWALLET).addMinter(process.env.NEW_MINTER);

  await addMinter.wait();
  console.log("check addMinter: ", addMinter);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});