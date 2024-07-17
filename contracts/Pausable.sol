// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/*
This contract is used for pausing the transfers of the token.
The functions Pause and unPause can only be accessed by the
contract owner.
It pauses the token transfer for desired amount of time
*/
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Pausable is Ownable {
    bool private _paused;

    event Paused(
        address indexed currentOwner,
        uint indexed timeStamp,
        bool indexed paused
    );

    modifier whenNotPaused() {
        require(!_paused, "Contract Paused");
        _;
    }

    modifier whenPaused {
        require(_paused, "Contract Not Paused");
        _;
    }

    constructor() {
        _paused = false;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    // This function is used to Pause the token transfers, can be called only by owner
    function pause() public virtual onlyOwner whenNotPaused returns (bool) {
        _paused = true;
        emit Paused(msg.sender, block.timestamp, true);
        return true;
    }

    // This function is used to Remove Pause from the token transfers, can be called only by owner
    function unPause() public virtual onlyOwner whenPaused returns (bool) {
        _paused = false;
        emit Paused(msg.sender, block.timestamp, false);
        return true;
    }
}