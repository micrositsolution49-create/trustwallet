import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";

import {
  fetchCryptoPrices,
  getNativeBalance,
  getTokenBalance,
  TokenConfig,
  TOKENS_CONFIG,
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
  updateTokenBalanceLocally: (
    fromSymbol: string,
    toSymbol: string,
    spentAmount: number,
    receivedAmount: number,
  ) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ----------------------------------------------------
// Promise pool
// ----------------------------------------------------

async function promisePool<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);

    const chunkResults = await Promise.all(chunk.map(fn));

    results.push(...chunkResults);
  }

  return results;
}

// ----------------------------------------------------
// Wallet Provider
// ----------------------------------------------------

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAuth();

  const [tokens, setTokens] = useState<DisplayToken[]>([]);

  const [totalBalanceUSD, setTotalBalanceUSD] = useState("$0.00");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<string>("");

  // --------------------------------------------------
  // Load wallet data
  // --------------------------------------------------

  const loadWalletData = useCallback(
    async (isBackground = false) => {
      if (!address) {
        setTokens([]);
        setTotalBalanceUSD("$0.00");
        return;
      }

      if (!isBackground) {
        setLoading(true);
      }

      setError(null);

      try {
        // --------------------------------------------
        // Fetch live market prices
        // --------------------------------------------

        const prices = await fetchCryptoPrices();

        // --------------------------------------------
        // Fetch wallet balances
        // --------------------------------------------

        const results = await promisePool(
          TOKENS_CONFIG,
          3,
          async (token): Promise<DisplayToken> => {
            let rawBalance = "0";

            // ------------------------------------------
            // Native token
            // ------------------------------------------

            if (token.type === "native") {
              rawBalance = await getNativeBalance(address, token.network);
            }

            // ------------------------------------------
            // ERC20 token
            // ------------------------------------------
            else {
              if (!token.contractAddress) {
                console.warn(`Skipping ${token.symbol}: contract address missing`);

                rawBalance = "0";
              } else {
                rawBalance = await getTokenBalance(address, token);
              }
            }

            // ------------------------------------------
            // Market price
            // ------------------------------------------

            const marketData = prices?.[token.coingeckoId];

            let price = marketData ? Number(marketData.usd) : 0;

            // USDC fallback
            if (
              token.symbol?.toUpperCase() === "USDC" ||
              token.name?.toLowerCase().includes("usd coin")
            ) {
              if (!price || price <= 0) {
                price = 1;
              }
            }

            const priceChange = marketData ? Number(marketData.usd_24h_change) : 0;

            const balanceNum = parseFloat(rawBalance) || 0;

            const balanceUSDNum = balanceNum * price;

            // ------------------------------------------
            // Return display token
            // ------------------------------------------

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
          },
        );

        // --------------------------------------------
        // Total wallet value
        // --------------------------------------------

        const total = results.reduce((sum, token) => sum + (token._usdValue || 0), 0);

        setTokens(results);

        setTotalBalanceUSD(
          `$${total.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        );

        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err: any) {
        console.error("Failed to load wallet data:", err);

        setError(err?.message || "Failed to fetch wallet balances. Please check your connection.");
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [address],
  );

  // --------------------------------------------------
  // Local balance update after swap
  // --------------------------------------------------

  const updateTokenBalanceLocally = (
    fromSymbol: string,
    toSymbol: string,
    spentAmount: number,
    receivedAmount: number,
  ) => {
    setTokens((prevTokens) => {
      const updated = prevTokens.map((token) => {
        let newRaw = parseFloat(token.rawBalance || "0");

        if (token.symbol.toUpperCase() === fromSymbol.toUpperCase()) {
          newRaw = Math.max(0, newRaw - spentAmount);
        }

        if (token.symbol.toUpperCase() === toSymbol.toUpperCase()) {
          newRaw = newRaw + receivedAmount;
        }

        const newUsdNum = newRaw * token.price;

        return {
          ...token,

          rawBalance: newRaw.toString(),

          _usdValue: newUsdNum,

          balanceUSD: `$${newUsdNum.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}`,
        };
      });

      const newTotal = updated.reduce((sum, token) => sum + token._usdValue, 0);

      setTotalBalanceUSD(
        `$${newTotal.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      );

      return updated;
    });
  };

  // --------------------------------------------------
  // Initial wallet load
  // --------------------------------------------------

  useEffect(() => {
    if (address) {
      loadWalletData();
    }
  }, [address, loadWalletData]);

  return (
    <WalletContext.Provider
      value={{
        tokens,
        totalBalanceUSD,
        loading,
        error,
        lastUpdated,
        loadWalletData,
        updateTokenBalanceLocally,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ----------------------------------------------------
// Hook
// ----------------------------------------------------

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return context;
}
