import { motion } from "framer-motion";
import { Wallet, Zap, CheckCircle2 } from "lucide-react";

const steps = [
    {
        icon: Wallet,
        number: "01",
        title: "Deposit once",
        description: "Connect your wallet and fund your session. One transaction to start.",
    },
    {
        icon: Zap,
        number: "02",
        title: "Trade instantly",
        description: "Every trade happens off-chain. No gas, no waiting, no wallet popups.",
    },
    {
        icon: CheckCircle2,
        number: "03",
        title: "Settle on-chain",
        description: "When you're done, settle your net balance with a single transaction.",
    },
];

export const HowItWorks = () => {
    return (
        <section className="py-24 relative">
            <div className="container px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        How it <span className="text-gradient">works</span>
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Yellow&apos;s state channels make every interaction instant while keeping your funds secure.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="glass-card p-6 relative group hover:border-primary/30 transition-colors"
                        >
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-6.5 w-6 h-px bg-border" />
                            )}

                            <div className="flex items-start gap-4">
                                <div className="shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <step.icon className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-mono text-muted-foreground">{step.number}</span>
                                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
