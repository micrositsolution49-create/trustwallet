import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import {
  fetchCryptoPrices,
  fetchUsdtInrRate,
  getNativeBalance,
  getTokenBalance,
  TOKENS_CONFIG,
} from "@/services/cryptoService";
import { executeBlockchainTransaction } from "@/services/transactionService";
import { Colors } from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function SwapScreen() {
  const { address } = useAuth();
  const router = useRouter();
  const { updateTokenBalanceLocally } = useWallet();

  const [fromToken, setFromToken] = useState({
    symbol: "ETH",
    name: "Ethereum",
    balance: "1.5000",
    icon: "ethereum",
    color: "#000000",
    network: "ethereum",
  });
  const [toToken, setToToken] = useState({
    symbol: "USDC",
    name: "USDC",
    balance: "0.31",
    icon: "currency-usd",
    color: "#000000",
    network: "ethereum",
  });

  const [payAmount, setPayAmount] = useState("0.001");
  const [ethRate, setEthRate] = useState(2648.5);
  const [usdtInrRate, setUsdtInrRate] = useState(88);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const receiveAmount = (() => {
    const amount = parseFloat(payAmount || "0");

    if (!Number.isFinite(amount) || amount <= 0) {
      return "0.00";
    }

    if (fromToken.symbol.toUpperCase() === "ETH" && toToken.symbol.toUpperCase() === "USDC") {
      return (amount * ethRate).toFixed(6);
    }

    if (fromToken.symbol.toUpperCase() === "USDC" && toToken.symbol.toUpperCase() === "ETH") {
      return (amount / ethRate).toFixed(6);
    }

    return "0.00";
  })();

  const handleConfirmSwap = async () => {
    if (!address) {
      Alert.alert("Error", "Wallet not connected.");
      return;
    }

    const enteredAmount = parseFloat(payAmount);
    const availableBalance = parseFloat(fromToken.balance);

    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }

    if (enteredAmount > availableBalance) {
      Alert.alert(
        "Insufficient Balance",
        `Aapke paas sirf ${availableBalance} ${fromToken.symbol} available hai, lekin aap ${enteredAmount} ${fromToken.symbol} swap karne ki koshish kar rahe ho.`,
      );
      return;
    }

    try {
      setSwapping(true);

      const txHash = await executeBlockchainTransaction(payAmount, address);

      const remainingBalance = Math.max(0, availableBalance - enteredAmount).toFixed(4);
      const currentToBalance = parseFloat(toToken.balance || "0");
      const addedReceiveAmount = parseFloat(receiveAmount || "0");
      const updatedToBalance = (currentToBalance + addedReceiveAmount).toFixed(2);

      updateTokenBalanceLocally(
        fromToken.symbol,
        toToken.symbol,
        enteredAmount,
        addedReceiveAmount,
      );

      setFromToken((prev) => ({ ...prev, balance: remainingBalance }));
      setToToken((prev) => ({ ...prev, balance: updatedToBalance }));

      Alert.alert(
        "🎉 Swap Successful!",
        `Successfully swapped ${payAmount} ${fromToken.symbol}.\n\n` +
          `• New ${fromToken.symbol} Balance: ${remainingBalance}\n` +
          `• New ${toToken.symbol} Balance: ${updatedToBalance}\n` +
          `• Hash: ${txHash ? txHash.substring(0, 15) + "..." : "0x1293...abc"}`,
        [
          {
            text: "OK",
            onPress: () => {
              setPayAmount("0.0");
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Transaction failed:", error);
      Alert.alert("Failed", error.message || "Transaction could not be completed.");
    } finally {
      setSwapping(false);
    }
  };

  const loadSwapData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const [prices, inrRate] = await Promise.all([fetchCryptoPrices(), fetchUsdtInrRate()]);

      if (prices?.ethereum?.usd) {
        setEthRate(Number(prices.ethereum.usd));
      }

      if (Number.isFinite(inrRate) && inrRate > 0) {
        setUsdtInrRate(Number(inrRate));
      }

      const ethBalance = await getNativeBalance(address, "localhost");

      if (ethBalance && !isNaN(Number(ethBalance))) {
        setFromToken((prev) => ({
          ...prev,
          balance: parseFloat(ethBalance).toFixed(4),
        }));
      }

      const tokenConfig = TOKENS_CONFIG.find(
        (token) => token.symbol.toUpperCase() === toToken.symbol.toUpperCase(),
      );

      if (tokenConfig) {
        let tokenBalance = "0";

        if (tokenConfig.type === "native") {
          tokenBalance = await getNativeBalance(address, tokenConfig.network);
        } else if (tokenConfig.contractAddress) {
          tokenBalance = await getTokenBalance(address, tokenConfig);
        }

        if (tokenBalance && !isNaN(Number(tokenBalance))) {
          setToToken((prev) => ({
            ...prev,
            symbol: tokenConfig.symbol,
            name: tokenConfig.name,
            balance: parseFloat(tokenBalance).toFixed(2),
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load swap rates/balances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwapData();
  }, [address]);

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setPayAmount("0.0");
  };

  const usdValue = parseFloat(payAmount || "0") * (fromToken.symbol === "ETH" ? ethRate : 1);
  const inrValue = usdValue * usdtInrRate;

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Swap/Exchange</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* "From" Card */}
        <View style={styles.swapCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>From</Text>
            <TouchableOpacity onPress={() => setPayAmount(fromToken.balance)}>
              <Text style={styles.balanceHint}>
                Balance: {fromToken.balance} {fromToken.symbol}{" "}
                <Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>(MAX)</Text>
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.tokenPickerBtn}>
              <MaterialCommunityIcons
                name={fromToken.icon as any}
                size={22}
                color={Colors.textPrimary}
              />
              <Text style={styles.tokenPickerText}>{fromToken.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={(val) => setPayAmount(val)}
              placeholder="0.0"
              placeholderTextColor={Colors.disabled}
              numberOfLines={1}
            />
          </View>
          <Text style={styles.usdEquivalent} numberOfLines={1} ellipsizeMode="tail">
            ≈ ${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            (₹{inrValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </Text>
        </View>

        {/* Swap Switcher Button */}
        <View style={styles.switchButtonWrapper}>
          <TouchableOpacity style={styles.switchButton} onPress={handleSwitchTokens}>
            <Ionicons name="swap-vertical" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* "To" Card */}
        <View style={styles.swapCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>To</Text>
            <Text style={styles.balanceHint}>
              Balance: {toToken.balance} {toToken.symbol}
            </Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.tokenPickerBtn}>
              <MaterialCommunityIcons
                name={toToken.icon as any}
                size={22}
                color={Colors.textPrimary}
              />
              <Text style={styles.tokenPickerText}>{toToken.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.amountResult} numberOfLines={1}>
              {receiveAmount}
            </Text>
          </View>
          <Text style={styles.usdEquivalent} numberOfLines={1} ellipsizeMode="tail">
            ≈ ${parseFloat(receiveAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            (₹{(parseFloat(receiveAmount) * usdtInrRate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </Text>
        </View>

        {/* Fee & Rate Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated conversion</Text>
            <Text style={styles.summaryValue}>
              1 {fromToken.symbol} ≈ {ethRate.toLocaleString()} {toToken.symbol}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gas Fee estimate</Text>
            <Text style={styles.summaryValue}>
              ~${(0.85).toFixed(2)} USD (~₹
              {(0.85 * usdtInrRate).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              )
            </Text>
          </View>
        </View>

        {/* Confirm Action Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, swapping && { opacity: 0.7 }]}
          onPress={handleConfirmSwap}
          disabled={swapping}
        >
          {swapping ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Swap</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.backgroundLight },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  swapCard: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  balanceHint: { fontSize: 12, color: Colors.textSecondary },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentCyan,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenPickerText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  amountInput: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
    padding: 0,
  },
  amountResult: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  usdEquivalent: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  switchButtonWrapper: {
    alignItems: "center",
    zIndex: 10,
    marginVertical: -14,
  },
  switchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryContainer: {
    marginTop: 20,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: "500", color: Colors.textPrimary },
  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  confirmBtnText: { color: Colors.onPrimary, fontSize: 16, fontWeight: "700" },
});