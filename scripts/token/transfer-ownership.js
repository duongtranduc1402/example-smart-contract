const hre = require('hardhat');
require('dotenv').config();

const CONTRACT = require("../../artifacts/contracts/DToken.sol/DToken.json");
const PROVIDER = new ethers.providers.JsonRpcBatchProvider(process.env.URL_RPC_MCH_TESTNET);

const OWNERWALLET = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  PROVIDER
);

const PCONTRACT = new ethers.Contract(
    process.env.D_CONTRACT_ADDRESS,
    CONTRACT.abi,
    OWNERWALLET
);

async function main() {
  console.log("Previous Owner: ", await PCONTRACT.owner());

  await PCONTRACT.connect(OWNERWALLET).setOwner(process.env.NEW_OWNER);

  console.log("Next Owner: ", await PCONTRACT.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});