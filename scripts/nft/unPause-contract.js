require("dotenv").config();
const hardhat = require("hardhat");
const { ethers } = hardhat;

// ABI AND PROVIDER
const CONTRACT = require("../../artifacts/contracts/PNFT.sol/PNFT.json");
const PROVIDER = new ethers.providers.JsonRpcBatchProvider(process.env.URL_RPC_MCH_MAINNET);

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
  const unPauseContract = await PCONTRACT.connect(OWNERWALLET).unPause();

  await unPauseContract.wait();
  console.log("check unPause contract: ", unPauseContract);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});