import { Market } from "./types";

export const MARKETS: Record<string, Market> = {
    BTC: {
        id: "btc",
        name: "Bitcoin",
        symbol: "BTC",
        address: "0x2260fac5e5542a773aa44fbcff2b3cba05b67b20", // WBTC
        decimals: 8,
        chainId: 1,
    },
    ETH: {
        id: "eth",
        name: "Ethereum",
        symbol: "ETH",
        address: "0xc02aaa39b223fe8d0a0e8e4f27ead9083c756cc2", // WETH
        decimals: 18,
        chainId: 1,
    },
    SOL: {
        id: "sol",
        name: "Solana",
        symbol: "SOL",
        address: "0xd31a59729e6e51adf1626f7a9993eb7aff663d1f", // Portal Wrapped Solana
        decimals: 8,
        chainId: 1,
    },
    ARB: {
        id: "arb",
        name: "Arbitrum",
        symbol: "ARB",
        address: "0xb50721bcf8d956c20dda5d4b2fee37e0cc87a735", // ARB
        decimals: 18,
        chainId: 1,
    },
};

export function getMarketBySymbol(symbol: string): Market | null {
    return MARKETS[symbol] || null;
}

export function getAllMarkets(): Market[] {
    return Object.values(MARKETS);
}