const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;
const { SignatureMinterERC20 } = require("../../lib");
const native_token = "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000";
const uri_example = "https://example.com/token/1";

async function deploy() {
  const [signer, user, buyer, seller] = await ethers.getSigners();

  let p = await ethers.getContractFactory("DToken");
  const contract = await p.deploy(signer.address, "DToken", "$D", signer.address);

  await contract.deployed();

  let pContract = await ethers.getContractAt(
    "DToken",
    contract.address,
    signer
  );

  let userCallContract = await ethers.getContractAt(
    "DToken",
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

  let p = await ethers.getContractFactory("DToken");
  const contract = await p.deploy(signer.address, "DToken", "$D", signer.address);

  await contract.deployed();

  let pContract = await ethers.getContractAt(
    "DToken",
    contract.address,
    signer
  );

  let userCallContract = await ethers.getContractAt(
    "DToken",
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

async function signPermit(owner, tokenAddress, spenderAddress, value, deadline, nonce, digest) {
  const msgParams = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
      [digest, await owner.getAddress(), spenderAddress, value, deadline, nonce]
  );
  const messageDigest = ethers.utils.keccak256(msgParams);
  const signature = await owner.signMessage(ethers.utils.arrayify(messageDigest));
  const { v, r, s } = ethers.utils.splitSignature(signature);
  return { v, r, s };
}

describe("DToken contract", function () {
  it("Should deploy", async function () {
    const [seller] = await ethers.getSigners();
    const pNFT = await ethers.getContractFactory("DToken");
    const pNft = await pNFT.deploy(seller.address, "DToken", "$D", seller.address);
    await pNft.deployed();
  });

  it("Should Contract Paused", async function () {
    const { pContract, signer, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const pause = await pContract.connect(signer).pause();
    await pause.wait();

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) - 3600,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should user unPaused contract", async function () {
    const { pContract, user } = await deploy();

    await expect(pContract.connect(user).unpause()).to.be.revertedWith(
      "OwnableUnauthorized()"
    );
  });

  it("Should owner unPaused contract", async function () {
    const { pContract, signer, user, buyer, seller } = await pauseContract();

    const unPause = await pContract.connect(signer).unpause();
    await unPause.wait();

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: user,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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
    const pNFT = await ethers.getContractFactory("DToken");
    await expect(
      pNFT.deploy(ethers.constants.AddressZero, "DToken", "$D", ethers.constants.AddressZero)
    ).to.be.revertedWith("Invalid recipient");
  });

  it("The signer should be the owner of the contract", async function () {
    const { pContract, user, buyer, seller } = await deploy();

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: user,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
      1,
      ethers.utils.parseEther("1"),
      ethers.constants.AddressZero,
      Math.floor(Date.now() / 1000) + 3606,
      Math.floor(Date.now() / 1000) + 3600,
      ethers.utils.hexZeroPad("0x1234567890abcdef", 32)
    );

    await expect(
      pContract.mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Request expired");
  });

  it("Should recipient undefined", async function () {
    const { pContract, signer, seller } = await deploy();

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      ethers.constants.AddressZero,
      seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
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
    ).to.be.revertedWith("msg value not zero");
  });

  it("Should NOT Native token Fee", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();
    const signatureMinter = new SignatureMinterERC20({
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
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
      req.req.price.mul(req.req.quantity)
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.price.mul(req.req.quantity))
    );
  });

  it("Should NOT Native token and mint Multiple token", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinterERC20({
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
        3,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(3);
    expect(await coinContract.balanceOf(seller.address)).to.equal(
      req.req.price
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.price)
    );
  });

  it("Should Native token Fee", async function () {
    const { pContract, signer, buyer, seller } = await deploy();
    const { coinContract } = await deployCoin();

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(native_token);

    addCurrency.wait();

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature, {
        value: req.req.price,
      })
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(native_token);

    addCurrency.wait();

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature, {
        value: req.req.price,
      })
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    ).to.be.revertedWith("Minting zero tokens.");

    expect(await pContract.balanceOf(buyer.address)).to.equal(0);
  });

  it("Should primary Sale Recipient", async function () {
    const { pContract, signer, buyer } = await deploy();
    const { coinContract } = await deployCoin();
    const signatureMinter = new SignatureMinterERC20({
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

    const req = await signatureMinter.createReq(
      buyer.address,
      ethers.constants.AddressZero,
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        ethers.constants.AddressZero,
        1,
        ethers.utils.parseEther("1"),
        coinContract.address,
        Math.floor(Date.now() / 1000) - 3600,
        Math.floor(Date.now() / 1000) + 3600,
        ethers.utils.hexZeroPad("0x1234567890abcdef", 32),
      ]);

    expect(await pContract.balanceOf(buyer.address)).to.equal(1);
    expect(await coinContract.balanceOf(signer.address)).to.equal(
      currentCoinBalanceSigner.add(req.req.price)
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.price)
    );
  });

  it("Should NOT Native token Fee, Transfer money to your own wallet address", async function () {
    const { pContract, signer, seller } = await deploy();
    const { coinContract } = await deployCoin();
    const signatureMinter = new SignatureMinterERC20({
      contract: pContract,
      signer: signer,
    });

    const addCurrency = await pContract
      .connect(signer)
      .addCurrency(coinContract.address);

    addCurrency.wait();

    const req = await signatureMinter.createReq(
      seller.address,
      seller.address,
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(seller).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        seller.address,
        seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
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

    const req = await signatureMinter.createReq(
      buyer.address,
      seller.address,
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

    const signatureMinter = new SignatureMinterERC20({
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
        req.req.price.mul(req.req.quantity)
      );

    await approveMint.wait();

    await expect(
      pContract.connect(buyer).mintWithSignature(req.req, req.signature)
    )
      .to.emit(pContract, "TokensMintedWithSignature")
      .withArgs(signer.address, req.req.to, [
        buyer.address,
        seller.address,
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
      req.req.price
    );
    expect(await coinContract.balanceOf(buyer.address)).to.equal(
      currentCoinBalanceBuyer.sub(req.req.price)
    );
  });

  it("should is paused", async function() {
    const { pContract, signer } = await deploy();
    const paused = await pContract.connect(signer).paused();

    expect(paused).to.equal(false);
  });

  it("should Contract Not Paused", async function() {
    const { pContract, signer, buyer } = await deploy();

    await expect(
      pContract.connect(signer).unpause()
    ).to.revertedWith("Pausable: not paused");
  });
});

describe("Transfer Ownership", function () {
  it("Ownable: new owner is the zero address", async function() {
    const { pContract, signer } = await deploy();

    await expect(
      pContract.connect(signer).setOwner(ethers.constants.AddressZero)
    ).to.emit(pContract, "OwnerUpdated")
    .withArgs(
      signer.address,
      ethers.constants.AddressZero
    );
  });

  it("Ownable: caller is not the owner", async function() {
    const { pContract, user } = await deploy();
    await expect(
      pContract.connect(user).setOwner(ethers.constants.AddressZero)
    ).to.revertedWith("OwnableUnauthorized()");
  });

  it("Can only be called by the current owner", async function() {
    const { pContract, signer , user } = await deploy();
    await expect(
      pContract.connect(signer).setOwner(user.address)
    ).to.emit(pContract, "OwnerUpdated")
    .withArgs(
      signer.address,
      user.address
    )
  });

  it("Should setContractURI contract", async function () {
    const { signer, pContract } = await deploy();

    await expect(pContract.connect(signer).setContractURI("test")).to.emit(pContract, "ContractURIUpdated")
    .withArgs(
      "",
      "test"
    );
  });

  it("Should ContractMetadataUnauthorized contract", async function () {
    const { pContract, user } = await deploy();

    await expect(pContract.connect(user).setContractURI("test")).to.revertedWith("ContractMetadataUnauthorized()");
  });

  it("Should burn not enough balance", async function () {
    const { pContract, user } = await deploy();

    await expect(pContract.connect(user).burn(ethers.utils.parseEther("1"))).to.revertedWith("not enough balance");
  });

  it("Should burn", async function () {
    const { pContract, signer } = await deploy();

    await pContract.connect(signer).mintTo(signer.address, ethers.utils.parseEther("10"));

    await expect(pContract.connect(signer).burn(ethers.utils.parseEther("1"))).to.emit(pContract, "Transfer")
    .withArgs(
      signer.address,
      ethers.constants.AddressZero,
      ethers.utils.parseEther("1")
    );
  });

  it("Should burnFrom Not authorized to burn.", async function () {
    const { pContract, user } = await deploy();

    await expect(pContract.connect(user).burnFrom(user.address, ethers.utils.parseEther("1"))).to.revertedWith("Not authorized to burn.");
  });

  it("Should burnFrom not enough balance.", async function () {
    const { pContract, signer } = await deploy();

    await expect(pContract.connect(signer).burnFrom(signer.address, ethers.utils.parseEther("1"))).to.revertedWith("not enough balance");
  });

  it("Should mintTo Not authorized to mint.", async function () {
    const { pContract, user } = await deploy();

    await expect(pContract.connect(user).mintTo(user.address, ethers.utils.parseEther("0.01"))).to.revertedWith("Not authorized to mint.");
  });

  it("Should burnFrom.", async function () {
    const { pContract, signer } = await deploy();

    await pContract.connect(signer).mintTo(signer.address, ethers.utils.parseEther("1000"));

    const balanceOfUser = await pContract.balanceOf(signer.address)

    await pContract.connect(signer).approve(signer.address, ethers.utils.parseEther("10"));

    await pContract.connect(signer).burnFrom(signer.address, ethers.utils.parseEther("10"));

    expect(await pContract.balanceOf(signer.address)).to.equal(balanceOfUser.sub(ethers.utils.parseEther("10")));
  });
});

// describe("ERC20Permit", function () {
//   it("Should permit spender to spend owner's tokens", async function () {
//     const { pContract, signer, user } = await deploy();
//       const value = ethers.utils.parseEther("100");
//       const deadline = Math.floor(Date.now() / 1000) + 3600; // Set deadline 1 hour from now

//       const nonce = await pContract.nonces(signer.address);
//       const digest = await pContract.PERMIT_TYPEHASH();

//       const { v, r, s } = await signPermit(signer, pContract.address, user.address, value, deadline, nonce, digest);

//       await pContract.connect(user).permit(signer.address, user.address, value, deadline, v, r, s);

//       const allowance = await pContract.allowance(signer.address, user.address);
//       expect(allowance).to.equal(value);
//   });
// });