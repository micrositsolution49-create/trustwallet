import 'react-native-get-random-values';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';

export const importWalletByPrivateKey = async (privateKeyInput: string) => {
  let cleanedKey = privateKeyInput.trim();
  
  // Agar user ne bina '0x' ke key di hai, toh use add kar dein
  if (!cleanedKey.startsWith("0x")) {
    cleanedKey = "0x" + cleanedKey;
  }

  try {
    // Ethers.js Wallet instance create karein private key se
    const wallet = new ethers.Wallet(cleanedKey);

    // SecureStore mein save karein
    await SecureStore.setItemAsync('user_private_key', wallet.privateKey);

    return { address: wallet.address, privateKey: wallet.privateKey };
  } catch (error) {
    throw new Error("Invalid private key. Please check and try again.");
  }
}; // ✅
export const importWalletByKeystore = async (jsonString: string, passwordInput: string) => {
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(jsonString, passwordInput);
    await SecureStore.setItemAsync('user_private_key', wallet.privateKey);
    return { address: wallet.address, privateKey: wallet.privateKey };
  } catch (error) {
    throw new Error("Invalid keystore JSON or incorrect password.");
  }
}; // ✅
export const createWallet = async () => {
  try {
    const mnemonic = bip39.generateMnemonic();
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);

    await SecureStore.setItemAsync('user_private_key', wallet.privateKey);
    await SecureStore.setItemAsync('user_mnemonic', mnemonic);

    return { address: wallet.address, mnemonic };
  } catch (error) {
    console.error("Wallet creation failed:", error);
    throw error;
  }
}; // ✅
export const importWallet = async (mnemonicInput: string) => {
  const cleaned = mnemonicInput.trim().toLowerCase();
  if (!bip39.validateMnemonic(cleaned)) {
    throw new Error("Invalid recovery phrase. Please check the words and try again.");
  }
  const wallet = ethers.HDNodeWallet.fromPhrase(cleaned);

  await SecureStore.setItemAsync('user_private_key', wallet.privateKey);
  await SecureStore.setItemAsync('user_mnemonic', cleaned);

  return { address: wallet.address, mnemonic: cleaned };
}; // ✅
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
}; // ✅
export const getMnemonic = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('user_mnemonic');
}; // Secret Recovery Phrase 

export const wipeWallet = async () => {
  await SecureStore.deleteItemAsync('user_private_key');
  await SecureStore.deleteItemAsync('user_mnemonic');
}; // ✅