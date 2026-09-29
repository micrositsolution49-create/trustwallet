import { ethers } from "ethers";

export interface TokenConfig {
  id: string;
  coingeckoId: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  type: "native" | "token";
  network: keyof typeof NETWORKS;
  contractAddress?: string;

  // Binance public market symbol
  marketSymbol?: string;
}

export const NETWORKS = {
  bsc: {
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    symbol: "BNB",
    chainId: 97,
  },

  localhost: {
    name: "Local Hardhat",
    rpcUrl: "http://192.168.1.34:8545",
    symbol: "ETH",
    chainId: 31337,
  },
};

export const TOKENS_CONFIG: TokenConfig[] = [
  {
    id: "1",
    coingeckoId: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    icon: "ethereum",
    color: "#627EEA",
    type: "native",
    network: "localhost",

    // Binance market
    marketSymbol: "ETHUSDT",
  },

  {
    id: "2",
    coingeckoId: "usd-coin",
    name: "USD Coin",
    symbol: "USDC",
    icon: "currency-usd",
    color: "#2775CA",
    type: "token",
    network: "localhost",
    contractAddress: "0x5fbdb2315678afecb367f032d93f642f64180aa3",

    // Binance market
    marketSymbol: "USDCUSDT",
  },
];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

/**
 * ----------------------------------------------------
 * BINANCE PUBLIC MARKET DATA
 * No API key required
 * ----------------------------------------------------
 */

export interface CryptoPrice {
  usd: number;
  usd_24h_change: number;
}

/**
 * Fetch crypto prices from Binance public API.
 *
 * Returns data in the same format that the old
 * CoinGecko function returned so existing code
 * does not need major changes.
 */
export async function fetchCryptoPrices() {
  const symbols: Record<string, string> = {
    bitcoin: "BTCUSDT",
    ethereum: "ETHUSDT",
    binancecoin: "BNBUSDT",
    solana: "SOLUSDT",
    ripple: "XRPUSDT",
    cardano: "ADAUSDT",
    dogecoin: "DOGEUSDT",
    polkadot: "DOTUSDT",
    "avalanche-2": "AVAXUSDT",
    chainlink: "LINKUSDT",
    "usd-coin": "USDCUSDT",
  };

  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Binance status:", response.status);

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Binance API failed: ${response.status}`);
    }

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Binance returned invalid JSON");
    }

    if (!Array.isArray(data)) {
      throw new Error("Invalid Binance market response");
    }

    const result: Record<
      string,
      {
        usd: number;
        usd_24h_change: number;
      }
    > = {};

    Object.entries(symbols).forEach(([coinId, symbol]) => {
      const ticker = data.find((item: any) => item.symbol === symbol);

      if (!ticker) {
        return;
      }

      result[coinId] = {
        usd: Number(ticker.lastPrice),
        usd_24h_change: Number(ticker.priceChangePercent),
      };
    });

    console.log("Live crypto prices:", result);

    return result;
  } catch (error) {
    console.error("Live market API error:", error);

    return {};
  }
}
export async function fetchUsdtInrRate(): Promise<number> {
  try {
    const response = await fetch("https://biquote.io/api/USDINR", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`USD/INR API failed: ${response.status}`);
    }

    const data = await response.json();

    const rate = Number(data?.mid);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid USD/INR rate");
    }

    console.log("Live USD/INR rate:", rate);

    return rate;
  } catch (error) {
    console.error("Failed to fetch USD/INR rate:", error);

    // Fallback only if live rate is unavailable
    return 96;
  }
}

/**
 * ----------------------------------------------------
 * NETWORK PROVIDER
 * ----------------------------------------------------
 */

function getProvider(network: keyof typeof NETWORKS): ethers.JsonRpcProvider {
  const config = NETWORKS[network];

  const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
    name: config.name,
    chainId: config.chainId,
  });

  return provider;
}

/**
 * ----------------------------------------------------
 * NATIVE TOKEN BALANCE
 * ----------------------------------------------------
 */

export async function getNativeBalance(
  address: string,
  network: keyof typeof NETWORKS = "localhost",
): Promise<string> {
  try {
    const provider = getProvider(network);

    const balance = await provider.getBalance(address);

    const formattedBalance = ethers.formatEther(balance);

    console.log(`Fetched ${NETWORKS[network].symbol} Balance for ${address}:`, formattedBalance);

    return formattedBalance;
  } catch (error) {
    console.error(`Failed to fetch native balance for ${address}:`, error);

    return "0";
  }
}

/**
 * ----------------------------------------------------
 * ERC20 TOKEN BALANCE
 * ----------------------------------------------------
 */

export async function getTokenBalance(address: string, token: TokenConfig): Promise<string> {
  try {
    if (!token.contractAddress) {
      throw new Error(`Contract address missing for ${token.symbol}`);
    }

    const provider = getProvider(token.network);

    const contract = new ethers.Contract(token.contractAddress, ERC20_ABI, provider);

    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();

    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log(`Fetched ${token.symbol} Balance for ${address}:`, formattedBalance);

    return formattedBalance;
  } catch (error) {
    console.error(`Failed to fetch ${token.symbol} balance:`, error);

    return "0";
  }
}

/**
 * ----------------------------------------------------
 * SEND NATIVE TRANSACTION
 * ----------------------------------------------------
 */

export async function sendNativeTransaction(
  privateKey: string,
  to: string,
  amount: string,
  network: keyof typeof NETWORKS = "localhost",
) {
  try {
    const provider = getProvider(network);

    const wallet = new ethers.Wallet(privateKey, provider);

    const transaction = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });

    console.log("Transaction submitted:", transaction.hash);

    const receipt = await transaction.wait();

    console.log("Transaction confirmed:", receipt?.hash);

    return receipt;
  } catch (error) {
    console.error("Native transaction failed:", error);

    throw error;
  }
}
