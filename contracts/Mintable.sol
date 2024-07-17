// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Mintable is Ownable {
    // Mapping to keep track of minters
    mapping(address => bool) public minters;

    // Modifier to restrict access to minting functions to only minters
    modifier onlyMinter() {
        require(minters[msg.sender], "Not a minter");
        _;
    }

    function _isMinter(address _minter) internal view returns (bool) {
        return minters[_minter];
    }
    
    // Function to add a new minter by the owner
    function _addMinter(address _minter) internal {
        require(_minter != address(0), "_minter address is not the zero address");
        minters[_minter] = true;
    }

    function addMinter(address _minter) external onlyOwner {
        _addMinter(_minter);
    }

    // Function to add a new minter by the owner
    function _removeMinter(address _minter) internal {
        require(_minter != address(0), "_minter address is not the zero address");
        require(_isMinter(_minter), "Not a minter");
        minters[_minter] = false;
    }

    function removeMinter(address _minter) external onlyOwner {
        _removeMinter(_minter);
    }
}