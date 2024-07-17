require("dotenv").config();
const hardhat = require("hardhat");
const { ethers } = hardhat;
const { SignatureMinter } = require("../../lib");

// ADDRESS CURRENCY
const ADDRESSCURRENCY = process.env.CURRENCY_CONTRACT_ADDRESS;

// ABI AND PROVIDER
const CONTRACT = require("../../artifacts/contracts/PNFT.sol/PNFT.json");
const ERC20 = require("../../lib/abi/ERC20.json");
const PROVIDER = new ethers.providers.JsonRpcBatchProvider(process.env.URL_RPC_MCH_TESTNET);

// BUYER
const BUYERADDRESS = process.env.BUYER_ADDRESS;
const BUYERWALLET = new ethers.Wallet(process.env.BUYER_PRIVATE_KEY, PROVIDER);

// SELLER
const SELLERADDRESS = process.env.SELLER_ADDRESS;
const OWNERWALLET = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  PROVIDER
);

// CONTRACT
const PCONTRACT = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  CONTRACT.abi,
  OWNERWALLET
);

const COINCONTRACT = new ethers.Contract(ADDRESSCURRENCY, ERC20, PROVIDER);

async function creatNextUid() {
  const transactions = await PCONTRACT.getSuccessfulTransactionCount();
  const bigNumberValue = ethers.BigNumber.from(process.env.HEX_VALUE);
  const incrementedValue = bigNumberValue.add(transactions);
  const resultHex = incrementedValue.toHexString();
  const paddedResult = ethers.utils.hexZeroPad(resultHex, 32);

  return paddedResult;
}

async function main() {
  const sigantureMint = new SignatureMinter({
    contract: PCONTRACT,
    signer: OWNERWALLET,
  });

  const currentCoinBalanceSeller = await COINCONTRACT.balanceOf(SELLERADDRESS);
  const currentCoinBalanceBuyer = await COINCONTRACT.balanceOf(BUYERADDRESS);
  const currentNftSeller = await PCONTRACT.balanceOf(SELLERADDRESS);
  const currentNftBuyer = await PCONTRACT.balanceOf(BUYERADDRESS);

  console.log("currentCoinBalanceSeller: ", currentCoinBalanceSeller.toString());
  console.log("currentCoinBalanceBuyer: ", currentCoinBalanceBuyer.toString());
  console.log("currentNftSeller: ", currentNftSeller.toString());
  console.log("currentNftBuyer: ", currentNftBuyer.toString());

  const uid = await creatNextUid();
  const req = await sigantureMint.createReq(
    BUYERADDRESS,
    SELLERADDRESS,
    "https://example.com/token/1",
    1,
    ethers.utils.parseEther("1"),
    ADDRESSCURRENCY,
    Math.floor(Date.now() / 1000) - 3600,
    Math.floor(Date.now() / 1000) + 3600,
    uid
  );

  console.log("=====PROCESSING=====");

  const approve = await COINCONTRACT.connect(BUYERWALLET).approve(
    PCONTRACT.address,
    req.req.pricePerToken.mul(req.req.quantity)
  );

  await approve.wait();

  const result = await PCONTRACT.connect(BUYERWALLET).mintWithSignature(
    req.req,
    req.signature
  );
  await result.wait();

  const afterCoinBalanceSeller = await COINCONTRACT.balanceOf(SELLERADDRESS);
  const afterCoinBalanceBuyer = await COINCONTRACT.balanceOf(BUYERADDRESS);
  const afterNftSeller = await PCONTRACT.balanceOf(SELLERADDRESS);
  const afterNftBuyer = await PCONTRACT.balanceOf(BUYERADDRESS);

  console.log("afterCoinBalanceSeller: ", afterCoinBalanceSeller.toString());
  console.log("afterCoinBalanceBuyer: ", afterCoinBalanceBuyer.toString());
  console.log("afterNftSeller: ", afterNftSeller.toString());
  console.log("afterNftBuyer: ", afterNftBuyer.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});