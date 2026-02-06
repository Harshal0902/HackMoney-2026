"use client"

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Bot, Wallet, AlertTriangle, Clock } from "lucide-react";

interface Market {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  timeframes: string[];
}

const markets: Market[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", price: 67432.50, change24h: 2.34, timeframes: ["15m", "1h", "4h"] },
  { id: "eth", name: "Ethereum", symbol: "ETH", price: 3521.80, change24h: -0.87, timeframes: ["15m", "1h", "4h"] },
  { id: "sol", name: "Solana", symbol: "SOL", price: 142.65, change24h: 5.12, timeframes: ["15m", "1h", "4h"] },
  { id: "arb", name: "Arbitrum", symbol: "ARB", price: 1.23, change24h: -2.45, timeframes: ["15m", "1h", "4h"] },
];

interface Position {
  id: string;
  market: string;
  type: "long" | "short";
  entry: number;
  current: number;
  pnl: number;
  pnlPercent: number;
}

const mockPositions: Position[] = [
  { id: "1", market: "BTC", type: "long", entry: 66800, current: 67432.50, pnl: 12.65, pnlPercent: 0.95 },
  { id: "2", market: "ETH", type: "short", entry: 3580, current: 3521.80, pnl: 8.20, pnlPercent: 1.63 },
];

export default function Page() {
  const [selectedMarket, setSelectedMarket] = useState<Market>(markets[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [sessionBalance, setSessionBalance] = useState(52.47);
  const [positions, setPositions] = useState<Position[]>(mockPositions);

  const handleTrade = (direction: "long" | "short") => {
    const newPosition: Position = {
      id: crypto.randomUUID(),
      market: selectedMarket.symbol,
      type: direction,
      entry: selectedMarket.price,
      current: selectedMarket.price,
      pnl: 0,
      pnlPercent: 0,
    };

    setPositions((prev) => [newPosition, ...prev]);

    setSessionBalance((prev) =>
      Math.round((prev + (direction === "long" ? -1 : -1)) * 100) / 100
    );
  };

  return (
    <div>
      <main className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[280px_1fr_320px] gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Markets</h2>
              <div className="space-y-2">
                {markets.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => setSelectedMarket(market)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${selectedMarket.id === market.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/50 hover:bg-secondary"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{market.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">{market.name}</span>
                      </div>
                      <span
                        className={`text-sm font-mono ${market.change24h >= 0 ? "text-success" : "text-destructive"
                          }`}
                      >
                        {market.change24h >= 0 ? "+" : ""}
                        {market.change24h}%
                      </span>
                    </div>
                    <div className="text-lg font-mono mt-1">
                      ${market.price.toLocaleString()}
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
                  <h1 className="text-2xl font-bold">{selectedMarket.symbol}/USDC</h1>
                  <p className="text-muted-foreground">{selectedMarket.name} Prediction</p>
                </div>
                <div className="flex gap-2">
                  {selectedMarket.timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedTimeframe === tf
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center py-8 border-y border-border/50 mb-6">
                <div className="text-5xl font-bold font-mono mb-2">
                  ${selectedMarket.price.toLocaleString()}
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${selectedMarket.change24h >= 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                    }`}
                >
                  {selectedMarket.change24h >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {selectedMarket.change24h >= 0 ? "+" : ""}
                  {selectedMarket.change24h}% (24h)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  variant="success"
                  size="xl"
                  className="flex-col h-auto py-6"
                  onClick={() => handleTrade("long")}
                >
                  <TrendingUp className="w-6 h-6 mb-1" />
                  <span className="text-lg font-bold">LONG</span>
                  <span className="text-xs opacity-70">Price will rise</span>
                </Button>
                <Button
                  variant="destructive"
                  size="xl"
                  className="flex-col h-auto py-6"
                  onClick={() => handleTrade("short")}
                >
                  <TrendingDown className="w-6 h-6 mb-1" />
                  <span className="text-lg font-bold">SHORT</span>
                  <span className="text-xs opacity-70">Price will fall</span>
                </Button>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  ⚡ Every click = instant off-chain update.{" "}
                  <span className="text-primary">No wallet popup. No loading.</span>
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
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Session Balance</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-success">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono">{sessionBalance.toFixed(2)}</span>
                  <span className="text-muted-foreground">USDC</span>
                </div>
                <div className="mt-2 text-sm text-success">+2.47 (4.94%)</div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="font-medium">AI Agent</span>
                  </div>
                  <button
                    onClick={() => setAgentEnabled(!agentEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${agentEnabled ? "bg-primary" : "bg-secondary"
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${agentEnabled ? "left-7" : "left-1"
                        }`}
                    />
                  </button>
                </div>
                {agentEnabled && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-muted-foreground mt-2"
                  >
                    Agent is actively trading on your behalf
                  </motion.p>
                )}
              </div>

              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Open Positions</h3>
                <div className="space-y-2">
                  {positions.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{pos.market}</span>
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded ${pos.type === "long"
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                            }`}
                        >
                          {pos.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono text-sm ${pos.pnl >= 0 ? "text-success" : "text-destructive"
                            }`}
                        >
                          {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pos.pnlPercent >= 0 ? "+" : ""}
                          {pos.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Risk Meter</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-linear-to-r from-success to-primary rounded-full" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Session ends in 2h 34m</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
