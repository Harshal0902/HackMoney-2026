/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SessionState, Position, Market } from "./types";
import { calculatePnL } from "./priceOracle";

interface AgentDecision {
    action: "hold" | "close_position" | "open_position";
    positionId?: string;
    market?: Market;
    type?: "long" | "short";
    reason: string;
}

export class TradingAgent {
    private sessionState: SessionState;
    private checkInterval: NodeJS.Timer | null = null;

    constructor(session: SessionState) {
        this.sessionState = session;
    }

    async evaluatePositions(): Promise<AgentDecision[]> {
        const decisions: AgentDecision[] = [];

        for (const position of this.sessionState.positions) {
            const decision = await this.evaluatePosition(position);
            if (decision) {
                decisions.push(decision);
            }
        }

        return decisions;
    }

    private async evaluatePosition(
        position: Position
    ): Promise<AgentDecision | null> {
        const { pnl, pnlPercent } = calculatePnL(
            position.entry,
            position.current,
            position.type
        );

        if (pnlPercent > 5) {
            return {
                action: "close_position",
                positionId: position.id,
                reason: "Profit target reached (5%)",
            };
        }

        if (pnlPercent < -3) {
            return {
                action: "close_position",
                positionId: position.id,
                reason: "Stop loss triggered (-3%)",
            };
        }

        if (pnlPercent < -2 && Math.abs(pnlPercent) > 4) {
            return {
                action: "open_position",
                market: position.market,
                type: position.type === "long" ? "short" : "long",
                reason: "Momentum reversal detected",
            };
        }

        return null;
    }

    async executeDecision(decision: AgentDecision): Promise<void> {
        switch (decision.action) {
            case "close_position":
                console.log(
                    `🤖 Agent closing position ${decision.positionId}: ${decision.reason}`
                );
                break;
            case "open_position":
                console.log(
                    `🤖 Agent opening ${decision.type} on ${decision.market?.symbol}: ${decision.reason}`
                );
                break;
            case "hold":
                console.log(`🤖 Agent holding: ${decision.reason}`);
                break;
        }
    }

    startAutoTrading(intervalMs: number = 5000) {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(async () => {
            const decisions = await this.evaluatePositions();
            for (const decision of decisions) {
                await this.executeDecision(decision);
            }
        }, intervalMs);

        console.log(
            `🤖 Agent auto-trading started (check every ${intervalMs}ms)`
        );
    }

    stopAutoTrading() {
        if (this.checkInterval) {
            // @ts-expect-error
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log("🤖 Agent auto-trading stopped");
        }
    }
}