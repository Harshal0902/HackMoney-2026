/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Bot, Settings, TrendingUp, TrendingDown, Activity, Shield, BarChart3, Power, AlertCircle } from "lucide-react";

import TradingAgentV2, {
  StrategyType,
  AgentLog,
} from '@/lib/agent';

const strategyOptions = [
  {
    id: 'trend_follow' as const,
    name: 'Trend Following',
    description: 'Follow market momentum',
  },
  {
    id: 'mean_reversion' as const,
    name: 'Mean Reversion',
    description: 'Trade price corrections',
  },
  {
    id: 'momentum' as const,
    name: 'Momentum',
    description: 'Capture strong moves',
  },
];

export default function AgentPage() {
  const { address } = useAccount();
  const store = useStore();
  const session = store.session;

  const [agentActive, setAgentActive] = useState(false);
  const [strategy, setStrategy] = useState<StrategyType>(
    'trend_follow'
  );
  const [maxTrades, setMaxTrades] = useState(10);
  const [maxDrawdown, setMaxDrawdown] = useState(5);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [tradesExecuted, setTradesExecuted] = useState(0);
  const [agent, setAgent] = useState<TradingAgentV2 | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const initializeAgent = useCallback(async () => {
    if (!session || !address) return;

    try {
      setError(null);

      const agentInstance = new TradingAgentV2(
        {
          strategy,
          maxTrades,
          maxDrawdown,
          sessionId: session.id,
          userAddress: address,
        },
        session
      );

      agentInstance.setCallbacks(
        (newLogs) => setLogs(newLogs),
        (stats) => {
          setTradesExecuted(stats.tradesExecuted);
          setTotalPnL(
            Math.round(stats.totalPnL * 100) / 100
          );
        }
      );

      setAgent(agentInstance);
      return agentInstance;
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to initialize agent';
      setError(errorMsg);
      console.error('Agent initialization failed:', err);
      return null;
    }
  }, [session, address, strategy, maxTrades, maxDrawdown]);

  const toggleAgent = useCallback(async () => {
    try {
      setError(null);

      if (agentActive && agent) {
        await agent.stop();
        setAgentActive(false);
      } else {
        let agentInstance = agent;

        if (!agentInstance) {
          // @ts-expect-error
          agentInstance = await initializeAgent();
          if (!agentInstance) return;
        }

        await agentInstance.start();
        setAgent(agentInstance);
        setAgentActive(true);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to toggle agent';
      setError(errorMsg);
      console.error('Toggle agent failed:', err);
    }
  }, [agentActive, agent, initializeAgent]);

  useEffect(() => {
    return () => {
      if (agent && agentActive) {
        agent.stop();
      }
    };
  }, [agent, agentActive]);

  if (!session) {
    return (
      <div className='min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center'
        >
          <h1 className='text-3xl font-bold text-white mb-4'>
            AI Trading Agent
          </h1>
          <p className='text-slate-400 mb-4'>
            Create a session first to use the AI agent
          </p>
          <Button asChild>
            <a href='/arena'>Go to Arena</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900'>
      <main className='py-8 px-4'>
        <div className='max-w-6xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-8'
          >
            <h1 className='text-4xl font-bold text-white mb-2'>
              <span className='text-blue-400'>AI Trading</span>{' '}
              Agent
            </h1>
            <p className='text-slate-400'>
              Let AI execute trades on your behalf with
              customizable strategies and risk parameters.
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400'
            >
              <AlertCircle className='w-5 h-5 shrink-0 mt-0.5' />
              <div>
                <p className='font-medium'>Error</p>
                <p className='text-sm'>{error}</p>
              </div>
            </motion.div>
          )}

          <div className='grid lg:grid-cols-[1fr_400px] gap-6'>
            <div className='space-y-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='glass-card p-6 bg-slate-800/50 border border-slate-700'
              >
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${agentActive
                        ? 'bg-emerald-500/20 animate-pulse'
                        : 'bg-slate-700'
                        }`}
                    >
                      <Bot
                        className={`w-6 h-6 ${agentActive
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                          }`}
                      />
                    </div>
                    <div>
                      <h2 className='font-semibold text-white'>
                        Agent Status
                      </h2>
                      <p
                        className={`text-sm ${agentActive
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                          }`}
                      >
                        {agentActive
                          ? 'Active - Trading'
                          : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={toggleAgent}
                    className={`gap-2 ${agentActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                      } text-white`}
                  >
                    <Power className='w-5 h-5' />
                    {agentActive
                      ? 'Stop Agent'
                      : 'Start Agent'}
                  </Button>
                </div>

                <div className='grid grid-cols-3 gap-4'>
                  <div className='p-4 bg-slate-700/50 rounded-lg text-center border border-slate-600'>
                    <Activity className='w-5 h-5 mx-auto mb-2 text-blue-400' />
                    <div className='text-2xl font-bold font-mono text-white'>
                      {tradesExecuted}
                    </div>
                    <div className='text-xs text-slate-400'>
                      Trades
                    </div>
                  </div>
                  <div className='p-4 bg-slate-700/50 rounded-lg text-center border border-slate-600'>
                    <BarChart3 className='w-5 h-5 mx-auto mb-2 text-blue-400' />
                    <div
                      className={`text-2xl font-bold font-mono ${totalPnL >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                        }`}
                    >
                      {totalPnL >= 0 ? '+' : ''}
                      {totalPnL.toFixed(2)}
                    </div>
                    <div className='text-xs text-slate-400'>
                      P&L (USDC)
                    </div>
                  </div>
                  <div className='p-4 bg-slate-700/50 rounded-lg text-center border border-slate-600'>
                    <Shield className='w-5 h-5 mx-auto mb-2 text-blue-400' />
                    <div className='text-2xl font-bold font-mono text-white'>
                      {maxDrawdown}%
                    </div>
                    <div className='text-xs text-slate-400'>
                      Max Drawdown
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='glass-card p-6 bg-slate-800/50 border border-slate-700'
              >
                <div className='flex items-center gap-2 mb-4'>
                  <Settings className='w-5 h-5 text-blue-400' />
                  <h2 className='font-semibold text-white'>
                    Strategy
                  </h2>
                </div>
                <div className='grid gap-3'>
                  {strategyOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStrategy(opt.id)}
                      disabled={agentActive}
                      className={`p-4 rounded-lg text-left transition-all border ${strategy === opt.id
                        ? 'bg-blue-500/20 border-blue-400/50'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                        } ${agentActive
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                        }`}
                    >
                      <div className='font-medium text-white'>
                        {opt.name}
                      </div>
                      <div className='text-sm text-slate-400'>
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='glass-card p-6 bg-slate-800/50 border border-slate-700'
              >
                <div className='flex items-center gap-2 mb-4'>
                  <Shield className='w-5 h-5 text-blue-400' />
                  <h2 className='font-semibold text-white'>
                    Risk Parameters
                  </h2>
                </div>
                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-slate-300'>
                        Max Trades per Session
                      </span>
                      <span className='font-mono text-white'>
                        {maxTrades}
                      </span>
                    </div>
                    <input
                      type='range'
                      min='1'
                      max='50'
                      value={maxTrades}
                      onChange={(e) =>
                        setMaxTrades(Number(e.target.value))
                      }
                      disabled={agentActive}
                      className='w-full accent-blue-500 disabled:opacity-50'
                    />
                    <div className='text-xs text-slate-400 mt-1'>
                      1 - 50 trades
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-slate-300'>
                        Max Drawdown
                      </span>
                      <span className='font-mono text-white'>
                        {maxDrawdown}%
                      </span>
                    </div>
                    <input
                      type='range'
                      min='1'
                      max='25'
                      value={maxDrawdown}
                      onChange={(e) =>
                        setMaxDrawdown(Number(e.target.value))
                      }
                      disabled={agentActive}
                      className='w-full accent-blue-500 disabled:opacity-50'
                    />
                    <div className='text-xs text-slate-400 mt-1'>
                      1% - 25% loss tolerance
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='glass-card p-4 bg-slate-800/50 border border-slate-700 h-fit lg:h-150 flex flex-col'
            >
              <div className='flex items-center justify-between mb-4'>
                <h2 className='font-semibold text-white'>
                  Live Activity
                </h2>
                {agentActive && (
                  <span className='flex items-center gap-1 text-xs text-emerald-400'>
                    <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
                    Recording
                  </span>
                )}
              </div>
              <div className='flex-1 overflow-y-auto space-y-2 pr-2'>
                {logs.length === 0 ? (
                  <div className='text-center text-slate-400 py-8 flex flex-col items-center justify-center'>
                    <Bot className='w-12 h-12 mb-3 opacity-20' />
                    <p className='text-sm'>
                      {agentActive
                        ? 'Awaiting signals...'
                        : 'Start the agent to see activity logs'}
                    </p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg text-sm border-l-2 ${log.type === 'trade'
                        ? 'bg-blue-500/10 border-l-blue-500'
                        : log.type === 'warning'
                          ? 'bg-red-500/10 border-l-red-500'
                          : 'bg-slate-700/50 border-l-slate-600'
                        }`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-center gap-2 flex-1'>
                          {log.type === 'trade' ? (
                            log.pnl && log.pnl > 0 ? (
                              <TrendingUp className='w-4 h-4 text-emerald-400 shrink-0' />
                            ) : log.pnl && log.pnl < 0 ? (
                              <TrendingDown className='w-4 h-4 text-red-400 shrink-0' />
                            ) : (
                              <Activity className='w-4 h-4 text-blue-400 shrink-0' />
                            )
                          ) : (
                            <Bot className='w-4 h-4 text-slate-400 shrink-0' />
                          )}
                          <span className='text-slate-200'>
                            {log.message}
                          </span>
                        </div>
                        {log.pnl !== undefined && (
                          <span
                            className={`font-mono text-xs shrink-0 ${log.pnl >= 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                              }`}
                          >
                            {log.pnl >= 0 ? '+' : ''}
                            ${log.pnl.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className='text-xs text-slate-500 mt-1'>
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
  );
}
