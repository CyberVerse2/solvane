"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  openWalletModal,
  restoreWallet,
  disconnectWallet,
  walletName,
  WalletError,
} from "@/lib/wallet-kit";
import { getXlmBalance } from "@/lib/horizon";

interface WalletState {
  address: string | null;
  walletId: string | null;
  walletLabel: string;
  balance: number | null; // null = account not funded
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const Ctx = createContext<WalletState | null>(null);
const KEY = "solvane:wallet";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async (addr: string) => {
    try {
      setBalance(await getXlmBalance(addr));
    } catch {
      setBalance(null);
    }
  }, []);

  // Restore a prior session (no prompt) on first load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY);
    if (!saved) return;
    try {
      const { address: addr, walletId: id } = JSON.parse(saved) as {
        address: string;
        walletId: string | null;
      };
      restoreWallet(id ?? "", addr).then((a) => {
        setAddress(a);
        setWalletId(id);
        loadBalance(a);
      });
    } catch {
      localStorage.removeItem(KEY);
    }
  }, [loadBalance]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { address: addr, walletId: id } = await openWalletModal();
      setAddress(addr);
      setWalletId(id);
      localStorage.setItem(KEY, JSON.stringify({ address: addr, walletId: id }));
      await loadBalance(addr);
    } catch (e) {
      setError(e instanceof WalletError ? e.message : "Failed to connect.");
    } finally {
      setConnecting(false);
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
    setWalletId(null);
    setBalance(null);
    setError(null);
    localStorage.removeItem(KEY);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) await loadBalance(address);
  }, [address, loadBalance]);

  return (
    <Ctx.Provider
      value={{
        address,
        walletId,
        walletLabel: walletName(walletId),
        balance,
        connecting,
        error,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
