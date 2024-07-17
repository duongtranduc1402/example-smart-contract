const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;

describe("P Coin contract", function () {
    it("Should deploy", async function () {
        const PCoin = await ethers.getContractFactory("PCoinHarness");
        const pNft = await PCoin.deploy();
        await pNft.deployed();
      });
  
});
