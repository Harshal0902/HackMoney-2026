import axios from "axios";

const LIFI_API_URL = "https://li.quest/v1";

interface BridgeRequest {
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    userAddress: string;
    slippage: number;
}

export async function getBestBridgeRoute(
    request: BridgeRequest
) {
    try {
        const response = await axios.get(`${LIFI_API_URL}/quote`, {
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
        });

        return response.data;
    } catch (error) {
        console.error("Bridge route fetch failed:", error);
        throw error;
    }
}

export async function getStatus(transactionHash: string) {
    try {
        const response = await axios.get(
            `${LIFI_API_URL}/status`,
            {
                params: { txHash: transactionHash },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Status fetch failed:", error);
        throw error;
    }
}