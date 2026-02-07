import { ethers } from "ethers";

const UNISWAP_V4_ROUTER = process.env
    .NEXT_PUBLIC_UNISWAP_V4_ROUTER!;
// const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

const UNISWAP_V4_ROUTER_ABI = [
    {
        type: "function",
        name: "swapExactInputSingle",
        inputs: [
            {
                name: "params",
                type: "tuple",
                components: [
                    { name: "poolKey", type: "tuple" },
                    { name: "amountIn", type: "uint256" },
                    { name: "minAmountOut", type: "uint256" },
                ],
            },
        ],
        outputs: [{ name: "amountOut", type: "uint256" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "quoteExactInputSingle",
        inputs: [
            {
                name: "params",
                type: "tuple",
                components: [
                    { name: "poolKey", type: "tuple" },
                    { name: "amountIn", type: "uint256" },
                ],
            },
        ],
        outputs: [{ name: "amountOut", type: "uint256" }],
        stateMutability: "view",
    },
];

export class UniswapV4Client {
    private provider: ethers.Provider;
    private signer: ethers.Signer | null = null;
    private router: ethers.Contract | null = null;

    constructor(rpcUrl: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    async initialize(signer: ethers.Signer) {
        this.signer = signer;
        this.router = new ethers.Contract(
            UNISWAP_V4_ROUTER,
            UNISWAP_V4_ROUTER_ABI,
            signer
        );
    }

    async simulateSwap(
        tokenIn: string,
        tokenOut: string,
        amount: bigint
    ): Promise<bigint> {
        if (!this.router) {
            throw new Error("Client not initialized");
        }

        try {
            console.log(
                `Simulating swap: ${amount} of ${tokenIn} to ${tokenOut}`
            );
            return amount;
        } catch (error) {
            console.error("Swap simulation failed:", error);
            throw error;
        }
    }

    async executeSwap(
        tokenIn: string,
        tokenOut: string,
        amount: bigint,
        minOutput: bigint
    ): Promise<string> {
        if (!this.router || !this.signer) {
            throw new Error("Client not initialized");
        }

        try {
            const tx = await this.router.swapExactInputSingle({
                poolKey: {
                    currency0: tokenIn,
                    currency1: tokenOut,
                    fee: 3000,
                    tickSpacing: 60,
                    hooks: ethers.ZeroAddress,
                },
                amountIn: amount,
                minAmountOut: minOutput,
            });

            const receipt = await tx.wait();
            return receipt?.transactionHash || "";
        } catch (error) {
            console.error("Swap execution failed:", error);
            throw error;
        }
    }
}

export const uniswapClient = new UniswapV4Client(
    process.env.NEXT_PUBLIC_RPC_URL!
);