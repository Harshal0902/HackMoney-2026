/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SessionState, SettlementData } from "./types";
import { yellowClient } from "./yellow";
import { ethers } from "ethers";

export async function prepareSettlement(
    session: SessionState,
    userAddress: string
): Promise<SettlementData> {
    const totalPnL = session.positions.reduce(
        (sum, pos) => sum + BigInt(Math.floor(pos.pnl * 1e18)),
        // @ts-expect-error
        0n
    );

    const finalBalance = session.balance + totalPnL;

    const settlementHash = ethers.solidityPackedKeccak256(
        ["string", "uint256", "uint256", "uint256"],
        [
            session.id,
            finalBalance,
            totalPnL,
            Math.floor(Date.now() / 1000),
        ]
    );

    return {
        sessionId: session.id,
        finalBalance,
        positions: session.positions,
        totalPnL,
        signature: settlementHash,
    };
}

export async function submitSettlement(
    settlement: SettlementData
): Promise<string> {
    return yellowClient.settleSession(settlement);
}