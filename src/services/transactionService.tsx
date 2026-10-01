import { NETWORKS, TOKENS_CONFIG } from "@/services/cryptoService";
import { getStoredPrivateKey } from "@/services/walletService";
import { ethers } from "ethers";

const NETWORK = "localhost" as const;
const RPC_URL = NETWORKS[NETWORK].rpcUrl;
const EXPECTED_CHAIN_ID = NETWORKS[NETWORK].chainId;

const MOCK_USDC_ADDRESS =
  TOKENS_CONFIG.find((token) => token.symbol === "USDC")?.contractAddress ?? "";

const MOCK_USDC_ABI = [
  "function swapEthForUSDC(address recipient, uint256 usdcAmount) payable",
  "function swapUSDCForETH(address payable recipient, uint256 usdcAmount, uint256 ethAmount)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

function getContractAddress(): string {
  if (!ethers.isAddress(MOCK_USDC_ADDRESS)) {
    throw new Error("Invalid USDC contract address. Check contractAddress in cryptoService.ts.");
  }

  return ethers.getAddress(MOCK_USDC_ADDRESS);
}

async function getWalletAndContract(expectedAddress: string) {
  if (!ethers.isAddress(expectedAddress)) {
    throw new Error("The connected wallet address is invalid.");
  }

  const privateKey = await getStoredPrivateKey();

  if (!privateKey) {
    throw new Error("Wallet private key not found. Import or create your wallet first.");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();

  if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
    throw new Error(
      `Wrong network. Expected chain ${EXPECTED_CHAIN_ID}, got ${network.chainId.toString()}.`,
    );
  }

  const wallet = new ethers.Wallet(privateKey, provider);

  if (wallet.address.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error("Connected wallet does not match the wallet stored on this device.");
  }

  const contractAddress = getContractAddress();
  const bytecode = await provider.getCode(contractAddress);

  if (bytecode === "0x") {
    throw new Error(
      `No contract deployed at ${contractAddress} on ${RPC_URL}. Deploy MockUSDC to this Hardhat network and update its address in cryptoService.ts.`,
    );
  }

  const contract = new ethers.Contract(contractAddress, MOCK_USDC_ABI, wallet);

  let decimals: number;

  try {
    decimals = Number(await contract.decimals());
  } catch {
    throw new Error(
      `A contract exists at ${contractAddress}, but decimals() failed. Verify that this address belongs to the deployed OpenZeppelin ERC20 MockUSDC contract.`,
    );
  }

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error("The USDC contract returned invalid decimals.");
  }

  return { provider, wallet, contract, decimals };
}

/**
 * Local Hardhat demo swaps:
 * ETH -> USDC
 * USDC -> ETH
 *
 * This uses the requested receive amount as the payout.
 * Do not use this design with real funds.
 */
export async function executeSwapPair(
  fromSymbol: string,
  toSymbol: string,
  payAmount: string,
  receiveAmount: string,
  userAddress: string,
): Promise<string> {
  const from = fromSymbol.trim().toUpperCase();
  const to = toSymbol.trim().toUpperCase();

  if (!((from === "ETH" && to === "USDC") || (from === "USDC" && to === "ETH"))) {
    throw new Error("This local demo supports ETH ↔ USDC only.");
  }

  if (
    !payAmount.trim() ||
    !receiveAmount.trim() ||
    !Number.isFinite(Number(payAmount)) ||
    !Number.isFinite(Number(receiveAmount)) ||
    Number(payAmount) <= 0 ||
    Number(receiveAmount) <= 0
  ) {
    throw new Error("Enter valid pay and receive amounts greater than zero.");
  }

  const { provider, wallet, contract, decimals } = await getWalletAndContract(userAddress);

  if (from === "ETH" && to === "USDC") {
    const ethAmount = ethers.parseEther(payAmount);
    const usdcAmount = ethers.parseUnits(receiveAmount, decimals);

    const ethBalance = await provider.getBalance(wallet.address);

    if (ethBalance < ethAmount) {
      throw new Error("Insufficient ETH balance for this swap.");
    }

    const tx = await contract.swapEthForUSDC(wallet.address, usdcAmount, { value: ethAmount });

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("ETH → USDC transaction failed.");
    }

    return tx.hash;
  }

  // USDC -> ETH
  const usdcAmount = ethers.parseUnits(payAmount, decimals);
  const ethAmount = ethers.parseEther(receiveAmount);

  const usdcBalance: bigint = await contract.balanceOf(wallet.address);

  if (usdcBalance < usdcAmount) {
    throw new Error("Insufficient USDC balance.");
  }

  const contractAddress = await contract.getAddress();
  const contractEthBalance = await provider.getBalance(contractAddress);

  if (contractEthBalance < ethAmount) {
    throw new Error(
      "The MockUSDC contract does not hold enough ETH to pay this swap. Fund the contract with test ETH first.",
    );
  }

  const tx = await contract.swapUSDCForETH(wallet.address, usdcAmount, ethAmount);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("USDC → ETH transaction failed.");
  }

  return tx.hash;
}

/**
 * Backward-compatible wrapper for any older ETH -> USDC caller.
 * For both directions, use executeSwapPair().
 */
export async function executeBlockchainTransaction(
  payAmount: string,
  receiveAmount: string,
  userAddress: string,
): Promise<string> {
  return executeSwapPair("ETH", "USDC", payAmount, receiveAmount, userAddress);
}
