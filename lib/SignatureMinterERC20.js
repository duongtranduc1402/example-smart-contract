const SIGNING_DOMAIN_NAME = "DToken"
const SIGNING_DOMAIN_VERSION = "1"

class SignatureMinterERC20 {

  constructor({ contract, signer }) {
    this.contract = contract
    this.signer = signer
  }

  async createReq(
    to,
    primarySaleRecipient,
    quantity,
    price,
    currency,
    validityStartTimestamp,
    validityEndTimestamp,
    uid,
  ) {
    const req = {     
      to,
      primarySaleRecipient,
      quantity,
      price,
      currency,
      validityStartTimestamp,
      validityEndTimestamp,
      uid,}
    const domain = await this._signingDomain()
    const types = {
      MintRequest: [
        {name: "to", type: "address"},
        {name: "primarySaleRecipient", type: "address"},
        {name: "quantity", type: "uint256"},
        {name: "price", type: "uint256"},
        {name: "currency", type: "address"},
        {name: "validityStartTimestamp", type: "uint128"},
        {name: "validityEndTimestamp", type: "uint128"},
        {name: "uid", type: "bytes32"}
      ]
    }
    const signature = await this.signer._signTypedData(domain, types, req)
    return {
      req: {...req},
      signature: signature
    }
  }

  async _signingDomain() {
    if (this._domain != null) {
      return this._domain
    }

    const chainId = await this.contract.getChainID();

    this._domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: this.contract.address,
      chainId,
    }
    return this._domain
  }
}

module.exports = {
  SignatureMinterERC20
}