const hre = require('hardhat');
require('dotenv').config();

const CONTRACT = require("../../artifacts/contracts/PNFT.sol/PNFT.json");
const PROVIDER = new ethers.providers.JsonRpcBatchProvider(process.env.URL_RPC_MCH_MAINNET);

const OWNERWALLET = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  PROVIDER
);

const PCONTRACT = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS,
    CONTRACT.abi,
    OWNERWALLET
);

async function main() {
  console.log("Previous Owner: ", await PCONTRACT.owner());

  await PCONTRACT.connect(OWNERWALLET).transferOwnership(process.env.NEW_OWNER);

  console.log("Next Owner: ", await PCONTRACT.owner());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});