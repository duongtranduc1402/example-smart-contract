const SIGNING_DOMAIN_NAME = "SignatureMintERC721"
const SIGNING_DOMAIN_VERSION = "1"

class SignatureMinter {

  constructor({ contract, signer }) {
    this.contract = contract
    this.signer = signer
  }

  async createReq(
    to,
    primarySaleRecipient,
    uri,
    quantity,
    pricePerToken,
    currency,
    validityStartTimestamp,
    validityEndTimestamp,
    uid,
  ) {
    const req = {     
      to,
      primarySaleRecipient,
      uri,
      quantity,
      pricePerToken,
      currency,
      validityStartTimestamp,
      validityEndTimestamp,
      uid,}
    const domain = await this._signingDomain()
    const types = {
      MintRequest: [
        {name: "to", type: "address"},
        {name: "primarySaleRecipient", type: "address"},
        {name: "uri", type: "string"},
        {name: "quantity", type: "uint256"},
        {name: "pricePerToken", type: "uint256"},
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
  SignatureMinter
}