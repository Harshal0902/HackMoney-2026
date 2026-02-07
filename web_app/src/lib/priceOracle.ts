import axios from "axios";

interface PriceData {
    symbol: string;
    price: number;
    change24h: number;
    timestamp: number;
}

const COINGECKO_API = "https://api.coingecko.com/api/v3";

const COINGECKO_IDS: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    ARB: "arbitrum",
};

export async function fetchMarketPrice(
    symbol: string
): Promise<PriceData> {
    const id = COINGECKO_IDS[symbol];
    if (!id) throw new Error(`Unknown symbol: ${symbol}`);

    try {
        const response = await axios.get(
            `${COINGECKO_API}/simple/price`,
            {
                params: {
                    ids: id,
                    vs_currencies: "usd",
                    include_24hr_change: true,
                },
            }
        );

        const priceData = response.data[id];
        return {
            symbol,
            price: priceData.usd,
            change24h: priceData.usd_24h_change,
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        throw error;
    }
}

export async function fetchMultiplePrices(
    symbols: string[]
): Promise<PriceData[]> {
    return Promise.all(
        symbols.map((symbol) => fetchMarketPrice(symbol))
    );
}

export function calculatePnL(
    entry: number,
    current: number,
    type: "long" | "short"
): { pnl: number; pnlPercent: number } {
    const priceDiff = current - entry;
    const pnl = type === "long" ? priceDiff : -priceDiff;
    const pnlPercent = (pnl / entry) * 100;

    return { pnl, pnlPercent };
}