import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getStoredPrivateKey } from "@/services/walletService";
import { ethers } from "ethers";
import { CameraView, Camera } from "expo-camera";
import { Colors } from "@/constants/Colors";

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // QR scan hone par address automatically fill ho jayega
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!data) return;
    // "ethereum:0xabc..." jaise QR ka prefix hata do
    const cleaned = data.replace(/^ethereum:/i, "").split("@")[0].split("?")[0];
    setRecipient(cleaned);
    setScanning(false);
  };

  const openScanner = () => {
    if (hasPermission) {
      setScanning(true);
    } else {
      Alert.alert("Permission Required", "Please grant camera permission.");
    }
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!ethers.isAddress(recipient)) {
      Alert.alert("Invalid address", "Please enter a valid wallet address.");
      return;
    }

    try {
      setLoading(true);
      const privateKey = await getStoredPrivateKey();

      if (!privateKey) {
        setLoading(false);
        Alert.alert("Error", "No wallet found. Please import a wallet first.");
        return;
      }

      const provider = new ethers.JsonRpcProvider("http://10.195.144.45:8545");
      const wallet = new ethers.Wallet(privateKey, provider);
      const txValue = ethers.parseEther(amount);

      const tx = await wallet.sendTransaction({
        to: recipient,
        value: txValue,
      });

      await tx.wait();
      setLoading(false);
      Alert.alert("Success", "Transaction sent successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Transaction Failed", error.message || "Something went wrong");
    }
  };

  const canSend = recipient.length > 0 && amount.length > 0 && !loading;

  // ---------------- QR SCANNER SCREEN ----------------
  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          style={StyleSheet.absoluteFill}
        />

        {/* Close Scanner Button */}
        <TouchableOpacity
          style={[styles.closeScannerButton, { top: insets.top + 12 }]}
          onPress={() => setScanning(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>

        {/* Scan frame */}
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Point the camera at a wallet QR code</Text>
        </View>
      </View>
    );
  }

  // ---------------- SEND FORM SCREEN ----------------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Crypto</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipient address</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="0x... or domain name"
                placeholderTextColor={Colors.textSecondary}
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={Colors.primary}
              />
            </View>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={openScanner}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={22} color={Colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountCard}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={Colors.border}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              selectionColor={Colors.primary}
            />
            <View style={styles.tokenBadge}>
              <Text style={styles.tokenText}>ETH</Text>
            </View>
          </View>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.sendButtonText}>Continue & Send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ---- Layout ----
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark, // white
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // ---- Header ----
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },

  // ---- Form ----
  section: {
    marginBottom: 24,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    paddingVertical: 15,
    fontSize: 16,
  },
  scanButton: {
    width: 52,
    height: 52,
    marginLeft: 10,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ---- Amount ----
  amountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingLeft: 18,
    paddingRight: 12,
    paddingVertical: 10,
  },
  amountInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: "700",
    paddingVertical: 8,
  },
  tokenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentCyan, // light gray
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 10,
  },
  tokenText: {
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },

  // ---- Send button ----
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  sendButtonText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  // ---- QR Scanner ----
  scannerContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  closeScannerButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.onPrimary,
  },
  scanHint: {
    marginTop: 24,
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
});