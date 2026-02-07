// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract YellowSafe is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct Session {
        address user;
        uint256 balance;
        uint256 initialDeposit;
        uint256 startTime;
        uint256 endTime;
        uint256 maxLoss;
        bool agentEnabled;
        bool settled;
        uint256 nonce;
    }

    struct TradeIntent {
        string sessionId;
        address tokenIn;
        address tokenOut;
        uint256 amount;
        uint8 tradeType;
        uint256 timestamp;
        uint256 nonce;
        bytes signature;
    }

    struct Settlement {
        string sessionId;
        uint256 finalBalance;
        uint256 totalPnL;
        bytes signature;
        bool executed;
    }

    IERC20 public USDC;
    address public yellowOperator;
    uint256 public minDeposit = 1e5;

    mapping(string => Session) public sessions;
    mapping(string => uint256) public sessionBalances;
    mapping(string => TradeIntent[]) public sessionTrades;
    mapping(string => Settlement) public settlements;
    mapping(address => string[]) public userSessions;

    event SessionCreated(
        string indexed sessionId,
        address indexed user,
        uint256 balance,
        uint256 endTime
    );

    event TradeIntentSubmitted(
        string indexed sessionId,
        address indexed user,
        uint256 amount,
        uint8 tradeType
    );

    event SessionSettled(
        string indexed sessionId,
        address indexed user,
        uint256 finalBalance,
        uint256 pnl
    );

    event BalanceUpdated(
        string indexed sessionId,
        uint256 newBalance
    );

    modifier onlyValidSession(string memory sessionId) {
        require(sessions[sessionId].user != address(0), "Invalid session");
        require(block.timestamp < sessions[sessionId].endTime, "Session expired");
        require(!sessions[sessionId].settled, "Already settled");
        _;
    }

    modifier onlySessionOwner(string memory sessionId) {
        require(msg.sender == sessions[sessionId].user, "Not session owner");
        _;
    }

    constructor(address _usdc) {
        USDC = IERC20(_usdc);
        yellowOperator = msg.sender;
    }

    function createSession(
        string memory sessionId,
        uint256 amount,
        uint256 duration,
        uint256 maxLoss,
        bool enableAgent
    ) external nonReentrant {
        require(amount >= minDeposit, "Deposit too small");
        require(duration > 0, "Invalid duration");
        require(sessions[sessionId].user == address(0), "Session exists");

        require(
            USDC.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        sessions[sessionId] = Session({
            user: msg.sender,
            balance: amount,
            initialDeposit: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            maxLoss: maxLoss,
            agentEnabled: enableAgent,
            settled: false,
            nonce: 0
        });

        sessionBalances[sessionId] = amount;
        userSessions[msg.sender].push(sessionId);

        emit SessionCreated(
            sessionId,
            msg.sender,
            amount,
            block.timestamp + duration
        );
    }

    function submitTradeIntent(
        TradeIntent memory intent
    ) external onlyValidSession(intent.sessionId) {
        Session storage session = sessions[intent.sessionId];
        require(msg.sender == session.user, "Unauthorized");
        require(intent.nonce == session.nonce, "Invalid nonce");

        bytes32 intentHash = keccak256(
            abi.encodePacked(
                intent.sessionId,
                intent.tokenIn,
                intent.tokenOut,
                intent.amount,
                intent.tradeType,
                intent.timestamp,
                intent.nonce
            )
        );

        require(
            _recoverSigner(intentHash, intent.signature) == session.user,
            "Invalid signature"
        );

        sessionTrades[intent.sessionId].push(intent);
        session.nonce++;

        emit TradeIntentSubmitted(
            intent.sessionId,
            session.user,
            intent.amount,
            intent.tradeType
        );
    }

    function updateBalance(
        string memory sessionId,
        uint256 newBalance
    ) external {
        require(msg.sender == yellowOperator, "Unauthorized");
        require(sessions[sessionId].user != address(0), "Invalid session");

        Session storage session = sessions[sessionId];
        session.balance = newBalance;
        sessionBalances[sessionId] = newBalance;

        emit BalanceUpdated(sessionId, newBalance);
    }

    function settleSession(
        string memory sessionId,
        uint256 finalBalance,
        bytes memory signature
    ) external nonReentrant onlyValidSession(sessionId) onlySessionOwner(sessionId) {
        Session storage session = sessions[sessionId];
        require(!settlements[sessionId].executed, "Already settled");

        bytes32 settlementHash = keccak256(
            abi.encodePacked(sessionId, finalBalance, block.timestamp)
        );

        require(
            _recoverSigner(settlementHash, signature) == session.user,
            "Invalid settlement signature"
        );

        int256 pnl = int256(finalBalance) - int256(session.initialDeposit);

        if (pnl < 0) {
            uint256 loss = uint256(-pnl);
            uint256 maxAllowedLoss =
                (session.initialDeposit * session.maxLoss) / 10000;
            require(loss <= maxAllowedLoss, "Loss exceeds max drawdown");
        }

        session.settled = true;
        settlements[sessionId] = Settlement({
            sessionId: sessionId,
            finalBalance: finalBalance,
            totalPnL: finalBalance >= session.initialDeposit
                ? finalBalance - session.initialDeposit
                : 0,
            signature: signature,
            executed: true
        });

        require(
            USDC.transfer(session.user, finalBalance),
            "Withdrawal failed"
        );

        emit SessionSettled(
            sessionId,
            session.user,
            finalBalance,
            pnl
        );
    }

    function emergencyWithdraw(string memory sessionId) external {
        Session storage session = sessions[sessionId];
        require(msg.sender == session.user, "Not session owner");
        require(block.timestamp > session.endTime, "Session not expired");
        require(!session.settled, "Already settled");

        session.settled = true;

        require(
            USDC.transfer(session.user, session.balance),
            "Withdrawal failed"
        );
    }

    function getSession(string memory sessionId)
        external
        view
        returns (Session memory)
    {
        return sessions[sessionId];
    }

    function getSessionTrades(string memory sessionId)
        external
        view
        returns (TradeIntent[] memory)
    {
        return sessionTrades[sessionId];
    }

    function getUserSessions(address user)
        external
        view
        returns (string[] memory)
    {
        return userSessions[user];
    }

    function _recoverSigner(bytes32 hash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        return messageHash.recover(signature);
    }

    function setOperator(address newOperator) external onlyOwner {
        yellowOperator = newOperator;
    }

    function setMinDeposit(uint256 newMinDeposit) external onlyOwner {
        minDeposit = newMinDeposit;
    }
}
