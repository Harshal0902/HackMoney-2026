import { motion } from "framer-motion";
import { Zap, Bot, Shield, ArrowLeftRight, Clock, LineChart } from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Zero Gas Fees",
        description: "Trade as many times as you want during a session without paying gas for each trade.",
    },
    {
        icon: Bot,
        title: "AI Agent Trading",
        description: "Let AI agents execute strategies on your behalf with customizable risk parameters.",
    },
    {
        icon: Shield,
        title: "Smart Contract Security",
        description: "Your funds are protected by audited smart contracts throughout the session.",
    },
    {
        icon: ArrowLeftRight,
        title: "Prediction Markets",
        description: "Place predictions on crypto prices with instant execution and fair settlement.",
    },
    {
        icon: Clock,
        title: "Instant Execution",
        description: "Web2-like speed with trades confirmed in milliseconds, not blocks.",
    },
    {
        icon: LineChart,
        title: "Real-Time P&L",
        description: "Watch your balance update in real-time as you trade and agents execute.",
    },
];

export const Features = () => {
    return (
        <section className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

            <div className="container px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Built for <span className="text-gradient">speed</span>
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Everything you need to trade fast and let AI work for you.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="glass-panel p-5 group hover:bg-card/60 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <feature.icon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
