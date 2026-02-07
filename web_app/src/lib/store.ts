import { create } from "zustand";
import { SessionState, Position } from "./types";

interface StoreState {
    session: SessionState | null;
    setSession: (session: SessionState) => void;
    updateBalance: (amount: bigint) => void;
    addPosition: (position: Position) => void;
    removePosition: (positionId: string) => void;
    updatePositionPnL: (positionId: string, pnl: number, pnlPercent: number) => void;
    setAgentEnabled: (enabled: boolean) => void;
    updateRiskLevel: (risk: number) => void;
    setSettlementPending: (pending: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
    session: null,
    setSession: (session) => set({ session }),
    updateBalance: (amount) =>
        set((state) => ({
            session: state.session ? { ...state.session, balance: amount } : null,
        })),
    addPosition: (position) =>
        set((state) => ({
            session: state.session
                ? {
                    ...state.session,
                    positions: [position, ...state.session.positions],
                }
                : null,
        })),
    removePosition: (positionId) =>
        set((state) => ({
            session: state.session
                ? {
                    ...state.session,
                    positions: state.session.positions.filter(
                        (p) => p.id !== positionId
                    ),
                }
                : null,
        })),
    updatePositionPnL: (positionId, pnl, pnlPercent) =>
        set((state) => ({
            session: state.session
                ? {
                    ...state.session,
                    positions: state.session.positions.map((p) =>
                        p.id === positionId ? { ...p, pnl, pnlPercent } : p
                    ),
                }
                : null,
        })),
    setAgentEnabled: (enabled) =>
        set((state) => ({
            session: state.session
                ? { ...state.session, agentEnabled: enabled }
                : null,
        })),
    updateRiskLevel: (risk) =>
        set((state) => ({
            session: state.session
                ? { ...state.session, riskLevel: risk }
                : null,
        })),
    setSettlementPending: (pending) =>
        set((state) => ({
            session: state.session
                ? { ...state.session, settlementPending: pending }
                : null,
        })),
}));
