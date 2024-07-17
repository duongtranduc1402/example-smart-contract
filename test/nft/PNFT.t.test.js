const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;

async function deploy() {
  const [signer, user, buyer, seller] = await ethers.getSigners();

  let p = await ethers.getContractFactory("PNFTHarness");
  const contract = await p.deploy(signer.address);

  await contract.deployed();

  let pContract = await ethers.getContractAt(
    "PNFTHarness",
    contract.address,
    signer
  );

  let userCallContract = await ethers.getContractAt(
    "PNFTHarness",
    contract.address,
    user
  );

  return {
    buyer,
    seller,
    signer,
    user,
    pContract,
    userCallContract,
  };
}

async function pauseContract() {
  const [signer, user, buyer, seller] = await ethers.getSigners();

  let p = await ethers.getContractFactory("PNFTHarness");
  const contract = await p.deploy(signer.address);

  await contract.deployed();

  let pContract = await ethers.getContractAt(
    "PNFTHarness",
    contract.address,
    signer
  );

  let userCallContract = await ethers.getContractAt(
    "PNFTHarness",
    contract.address,
    user
  );

  const pause = await contract.connect(signer).Pause();
  await pause.wait();

  return {
    buyer,
    seller,
    signer,
    user,
    pContract,
    userCallContract,
  };
}

async function deployCoin() {
  const [signer] = await ethers.getSigners();

  let p = await ethers.getContractFactory("PCoinHarness");
  const contract = await p.deploy();

  await contract.deployed();

  let coinContract = await ethers.getContractAt(
    "PCoinHarness",
    contract.address,
    signer
  );

  return {
    signer,
    coinContract,
  };
}

describe("PNFTHarness contract", function () {

  it("Should can Set Primary Sale Recipient", async function () {
    const { pContract, signer, seller } = await deploy();

    expect(await pContract.connect(signer).canSetPrimarySaleRecipient())
    .to.equal(true);
  });

  it("Should msg.value === 0", async function () {
    const { pContract, signer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const addCurrency = await pContract.connect(signer).addCurrency(coinContract.address);

    addCurrency.wait();

    await expect(pContract.connect(signer).collectPriceOnClaim(
      seller.address,
      1,
      coinContract.address,
      ethers.utils.parseEther("0"),
      {value: ethers.utils.parseEther("1")}
    )).to.be.revertedWith("!Value");
  });

  it("Should _pricePerToken == 0", async function () {
    const { pContract, signer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const addCurrency = await pContract.connect(signer).addCurrency(coinContract.address);

    addCurrency.wait();

    await pContract.connect(signer).collectPriceOnClaim(
      seller.address,
      0,
      coinContract.address,
      ethers.utils.parseEther("0")
    );
  });

  it("Should _amount == 0", async function () {
    const { pContract, signer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const addCurrency = await pContract.connect(signer).addCurrency(coinContract.address);

    addCurrency.wait();

     await pContract.connect(signer).collectPriceOnClaim(
      seller.address,
      0,
      coinContract.address,
      ethers.utils.parseEther("1")
    );
  });
});
