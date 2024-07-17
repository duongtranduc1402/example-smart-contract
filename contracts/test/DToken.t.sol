// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../DToken.sol";
import "hardhat/console.sol";

contract DTokenHarness is DToken {
    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        address _primarySaleRecipient
    ) DToken(_defaultAdmin, _name, _symbol, _primarySaleRecipient) {}

    function canSetPrimarySaleRecipient() external view virtual returns (bool) {
        return _canSetPrimarySaleRecipient();
    }

    function collectPriceOnClaim(
        address _primarySaleRecipient,
        address _currency,
        uint256 _price
    ) payable external virtual {
        _collectPriceOnClaim(
            _primarySaleRecipient,
            _currency,
            _price
        );
    }
}
