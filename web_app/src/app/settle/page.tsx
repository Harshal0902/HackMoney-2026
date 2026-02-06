"use client"

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowDown, ExternalLink, Zap, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Page() {
    const [isSettling, setIsSettling] = useState(false);
    const [isSettled, setIsSettled] = useState(false);

    const sessionData = {
        startingBalance: 50,
        finalBalance: 52.47,
        tradesExecuted: 12,
        pnl: 2.47,
        pnlPercent: 4.94,
        agentTrades: 8,
        manualTrades: 4,
        gasSaved: "$12.40",
    };

    const handleSettle = () => {
        setIsSettling(true);
        setTimeout(() => {
            setIsSettling(false);
            setIsSettled(true);
        }, 2000);
    };

    return (
        <div>
            <main className="py-8 px-4">
                <div className="max-w-xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl font-bold mb-2">
                            {isSettled ? (
                                <>Session <span className="text-gradient">Complete</span></>
                            ) : (
                                <>Settle <span className="text-gradient">Session</span></>
                            )}
                        </h1>
                        <p className="text-muted-foreground">
                            {isSettled
                                ? "Your session has been settled on-chain."
                                : "Review your session and settle on-chain."}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Session Summary</h2>
                                    <p className="text-sm text-muted-foreground">4 hours · 12 trades</p>
                                </div>
                            </div>
                            {isSettled && (
                                <div className="flex items-center gap-2 text-success">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Settled</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-secondary/50 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">Starting</p>
                                    <p className="text-2xl font-bold font-mono">${sessionData.startingBalance}</p>
                                </div>
                                <ArrowDown className="w-8 h-8 text-muted-foreground -rotate-90" />
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">Final</p>
                                    <p className="text-2xl font-bold font-mono text-success">
                                        ${sessionData.finalBalance}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <TrendingUp className="w-5 h-5 text-success" />
                                <span className="text-lg font-semibold text-success">
                                    +${sessionData.pnl} ({sessionData.pnlPercent}%)
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Trades Executed</p>
                                <p className="text-xl font-bold font-mono">{sessionData.tradesExecuted}</p>
                            </div>
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Gas Saved</p>
                                <p className="text-xl font-bold font-mono text-success">{sessionData.gasSaved}</p>
                            </div>
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Agent Trades</p>
                                <p className="text-xl font-bold font-mono">{sessionData.agentTrades}</p>
                            </div>
                            <div className="p-4 bg-secondary/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Manual Trades</p>
                                <p className="text-xl font-bold font-mono">{sessionData.manualTrades}</p>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-sm">
                                    <span className="text-foreground font-medium">All 12 actions were off-chain.</span>
                                    <span className="text-muted-foreground">
                                        {" "}Only the final state is settled with one transaction.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {!isSettled ? (
                            <Button
                                variant="hero"
                                size="lg"
                                className="w-full"
                                onClick={handleSettle}
                                disabled={isSettling}
                            >
                                {isSettling ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Settling...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Settle Session
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <Button variant="glass" size="lg" className="w-full gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    View Transaction
                                </Button>
                                <Button variant="hero" size="lg" className="w-full" asChild>
                                    <Link href="/session">Start New Session</Link>
                                </Button>
                            </div>
                        )}
                    </motion.div>

                    {isSettled && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 glass-panel p-4 text-center"
                        >
                            <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
                            <p className="font-mono text-xs break-all text-foreground">
                                0x7f9a...3d4e2b1c
                            </p>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    )
}
