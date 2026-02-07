/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Bot,
  Wallet,
  AlertTriangle,
  Clock,
  Zap,
  LogOut,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useWalletSigner } from "@/lib/useWalletSigner";
import { SessionState, Position, Market } from "@/lib/types";
import { MARKETS, getMarketBySymbol, getAllMarkets } from "@/lib/markets";
import {
  fetchMarketPrice,
  fetchMultiplePrices,
  calculatePnL,
} from "@/lib/priceOracle";
import { yellowClient } from "@/lib/yellow";
import { uniswapClient } from "@/lib/uniswap";
import { TradingAgent, AgentLog } from "@/lib/agent";
import {
  prepareSettlement,
  submitSettlement,
} from "@/lib/settlement";
import { ethers } from "ethers";

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

interface PriceCache {
  [symbol: string]: {
    price: number;
    change24h: number;
    timestamp: number;
  };
}

export default function ArenaPage() {
  const { address, isConnected } = useAccount();
  const signer = useWalletSigner();
  const store = useStore();

  const [selectedMarket, setSelectedMarket] = useState<Market>(
    getMarketBySymbol("BTC")!
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION_MS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceCache, setPriceCache] = useState<PriceCache>({});
  const [agent, setAgent] = useState<TradingAgent | null>(null);

  const initializeSession = useCallback(async () => {
    if (!address || !signer) return;

    try {
      setLoading(true);
      setError(null);

      await yellowClient.initialize(address);

      await uniswapClient.initialize(await signer);

      const { sessionId, tx } = await yellowClient.createSession(
        address,
        BigInt(50 * 1e6),
        SESSION_DURATION_MS
      );

      const newSession: SessionState = {
        id: sessionId,
        userId: address,
        balance: BigInt(50 * 1e6),
        initialDeposit: BigInt(50 * 1e6),
        startTime: new Date(),
        sessionDuration: SESSION_DURATION_MS,
        riskLevel: 0,
        positions: [],
        agentEnabled: false,
        chainId: 1,
        settlementPending: false,
        nonce: 0,
      };

      store.setSession(newSession);
      console.log("✅ Session created:", sessionId);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create session";
      setError(errorMsg);
      console.error("Session creation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [address, signer, store]);

  const updatePrices = useCallback(async () => {
    try {
      const markets = getAllMarkets();
      const prices = await fetchMultiplePrices(
        markets.map((m) => m.symbol)
      );

      const cache: PriceCache = {};
      prices.forEach((price) => {
        cache[price.symbol] = {
          price: price.price,
          change24h: price.change24h,
          timestamp: price.timestamp,
        };
      });

      setPriceCache(cache);

      if (store.session) {
        store.session.positions.forEach((pos) => {
          const marketPrice =
            cache[pos.market.symbol]?.price || pos.current;
          const { pnl, pnlPercent } = calculatePnL(
            pos.entry,
            marketPrice,
            pos.type
          );
          store.updatePositionPnL(
            pos.id,
            parseFloat(pnl.toFixed(2)),
            parseFloat(pnlPercent.toFixed(2))
          );
        });
      }
    } catch (err) {
      console.error("Price update failed:", err);
    }
  }, [store]);

  useEffect(() => {
    if (!store.session) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handleSessionEnd();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [store.session]);

  useEffect(() => {
    updatePrices();
    const interval = setInterval(updatePrices, 5000);
    return () => clearInterval(interval);
  }, [updatePrices]);

  useEffect(() => {
    if (address && signer && !store.session && isConnected) {
      initializeSession();
    }
  }, [address, signer, store.session, initializeSession, isConnected]);

  const handleTrade = async (direction: "long" | "short") => {
    if (!store.session || !signer) return;

    try {
      setLoading(true);
      setError(null);

      const marketPrice =
        priceCache[selectedMarket.symbol]?.price || 100;
      const size = BigInt(1 * 1e6);

      const intentHash = ethers.solidityPackedKeccak256(
        [
          "string",
          "address",
          "uint8",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          store.session.id,
          selectedMarket.address,
          direction === "long" ? 0 : 1,
          size,
          Math.floor(Date.now() / 1000),
          store.session.nonce,
        ]
      );

      const signature = await (await signer).signMessage(
        ethers.getBytes(intentHash)
      );

      await yellowClient.submitTradeIntent(
        {
          sessionId: store.session.id,
          market: selectedMarket,
          type: direction,
          size,
          timestamp: Math.floor(Date.now() / 1000),
          nonce: store.session.nonce,
        },
        signature
      );

      const newPosition: Position = {
        id: `pos_${crypto.randomUUID()}`,
        market: selectedMarket,
        type: direction,
        entry: marketPrice,
        current: marketPrice,
        pnl: 0,
        pnlPercent: 0,
        createdAt: new Date(),
        size,
      };

      store.addPosition(newPosition);

      const newBalance = store.session.balance - BigInt(1000);
      store.updateBalance(newBalance);

      console.log(
        `✅ ${direction.toUpperCase()} position opened on ${selectedMarket.symbol}`
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Trade failed";
      setError(errorMsg);
      console.error("Trade execution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (positionId: string) => {
    if (!store.session) return;

    try {
      const position = store.session.positions.find(
        (p) => p.id === positionId
      );
      if (!position) return;

      const realizedPnL = BigInt(
        Math.floor(position.pnl * 1e6)
      );
      store.updateBalance(store.session.balance + realizedPnL);
      store.removePosition(positionId);

      console.log(
        `✅ Position closed with P&L: ${position.pnl.toFixed(2)}`
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Close failed";
      setError(errorMsg);
    }
  };

  const toggleAgent = useCallback(() => {
    if (!store.session) return;

    if (!store.session.agentEnabled && !agent) {
      const newAgent = new TradingAgent(
        {
          strategy: "trend_follow",
          maxTrades: 10,
          maxDrawdown: 5,
          sessionId: store.session.id,
          userAddress: address!,
        },
        store.session
      );

      newAgent.setCallbacks(undefined, undefined);

      newAgent.start();
      setAgent(newAgent);
      store.setAgentEnabled(true);
      console.log("🤖 AI Agent activated");
    } else if (agent) {
      agent.stop();
      setAgent(null);
      store.setAgentEnabled(false);
      console.log("🤖 AI Agent stopped");
    }
  }, [store.session, agent, store, address]);

  const handleSessionEnd = async () => {
    if (!store.session || !signer || store.session.settlementPending)
      return;

    try {
      setLoading(true);
      store.setSettlementPending(true);

      if (agent) {
        agent.stop();
      }

      const settlement = await prepareSettlement(
        store.session,
        address!
      );

      const txHash = await submitSettlement(settlement);

      console.log("✅ Session settled on-chain:", txHash);

      store.setSession({
        ...store.session,
        positions: [],
        balance: store.session.initialDeposit,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Settlement failed";
      setError(errorMsg);
      console.error("Settlement failed:", err);
      store.setSettlementPending(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            OneSet Arena
          </h1>
          <p className="text-slate-400 mb-8">
            Connect your wallet to start trading
          </p>
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  if (!store.session) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
          <p className="text-slate-400 mt-4">Initializing session...</p>
        </motion.div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const totalPnL =
    store.session.positions.reduce((sum, p) => sum + p.pnl, 0) +
    (Number(store.session.initialDeposit) -
      Number(store.session.balance)) /
    1e6;

  const riskLevel = Math.min(
    100,
    Math.floor(
      (store.session.positions.length * 20 +
        Math.max(
          0,
          Math.min(
            100,
            (totalPnL /
              (Number(store.session.initialDeposit) / 1e6)) *
            100
          )
        )) /
      3
    )
  );

  const currentMarketPrice =
    priceCache[selectedMarket.symbol]?.price || 0;
  const currentMarketChange =
    priceCache[selectedMarket.symbol]?.change24h || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  OneSet Arena
                </h1>
                <p className="text-slate-400">
                  Session {store.session.id.slice(-8)} • Live
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-[280px_1fr_320px] gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <h2 className="text-sm font-medium text-slate-400 mb-4">
                Markets
              </h2>
              <div className="space-y-2">
                {getAllMarkets().map((market) => (
                  <button
                    key={market.id}
                    onClick={() => setSelectedMarket(market)}
                    disabled={loading}
                    className={`w-full p-3 rounded-lg text-left transition-all
                      ${selectedMarket.id === market.id
                        ? "bg-blue-500/20 border border-blue-400/50"
                        : "bg-slate-700/50 hover:bg-slate-700"
                      }
                      ${loading ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">
                          {market.symbol}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {market.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-mono ${(priceCache[market.symbol]?.change24h ||
                          0) >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                          }`}
                      >
                        {(priceCache[market.symbol]?.change24h ||
                          0) >= 0
                          ? "+"
                          : ""}
                        {(
                          priceCache[market.symbol]?.change24h || 0
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                    <div className="text-lg font-mono text-white mt-1">
                      $
                      {(
                        priceCache[market.symbol]?.price || 0
                      ).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {selectedMarket.symbol}/USDC
                  </h1>
                  <p className="text-slate-400">
                    {selectedMarket.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  {["15m", "1h", "4h"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors
                        ${selectedTimeframe === tf
                          ? "bg-blue-500 text-white"
                          : "bg-slate-700 text-slate-300 hover:text-white"
                        }
                      `}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center py-8 border-y border-slate-700/50 mb-6">
                <div className="text-5xl font-bold font-mono text-white mb-2">
                  $
                  {currentMarketPrice.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1
                    rounded-full text-sm
                    ${currentMarketChange >= 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                    }
                  `}
                >
                  {currentMarketChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {currentMarketChange >= 0 ? "+" : ""}
                  {currentMarketChange.toFixed(2)}% (24h)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  onClick={() => handleTrade("long")}
                  disabled={loading}
                  className="flex-col h-auto py-6 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-6 h-6 mb-1" />
                  <span className="text-lg font-bold">LONG</span>
                  <span className="text-xs opacity-70">
                    Price will rise
                  </span>
                </Button>
                <Button
                  onClick={() => handleTrade("short")}
                  disabled={loading}
                  className="flex-col h-auto py-6 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingDown className="w-6 h-6 mb-1" />
                  <span className="text-lg font-bold">SHORT</span>
                  <span className="text-xs opacity-70">
                    Price will fall
                  </span>
                </Button>
              </div>

              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-300">
                  <span className="text-blue-400 font-semibold">
                    🟡 Yellow Network
                  </span>
                  {" • "}
                  Every click = instant off-chain update.{" "}
                  <span className="text-blue-300">
                    No wallet popup. No loading.
                  </span>
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      Session Balance
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-white">
                    {(
                      Number(store.session.balance) / 1e6
                    ).toFixed(2)}
                  </span>
                  <span className="text-slate-400">USDC</span>
                </div>
                <div
                  className={`mt-2 text-sm ${totalPnL >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                    }`}
                >
                  {totalPnL >= 0 ? "+" : ""}
                  {totalPnL.toFixed(2)} (
                  {(
                    (totalPnL /
                      (Number(store.session.initialDeposit) /
                        1e6)) *
                    100
                  ).toFixed(2)}
                  %)
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">
                      AI Agent
                    </span>
                  </div>
                  <button
                    onClick={toggleAgent}
                    disabled={loading}
                    className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50
                      ${store.session.agentEnabled
                        ? "bg-blue-500"
                        : "bg-slate-700"
                      }
                    `}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${store.session.agentEnabled
                          ? "left-7"
                          : "left-1"
                        }
                      `}
                    />
                  </button>
                </div>
                {store.session.agentEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    className="text-xs text-slate-400 mt-2 space-y-1"
                  >
                    <p>✓ Agent active</p>
                    <p>Risk limit: {riskLevel}/100</p>
                  </motion.div>
                )}
              </div>

              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">
                  Open Positions ({store.session.positions.length})
                </h3>
                {store.session.positions.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No open positions
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {store.session.positions.map((pos) => (
                      <motion.div
                        key={pos.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => closePosition(pos.id)}
                        className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-slate-700 transition-colors"
                      >
                        <div>
                          <span className="font-medium text-white">
                            {pos.market.symbol}
                          </span>
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded
                              ${pos.type === "long"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                              }
                            `}
                          >
                            {pos.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-mono text-sm ${pos.pnl >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                              }`}
                          >
                            {pos.pnl >= 0 ? "+" : ""}
                            ${pos.pnl.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {pos.pnlPercent >= 0 ? "+" : ""}
                            {pos.pnlPercent.toFixed(2)}%
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">
                    Risk Meter
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all
                      ${riskLevel < 30
                        ? "bg-emerald-500"
                        : riskLevel < 70
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }
                    `}
                    style={{
                      width: `${Math.min(100, riskLevel * 1.5)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
