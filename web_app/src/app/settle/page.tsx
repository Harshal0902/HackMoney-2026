/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useWalletSigner } from '@/lib/useWalletSigner';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowDown, ExternalLink, Zap, TrendingUp, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { settlementManager, SettlementSummary } from '@/lib/settlementManager';

const ETHERSCAN_BASE = 'https://etherscan.io/tx';
const ARBISCAN_BASE = 'https://arbiscan.io/tx';

export default function SettlePage() {
    const { address } = useAccount();
    const chainId = useChainId();
    const signer = useWalletSigner();
    const store = useStore();
    const session = store.session;

    const [isSettling, setIsSettling] = useState(false);
    const [isSettled, setIsSettled] = useState(false);
    const [summary, setSummary] = useState<SettlementSummary | null>(null);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            const positionHistory = session.positions.map((pos) => ({
                wasAgent: session.agentEnabled,
                pnl: pos.pnl,
            }));

            settlementManager
                .calculateSummary(session, positionHistory)
                .then((result) => {
                    setSummary(result);
                    console.log('📊 Settlement summary calculated:', result);
                })
                .catch((err) => {
                    console.error('Failed to calculate summary:', err);
                    setError('Failed to calculate session summary');
                });
        }
    }, [session]);

    const handleSettle = useCallback(async () => {
        if (!session || !signer || !address) {
            setError('Session or wallet not available');
            return;
        }

        try {
            setIsSettling(true);
            setError(null);

            console.log('🚀 Starting settlement process...');

            console.log('📝 Preparing settlement data...');
            const settlement = await settlementManager.prepareSettlement(
                session,
                await signer
            );

            console.log('⚡ Executing settlement...');
            const txHash = await settlementManager.executeSettlement(
                settlement,
                session,
                await signer,
                address,
                chainId
            );

            setTransactionHash(txHash);
            setIsSettled(true);

            console.log('✅ Settlement complete:', txHash);

            // @ts-expect-error
            store.setSession(null);
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : 'Settlement failed';
            setError(errorMsg);
            console.error('Settlement error:', err);
        } finally {
            setIsSettling(false);
        }
    }, [session, signer, address, chainId, store]);

    if (!session) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center'
                >
                    <AlertCircle className='w-12 h-12 text-yellow-400 mx-auto mb-4' />
                    <h1 className='text-3xl font-bold text-white mb-2'>
                        No Active Session
                    </h1>
                    <p className='text-slate-400 mb-8'>
                        Create a session first to settle
                    </p>
                    <Button asChild className='bg-blue-500 hover:bg-blue-600'>
                        <Link href='/session'>Create Session</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-center'
                >
                    <div className='inline-block'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400'></div>
                    </div>
                    <p className='text-slate-400 mt-4'>Loading settlement summary...</p>
                </motion.div>
            </div>
        );
    }

    const explorerUrl =
        chainId === 42161
            ? `${ARBISCAN_BASE}/${transactionHash}`
            : `${ETHERSCAN_BASE}/${transactionHash}`;

    const isProfitable = summary.pnl >= 0;

    return (
        <div className='min-h-screen'>
            <main className='py-8 px-4'>
                <div className='max-w-xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='text-center mb-8'
                    >
                        <h1 className='text-4xl font-bold text-white mb-2'>
                            {isSettled ? (
                                <>
                                    Session <span className='text-emerald-400'>Complete</span>
                                </>
                            ) : (
                                <>
                                    Settle <span className='text-blue-400'>Session</span>
                                </>
                            )}
                        </h1>
                        <p className='text-slate-400'>
                            {isSettled
                                ? 'Your session has been settled on-chain.'
                                : 'Review your session and settle on-chain.'}
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className='glass-card p-6 bg-slate-800/50 border border-slate-700'
                    >
                        <div className='flex items-center justify-between mb-6'>
                            <div className='flex items-center gap-3'>
                                <div className='w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center'>
                                    <BarChart3 className='w-6 h-6 text-blue-400' />
                                </div>
                                <div>
                                    <h2 className='font-semibold text-white'>
                                        Session Summary
                                    </h2>
                                    <p className='text-sm text-slate-400'>
                                        {session.sessionDuration / (60 * 60 * 1000)} hours ·{' '}
                                        {summary.tradesExecuted} trades
                                    </p>
                                </div>
                            </div>
                            {isSettled && (
                                <div className='flex items-center gap-2 text-emerald-400'>
                                    <CheckCircle2 className='w-5 h-5' />
                                    <span className='text-sm font-medium'>
                                        Settled
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className='bg-slate-700/50 rounded-xl p-6 mb-6 border border-slate-600'>
                            <div className='flex items-center justify-between mb-4'>
                                <div className='text-center'>
                                    <p className='text-sm text-slate-400 mb-1'>
                                        Starting
                                    </p>
                                    <p className='text-2xl font-bold font-mono text-white'>
                                        ${summary.startingBalance.toFixed(2)}
                                    </p>
                                </div>
                                <ArrowDown className='w-8 h-8 text-slate-400 -rotate-90' />
                                <div className='text-center'>
                                    <p className='text-sm text-slate-400 mb-1'>
                                        Final
                                    </p>
                                    <p
                                        className={`text-2xl font-bold font-mono ${isProfitable
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                            }`}
                                    >
                                        ${summary.finalBalance.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center justify-center gap-2'>
                                {isProfitable ? (
                                    <TrendingUp className='w-5 h-5 text-emerald-400' />
                                ) : (
                                    <TrendingUp className='w-5 h-5 text-red-400 rotate-180' />
                                )}
                                <span
                                    className={`text-lg font-semibold ${isProfitable
                                        ? 'text-emerald-400'
                                        : 'text-red-400'
                                        }`}
                                >
                                    {isProfitable ? '+' : ''}${summary.pnl.toFixed(2)} (
                                    {summary.pnlPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4 mb-6'>
                            <div className='p-4 bg-slate-700/50 rounded-lg border border-slate-600'>
                                <p className='text-sm text-slate-400'>
                                    Trades Executed
                                </p>
                                <p className='text-xl font-bold font-mono text-white'>
                                    {summary.tradesExecuted}
                                </p>
                            </div>
                            <div className='p-4 bg-slate-700/50 rounded-lg border border-slate-600'>
                                <p className='text-sm text-slate-400'>
                                    Gas Saved
                                </p>
                                <p className='text-xl font-bold font-mono text-emerald-400'>
                                    {summary.gasSaved}
                                </p>
                            </div>
                            <div className='p-4 bg-slate-700/50 rounded-lg border border-slate-600'>
                                <p className='text-sm text-slate-400'>
                                    AI Agent Trades
                                </p>
                                <p className='text-xl font-bold font-mono text-white'>
                                    {summary.agentTrades}
                                </p>
                            </div>
                            <div className='p-4 bg-slate-700/50 rounded-lg border border-slate-600'>
                                <p className='text-sm text-slate-400'>
                                    Manual Trades
                                </p>
                                <p className='text-xl font-bold font-mono text-white'>
                                    {summary.manualTrades}
                                </p>
                            </div>
                        </div>

                        <div className='bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6'>
                            <div className='flex items-start gap-3'>
                                <Zap className='w-5 h-5 text-blue-400 shrink-0 mt-0.5' />
                                <div className='text-sm'>
                                    <p className='text-white font-medium'>
                                        🟡 All {summary.tradesExecuted} actions were
                                        off-chain.
                                    </p>
                                    <p className='text-slate-300 mt-1'>
                                        Only the final state is settled with one
                                        transaction. This is why you saved{' '}
                                        <span className='text-blue-400 font-semibold'>
                                            {summary.gasSaved}
                                        </span>
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!isSettled ? (
                            <Button
                                onClick={handleSettle}
                                disabled={isSettling}
                                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg'
                            >
                                {isSettling ? (
                                    <>
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                        Settling on-chain...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className='w-5 h-5' />
                                        Settle Session
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className='space-y-3'>
                                <Button
                                    asChild
                                    className='w-full bg-slate-700 hover:bg-slate-600 text-white'
                                >
                                    <a
                                        href={explorerUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        <ExternalLink className='w-4 h-4' />
                                        View Transaction on Explorer
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    className='w-full bg-blue-500 hover:bg-blue-600 text-white'
                                >
                                    <Link href='/session'>Start New Session</Link>
                                </Button>
                            </div>
                        )}
                    </motion.div>

                    {isSettled && transactionHash && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='mt-6 glass-card p-4 bg-slate-800/50 border border-slate-700'
                        >
                            <div className='text-center'>
                                <p className='text-sm text-slate-400 mb-3'>
                                    Settlement Transaction
                                </p>
                                <p className='font-mono text-xs break-all text-slate-200 bg-slate-700/50 p-3 rounded-lg'>
                                    {transactionHash}
                                </p>
                                <div className='mt-3 flex items-center justify-center gap-2 text-xs text-emerald-400'>
                                    <CheckCircle2 className='w-4 h-4' />
                                    Confirmed on-chain
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
