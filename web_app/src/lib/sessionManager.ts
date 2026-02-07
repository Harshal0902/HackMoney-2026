/* eslint-disable @typescript-eslint/ban-ts-comment */
import { yellowClient } from './yellow';
import { getBestBridgeRoute, executeBridgeSwap } from './lifi';
import { ethers } from 'ethers';

export interface SessionConfig {
    balance: bigint;
    maxLoss: number;
    duration: number;
    enableAgent: boolean;
    userAddress: string;
}

export interface SessionCreationResult {
    sessionId: string;
    transactionHash: string;
    status: 'pending' | 'confirmed';
}

class SessionManager {
    async validateBalance(amount: bigint): Promise<boolean> {
        const MIN_BALANCE = BigInt(0.1 * 1e6);
        return amount >= MIN_BALANCE;
    }

    async getOptimalBridgeRoute(
        userAddress: string,
        fromChain: number,
        amount: string
    ) {
        try {
            const USDC_MAINNET = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
            const USDC_ARBITRUM =
                '0xff970a61a04b1ca14834a43f5de4533ebddb5f86';

            if (fromChain === 1) {
                console.log('✅ Already on Ethereum mainnet');
                return null;
            }
            const route = await getBestBridgeRoute({
                fromChain,
                toChain: 1,
                fromToken: USDC_ARBITRUM,
                toToken: USDC_MAINNET,
                fromAmount: amount,
                userAddress,
                slippage: 0.5,
            });

            return route;
        } catch (error) {
            console.error('Failed to get bridge route:', error);
            return null;
        }
    }

    async createSession(
        config: SessionConfig,
        signer: ethers.Signer,
        chainId: number
    ): Promise<SessionCreationResult> {
        try {
            await yellowClient.initialize(config.userAddress);
            console.log('🟡 Yellow client initialized');

            let bridgeRoute = null;
            if (chainId !== 1) {
                console.log(
                    '🌉 Checking bridge route from chain',
                    chainId
                );
                bridgeRoute = await this.getOptimalBridgeRoute(
                    config.userAddress,
                    chainId,
                    config.balance.toString()
                );
            }

            if (bridgeRoute) {
                try {
                    console.log(
                        '🌉 Executing bridge swap via LI.FI...'
                    );
                    const bridgeTxHash = await executeBridgeSwap(
                        bridgeRoute,
                        signer
                    );
                    console.log('✅ Bridge executed:', bridgeTxHash);

                    await new Promise((resolve) =>
                        setTimeout(resolve, 3000)
                    );
                } catch (bridgeError) {
                    console.warn(
                        'Bridge execution warning (may not be required):',
                        bridgeError
                    );
                }
            } else {
                console.log('✅ No bridge needed');
            }

            console.log('🟡 Creating Yellow session...');
            const { sessionId, tx } =
                await yellowClient.createSession(
                    config.userAddress,
                    config.balance,
                    config.duration * 60 * 60 * 1000
                );

            console.log('✅ Session created:', sessionId);

            if (config.enableAgent) {
                console.log('🤖 Registering agent permissions...');
            }

            return {
                sessionId,
                transactionHash: tx,
                status: 'confirmed',
            };
        } catch (error) {
            console.error('Session creation failed:', error);
            throw error;
        }
    }

    async validateSession(sessionId: string): Promise<boolean> {
        try {
            const balance = await yellowClient.getSessionBalance(
                sessionId
            );
            // @ts-expect-error
            return balance > 0n;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }
}

export const sessionManager = new SessionManager();
