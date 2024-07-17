const hre = require('hardhat');

async function deployPCoin() {
  const PCoin = await hre.ethers.getContractFactory('PCoin');
  const pCoin = await PCoin.deploy();

  await pCoin.deployed();

  console.log('PCoin address:', pCoin.address);
}

deployPCoin().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});