"use client"

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Zap, Clock, Shield, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

type SessionStep = 1 | 2 | 3 | 4;

export default function Page() {
    const [currentStep, setCurrentStep] = useState<SessionStep>(1);
    const [isConnected, setIsConnected] = useState(false);
    const [sessionBalance, setSessionBalance] = useState(50);
    const [maxLoss, setMaxLoss] = useState(10);
    const [sessionDuration, setSessionDuration] = useState(4);
    const [enableAgent, setEnableAgent] = useState(false);

    const handleConnect = () => {
        setIsConnected(true);
        setTimeout(() => setCurrentStep(2), 500);
    };

    const handleCreateSession = () => {
        setCurrentStep(3);
        setTimeout(() => setCurrentStep(4), 1500);
    };

    return (
        <div>
            <main className="py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl font-bold mb-2">
                            Start Your <span className="text-gradient">Session</span>
                        </h1>
                        <p className="text-muted-foreground">
                            Deposit once, trade instantly, settle when you&apos;re done.
                        </p>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground"
                                        }`}
                                >
                                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                                </div>
                                {step < 4 && (
                                    <div
                                        className={`w-12 h-0.5 transition-colors ${currentStep > step ? "bg-primary" : "bg-secondary"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="glass-card p-8"
                    >
                        {currentStep === 1 && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                                    <Wallet className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
                                <p className="text-muted-foreground mb-6">
                                    Connect your wallet to create a Yellow session.
                                </p>
                                <Button variant="hero" size="lg" onClick={handleConnect}>
                                    {isConnected ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Connected
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="w-5 h-5" />
                                            Connect Wallet
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Configure Session</h2>
                                        <p className="text-sm text-muted-foreground">Set your trading parameters</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Session Balance (USDC)
                                        </label>
                                        <div className="flex gap-2">
                                            {[25, 50, 100, 250].map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setSessionBalance(amount)}
                                                    className={`flex-1 py-3 rounded-lg font-mono transition-colors ${sessionBalance === amount
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary hover:bg-secondary/80"
                                                        }`}
                                                >
                                                    ${amount}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium">Max Loss</span>
                                            <span className="font-mono text-primary">{maxLoss}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={maxLoss}
                                            onChange={(e) => setMaxLoss(Number(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>Conservative</span>
                                            <span>Aggressive</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Session Duration
                                        </label>
                                        <div className="flex gap-2">
                                            {[1, 4, 12, 24].map((hours) => (
                                                <button
                                                    key={hours}
                                                    onClick={() => setSessionDuration(hours)}
                                                    className={`flex-1 py-3 rounded-lg transition-colors ${sessionDuration === hours
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary hover:bg-secondary/80"
                                                        }`}
                                                >
                                                    {hours}h
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                                        <div>
                                            <span className="font-medium">Enable AI Agent</span>
                                            <p className="text-xs text-muted-foreground">
                                                Let AI trade on your behalf
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setEnableAgent(!enableAgent)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${enableAgent ? "bg-primary" : "bg-muted"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${enableAgent ? "left-7" : "left-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <Button
                                        variant="hero"
                                        size="lg"
                                        className="w-full"
                                        onClick={handleCreateSession}
                                    >
                                        Create Session
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-6" />
                                <h2 className="text-xl font-semibold mb-2">Creating Session</h2>
                                <p className="text-muted-foreground">
                                    Setting up your Yellow state channel...
                                </p>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-8 h-8 text-success" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Session Active!</h2>
                                <p className="text-muted-foreground mb-6">
                                    Your session is ready. Trade with zero gas fees.
                                </p>

                                <div className="glass-panel p-4 mb-6 text-left">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Balance</span>
                                            <div className="font-mono font-semibold">${sessionBalance} USDC</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Duration</span>
                                            <div className="font-mono font-semibold">{sessionDuration} hours</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Max Loss</span>
                                            <div className="font-mono font-semibold">{maxLoss}%</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">AI Agent</span>
                                            <div className="font-semibold">{enableAgent ? "Enabled" : "Disabled"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
                                    <Shield className="w-4 h-4" />
                                    <span>No gas for trades during this session</span>
                                </div>
                                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
                                    <Clock className="w-4 h-4" />
                                    <span>1 settlement tx at the end</span>
                                </div>

                                <Button variant="hero" size="lg" asChild>
                                    <Link href="/arena">
                                        Enter Arena
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
