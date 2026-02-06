"use client"

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Settings, TrendingUp, TrendingDown, Activity, Shield, BarChart3, Power } from "lucide-react";

type StrategyType = "trend_follow" | "mean_reversion" | "momentum";
type LogType = "trade" | "info" | "warning";

interface AgentLog {
  id: string;
  type: LogType;
  message: string;
  timestamp: Date;
  pnl?: number;
}

const strategyOptions = [
  { id: "trend_follow" as const, name: "Trend Following", description: "Follow market momentum" },
  { id: "mean_reversion" as const, name: "Mean Reversion", description: "Trade price corrections" },
  { id: "momentum" as const, name: "Momentum", description: "Capture strong moves" },
];

export default function Page() {
  const [agentActive, setAgentActive] = useState(false);
  const [strategy, setStrategy] = useState<StrategyType>("trend_follow");
  const [maxTrades, setMaxTrades] = useState(10);
  const [maxDrawdown, setMaxDrawdown] = useState(5);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [tradesExecuted, setTradesExecuted] = useState(0);

  useEffect(() => {
    if (!agentActive) return;

    const interval = setInterval(() => {
      const actions = [
        {
          type: "trade" as const, messages: [
            { msg: "Opened BTC long position", pnl: null },
            { msg: "Closed ETH short (+$1.24)", pnl: 1.24 },
            { msg: "Opened SOL long position", pnl: null },
            { msg: "Closed BTC long (+$2.15)", pnl: 2.15 },
            { msg: "Closed position (-$0.45)", pnl: -0.45 },
          ]
        },
        {
          type: "info" as const, messages: [
            { msg: "Analyzing market conditions...", pnl: null },
            { msg: "Trend signal detected on ETH", pnl: null },
            { msg: "Momentum building on BTC", pnl: null },
          ]
        },
      ];

      const category = actions[Math.floor(Math.random() * actions.length)];
      const action = category.messages[Math.floor(Math.random() * category.messages.length)];

      const newLog: AgentLog = {
        id: Date.now().toString(),
        type: category.type,
        message: action.msg,
        timestamp: new Date(),
        pnl: action.pnl ?? undefined,
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 50));

      if (action.pnl) {
        setTotalPnL((prev) => Math.round((prev + action.pnl!) * 100) / 100);
        setTradesExecuted((prev) => prev + 1);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [agentActive]);

  const toggleAgent = () => {
    if (!agentActive) {
      setLogs([{
        id: Date.now().toString(),
        type: "info",
        message: `Agent started with ${strategyOptions.find(s => s.id === strategy)?.name} strategy`,
        timestamp: new Date(),
      }]);
    }
    setAgentActive(!agentActive);
  };

  return (
    <div>
      <main className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">AI Trading</span> Agent
            </h1>
            <p className="text-muted-foreground">
              Let AI execute trades on your behalf with customizable strategies and risk parameters.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${agentActive ? "bg-success/20" : "bg-secondary"
                      }`}>
                      <Bot className={`w-6 h-6 ${agentActive ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h2 className="font-semibold">Agent Status</h2>
                      <p className={`text-sm ${agentActive ? "text-success" : "text-muted-foreground"}`}>
                        {agentActive ? "Active - Trading" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={agentActive ? "destructive" : "success"}
                    size="lg"
                    onClick={toggleAgent}
                    className="gap-2"
                  >
                    <Power className="w-5 h-5" />
                    {agentActive ? "Stop Agent" : "Start Agent"}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold font-mono">{tradesExecuted}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <BarChart3 className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <div className={`text-2xl font-bold font-mono ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
                      {totalPnL >= 0 ? "+" : ""}{totalPnL.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">P&L (USDC)</div>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg text-center">
                    <Shield className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold font-mono">{maxDrawdown}%</div>
                    <div className="text-xs text-muted-foreground">Max Drawdown</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Strategy</h2>
                </div>
                <div className="grid gap-3">
                  {strategyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStrategy(opt.id)}
                      disabled={agentActive}
                      className={`p-4 rounded-lg text-left transition-all ${strategy === opt.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary/50 hover:bg-secondary border border-transparent"
                        } ${agentActive ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="font-medium">{opt.name}</div>
                      <div className="text-sm text-muted-foreground">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Risk Parameters</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Max Trades per Session</span>
                      <span className="font-mono">{maxTrades}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={maxTrades}
                      onChange={(e) => setMaxTrades(Number(e.target.value))}
                      disabled={agentActive}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Max Drawdown %</span>
                      <span className="font-mono">{maxDrawdown}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={maxDrawdown}
                      onChange={(e) => setMaxDrawdown(Number(e.target.value))}
                      disabled={agentActive}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 flex flex-col h-150"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Live Activity</h2>
                {agentActive && (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Recording
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Start the agent to see activity logs</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg text-sm ${log.type === "trade"
                        ? "bg-primary/10 border-l-2 border-primary"
                        : log.type === "warning"
                          ? "bg-destructive/10 border-l-2 border-destructive"
                          : "bg-secondary/50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {log.type === "trade" ? (
                            log.pnl && log.pnl > 0 ? (
                              <TrendingUp className="w-4 h-4 text-success shrink-0" />
                            ) : log.pnl && log.pnl < 0 ? (
                              <TrendingDown className="w-4 h-4 text-destructive shrink-0" />
                            ) : (
                              <Activity className="w-4 h-4 text-primary shrink-0" />
                            )
                          ) : (
                            <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span>{log.message}</span>
                        </div>
                        {log.pnl !== undefined && (
                          <span className={`font-mono text-xs shrink-0 ${log.pnl >= 0 ? "text-success" : "text-destructive"
                            }`}>
                            {log.pnl >= 0 ? "+" : ""}${log.pnl.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.timestamp.toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
