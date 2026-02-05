"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);

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
                        <Button size="sm" asChild>
                            <Link href="/session">Connect Wallet</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/arena">Start Trading</Link>
                        </Button>
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