import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

const PIN_HASH_KEY = 'user_pin_hash';

const hashPin = async (pin: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin
  );
};

export const setPin = async (pin: string): Promise<void> => {
  const hash = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
};

export const hasPinSet = async (): Promise<boolean> => {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return !!hash;
};

export const tryBiometricUnlock = async (): Promise<boolean> => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock your wallet',
    cancelLabel: 'Use PIN instead',
    disableDeviceFallback: true, // ⬅️ prevents OS device-PIN fallback (the "4 digit" prompt)
  });

  return result.success;
}; //✅