import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getStoredWallet } from "@/services/walletService";

interface AuthContextType {
  hasWallet: boolean;
  unlocked: boolean;
  isReady: boolean;
  address: string | null;
  refresh: () => Promise<void>;
  unlock: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType>({
  hasWallet: false,
  unlocked: false,
  isReady: false,
  address: null,
  refresh: async () => {},
  unlock: () => {},
  lock: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasWallet, setHasWallet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const storedAddress = await getStoredWallet();
      setHasWallet(!!storedAddress);
      setAddress(storedAddress);
    } catch (error) {
      console.error("Failed to load stored wallet:", error);
    } finally {
      setIsReady(true); // Ensures isReady always flips to true even if storage fails
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(() => setUnlocked(true), []);
  const lock = useCallback(() => setUnlocked(false), []);

  return (
    <AuthContext.Provider
      value={{ hasWallet, unlocked, isReady, address, refresh, unlock, lock }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
