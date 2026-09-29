import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchCryptoPrices,
  getNativeBalance,
  getTokenBalance,
  TOKENS_CONFIG,
  TokenConfig,
} from "@/services/cryptoService";

interface DisplayToken extends TokenConfig {
  rawBalance: string;
  balanceUSD: string;
  price: number;
  change: string;
  isUp: boolean;
  _usdValue: number;
}

interface WalletContextType {
  tokens: DisplayToken[];
  totalBalanceUSD: string;
  loading: boolean;
  error: string | null;
  lastUpdated: string;
  loadWalletData: (isBackground?: boolean) => Promise<void>;
  updateTokenBalanceLocally: (fromSymbol: string, toSymbol: string, spentAmount: number, receivedAmount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Helper function to process token requests in batches (avoids RPC rate-limiting/429 errors)
async function promisePool<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  let results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results = results.concat(chunkResults);
  }
  return results;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAuth();
  const [tokens, setTokens] = useState<DisplayToken[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState("$0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadWalletData = useCallback(async (isBackground = false) => {
    if (!address) return;
    if (!isBackground) setLoading(true);
    setError(null); // Clear previous errors on a fresh attempt

    try {
      const prices = await fetchCryptoPrices();

      // Process token balance checks in chunks of 3 to protect RPC nodes
      const results = await promisePool(TOKENS_CONFIG, 3, async (token) => {
        const rawBalance =
          token.type === "native"
            ? await getNativeBalance(address, token.network)
            : await getTokenBalance(address, token.contractAddress!, token.network);

        const marketData = prices?.[token.coingeckoId];
        let price = marketData ? marketData.usd : 0;
        
        if (token.symbol?.toUpperCase() === "USDC" || token.name?.toLowerCase().includes("usd coin")) {
          price = price > 0 ? price : 1.0;
        }

        const priceChange = marketData ? marketData.usd_24h_change : 0;
        const balanceNum = parseFloat(rawBalance) || 0;
        const balanceUSDNum = balanceNum * price;

        return {
          ...token,
          rawBalance,
          price,
          balanceUSD: `$${balanceUSDNum.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}`,
          change: `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
          isUp: priceChange >= 0,
          _usdValue: balanceUSDNum,
        };
      });

      const total = results.reduce((sum, t) => sum + t._usdValue, 0);

      setTokens(results);
      setTotalBalanceUSD(
        `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      );
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Failed to load wallet data:", err);
      setError(err.message || "Failed to fetch wallet balances. Please check your connection.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [address]);

  // Instant local update function for swaps
  const updateTokenBalanceLocally = (fromSymbol: string, toSymbol: string, spentAmount: number, receivedAmount: number) => {
    setTokens((prevTokens) => {
      const updated = prevTokens.map((token) => {
        let newRaw = parseFloat(token.rawBalance || "0");
        if (token.symbol === fromSymbol) {
          newRaw = Math.max(0, newRaw - spentAmount);
        } else if (token.symbol === toSymbol) {
          newRaw = newRaw + receivedAmount;
        }
        const newUsdNum = newRaw * token.price;
        return {
          ...token,
          rawBalance: newRaw.toString(),
          _usdValue: newUsdNum,
          balanceUSD: `$${newUsdNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
        };
      });

      const newTotal = updated.reduce((sum, t) => sum + t._usdValue, 0);
      setTotalBalanceUSD(`$${newTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return updated;
    });
  };

  useEffect(() => {
    if (address) loadWalletData();
  }, [address, loadWalletData]);

  return (
    <WalletContext.Provider value={{ tokens, totalBalanceUSD, loading, error, lastUpdated, loadWalletData, updateTokenBalanceLocally }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}