/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type NavLink = {
    name: string;
    path: string;
};

const navLinks: NavLink[] = [
    { name: "Arena", path: "/arena" },
    { name: "AI Agent", path: "/agent" },
    { name: "Session", path: "/session" },
];

export const Navbar = () => {
    const pathname = usePathname();
    const { isConnected, address } = useAccount();
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="z-50 px-4 py-4"
        >
            <div className="max-w-7xl mx-auto">
                <div className="glass-panel px-6 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-xl font-bold text-foreground">
                            One<span className="text-gradient">Set</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;

                            return (
                                <Link key={link.path} href={link.path}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        size="sm"
                                        className="relative"
                                    >
                                        {link.name}
                                        {isActive && (
                                            <motion.div
                                                layoutId="navbar-indicator"
                                                className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                                            />
                                        )}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {isConnected ? (
                            <>
                                {/* <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600">
                                    <Wallet className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-slate-200">
                                        {formatAddress(address || "")}
                                    </span>
                                </div> */}
                                <ConnectButton />
                            </>
                        ) : (
                            <>
                                <ConnectButton />
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/arena">Start Trading</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden mt-2 glass-panel p-4 flex flex-col gap-2"
                    >
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;

                            return (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                    >
                                        {link.name}
                                    </Button>
                                </Link>
                            );
                        })}

                        <div className="border-t border-border my-2" />

                        {/* {isConnected && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 mb-2">
                                <Wallet className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-slate-200">
                                    {formatAddress(address || "")}
                                </span>
                            </div>
                        )} */}

                        <div className="w-full">
                            <ConnectButton />
                        </div>

                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/arena" onClick={() => setMobileOpen(false)}>
                                Start Trading
                            </Link>
                        </Button>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
};
