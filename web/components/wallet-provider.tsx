"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { connect as fConnect, restore, WalletError } from "@/lib/freighter";
import { getXlmBalance } from "@/lib/horizon";

interface WalletState {
  address: string | null;
  balance: number | null; // null = account not funded
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const Ctx = createContext<WalletState | null>(null);
const STORAGE_KEY = "solvane:wallet-connected";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
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

  // Restore an existing session on first load (no prompt).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) !== "1") return;
    restore().then((addr) => {
      if (addr) {
        setAddress(addr);
        loadBalance(addr);
      }
    });
  }, [loadBalance]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const { address: addr } = await fConnect();
      setAddress(addr);
      localStorage.setItem(STORAGE_KEY, "1");
      await loadBalance(addr);
    } catch (e) {
      setError(e instanceof WalletError ? e.message : "Failed to connect.");
    } finally {
      setConnecting(false);
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) await loadBalance(address);
  }, [address, loadBalance]);

  return (
    <Ctx.Provider
      value={{ address, balance, connecting, error, connect, disconnect, refreshBalance }}
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
