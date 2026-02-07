export interface Market {
    id: string;
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    chainId: number;
}

export interface Position {
    id: string;
    market: Market;
    type: "long" | "short";
    entry: number;
    current: number;
    pnl: number;
    pnlPercent: number;
    createdAt: Date;
    size: bigint;
}

export interface SessionState {
    id: string;
    userId: string;
    balance: bigint;
    initialDeposit: bigint;
    startTime: Date;
    sessionDuration: number;
    riskLevel: number;
    positions: Position[];
    agentEnabled: boolean;
    chainId: number;
    settlementPending: boolean;
    nonce: number;
}

export interface TradeIntent {
    sessionId: string;
    market: Market;
    type: "long" | "short";
    size: bigint;
    timestamp: number;
    nonce: number;
    signature?: string;
}

export interface SettlementData {
    sessionId: string;
    finalBalance: bigint;
    positions: Position[];
    totalPnL: bigint;
    signature: string;
}