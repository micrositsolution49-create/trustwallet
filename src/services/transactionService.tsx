import * as SecureStore from "expo-secure-store";
import { ethers } from "ethers";
import { NETWORKS } from "./cryptoService";

const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // MockUSDC deployed address

// Standard ERC20 mint ABI
const ERC20_ABI = [
  "function mint(address to, uint256 amount) external",
];

export const executeBlockchainTransaction = async (
  payAmount: string,
  userAddress: string,
) => {  
  const privateKey = await SecureStore.getItemAsync("user_private_key");
  if (!privateKey) {
    throw new Error(
      "Wallet private key not found. Please re-import your wallet.",
    );
  }

  const networkConfig = NETWORKS["localhost"];
  const customNetwork = new ethers.Network(
    "local",
    Number(networkConfig.chainId),
  );
  (customNetwork as any).ensAddress = null;

  const provider = new ethers.JsonRpcProvider(
    networkConfig.rpcUrl,
    customNetwork,
    {
      staticNetwork: true,
    },
  );

  const wallet = new ethers.Wallet(privateKey, provider);

  // MockUSDC contract instance
  const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

  // Decimals fix karne ke liye .toFixed(6) lagaya hai
  const rawCalculated = parseFloat(payAmount) * 3450.5;
  const usdcAmount = ethers.parseUnits(rawCalculated.toFixed(6), 6);

  // Transfer ki jagah ab yahan 'mint' call hoga taaki tokens generate ho sakein
  const tx = await usdcContract.mint(userAddress, usdcAmount);

  console.log("Mock USDC Mint TX sent:", tx.hash);
  await tx.wait();
  console.log("Mock USDC Mint mined successfully!");

  return tx.hash;
};