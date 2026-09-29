import 'react-native-get-random-values';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';

// Standard Ethereum derivation path
const ETH_DERIVATION_PATH = "m/44'/60'/0'/0/0";

export const importWalletByPrivateKey = async (privateKeyInput: string) => {
  let cleanedKey = privateKeyInput.trim();
  
  if (!cleanedKey.startsWith("0x")) {
    cleanedKey = "0x" + cleanedKey;
  }

  try {
    const wallet = new ethers.Wallet(cleanedKey);
    await SecureStore.setItemAsync('user_private_key', wallet.privateKey);

    return { address: wallet.address, privateKey: wallet.privateKey };
  } catch (error) {
    throw new Error("Invalid private key. Please check and try again.");
  }
};

export const importWalletByKeystore = async (jsonString: string, passwordInput: string) => {
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(jsonString, passwordInput);
    await SecureStore.setItemAsync('user_private_key', wallet.privateKey);
    return { address: wallet.address, privateKey: wallet.privateKey };
  } catch (error) {
    throw new Error("Invalid keystore JSON or incorrect password.");
  }
};

export const createWallet = async () => {
  try {
    const mnemonic = bip39.generateMnemonic();
    // Explicitly passing the path ensures deterministic and predictable key derivation
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, ETH_DERIVATION_PATH);

    await SecureStore.setItemAsync('user_private_key', wallet.privateKey);
    await SecureStore.setItemAsync('user_mnemonic', mnemonic);

    return { address: wallet.address, mnemonic };
  } catch (error) {
    console.error("Wallet creation failed:", error);
    throw error;
  }
};

export const importWallet = async (mnemonicInput: string) => {
  const cleaned = mnemonicInput.trim().toLowerCase();
  if (!bip39.validateMnemonic(cleaned)) {
    throw new Error("Invalid recovery phrase. Please check the words and try again.");
  }
  
  const wallet = ethers.HDNodeWallet.fromPhrase(cleaned, undefined, ETH_DERIVATION_PATH);

  await SecureStore.setItemAsync('user_private_key', wallet.privateKey);
  await SecureStore.setItemAsync('user_mnemonic', cleaned);

  return { address: wallet.address, mnemonic: cleaned };
};

export const getStoredWallet = async () => {
  try {
    const privateKey = await SecureStore.getItemAsync('user_private_key');
    if (!privateKey) return null;
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    console.error("Failed to load wallet:", error);
    return null;
  }
};

// Helper function to safely fetch the raw private key for transaction signing
export const getStoredPrivateKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('user_private_key');
  } catch (error) {
    console.error("Failed to load private key:", error);
    return null;
  }
};

export const getMnemonic = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('user_mnemonic');
}; // Secret Recovery Phrase 

export const wipeWallet = async () => {
  await SecureStore.deleteItemAsync('user_private_key');
  await SecureStore.deleteItemAsync('user_mnemonic');
};