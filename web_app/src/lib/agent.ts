/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SessionState } from './types';
import { calculatePnL } from './priceOracle';
import { yellowClient } from './yellow';

export type StrategyType = 'trend_follow' | 'mean_reversion' | 'momentum';
export type LogType = 'trade' | 'info' | 'warning';

export interface AgentLog {
    id: string;
    type: LogType;
    message: string;
    timestamp: Date;
    pnl?: number;
}

export interface AgentConfig {
    strategy: StrategyType;
    maxTrades: number;
    maxDrawdown: number;
    sessionId: string;
    userAddress: string;
}

interface MarketSignal {
    symbol: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    rsi: number;
    macd: number;
}

export class TradingAgent {
    private config: AgentConfig;
    private sessionState: SessionState;
    private running: boolean = false;
    private checkInterval: NodeJS.Timer | null = null;
    private logs: AgentLog[] = [];
    private totalPnL: number = 0;
    private tradesExecuted: number = 0;
    private onLogsUpdate?: (logs: AgentLog[]) => void;
    private onStatsUpdate?: (stats: {
        tradesExecuted: number;
        totalPnL: number;
    }) => void;

    constructor(
        config: AgentConfig,
        sessionState: SessionState
    ) {
        this.config = config;
        this.sessionState = sessionState;
    }

    setCallbacks(
        onLogs?: (logs: AgentLog[]) => void,
        onStats?: (stats: {
            tradesExecuted: number;
            totalPnL: number;
        }) => void
    ) {
        this.onLogsUpdate = onLogs;
        this.onStatsUpdate = onStats;
    }

    private addLog(log: Omit<AgentLog, 'id'>) {
        const newLog: AgentLog = {
            ...log,
            id: Date.now().toString(),
        };
        this.logs = [newLog, ...this.logs].slice(0, 100);
        this.onLogsUpdate?.(this.logs);
    }

    private updateStats() {
        this.onStatsUpdate?.({
            tradesExecuted: this.tradesExecuted,
            totalPnL: this.totalPnL,
        });
    }

    private async fetchMarketSignals(): Promise<MarketSignal[]> {
        try {
            const symbols = ['BTC', 'ETH', 'SOL', 'ARB'];
            const signals: MarketSignal[] = [];

            for (const symbol of symbols) {
                const rsi = Math.random() * 100;
                const macd = (Math.random() - 0.5) * 100;

                let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
                let strength = 0;

                if (rsi < 30) {
                    signal = 'bullish';
                    strength = (30 - rsi) / 30;
                } else if (rsi > 70) {
                    signal = 'bearish';
                    strength = (rsi - 70) / 30;
                }

                signals.push({
                    symbol,
                    signal,
                    strength,
                    rsi,
                    macd,
                });
            }

            return signals;
        } catch (error) {
            console.error('Failed to fetch market signals:', error);
            return [];
        }
    }

    private evaluateSignal(
        signal: MarketSignal
    ): { shouldTrade: boolean; type: 'long' | 'short' } | null {
        switch (this.config.strategy) {
            case 'trend_follow':
                if (signal.signal === 'bullish' && signal.strength > 0.6) {
                    return { shouldTrade: true, type: 'long' };
                }
                if (signal.signal === 'bearish' && signal.strength > 0.6) {
                    return { shouldTrade: true, type: 'short' };
                }
                break;

            case 'mean_reversion':
                if (signal.rsi < 30) {
                    return { shouldTrade: true, type: 'long' };
                }
                if (signal.rsi > 70) {
                    return { shouldTrade: true, type: 'short' };
                }
                break;

            case 'momentum':
                if (
                    signal.signal === 'bullish' &&
                    signal.strength > 0.8 &&
                    signal.macd > 0
                ) {
                    return { shouldTrade: true, type: 'long' };
                }
                if (
                    signal.signal === 'bearish' &&
                    signal.strength > 0.8 &&
                    signal.macd < 0
                ) {
                    return { shouldTrade: true, type: 'short' };
                }
                break;
        }

        return null;
    }

    private evaluatePositions(): {
        positionId: string;
        reason: string;
    }[] {
        const positionsToClose: {
            positionId: string;
            reason: string;
        }[] = [];

        for (const position of this.sessionState.positions) {
            const { pnl, pnlPercent } = calculatePnL(
                position.entry,
                position.current,
                position.type
            );

            if (pnlPercent > 3) {
                positionsToClose.push({
                    positionId: position.id,
                    reason: `Profit target reached (+${pnlPercent.toFixed(2)}%)`,
                });
            }

            if (pnlPercent < -2) {
                positionsToClose.push({
                    positionId: position.id,
                    reason: `Stop loss triggered (${pnlPercent.toFixed(2)}%)`,
                });
            }
        }

        return positionsToClose;
    }

