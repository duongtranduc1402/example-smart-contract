// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {CurrencyTransferLib} from "../lib/CurrencyTransferLib.sol";

contract PCoinHarness is ERC20 {
    constructor() ERC20("PCoin", "PC") {
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }
}