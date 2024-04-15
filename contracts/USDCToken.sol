// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SyntheticAsset
 * @dev A basic smart contract for managing leveraged positions in synthetic assets.
 * @author SrikanthAlva
 */
contract USDCToken is ERC20 {
    constructor() ERC20("USDC", "USDC") {}

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function mint(uint256 _amount) public {
        _mint(msg.sender, _amount);
    }
}
