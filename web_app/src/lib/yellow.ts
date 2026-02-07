import { TradeIntent, SettlementData } from "./types";

const YELLOW_API_URL =
    process.env.NEXT_PUBLIC_YELLOW_API_URL ||
    "https://api.yellownetwork.io";

interface YellowTradeResponse {
    success: boolean;
    signature: string;
    nonce: number;
}

export class YellowNetworkClient {
    private apiUrl: string;
    private sessionToken: string | null = null;

    constructor() {
        this.apiUrl = YELLOW_API_URL;
    }

    async initialize(userAddress: string): Promise<void> {
        try {
            const response = await fetch(
                `${this.apiUrl}/v1/auth/init`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: userAddress }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Auth init failed: ${response.statusText}`
                );
            }

            const data = await response.json();
            this.sessionToken = data.token;
        } catch (error) {
            console.error("Yellow initialization failed:", error);
            throw error;
        }
    }

    async createSession(
        userAddress: string,
        amount: bigint,
        duration: number
    ): Promise<{ sessionId: string; tx: string }> {
        if (!this.sessionToken) {
            throw new Error("Client not initialized");
        }

        try {
            const response = await fetch(
                `${this.apiUrl}/v1/sessions/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.sessionToken}`,
                    },
                    body: JSON.stringify({
                        userAddress,
                        amount: amount.toString(),
                        duration,
                        chainId: 1,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Session creation failed: ${response.statusText}`
                );
            }

            const data = await response.json();
            return {
                sessionId: data.sessionId,
                tx: data.transactionHash,
            };
        } catch (error) {
            console.error("Session creation failed:", error);
            throw error;
        }
    }

    async submitTradeIntent(
        intent: TradeIntent,
        signature: string
    ): Promise<YellowTradeResponse> {
        if (!this.sessionToken) {
            throw new Error("Client not initialized");
        }

        try {
            const response = await fetch(
                `${this.apiUrl}/v1/trades/intent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.sessionToken}`,
                    },
                    body: JSON.stringify({
                        sessionId: intent.sessionId,
                        market: intent.market.address,
                        type: intent.type,
                        size: intent.size.toString(),
                        timestamp: intent.timestamp,
                        nonce: intent.nonce,
                        signature,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Trade intent submission failed: ${response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            console.error("Trade intent submission failed:", error);
            throw error;
        }
    }

    async getSessionBalance(sessionId: string): Promise<bigint> {
        if (!this.sessionToken) {
            throw new Error("Client not initialized");
        }

        try {
            const response = await fetch(
                `${this.apiUrl}/v1/sessions/${sessionId}/balance`,
                {
                    headers: {
                        Authorization: `Bearer ${this.sessionToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Balance fetch failed: ${response.statusText}`
                );
            }

            const data = await response.json();
            return BigInt(data.balance);
        } catch (error) {
            console.error("Balance fetch failed:", error);
            throw error;
        }
    }

    async settleSession(settlement: SettlementData): Promise<string> {
        if (!this.sessionToken) {
            throw new Error("Client not initialized");
        }

        try {
            const response = await fetch(
                `${this.apiUrl}/v1/sessions/settle`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.sessionToken}`,
                    },
                    body: JSON.stringify({
                        sessionId: settlement.sessionId,
                        finalBalance: settlement.finalBalance.toString(),
                        totalPnL: settlement.totalPnL.toString(),
                        signature: settlement.signature,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Settlement failed: ${response.statusText}`
                );
            }

            const data = await response.json();
            return data.transactionHash;
        } catch (error) {
            console.error("Settlement failed:", error);
            throw error;
        }
    }
}

export const yellowClient = new YellowNetworkClient();
