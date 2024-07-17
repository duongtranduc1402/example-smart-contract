const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;

async function deploy() {
  const [signer, user] = await ethers.getSigners();

  let transfer = await ethers.getContractFactory("TransferHarness");
  const contract = await transfer.deploy();

  await contract.deployed();

  let transferContract = await ethers.getContractAt(
    "TransferHarness",
    contract.address,
    signer
  );

  return {
    signer,
    user,
    transferContract,
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

describe("Transfer ERC20", function () {
  it("Should deploy", async function () {
    const Transfer = await ethers.getContractFactory("TransferHarness");
    const contract = await Transfer.deploy();
    await contract.deployed();
  });

  it("Should safe transfer ERC20", async function () {
    const { transferContract } = await deploy();
    const { signer, coinContract } = await deployCoin();

    const weiValue = ethers.BigNumber.from("4000000000000000000000");
    const approve = await coinContract
      .connect(signer)
      .approve(transferContract.address, weiValue);

    await approve.wait();

    const transfer = await coinContract
      .connect(signer)
      .transfer(transferContract.address, weiValue);

    await transfer.wait();

    const currentCoinBalance = await coinContract.balanceOf(transferContract.address);

    const safeTransfer = await transferContract.safeTransferERC20(
      coinContract.address,
      transferContract.address,
      signer.address,
      ethers.utils.parseEther("1")
    );

    await safeTransfer.wait();
  });
});
