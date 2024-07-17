const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const PNFT = await hre.ethers.getContractFactory('PNFT');
  const pNft = await PNFT.deploy(process.env.PRIMARY_SALE_RECIPIENT_ADDRESS);

  await pNft.deployed();

  console.log('PNFT address:', pNft.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});