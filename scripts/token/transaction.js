require("dotenv").config();
const hardhat = require("hardhat");
const { ethers } = hardhat;
const { SignatureMinterERC20 } = require("../../lib");

// ADDRESS CURRENCY
const ADDRESSCURRENCY = process.env.CURRENCY_CONTRACT_ADDRESS;

// ABI AND PROVIDER
const CONTRACTABI = require("../../artifacts/contracts/DToken.sol/DToken.json");
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
const CONTRACT = new ethers.Contract(
  process.env.D_CONTRACT_ADDRESS,
  CONTRACTABI.abi,
  OWNERWALLET
);

const COINCONTRACT = new ethers.Contract(ADDRESSCURRENCY, ERC20, PROVIDER);

async function creatNextUid() {
  const transactions = await CONTRACT.getSuccessfulTransactionCount();
  const bigNumberValue = ethers.BigNumber.from(process.env.HEX_VALUE);
  const incrementedValue = bigNumberValue.add(transactions);
  const resultHex = incrementedValue.toHexString();
  const paddedResult = ethers.utils.hexZeroPad(resultHex, 32);

  return paddedResult;
}

async function main() {
  const sigantureMint = new SignatureMinterERC20({
    contract: CONTRACT,
    signer: OWNERWALLET,
  });

  const currentCoinBalanceSeller = await COINCONTRACT.balanceOf(SELLERADDRESS);
  const currentCoinBalanceBuyer = await COINCONTRACT.balanceOf(BUYERADDRESS);
  const currentNftSeller = await CONTRACT.balanceOf(SELLERADDRESS);
  const currentNftBuyer = await CONTRACT.balanceOf(BUYERADDRESS);

  console.log("currentCoinBalanceSeller: ", ethers.utils.formatEther(currentCoinBalanceSeller));
  console.log("currentCoinBalanceBuyer: ", ethers.utils.formatEther(currentCoinBalanceBuyer));
  console.log("currentNftSeller: ", ethers.utils.formatEther(currentNftSeller));
  console.log("currentNftBuyer: ", ethers.utils.formatEther(currentNftBuyer));

  const uid = await creatNextUid();
  const req = await sigantureMint.createReq(
    OWNERWALLET.address,
    SELLERADDRESS,
    ethers.utils.parseEther("300"),
    ethers.utils.parseEther("300"),
    ADDRESSCURRENCY,
    Math.floor(Date.now() / 1000) - 3600,
    Math.floor(Date.now() / 1000) + 3600,
    uid
  );

  console.log("=====PROCESSING=====");

  const approve = await COINCONTRACT.connect(BUYERWALLET).approve(
    CONTRACT.address,
    ethers.utils.parseEther("300")
  );

  await approve.wait();

  const result = await CONTRACT.connect(BUYERWALLET).mintWithSignature(
    req.req,
    req.signature
  );
  await result.wait();

  const afterCoinBalanceSeller = await COINCONTRACT.balanceOf(SELLERADDRESS);
  const afterCoinBalanceBuyer = await COINCONTRACT.balanceOf(BUYERADDRESS);
  const afterNftSeller = await CONTRACT.balanceOf(SELLERADDRESS);
  const afterNftBuyer = await CONTRACT.balanceOf(BUYERADDRESS);

  console.log("afterCoinBalanceSeller: ", ethers.utils.formatEther(afterCoinBalanceSeller));
  console.log("afterCoinBalanceBuyer: ", ethers.utils.formatEther(afterCoinBalanceBuyer));
  console.log("afterNftSeller: ", ethers.utils.formatEther(afterNftSeller));
  console.log("afterNftBuyer: ", ethers.utils.formatEther(afterNftBuyer));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});