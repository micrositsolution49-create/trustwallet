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
  // 'ethereum' ki jagah key ka naam 'localhost' ya 'hardhat' kar do
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
    contractAddress: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // Yahan se space hata diya hai
  },
];

export async function fetchCryptoPrices() {
  try {
    const ids = TOKENS_CONFIG.map((t) => t.coingeckoId).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    );
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error("Error fetching crypto prices, using fallback:", error);
    // Fallback prices taaki app crash na ho
    return {
      ethereum: { usd: 3450.5, usd_24h_change: 0 },
      "usd-coin": { usd: 1.0, usd_24h_change: 0 },
    };
  }
}

export const getNativeBalance = async (
  address: string,
  network: keyof typeof NETWORKS,
): Promise<string> => {
  try {
    const { rpcUrl, chainId } = NETWORKS[network];

    // Yahan bhi custom network set kar do taaki native balance fetch karte waqt ENS error na aaye
    const customNetwork = new ethers.Network("local", Number(chainId));
    (customNetwork as any).ensAddress = null;

    const provider = new ethers.JsonRpcProvider(rpcUrl, customNetwork, {
      staticNetwork: true,
    });

    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei); // wei -> readable ETH format
  } catch (error) {
    console.error(`Failed to fetch ${network} balance:`, error);
    return "0";
  }
};

// ---- Token balance (ERC-20 / BEP-20) ----
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export const getTokenBalance = async (
  walletAddress: string,
  tokenContractAddress: string,
  network: keyof typeof NETWORKS,
): Promise<string> => {
  try {
    const { rpcUrl, chainId } = NETWORKS[network];

    const cleanTokenAddress = tokenContractAddress.trim();
    const cleanWalletAddress = walletAddress.trim();

    // ENS error se bachne ke liye custom network
    const customNetwork = new ethers.Network("local", Number(chainId));
    (customNetwork as any).ensAddress = null;

    const provider = new ethers.JsonRpcProvider(rpcUrl, customNetwork, {
      staticNetwork: true,
    });

    // Standard ERC20 ABI use karenge balance aur decimals read karne ke liye
    const ERC20_ABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    const contract = new ethers.Contract(cleanTokenAddress, ERC20_ABI, provider);

    // Promise.all se balance aur decimals ek sath fetch kar lo
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
