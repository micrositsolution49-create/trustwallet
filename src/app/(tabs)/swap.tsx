import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { executeBlockchainTransaction } from "@/services/transactionService";
import { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext"; // WalletContext import kiya
import {
  fetchCryptoPrices,
  getNativeBalance,
  getTokenBalance,
  TOKENS_CONFIG,
} from "@/services/cryptoService";

export default function SwapScreen() {
  const { address } = useAuth();
  const { updateTokenBalanceLocally } = useWallet(); // Wallet context se sync function liya

  const [fromToken, setFromToken] = useState({
    symbol: "ETH",
    name: "Ethereum",
    balance: "1.5000",
    icon: "ethereum",
    color: "#627EEA",
    network: "ethereum",
  });
  const [toToken, setToToken] = useState({
    symbol: "USDC",
    name: "USDC",
    balance: "0.31",
    icon: "currency-usd",
    color: "#26A17B",
    network: "ethereum",
  });

  const [payAmount, setPayAmount] = useState("0.001");
  const [ethRate, setEthRate] = useState(2648.5);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const USD_TO_INR = 83.5;

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
        `Aapke paas sirf ${availableBalance} ${fromToken.symbol} available hai, lekin aap ${enteredAmount} ${fromToken.symbol} swap karne ki koshish kar rahe ho.`
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

      // Yahan global wallet state ko instantly update kar rahe hain taaki Wallet screen match ho jaye
      updateTokenBalanceLocally(
        fromToken.symbol,
        toToken.symbol,
        enteredAmount,
        addedReceiveAmount
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
        ]
      );
    } catch (error: any) {
      console.error("Transaction failed:", error);
      Alert.alert(
        "Failed",
        error.message || "Transaction could not be completed.",
      );
    } finally {
      setSwapping(false);
    }
  };

  const loadSwapData = async () => {
    if (!address) return;
    try {
      setLoading(true);
      const prices = await fetchCryptoPrices();
      if (prices?.ethereum?.usd) {
        setEthRate(prices.ethereum.usd);
      }

      const ethBalance = await getNativeBalance(address, "localhost");
      if (ethBalance && !isNaN(Number(ethBalance))) {
        setFromToken((prev) => ({
          ...prev,
          balance: parseFloat(ethBalance).toFixed(4),
        }));
      }

      const tokenConfig = TOKENS_CONFIG.find(
        (t) => t.symbol === toToken.symbol || t.symbol === "USDC" || t.symbol === "USDT",
      );
      if (tokenConfig && tokenConfig.contractAddress) {
        const tokenBalance = await getTokenBalance(
          address,
          tokenConfig.contractAddress,
          "localhost",
        );
        if (tokenBalance && !isNaN(Number(tokenBalance))) {
          setToToken((prev) => ({
            ...prev,
            symbol: tokenConfig.symbol,
            balance: parseFloat(tokenBalance).toFixed(2),
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load swap rates/balances", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwapData();
  }, [address]);

  const receiveAmount =
    payAmount && !isNaN(Number(payAmount))
      ? (parseFloat(payAmount) * ethRate).toFixed(2)
      : "0.00";

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setPayAmount("0.0");
  };

  const usdValue =
    parseFloat(payAmount || "0") * (fromToken.symbol === "ETH" ? ethRate : 1);
  const inrValue = usdValue * USD_TO_INR;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Swap/Exchange</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={22} color="#0F172A" />
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
                <Text style={{ color: "#0090FF", fontWeight: "700" }}>(MAX)</Text>
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.tokenPickerBtn}>
              <MaterialCommunityIcons
                name={fromToken.icon as any}
                size={22}
                color={fromToken.color}
              />
              <Text style={styles.tokenPickerText}>{fromToken.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={(val) => {
                setPayAmount(val);
              }}
              placeholder="0.0"
              placeholderTextColor="#94A3B8"
              numberOfLines={1}
            />
          </View>
          <Text
            style={styles.usdEquivalent}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ≈ $
            {usdValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            (₹
            {inrValue.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            )
          </Text>
        </View>

        {/* Swap Switcher Button */}
        <View style={styles.switchButtonWrapper}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchTokens}
          >
            <Ionicons name="swap-vertical" size={20} color="#0090FF" />
          </TouchableOpacity>
        </View>

        {/* "To" Card */}
        <View style={[styles.swapCard, { marginTop: -14 }]}>
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
                color={toToken.color}
              />
              <Text style={styles.tokenPickerText}>{toToken.symbol}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.amountResult} numberOfLines={1}>
              {receiveAmount}
            </Text>
          </View>
          <Text
            style={styles.usdEquivalent}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ≈ $
            {parseFloat(receiveAmount).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            (₹
            {(parseFloat(receiveAmount) * USD_TO_INR).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            )
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
            <Text style={styles.summaryValue}>~$0.85 USD (~₹70.98)</Text>
          </View>
        </View>

        {/* Confirm Action Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, swapping && { opacity: 0.7 }]}
          onPress={handleConfirmSwap}
          disabled={swapping}
        >
          {swapping ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Swap</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  swapCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F6",
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
  cardLabel: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  balanceHint: { fontSize: 12, color: "#94A3B8" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tokenPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
    flexShrink: 0,
  },
  tokenPickerText: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  amountInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
    padding: 0,
  },
  amountResult: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  usdEquivalent: {
    fontSize: 12,
    color: "#94A3B8",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryContainer: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#64748B" },
  summaryValue: { fontSize: 13, fontWeight: "500", color: "#0F172A" },
  confirmBtn: {
    backgroundColor: "#0090FF",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#0090FF",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});