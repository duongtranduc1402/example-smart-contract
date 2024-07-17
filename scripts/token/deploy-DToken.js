const hre = require('hardhat');
require('dotenv').config();

async function main() {
  const DToken = await hre.ethers.getContractFactory('DToken');
  const d = await DToken.deploy(process.env.PRIMARY_SALE_RECIPIENT_ADDRESS, "DToken", "$D", process.env.PRIMARY_SALE_RECIPIENT_ADDRESS);

  await d.deployed();

  console.log('dToken address:', d.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});