"use client";

import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletSigner } from '@/lib/useWalletSigner';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Wallet, Zap, Clock, Shield, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { sessionManager, SessionConfig } from '@/lib/sessionManager';
import { SessionState } from '@/lib/types';

type SessionStep = 1 | 2 | 3 | 4;

export default function SessionPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const signer = useWalletSigner();
    const store = useStore();

    const [currentStep, setCurrentStep] = useState<SessionStep>(1);
    const [sessionBalance, setSessionBalance] = useState(50);
    const [maxLoss, setMaxLoss] = useState(10);
    const [sessionDuration, setSessionDuration] = useState(4);
    const [enableAgent, setEnableAgent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleWalletConnected = useCallback(() => {
        if (isConnected && address) {
            setTimeout(() => setCurrentStep(2), 500);
        }
    }, [isConnected, address]);

    const handleCreateSession = useCallback(async () => {
        if (!address || !signer) {
            setError('Wallet not connected');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setCurrentStep(3);

            const config: SessionConfig = {
                balance: BigInt(sessionBalance * 1e6),
                maxLoss,
                duration: sessionDuration,
                enableAgent,
                userAddress: address,
            };

            const result = await sessionManager.createSession(
                config,
                await signer,
                chainId
            );

            const isValid = await sessionManager.validateSession(
                result.sessionId
            );

            if (!isValid) {
                throw new Error('Session validation failed');
            }

            const newSession: SessionState = {
                id: result.sessionId,
                userId: address,
                balance: config.balance,
                initialDeposit: config.balance,
                startTime: new Date(),
                sessionDuration: config.duration * 60 * 60 * 1000,
                riskLevel: 0,
                positions: [],
                agentEnabled: config.enableAgent,
                chainId,
                settlementPending: false,
                nonce: 0,
            };

            store.setSession(newSession);

            console.log('✅ Session created and stored:', result.sessionId);

            setTimeout(() => setCurrentStep(4), 1500);
        } catch (err) {
            const errorMsg =
                err instanceof Error
                    ? err.message
                    : 'Failed to create session';
            setError(errorMsg);
            console.error('Session creation error:', err);
            setCurrentStep(2);
        } finally {
            setLoading(false);
        }
    }, [address, signer, sessionBalance, maxLoss, sessionDuration, enableAgent, chainId, store]);

    if (store.session) {
        return (
            <div className='min-h-screen  flex items-center justify-center'>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center'
                >
                    <div className='w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6'>
                        <Check className='w-8 h-8 text-emerald-400' />
                    </div>
                    <h1 className='text-3xl font-bold text-white mb-2'>
                        Session Active
                    </h1>
                    <p className='text-slate-400 mb-8'>
                        You already have an active session
                    </p>
                    <Button asChild className='bg-blue-500 hover:bg-blue-600'>
                        <Link href='/arena'>Go to Arena</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className='min-h-screen'>
            <main className='py-8 px-4'>
                <div className='max-w-2xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='text-center mb-8'
                    >
                        <h1 className='text-4xl font-bold text-white mb-2'>
                            Start Your <span className='text-blue-400'>Session</span>
                        </h1>
                        <p className='text-slate-400'>
                            Deposit once, trade instantly, settle when
                            you&apos;re done.
                        </p>
                    </motion.div>

                    <div className='flex items-center justify-center gap-2 mb-8'>
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className='flex items-center'>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-700 text-slate-400'
                                        }`}
                                >
                                    {currentStep > step ? (
                                        <Check className='w-4 h-4' />
                                    ) : (
                                        step
                                    )}
                                </div>
                                {step < 4 && (
                                    <div
                                        className={`w-12 h-0.5 transition-colors ${currentStep > step
                                            ? 'bg-blue-500'
                                            : 'bg-slate-700'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

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
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className='glass-card p-8 bg-slate-800/50 border border-slate-700'
                    >
                        {currentStep === 1 && (
                            <div className='text-center'>
                                <div className='w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-6'>
                                    <Wallet className='w-8 h-8 text-blue-400' />
                                </div>
                                <h2 className='text-2xl font-semibold text-white mb-2'>
                                    Connect Wallet
                                </h2>
                                <p className='text-slate-400 mb-8'>
                                    Connect your wallet to create a Yellow
                                    session.
                                </p>

                                {!isConnected ? (
                                    <div className='flex justify-center'>
                                        <ConnectButton />
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleWalletConnected}
                                        className='bg-emerald-600 hover:bg-emerald-700 text-white'
                                    >
                                        <Check className='w-5 h-5' />
                                        Connected: {address?.slice(0, 6)}...
                                        {address?.slice(-4)}
                                    </Button>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <div className='flex items-center gap-3 mb-6'>
                                    <div className='w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center'>
                                        <Zap className='w-5 h-5 text-blue-400' />
                                    </div>
                                    <div>
                                        <h2 className='text-xl font-semibold text-white'>
                                            Configure Session
                                        </h2>
                                        <p className='text-sm text-slate-400'>
                                            Set your trading parameters
                                        </p>
                                    </div>
                                </div>

                                <div className='space-y-6'>
                                    <div>
                                        <label className='block text-sm font-medium text-white mb-3'>
                                            Session Balance (USDC)
                                        </label>
                                        <div className='flex gap-2'>
                                            {[25, 50, 100, 250].map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setSessionBalance(amount)}
                                                    className={`flex-1 py-3 rounded-lg font-mono transition-colors ${sessionBalance === amount
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                                        }`}
                                                >
                                                    ${amount}
                                                </button>
                                            ))}
                                        </div>
                                        <p className='text-xs text-slate-400 mt-2'>
                                            🌉 LI.FI will route your deposit
                                            across chains if needed
                                        </p>
                                    </div>

                                    {/* Max loss slider */}
                                    <div>
                                        <div className='flex justify-between text-sm mb-2'>
                                            <span className='font-medium text-white'>
                                                Max Loss (Stop Loss)
                                            </span>
                                            <span className='font-mono text-blue-400'>
                                                {maxLoss}%
                                            </span>
                                        </div>
                                        <input
                                            type='range'
                                            min='5'
                                            max='50'
                                            value={maxLoss}
                                            onChange={(e) =>
                                                setMaxLoss(Number(e.target.value))
                                            }
                                            className='w-full accent-blue-500'
                                        />
                                        <div className='flex justify-between text-xs text-slate-400 mt-2'>
                                            <span>Conservative</span>
                                            <span>Aggressive</span>
                                        </div>
                                        <p className='text-xs text-slate-400 mt-2'>
                                            ⚠️ Enforced on-chain via Uniswap
                                            v4 hooks
                                        </p>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-white mb-3'>
                                            Session Duration
                                        </label>
                                        <div className='flex gap-2'>
                                            {[1, 4, 12, 24].map((hours) => (
                                                <button
                                                    key={hours}
                                                    onClick={() =>
                                                        setSessionDuration(hours)
                                                    }
                                                    className={`flex-1 py-3 rounded-lg transition-colors ${sessionDuration === hours
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                                        }`}
                                                >
                                                    {hours}h
                                                </button>
                                            ))}
                                        </div>
                                        <p className='text-xs text-slate-400 mt-2'>
                                            🟡 Auto-settles when duration
                                            expires
                                        </p>
                                    </div>

                                    <div className='flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600'>
                                        <div>
                                            <span className='font-medium text-white'>
                                                Enable AI Agent
                                            </span>
                                            <p className='text-xs text-slate-400 mt-1'>
                                                Let AI trade on your behalf
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setEnableAgent(!enableAgent)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${enableAgent
                                                ? 'bg-blue-500'
                                                : 'bg-slate-600'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enableAgent
                                                    ? 'left-7'
                                                    : 'left-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleCreateSession}
                                        disabled={loading}
                                        className='w-full bg-blue-500 hover:bg-blue-600 text-white'
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className='w-5 h-5 animate-spin' />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create Session
                                                <ArrowRight className='w-5 h-5' />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className='text-center py-12'>
                                <div className='w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-6' />
                                <h2 className='text-xl font-semibold text-white mb-2'>
                                    Creating Session
                                </h2>
                                <p className='text-slate-400 mb-4'>
                                    Setting up your Yellow state channel...
                                </p>
                                <div className='space-y-2 text-left max-w-sm mx-auto'>
                                    <div className='flex items-center gap-2 text-sm text-slate-300'>
                                        <div className='w-2 h-2 rounded-full bg-blue-400' />
                                        Initializing Yellow Network
                                    </div>
                                    <div className='flex items-center gap-2 text-sm text-slate-300'>
                                        <div className='w-2 h-2 rounded-full bg-slate-600' />
                                        Preparing liquidity routes
                                    </div>
                                    <div className='flex items-center gap-2 text-sm text-slate-300'>
                                        <div className='w-2 h-2 rounded-full bg-slate-600' />
                                        Registering parameters
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className='text-center'>
                                <div className='w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6'>
                                    <Check className='w-8 h-8 text-emerald-400' />
                                </div>
                                <h2 className='text-2xl font-semibold text-white mb-2'>
                                    Session Active!
                                </h2>
                                <p className='text-slate-400 mb-8'>
                                    Your session is ready. Trade with zero
                                    gas fees.
                                </p>

                                <div className='bg-slate-700/50 p-6 rounded-lg border border-slate-600 mb-6'>
                                    <div className='grid grid-cols-2 gap-4 text-left'>
                                        <div>
                                            <span className='text-slate-400 text-sm'>
                                                Balance
                                            </span>
                                            <div className='font-mono font-semibold text-white text-lg'>
                                                ${sessionBalance} USDC
                                            </div>
                                        </div>
                                        <div>
                                            <span className='text-slate-400 text-sm'>
                                                Duration
                                            </span>
                                            <div className='font-mono font-semibold text-white text-lg'>
                                                {sessionDuration}h
                                            </div>
                                        </div>
                                        <div>
                                            <span className='text-slate-400 text-sm'>
                                                Max Loss
                                            </span>
                                            <div className='font-mono font-semibold text-white text-lg'>
                                                {maxLoss}%
                                            </div>
                                        </div>
                                        <div>
                                            <span className='text-slate-400 text-sm'>
                                                AI Agent
                                            </span>
                                            <div className='font-semibold text-white text-lg'>
                                                {enableAgent
                                                    ? 'Enabled'
                                                    : 'Disabled'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-3 mb-8'>
                                    <div className='flex items-center justify-center gap-2 text-sm text-slate-300'>
                                        <Zap className='w-4 h-4 text-blue-400' />
                                        <span>
                                            No gas for trades during this
                                            session
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-center gap-2 text-sm text-slate-300'>
                                        <Clock className='w-4 h-4 text-blue-400' />
                                        <span>1 settlement tx at the end</span>
                                    </div>
                                    <div className='flex items-center justify-center gap-2 text-sm text-slate-300'>
                                        <Shield className='w-4 h-4 text-blue-400' />
                                        <span>
                                            Risk limits enforced on-chain
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    className='w-full bg-blue-500 hover:bg-blue-600 text-white'
                                >
                                    <Link href='/arena'>
                                        Enter Arena
                                        <ArrowRight className='w-5 h-5' />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
