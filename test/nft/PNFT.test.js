const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;
const { SignatureMinter } = require("../../lib");
const native_token = "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";
const uri_example = "https://example.com/token/1";

async function deploy() {
  const [signer, user, buyer, seller] = await ethers.getSigners();

  let p = await ethers.getContractFactory("PNFT");
  const contract = await p.deploy(signer.address);

  await contract.deployed();

  let pContract = await ethers.getContractAt(
    "PNFT",
    contract.address,
    signer
  );

  let userCallContract = await ethers.getContractAt(
    "PNFT",
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

  let p = await ethers.getContractFactory("PNFT");
  const contract = await p.deploy(signer.address);

  await contract.deployed();

  let pContract = await ethers.getContractAt(
    "PNFT",
    contract.address,
    signer
  );

  let userCallContract = await ethers.getContractAt(
    "PNFT",
    contract.address,
    user
  );

  const pause = await contract.connect(signer).pause();
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

describe("PNFT contract", function () {
  it("Should deploy", async function () {
    const [seller] = await ethers.getSigners();
    const pNFT = await ethers.getContractFactory("PNFT");
    const pNft = await pNFT.deploy(seller.address);
    await pNft.deployed();
  });

  it("Should Contract Paused", async function () {
    const { pContract, signer, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const pause = await pContract.connect(signer).pause();
    await pause.wait();

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Contract Paused");
  });

  it("Should user unPaused contract", async function () {
    const { pContract, user } = await deploy();

    await expect(pContract.connect(user).unPause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should owner unPaused contract", async function () {
    const { pContract, signer, user, buyer, seller } = await pauseContract();

    const unPause = await pContract.connect(signer).unPause();
    await unPause.wait();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: user,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Invalid req");
  });

  it("Should Invalid recipient", async function () {
    const pNFT = await ethers.getContractFactory("PNFT");
    await expect(
      pNFT.deploy(ethers.constants.AddressZero)
    ).to.be.revertedWith("Invalid recipient");
  });

  it("The signer should be the owner of the contract", async function () {
    const { pContract, user, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: user,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Invalid req");
  });

  it("If the request is no longer valid", async function () {
    const { pContract, signer, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) + 3606,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Req expired");
  });

  it("Should recipient undefined", async function () {
    const { pContract, signer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      ethers.constants.AddressZero,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("recipient undefined");
  });

  it("Should Invalid msg value", async function () {
    const { pContract, signer, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(ethers.constants.AddressZero);

    addCurrency.wait();

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature, {
        value: ethers.utils.parseUnits("0.1", "ether"),
      })
    ).to.be.revertedWith("Invalid msg value for currency transfer");
  });

  it("Should NOT Native token Fee", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();
    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });
    const weiValue = ethers.BigNumber.from("4000000000000000000000");
    const approve = await coinContract
      .connect(signer)
      .approve(buyer.address, weiValue);

    await approve.wait();

    const transfer = await coinContract
      .connect(signer)
      .transfer(buyer.address, weiValue);

    await transfer.wait();
    const currentCoinBalanceBuyer = await coinContract.balanceOf(buyer.address);

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);

    addCurrency.wait();

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      coinContract.address,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await pContract.connect(signer).addMinter(buyer.address);

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        1,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.getSuccessfulTransactionCount()).to.equal(1);

    expect(await pContract.balanceOf(buyer.address)).to.equal(1);
    expect(await coinContract.balanceOf(seller.address)).to.equal(
      req.req.pricePerToken.mul(req.req.quantity)
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.pricePerToken.mul(req.req.quantity))
    );
  });

  it("Should NOT Native token and mint Multiple token", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const weiValue = ethers.BigNumber.from("4000000000000000000000");
    const approve = await coinContract
      .connect(signer)
      .approve(buyer.address, weiValue);

    await approve.wait();

    const transfer = await coinContract
      .connect(signer)
      .transfer(buyer.address, weiValue);

    await transfer.wait();

    const currentCoinBalanceBuyer = await coinContract.balanceOf(buyer.address);

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);

    addCurrency.wait();

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      3,
      ethers.utils.parseEther("1"),
      coinContract.address,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        3,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(3);
    expect(await coinContract.balanceOf(seller.address)).to.equal(
      req.req.pricePerToken.mul(req.req.quantity)
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.pricePerToken.mul(req.req.quantity))
    );
  });

  it("Should Native token Fee", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(native_token);

    addCurrency.wait();

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      native_token,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature, {
        value: req.req.pricePerToken.mul(req.req.quantity),
      })
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        1,
        ethers.utils.parseEther("1"),
        native_token,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(1);
  });

  it("Should Native token and mint Multiple token", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(native_token);

    addCurrency.wait();

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      3,
      ethers.utils.parseEther("1"),
      native_token,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature, {
        value: req.req.pricePerToken.mul(req.req.quantity),
      })
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        3,
        ethers.utils.parseEther("1"),
        native_token,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(3);
  });

  it("Should Mint a token NOT Fee", async function () {
    const { pContract, signer, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("0"),
      native_token,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        1,
        ethers.utils.parseEther("0"),
        native_token,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(1);
  });

  it("Should Mint Multiple token NOT Fee", async function () {
    const { pContract, signer, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      5,
      ethers.utils.parseEther("0"),
      native_token,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        5,
        ethers.utils.parseEther("0"),
        native_token,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(5);
  });

  it("Should Invalid quantity", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      0,
      ethers.utils.parseEther("1"),
      native_token,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Invalid quantity");

    expect(await pContract.balanceOf(buyer.address)).to.equal(0);
  });

  it("Should primary Sale Recipient", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();
    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });
    const weiValue = ethers.BigNumber.from("4000000000000000000000");
    const approve = await coinContract
      .connect(signer)
      .approve(buyer.address, weiValue);

    await approve.wait();

    const transfer = await coinContract
      .connect(signer)
      .transfer(buyer.address, weiValue);

    await transfer.wait();
    const currentCoinBalanceBuyer = await coinContract.balanceOf(buyer.address);
    const currentCoinBalanceSigner = await coinContract.balanceOf(
      signer.address
    );

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);

    addCurrency.wait();

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      ethers.constants.AddressZero,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      coinContract.address,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        ethers.constants.AddressZero,
        uri_example,
        1,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(1);
    expect(await coinContract.balanceOf(signer.address)).to.equal(
      currentCoinBalanceSigner.add(req.req.pricePerToken.mul(req.req.quantity))
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.pricePerToken.mul(req.req.quantity))
    );
  });

  it("Should NOT Native token Fee, Transfer money to your own wallet address", async function () {
    const { pContract, signer, seller } = await deploy();
    const { coinContract } = await deployCoin();
    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);

    addCurrency.wait();

    await pContract.connect(signer).addMinter(seller.address);

    const req = await signatureMinter.createReq(
      seller.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      coinContract.address,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(seller)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(seller).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        seller.address,
        seller.address,
        uri_example,
        1,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);
  });

  it("Should remove currency", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);
    addCurrency.wait();

    const removeCurrency = await pContract
      .connect(signer)
      .removeCurrency(coinContract.address);
    removeCurrency.wait();

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      1,
      ethers.utils.parseEther("1"),
      coinContract.address,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature, {
        value: ethers.utils.parseUnits("0.1", "ether"),
      })
    ).to.be.revertedWith("This currency not support");
  });

  it("One signature but minted twice", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinter({
      contract: pContract,
      signer: signer,
    });

    const weiValue = ethers.BigNumber.from("4000000000000000000000");
    const approve = await coinContract
      .connect(signer)
      .approve(buyer.address, weiValue);

    await approve.wait();

    const transfer = await coinContract
      .connect(signer)
      .transfer(buyer.address, weiValue);

    await transfer.wait();

    const currentCoinBalanceBuyer = await coinContract.balanceOf(buyer.address);

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);

    addCurrency.wait();

    await pContract.connect(signer).addMinter(buyer.address);

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      uri_example,
      3,
      ethers.utils.parseEther("1"),
      coinContract.address,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    const approveMint = await coinContract
      .connect(buyer)
      .approve(
        pContract.address,
        req.req.pricePerToken.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, "0", [
        buyer.address,
        seller.address,
        uri_example,
        3,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    ).to.revertedWith("Invalid req");

    expect(await pContract.balanceOf(buyer.address)).to.equal(3);
    expect(await coinContract.balanceOf(seller.address)).to.equal(
      req.req.pricePerToken.mul(req.req.quantity)
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.pricePerToken.mul(req.req.quantity))
    );
  });

  it("should Not a minter", async function() {
    const { pContract, buyer} = await deploy();

    await expect(
      pContract.connect(buyer).mint(buyer.address, 1)
    ).to.revertedWith("Not a minter");
  });

  it("should add a minter the zero address", async function() {
    const { pContract, signer } = await deploy();

    await expect(
      pContract.connect(signer).addMinter(ethers.constants.AddressZero)
    ).to.revertedWith("_minter address is not the zero address");
  });

  it("should remove a minter the zero address", async function() {
    const { pContract, signer } = await deploy();

    await expect(
      pContract.connect(signer).removeMinter(ethers.constants.AddressZero)
    ).to.revertedWith("_minter address is not the zero address");
  });

  it("should isMinter = true", async function() {
    const { pContract, signer, buyer } = await deploy();

    await pContract.connect(signer).addMinter(buyer.address);

    await pContract.connect(signer).removeMinter(buyer.address);
  });

  it("should a minter", async function() {
    const { pContract, signer, buyer } = await deploy();
    await pContract.connect(signer).addMinter(buyer.address);

    await expect(
      pContract.connect(buyer).mint(buyer.address, 0)
    ).to.revertedWith("Invalid quantity");
  });

  it("should is paused", async function() {
    const { pContract, signer } = await deploy();
    const paused = await pContract.connect(signer).paused();

    expect(paused).to.equal(false);
  });

  it("should mint a nft token with minter role", async function() {
    const { pContract, signer, buyer } = await deploy();
    await pContract.connect(signer).addMinter(buyer.address);

    await expect(
      pContract.connect(buyer).mint(buyer.address, 1)
    ).to.emit(pContract, "TokensMinted")
    .withArgs(
      buyer.address,
      1,
      0
    )
  });

  it("should a minter in removeMinter function", async function() {
    const { pContract, signer, buyer } = await deploy();

    await expect(
      pContract.connect(signer).removeMinter(buyer.address)
    ).to.revertedWith("Not a minter");
  });

  it("should Contract Not Paused", async function() {
    const { pContract, signer, buyer } = await deploy();

    await expect(
      pContract.connect(signer).unPause()
    ).to.revertedWith("Contract Not Paused");
  });
});

describe("Transfer Ownership", function () {
  it("Ownable: new owner is the zero address", async function() {
    const { pContract, signer } = await deploy();

    await expect(
      pContract.connect(signer).transferOwnership(ethers.constants.AddressZero)
    ).to.revertedWith("Ownable: new owner is the zero address");
  });

  it("Ownable: caller is not the owner", async function() {
    const { pContract, user } = await deploy();
    await expect(
      pContract.connect(user).transferOwnership(ethers.constants.AddressZero)
    ).to.revertedWith("Ownable: caller is not the owner");
  });

  it("Can only be called by the current owner", async function() {
    const { pContract, signer , user } = await deploy();
    await expect(
      pContract.connect(signer).transferOwnership(user.address)
    ).to.emit(pContract, "OwnershipTransferred")
    .withArgs(
      signer.address,
      user.address
    )
  });
});