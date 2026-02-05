# OneSet

**One deposit. Infinite actions. One settlement.**

OneSet is a session-based trading and prediction application that enables instant, gasless user and AI-agent interactions off-chain, with secure on-chain settlement only once at the end of a session. Built using **Yellow Network**, **Uniswap v4**, and **LI.FI**, OneSet delivers Web2-like speed while preserving Web3 security and verifiability.

## 🧠 Problem

Modern on-chain trading and prediction apps suffer from fundamental UX and cost issues:

- Every interaction requires a blockchain transaction
- High gas fees make micro-transactions impractical
- Latency breaks real-time trading and agent-driven strategies
- AI agents cannot safely execute frequent actions on-chain

As a result, many high-frequency or session-based financial interactions are either impossible or economically inefficient on-chain.

## 💡 Solution

**OneSet** introduces a session-based model for DeFi interactions:

- Users deposit funds **once**
- Perform **unlimited instant actions off-chain** (trades, predictions, agent execution)
- Settle the **net result on-chain only once** when the session ends

This approach dramatically reduces gas costs, improves UX, and enables entirely new classes of applications such as AI-driven trading and micro-markets.

## ⚙️ How It Works

### 1. Create a Session (On-chain)

- User connects their wallet
- Deposits USDC into a Yellow smart contract safe
- A session key is generated with scoped permissions (balance, duration, risk limits)

### 2. Instant Off-Chain Actions

- Trades, predictions, and agent actions happen off-chain
- Each action updates the session state instantly
- No gas, no wallet popups, no waiting

### 3. Net Settlement (On-chain)

- When the session ends, the final signed state is submitted
- Smart contracts verify correctness
- Net balances are settled on-chain in a single transaction

## 🟡 Yellow Network Integration

Yellow Network is the **core execution layer** of OneSet.

We use Yellow’s **state channels and session keys** to:

- Enable real-time, gasless interactions
- Support session-based spending limits
- Secure off-chain balances with cryptographic guarantees
- Compress dozens of actions into a single on-chain settlement

Without Yellow, OneSet would not be possible.

## 🦄 Uniswap v4 – Agentic Settlement Layer

Uniswap v4 is used for **final execution and price discovery**, not for every interaction.

In OneSet:

- Trades are simulated and netted off-chain during a session
- Only the final net position is executed on-chain via Uniswap v4

### Agentic Finance

- AI agents make decisions off-chain in real time
- Hooks are used to enforce:

  - Slippage limits
  - Risk constraints
  - Execution conditions
- Execution remains transparent, verifiable, and safe

This design cleanly qualifies OneSet as an **Agentic Finance** application.

## 🌉 LI.FI – Cross-Chain Entry & AI Execution

OneSet is chain-agnostic by design.

Using **LI.FI**, we enable:

- Deposits from any EVM chain
- Swap + bridge + deposit in a single flow
- Seamless capital movement for users and AI agents

AI agents can also use LI.FI programmatically to rebalance or route capital across chains before final settlement.

## 🤖 AI Agents in OneSet

Users can optionally enable AI agents within a session.

Agents:

- Operate under strict session constraints
- Execute trades or predictions off-chain
- Are transparent and deterministic
- Settle results on-chain only once

This makes OneSet ideal for experimenting with **safe, bounded, agent-driven finance**.

## 🔄 User Flow

1. Open OneSet
2. Connect wallet
3. Create a session and deposit once
4. Trade or predict instantly (off-chain)
5. Optionally enable an AI agent
6. End session
7. Final settlement on-chain

## 🧪 Why OneSet Is Unique

- **Web2-speed UX with Web3 security**
- Enables micro-transactions and rapid iteration
- Designed for AI-native financial interactions
- Reduces gas costs by orders of magnitude
- Clean separation of off-chain execution and on-chain truth

## 🏆 HackMoney 2026 Submission

This project is submitted under the following tracks:

- 🚀 Yellow Network – SDK Integration
- 🤖 Uniswap v4 – Agentic Finance
- 🥈 LI.FI – AI Smart App

## 🚀 Future Scope

- Advanced agent strategies
- Multi-user shared sessions
- On-chain reputation for agents
- Expanded market types
- Solana support via Yellow