    private canExecuteTrade(): {
        allowed: boolean;
        reason?: string;
    } {
        if (this.tradesExecuted >= this.config.maxTrades) {
            return {
                allowed: false,
                reason: `Max trades limit reached (${this.config.maxTrades})`,
            };
        }

        const currentDrawdown =
            ((this.totalPnL - Math.abs(this.totalPnL)) /
                Number(this.sessionState.initialDeposit)) *
            100;
        if (Math.abs(currentDrawdown) > this.config.maxDrawdown) {
            return {
                allowed: false,
                reason: `Max drawdown limit exceeded (${Math.abs(currentDrawdown).toFixed(2)}%)`,
            };
        }

        return { allowed: true };
    }

    private async executeOpenTrade(
        symbol: string,
        type: 'long' | 'short'
    ): Promise<boolean> {
        try {
            const { MARKETS } = await import('@/lib/markets');
            const market = Object.values(MARKETS).find(
                (m) => m.symbol === symbol
            );

            if (!market) {
                this.addLog({
                    type: 'warning',
                    message: `Market not found for ${symbol}`,
                    timestamp: new Date(),
                });
                return false;
            }

            const size = BigInt(0.5 * 1e6);

            const signature =
                Math.random().toString(36).substring(7);
            await yellowClient.submitTradeIntent(
                {
                    sessionId: this.config.sessionId,
                    market,
                    type,
                    size,
                    timestamp: Math.floor(Date.now() / 1000),
                    nonce: 0,
                },
                signature
            );

            this.addLog({
                type: 'trade',
                message: `Opened ${type.toUpperCase()} position on ${symbol}`,
                timestamp: new Date(),
            });

            return true;
        } catch (error) {
            console.error('Trade execution failed:', error);
            this.addLog({
                type: 'warning',
                message: `Failed to open ${symbol} position: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            });
            return false;
        }
    }

    private async executeClosePosition(
        positionId: string,
        reason: string,
        pnl: number
    ): Promise<boolean> {
        try {
            this.addLog({
                type: 'trade',
                message: `Closed position - ${reason}`,
                timestamp: new Date(),
                pnl,
            });

            this.totalPnL += pnl;
            this.tradesExecuted += 1;
            this.updateStats();

            return true;
        } catch (error) {
            console.error('Close execution failed:', error);
            return false;
        }
    }

    async start(): Promise<void> {
        if (this.running) {
            console.log('Agent already running');
            return;
        }

        this.running = true;
        this.logs = [];
        this.totalPnL = 0;
        this.tradesExecuted = 0;

        this.addLog({
            type: 'info',
            message: `Agent started with ${this.config.strategy} strategy`,
            timestamp: new Date(),
        });

        this.addLog({
            type: 'info',
            message: `Risk limits: Max ${this.config.maxTrades} trades, ${this.config.maxDrawdown}% max drawdown`,
            timestamp: new Date(),
        });

        this.checkInterval = setInterval(async () => {
            if (!this.running) return;

            try {
                const signals = await this.fetchMarketSignals();

                for (const signal of signals) {
                    const riskCheck = this.canExecuteTrade();

                    if (!riskCheck.allowed) {
                        if (
                            !this.logs.some(
                                (l) =>
                                    l.message ===
                                    `Agent paused: ${riskCheck.reason}`
                            )
                        ) {
                            this.addLog({
                                type: 'warning',
                                message: `Agent paused: ${riskCheck.reason}`,
                                timestamp: new Date(),
                            });
                        }
                        continue;
                    }

                    const evaluation = this.evaluateSignal(signal);

                    if (evaluation) {
                        const executed = await this.executeOpenTrade(
                            signal.symbol,
                            evaluation.type
                        );

                        if (executed) {
                            this.tradesExecuted += 1;
                            this.updateStats();
                        }
                    } else {
                        this.addLog({
                            type: 'info',
                            message: `${signal.symbol}: ${signal.signal.toUpperCase()} signal (strength: ${(signal.strength * 100).toFixed(0)}%)`,
                            timestamp: new Date(),
                        });
                    }
                }

                const positionsToClose = this.evaluatePositions();

                for (const close of positionsToClose) {
                    const position = this.sessionState.positions.find(
                        (p) => p.id === close.positionId
                    );
                    if (position) {
                        const { pnl } = calculatePnL(
                            position.entry,
                            position.current,
                            position.type
                        );
                        await this.executeClosePosition(
                            close.positionId,
                            close.reason,
                            pnl
                        );
                    }
                }
            } catch (error) {
                console.error('Agent loop error:', error);
                this.addLog({
                    type: 'warning',
                    message: `Agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    timestamp: new Date(),
                });
            }
        }, 5000);
    }

    async stop(): Promise<void> {
        this.running = false;

        if (this.checkInterval) {
            // @ts-expect-error
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.addLog({
            type: 'info',
            message: `Agent stopped. Final P&L: ${this.totalPnL >= 0 ? '+' : ''}${this.totalPnL.toFixed(2)}`,
            timestamp: new Date(),
        });
    }

    getLogs(): AgentLog[] {
        return this.logs;
    }

    getStats(): { tradesExecuted: number; totalPnL: number } {
        return {
            tradesExecuted: this.tradesExecuted,
            totalPnL: this.totalPnL,
        };
    }

    isRunning(): boolean {
        return this.running;
    }
}

export default TradingAgent;
