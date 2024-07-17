// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {CurrencyTransferLib} from "../lib/CurrencyTransferLib.sol";

contract TransferHarness {

    function safeTransferERC20(
        address _currency, address _from, address _to, uint256 _totalPrice
    ) external virtual {
        CurrencyTransferLib.safeTransferERC20(
            _currency,
            _from,
            _to,
            _totalPrice
        );
    }
}