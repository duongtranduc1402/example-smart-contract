// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./ERC20Base.sol";
import "./PrimarySale.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SignatureMintERC20} from "./SignatureMintERC20.sol";
import {CurrencyTransferLib} from "./lib/CurrencyTransferLib.sol";

contract DToken is
    ERC20Base,
    PrimarySale,
    SignatureMintERC20,
    ReentrancyGuard
{
    uint256 public successfulTransactions;

    event TransactionExecuted(
        address indexed sender,
        uint256 indexed transactionId,
        bool success
    );

    /*//////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        address _primarySaleRecipient
    ) ERC20Base(_defaultAdmin, _name, _symbol) {
        _setupPrimarySaleRecipient(_primarySaleRecipient);
    }

    /*//////////////////////////////////////////////////////////////
                        Signature minting logic
    //////////////////////////////////////////////////////////////*/

    /**
     *  @notice           Mints tokens according to the provided mint request.
     *
     *  @param _req       The payload / mint request.
     *  @param _signature The signature produced by an account signing the mint request.
     */
    function mintWithSignature(
        MintRequest calldata _req,
        bytes calldata _signature
    )
        external
        payable
        virtual
        whenNotPaused
        nonReentrant
        returns (address signer)
    {
        require(_req.quantity > 0, "Minting zero tokens.");

        // Verify and process payload.
        signer = _processRequest(_req, _signature);

        address receiver = _req.to;

        // Collect price
        if (_req.price > 0) {
            _collectPriceOnClaim(
                _req.primarySaleRecipient,
                _req.currency,
                _req.price
            );
        }

        // Mint tokens.
        _mint(receiver, _req.quantity);

        // Increment the count of successful transactions.
        successfulTransactions++;

        // Emit an event indicating the successful execution of the transaction.
        emit TransactionExecuted(msg.sender, successfulTransactions, true);

        emit TokensMintedWithSignature(signer, receiver, _req);
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

    /// @dev Collects and distributes the primary sale value of tokens being claimed.
    function _collectPriceOnClaim(
        address _primarySaleRecipient,
        address _currency,
        uint256 _price
    ) internal virtual whenNotPaused {
        require(supportedCurrency[_currency], "This currency not support");
        if (_price == 0) {
            require(msg.value == 0, "!Value");
            return;
        }

        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            require(msg.value == _price, "Must send total price.");
        } else {
            require(msg.value == 0, "msg value not zero");
        }

        address saleRecipient = _primarySaleRecipient == address(0)
            ? primarySaleRecipient()
            : _primarySaleRecipient;
        CurrencyTransferLib.transferCurrency(
            _currency,
            msg.sender,
            saleRecipient,
            _price
        );
    }

    function addCurrency(address currency) external onlyOwner {
        _addCurrency(currency);
    }

    function removeCurrency(address currency) external onlyOwner {
        _removeCurrency(currency);
    }
}
