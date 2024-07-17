# Dark-Blood-Reborn

Desciption

## Contract

### Install
```bash
cd contracts/
npm install
```

### Configuration
Create a new file `.env` and add:
```base
# Primary sale recipient address
PRIMARY_SALE_RECIPIENT_ADDRESS=

# Private key hardhat config
PRIVATE_KEY=

# New owner
NEW_OWNER=

# New minter
NEW_MINTER=

# RPC testnet
URL_RPC_MCH_TESTNET=

# RPC mainnet
URL_RPC_MCH_MAINNET=

# Contract address
NFT_CONTRACT_ADDRESS=

# Hex value
HEX_VALUE=

#Currency contract address
CURRENCY_CONTRACT_ADDRESS=
```

### Run Unit test
```base
npx hardhat test
```

### Hardhat Converage
```base
npx hardhat converage
```

### Deploy
```base
# Testnet
npx hardhat run scripts/deploy.js --network mchTestnet

# Mainnet
npx hardhat run scripts/deploy.js --network mchMainnet
```