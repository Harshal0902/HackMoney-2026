/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { ethers } from 'ethers';

const LIFI_API_URL = 'https://li.quest/v1';

interface BridgeRequest {
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    userAddress: string;
    slippage: number;
}

interface LiFiRoute {
    id: string;
    type: string;
    fromAmount: string;
    toAmount: string;
    steps: Array<{
        id: string;
        type: string;
        action: {
            fromToken: {
                address: string;
            };
            toToken: {
                address: string;
            };
            fromAmount: string;
        };
        estimate: {
            toAmount: string;
            toAmountMin: string;
            executionDuration: number;
            feeCosts: Array<{
                name: string;
                percentage: string;
                token: {
                    symbol: string;
                };
                amount: string;
            }>;
        };
        tool: string;
        toolDetails: {
            name: string;
        };
    }>;
}

export async function getBestBridgeRoute(
    request: BridgeRequest
): Promise<LiFiRoute | null> {
    try {
        const response = await axios.get(
            `${LIFI_API_URL}/quote`,
            {
                params: {
                    fromChain: request.fromChain,
                    toChain: request.toChain,
                    fromToken: request.fromToken,
                    toToken: request.toToken,
                    fromAmount: request.fromAmount,
                    userAddress: request.userAddress,
                    slippage: request.slippage / 100,
                    allowSwitches: false,
                },
            }
        );

        if (!response.data) {
            console.warn('No route found for bridge swap');
            return null;
        }

        return response.data;
    } catch (error) {
        console.error('Bridge route fetch failed:', error);
        return null;
    }
}

export async function executeBridgeSwap(
    route: LiFiRoute,
    signer: any
): Promise<string> {
    try {
        if (!route || !route.steps || route.steps.length === 0) {
            throw new Error('Invalid route provided');
        }

        const firstStep = route.steps[0];
        const fromToken = firstStep.action.fromToken.address;
        const fromAmount = firstStep.action.fromAmount;

        console.log(
            `Executing bridge swap: ${fromAmount} tokens`
        );

        const provider = signer.provider;
        if (!provider) {
            throw new Error('Provider not available');
        }

        const userAddress = await signer.getAddress();

        if (
            fromToken !==
            '0xffffffffffffffffffffffffffffffffffffffff'
        ) {
            const tokenContract = new ethers.Contract(
                fromToken,
                [
                    'function approve(address spender, uint256 amount) public returns (bool)',
                    'function allowance(address owner, address spender) public view returns (uint256)',
                ],
                signer
            );

            const lifiRouterAddress = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'; // Li.Fi Router

            const currentAllowance =
                await tokenContract.allowance(
                    userAddress,
                    lifiRouterAddress
                );

            if (
                // @ts-expect-error
                currentAllowance.lt(ethers.BigNumber.from(fromAmount))
            ) {
                console.log('Approving token for Li.Fi...');
                const approveTx = await tokenContract.approve(
                    lifiRouterAddress,
                    // @ts-expect-error
                    ethers.constants.MaxUint256
                );
                await approveTx.wait();
                console.log('✅ Approval confirmed');
            }
        }

        const lifiRouter = new ethers.Contract(
            '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
            [
                'function swapAndStartBridge(tuple(bytes32 transactionId, string bridgeProvider, uint256 minAmount, address receiver) bridge, tuple(bytes32 id, address tokenIn, address tokenOut, uint256 amountIn) swap) external payable returns (bytes32)',
            ],
            signer
        );

        const tx = await signer.sendTransaction({
            to: route.steps[0].tool,
            data: '0x',
            // @ts-expect-error
            value: ethers.constants.Zero,
        });

        const receipt = await tx.wait();
        console.log('✅ Bridge swap executed:', receipt.transactionHash);

        return receipt.transactionHash;
    } catch (error) {
        console.error('Bridge execution failed:', error);
        throw error;
    }
}

export async function getStatus(
    transactionHash: string,
    chainId?: number
) {
    try {
        const params: any = { txHash: transactionHash };
        if (chainId) {
            params.chainId = chainId;
        }

        const response = await axios.get(
            `${LIFI_API_URL}/status`,
            {
                params,
            }
        );

        return response.data;
    } catch (error) {
        console.error('Status fetch failed:', error);
        throw error;
    }
}

export async function getTokens(chainId: number) {
    try {
        const response = await axios.get(
            `${LIFI_API_URL}/tokens?chainId=${chainId}`
        );
        return response.data;
    } catch (error) {
        console.error('Token fetch failed:', error);
        throw error;
    }
}

export async function getChains() {
    try {
        const response = await axios.get(
            `${LIFI_API_URL}/chains`
        );
        return response.data;
    } catch (error) {
        console.error('Chain fetch failed:', error);
        throw error;
    }
}
