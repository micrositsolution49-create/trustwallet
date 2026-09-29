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
    rpcUrl: "http://192.168.1.36:8545",
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
  },
];

// ---- Global Standard ABIs ----
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export async function fetchCryptoPrices() {
  try {
    const ids = TOKENS_CONFIG.map((t) => t.coingeckoId).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    );
    const data = await response.json();
    
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Empty response from CoinGecko");
    }
    
    return data;
  } catch (error) {
    console.warn("Using development fallback prices due to API limit/network:", error);
    return {
      ethereum: { usd: 2648.50, usd_24h_change: 2.45 },
      "usd-coin": { usd: 1.0, usd_24h_change: 0.0 },
    };
  }
}

export const getNativeBalance = async (
  address: string,
  network: keyof typeof NETWORKS,
): Promise<string> => {
  try {
    const netConfig = NETWORKS[network];
    const customNetwork = new ethers.Network(netConfig.name, Number(netConfig.chainId));
    (customNetwork as any).ensAddress = null;

    const provider = new ethers.JsonRpcProvider(netConfig.rpcUrl, customNetwork, {
      staticNetwork: true,
    });

    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei);
  } catch (error) {
    console.error(`Failed to fetch ${network} balance:`, error);
    return "0";
  }
};

export const getTokenBalance = async (
  walletAddress: string,
  tokenContractAddress: string,
  network: keyof typeof NETWORKS
): Promise<string> => {
  try {
    const netConfig = NETWORKS[network];
    const cleanTokenAddress = tokenContractAddress.trim();
    const cleanWalletAddress = walletAddress.trim();

    const customNetwork = new ethers.Network(netConfig.name, Number(netConfig.chainId));
    (customNetwork as any).ensAddress = null;

    const provider = new ethers.JsonRpcProvider(netConfig.rpcUrl, customNetwork, {
      staticNetwork: true,
    });

    const contract = new ethers.Contract(cleanTokenAddress, ERC20_ABI, provider);

    const [rawBalance, decimals] = await Promise.all([
      contract.balanceOf(cleanWalletAddress),
      contract.decimals(),
    ]);

    console.log(`Fetched Balance for ${cleanWalletAddress}:`, rawBalance.toString());

    return ethers.formatUnits(rawBalance, decimals);
  } catch (error) {
    console.error("Failed to fetch token balance via ethers contract:", error);
    return "0";
  }
};

// ---- Send Transaction (Native Assets like ETH / BNB) ----
export interface SendTransactionParams {
  privateKey: string;
  toAddress: string;
  amount: string; // human-readable string (e.g. "0.1")
  network: keyof typeof NETWORKS;
}

export async function sendNativeTransaction({
  privateKey,
  toAddress,
  amount,
  network,
}: SendTransactionParams): Promise<string> {
  try {
    const netConfig = NETWORKS[network];
    const customNetwork = new ethers.Network(netConfig.name, Number(netConfig.chainId));
    (customNetwork as any).ensAddress = null;

    const provider = new ethers.JsonRpcProvider(netConfig.rpcUrl, customNetwork, {
      staticNetwork: true,
    });

    // Initialize wallet with private key and provider
    const wallet = new ethers.Wallet(privateKey, provider);

    // Parse human readable amount into Wei
    const valueWei = ethers.parseEther(amount);

    // Broadcast transaction
    const tx = await wallet.sendTransaction({
      to: toAddress.trim(),
      value: valueWei,
    });

    console.log("Transaction broadcasted successfully:", tx.hash);
    return tx.hash;
  } catch (error: any) {
    console.error("Failed to send transaction:", error);
    throw new Error(error.reason || error.message || "Transaction failed");
  }
}