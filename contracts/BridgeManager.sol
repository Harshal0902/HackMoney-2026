// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ILiFiBridge {
    function swap(
        address fromToken,
        address toToken,
        uint256 amount,
        address receiver,
        uint256 slippage
    ) external returns (uint256);
}

contract BridgeManager is Ownable {
    IERC20 public USDC;
    ILiFiBridge public lifiBridge;

    struct BridgeRoute {
        address fromToken;
        address toToken;
        uint256 amount;
        address receiver;
        uint256 minOutput;
        uint256 executedAt;
    }

    mapping(bytes32 => BridgeRoute) public bridgeRoutes;

    event BridgeInitiated(
        bytes32 indexed routeId,
        address indexed user,
        uint256 amount,
        address toToken
    );

    event BridgeCompleted(
        bytes32 indexed routeId,
        address indexed user,
        uint256 outputAmount
    );

    constructor(address _usdc, address _lifiBridge) {
        USDC = IERC20(_usdc);
        lifiBridge = ILiFiBridge(_lifiBridge);
    }

    function initiateBridge(
        address fromToken,
        address toToken,
        uint256 amount,
        address receiver,
        uint256 minOutput,
        uint256 slippage
    ) external returns (bytes32 routeId) {
        require(amount > 0, "Invalid amount");

        require(
            IERC20(fromToken).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        IERC20(fromToken).approve(address(lifiBridge), amount);

        uint256 outputAmount = lifiBridge.swap(
            fromToken,
            toToken,
            amount,
            receiver,
            slippage
        );

        require(outputAmount >= minOutput, "Insufficient output");

        routeId = keccak256(
            abi.encodePacked(
                msg.sender,
                fromToken,
                toToken,
                amount,
                block.timestamp
            )
        );

        bridgeRoutes[routeId] = BridgeRoute({
            fromToken: fromToken,
            toToken: toToken,
            amount: amount,
            receiver: receiver,
            minOutput: minOutput,
            executedAt: block.timestamp
        });

        emit BridgeInitiated(routeId, msg.sender, amount, toToken);
        emit BridgeCompleted(routeId, msg.sender, outputAmount);
    }

    function getBridgeRoute(bytes32 routeId)
        external
        view
        returns (BridgeRoute memory)
    {
        return bridgeRoutes[routeId];
    }

    function setLiFiBridge(address newBridge) external onlyOwner {
        lifiBridge = ILiFiBridge(newBridge);
    }
}
