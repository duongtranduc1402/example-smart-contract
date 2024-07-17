// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "erc721a/contracts/ERC721A.sol";
import "./SignatureMintERC721.sol";
import "./PrimarySale.sol";
import "./Pausable.sol";
import "./Mintable.sol";
import "hardhat/console.sol";

import {CurrencyTransferLib} from "./lib/CurrencyTransferLib.sol";

/**
 *      BASE:      ERC721A
 *      EXTENSION: SignatureMintERC721
 *
 *  The `PNFT` contract uses the `ERC721A` contract, along with the `SignatureMintERC721` extension.
 *
 *  The 'signature minting' mechanism in the `SignatureMintERC721` extension uses EIP 712, and is a way for a contract
 *  admin to authorize an external party's request to mint tokens on the admin's contract. At a high level, this means
 *  you can authorize some external party to mint tokens on your contract, and specify what exactly will be minted by
 *  that external party.
 *
 */

contract PNFT is ERC721A, PrimarySale, SignatureMintERC721, Pausable, ReentrancyGuard, Mintable {
    uint256 public successfulTransactions;

    event TransactionExecuted(
        address indexed sender,
        uint256 indexed transactionId,
        bool success
    );

    /// @dev Emitted when tokens are minted.
    event TokensMinted(
        address indexed mintedTo,
        uint256 quantity,
        uint256 indexed tokenIdMinted
    );

    /*//////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Constructor to initialize the PNFT contract.
     * @param _primarySaleRecipient The address to receive funds from primary sales.
     */
    constructor(
        address _primarySaleRecipient
    ) ERC721A("P NFT", "PNFT") {
        _setupPrimarySaleRecipient(_primarySaleRecipient);
        // The contract deployer is the initial owner and also a minter
        _addMinter(msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        Signature minting logic
    //////////////////////////////////////////////////////////////*/

    /**
    * @notice Mints tokens according to the provided mint request, validating the request signature.
    *
    * @param _req The payload / mint request containing details such as quantity, recipient, price, etc.
    * @param _signature The signature produced by an account signing the mint request.
    * @return signer The address of the signer who authorized the mint request.
    */
    function mintWithSignature(
       MintRequest calldata _req,
       bytes calldata _signature
    )
       external
       payable
       virtual
       override
       nonReentrant
       whenNotPaused
       returns (address signer)
    {
       // Ensure the requested quantity is valid.
       require(_req.quantity > 0, "Invalid quantity");

       // Get the next token ID to be minted.
       uint256 tokenIdToMint = _nextTokenId();

       // Verify and process the mint request.
       signer = _processRequest(_req, _signature);

       // Extract the recipient address from the mint request.
       address receiver = _req.to;

       // Collect the specified price if applicable.
       if (_req.pricePerToken > 0) {
           _collectPriceOnClaim(
               _req.primarySaleRecipient,
               _req.quantity,
               _req.currency,
               _req.pricePerToken
           );
       }

       // Mint the requested tokens.
       _safeMint(receiver, _req.quantity);

       // Increment the count of successful transactions.
       successfulTransactions++;

       // Emit an event indicating the successful execution of the transaction.
       emit TransactionExecuted(msg.sender, successfulTransactions, true);

       // Emit an event indicating the minting of tokens with the provided signature.
       emit TokensMintedWithSignature(signer, receiver, tokenIdToMint, _req);

       // Emit an event indicating the minting of tokens.
       emit TokensMinted(receiver, _req.quantity, tokenIdToMint);
    }
   
    /**
    * @notice Mints tokens for a specified receiver, validating the request.
    *
    * @param _receiver The address of the recipient who will receive the minted tokens.
    * @param _quantity The quantity of tokens to be minted.
    */
    function mint(
       address _receiver,
       uint256 _quantity
    )
       external
       nonReentrant
       whenNotPaused
       onlyMinter
    {
       // Ensure the requested quantity is valid.
       require(_quantity > 0, "Invalid quantity");

       // Get the next token ID to be minted.
       uint256 tokenIdToMint = _nextTokenId();

       // Mint the requested tokens.
       _safeMint(_receiver, _quantity);

       // Increment the count of successful transactions.
       successfulTransactions++;

       // Emit an event indicating the successful execution of the transaction.
       emit TransactionExecuted(msg.sender, successfulTransactions, true);

       // Emit an event indicating the minting of tokens.
       emit TokensMinted(_receiver, _quantity, tokenIdToMint);
    }

    /**
     * @dev Gets the count of successful transactions.
     * @return uint256 The count of successful transactions.
     */
    function getSuccessfulTransactionCount() public view returns (uint256) {
        return successfulTransactions;
    }

    /**
     * @dev Gets the Chain ID of the network.
     * @return uint256 The Chain ID.
     */
    function getChainID() external view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /*//////////////////////////////////////////////////////////////
                            Internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns whether a given address is authorized to sign mint requests.
    function _canSignMintRequest(
        address _signer
    ) internal view virtual override returns (bool) {
        return _signer == owner();
    }

    /// @dev Returns whether primary sale recipient can be set in the given execution context.
    function _canSetPrimarySaleRecipient()
        internal
        view
        virtual
        override
        returns (bool)
    {
        return msg.sender == owner();
    }

    /// @dev Collects and distributes the primary sale value of NFTs being claimed.
    function _collectPriceOnClaim(
        address _primarySaleRecipient,
        uint256 _quantityToClaim,
        address _currency,
        uint256 _pricePerToken
    ) internal virtual whenNotPaused {
        require(supportedCurrency[_currency], "This currency not support");
        if (_pricePerToken == 0) {
            require(msg.value == 0, "!Value");
            return;
        }

        uint256 totalPrice = _quantityToClaim * _pricePerToken;
        bool validMsgValue;
        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            validMsgValue = msg.value == totalPrice;
        } else {
            validMsgValue = msg.value == 0;
        }
        require(validMsgValue, "Invalid msg value for currency transfer");

        address saleRecipient = _primarySaleRecipient == address(0)
            ? primarySaleRecipient()
            : _primarySaleRecipient;

        CurrencyTransferLib.transferCurrency(
            _currency,
            msg.sender,
            saleRecipient,
            totalPrice
        );
    }

    function addCurrency(address currency) external onlyOwner {
        _addCurrency(currency);
    }

    function removeCurrency(address currency) external onlyOwner {
        _removeCurrency(currency);
    }
}
