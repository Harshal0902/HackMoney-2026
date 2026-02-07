// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import "@uniswap/v4-core/contracts/libraries/FixedPoint128.sol";
import "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import "@uniswap/v4-core/contracts/PoolManager.sol";

contract OneSetHook {
    using Hooks for bytes32;

    IPoolManager public immutable poolManager;
    address public yellowSafe;

    mapping(address => uint256) public maxRiskPercentage;
    mapping(address => uint256) public maxPositionSize;
    mapping(bytes32 => uint256) public poolExposure;

    struct StrategyConfig {
        uint8 strategyType;
        uint256 minSignalStrength;
        uint256 executionThreshold;
    }

    mapping(address => StrategyConfig) public strategyConfigs;

    event RiskLimitExceeded(address indexed user, uint256 exposure, uint256 limit);
    event StrategyExecuted(
        address indexed user,
        uint8 strategyType,
        uint256 amount
    );

    constructor(address _poolManager, address _yellowSafe) {
        poolManager = IPoolManager(_poolManager);
        yellowSafe = _yellowSafe;
    }

    function beforeSwap(
        address sender,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external view returns (bytes4) {
        (uint256 riskLimit, uint256 slippage) = abi.decode(
            hookData,
            (uint256, uint256)
        );

        bytes32 poolId = getPoolId(params.key);
        uint256 currentExposure = poolExposure[poolId];

        uint256 swapAmount = params.amountSpecified > 0
            ? uint256(params.amountSpecified)
            : uint256(-params.amountSpecified);

        uint256 newExposure = currentExposure + swapAmount;

        require(
            newExposure <= (riskLimit * 100),
            "Risk limit exceeded"
        );

        require(slippage <= 500, "Slippage too high");

        return this.beforeSwap.selector;
    }

    function afterSwap(
        address sender,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external returns (bytes4) {
        bytes32 poolId = getPoolId(params.key);
        uint256 swapAmount = delta.amount0() > 0
            ? uint256(delta.amount0())
            : uint256(delta.amount1());

        poolExposure[poolId] += swapAmount;

        emit StrategyExecuted(sender, 0, swapAmount);

        return this.afterSwap.selector;
    }

    function setRiskParameters(
        address user,
        uint256 riskPercentage,
        uint256 positionSize
    ) external {
        require(msg.sender == yellowSafe, "Unauthorized");
        maxRiskPercentage[user] = riskPercentage;
        maxPositionSize[user] = positionSize;
    }

    function setStrategy(
        address user,
        uint8 strategyType,
        uint256 minSignalStrength,
        uint256 executionThreshold
    ) external {
        require(msg.sender == yellowSafe, "Unauthorized");
        strategyConfigs[user] = StrategyConfig({
            strategyType: strategyType,
            minSignalStrength: minSignalStrength,
            executionThreshold: executionThreshold
        });
    }

    function getPoolId(IPoolManager.PoolKey memory key)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(key));
    }

    function getHookPermissions() external pure returns (bytes16) {
        return
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_SETTLE_FLAG;
    }
}
