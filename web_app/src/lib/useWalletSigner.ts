/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWalletClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { useMemo } from "react";

export function useWalletSigner() {
    const { data: walletClient } = useWalletClient();

    const signer = useMemo(() => {
        if (!walletClient) return null;

        const provider = new BrowserProvider(
            walletClient.transport as any
        );
        return provider.getSigner();
    }, [walletClient]);

    return signer;
}
