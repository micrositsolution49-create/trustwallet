import { getStoredWallet } from "@/services/walletService";
import React, { createContext, useCallback, useContext, useState } from "react";

interface WalletContextType {
  address: string | null;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  refreshWallet: async () => {},
});

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    const stored = await getStoredWallet();
    setAddress(stored);
  }, []);

  return (
    <WalletContext.Provider value={{ address, refreshWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
