// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Mock ERC-20 token with an open faucet function for Metropolis Hackathon testing on Monad Testnet.
 */
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint 1,000,000 tokens to the deployer for initial testing
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @notice Open faucet minting function allowing anyone to mint test tokens.
     * @param to Destination address
     * @param amount Token amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        _mint(to, amount);
    }
}
