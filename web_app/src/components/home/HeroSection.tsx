import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-100 h-100 bg-primary/3 rounded-full blur-3xl" />
            </div>

            <div
                className="absolute inset-0 opacity-[0.02] text-foreground"
                style={{
                    backgroundImage: `
      linear-gradient(currentColor 1px, transparent 1px),
      linear-gradient(90deg, currentColor 1px, transparent 1px)
    `,
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="container relative z-10 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
                    >
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Powered by Yellow State Channels</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Trade instantly.
                        <br />
                        <span className="text-gradient">Settle once.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
                    >
                        Gasless, session-based trading & predictions powered by Yellow state channels.
                        Zero latency. Zero complexity.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button variant="hero" size="xl" asChild className="group">
                            <Link href="/arena">
                                Start Trading
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button variant="glass" size="xl" className="group">
                            <Play className="w-5 h-5" />
                            Watch Demo
                            <span className="text-muted-foreground text-sm">(2 min)</span>
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="mt-16"
                    >
                        <LiveBalanceDemo />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const LiveBalanceDemo = () => {
    return (
        <div className="glass-card p-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Session Balance</span>
                <span className="flex items-center gap-1 text-xs text-success">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Live
                </span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold font-mono">52.47</span>
                <span className="text-lg text-muted-foreground">USDC</span>
                <span className="ml-auto text-success font-mono text-sm">+2.47 (4.94%)</span>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                    <span>Trades executed</span>
                    <span className="font-mono text-foreground">12</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Gas fees</span>
                    <span className="font-mono text-foreground">$0.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Settlement status</span>
                    <span className="text-primary font-medium">Off-chain</span>
                </div>
            </div>
        </div>
    );
};
