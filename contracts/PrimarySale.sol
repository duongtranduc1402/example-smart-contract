// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/IPrimarySale.sol";

abstract contract PrimarySale is IPrimarySale {
    mapping(address => bool) public supportedCurrency;
    /// @dev The address that receives all primary sales value.
    address private recipient;

    /// @dev Returns primary sale recipient address.
    function primarySaleRecipient() public view override returns (address) {
        return recipient;
    }

    /// @dev Lets a contract admin set the recipient for all primary sales.
    function _setupPrimarySaleRecipient(address _saleRecipient) internal {
        if (_saleRecipient == address(0)) {
            revert("Invalid recipient");
        }
        recipient = _saleRecipient;
        emit PrimarySaleRecipientUpdated(_saleRecipient);
    }

    /// @dev Returns whether primary sale recipient can be set in the given execution context.
    function _canSetPrimarySaleRecipient() internal view virtual returns (bool);

    function _addCurrency(address currency) internal virtual {
        supportedCurrency[currency] = true;
    }

    function _removeCurrency(address currency) internal virtual {
        supportedCurrency[currency] = false;
    }
}
