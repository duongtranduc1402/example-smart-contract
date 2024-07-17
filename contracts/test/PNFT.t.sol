// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../PNFT.sol";
import "hardhat/console.sol";

contract PNFTHarness is PNFT {
    constructor(
        address _primarySaleRecipient
    ) PNFT(_primarySaleRecipient) {}

    function canSetPrimarySaleRecipient() external view virtual returns (bool) {
        return _canSetPrimarySaleRecipient();
    }

    function collectPriceOnClaim(
        address _primarySaleRecipient,
        uint256 _quantityToClaim,
        address _currency,
        uint256 _pricePerToken
    ) payable external virtual {
        _collectPriceOnClaim(
            _primarySaleRecipient,
            _quantityToClaim,
            _currency,
            _pricePerToken
        );
    }
}
