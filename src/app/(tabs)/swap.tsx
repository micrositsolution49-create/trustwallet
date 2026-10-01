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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Real Crypto Icon Helper based on symbol
const getCoinIconDetails = (symbol: string) => {
  const upperSymbol = symbol?.toUpperCase() || "";
  switch (upperSymbol) {
    case "ETH":
      return { name: "ethereum", type: "material-community", bg: "#627EEA" };
    case "USDC":
      return { name: "currency-usd", type: "material-community", bg: "#2775CA" };
    case "USDT":
      return { name: "t-bitcoin", type: "material-community", bg: "#26A17B" };
    case "BTC":
      return { name: "bitcoin", type: "material-community", bg: "#F7931A" };
    case "SOL":
      return { name: "flash", type: "material-community", bg: "#14F195" };
    case "MATIC":
    case "POL":
      return { name: "polygon", type: "material-community", bg: "#8247E5" };
    case "BNB":
      return { name: "alpha-b-box", type: "material-community", bg: "#F3BA2F" };
    default:
      return { name: "coins", type: "font-awesome5", bg: Colors.primary };
  }
};

export default function SwapScreen() {
  const { address } = useAuth();
  const router = useRouter();
  const { updateTokenBalanceLocally } = useWallet();

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
    color: "#2775CA",
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
          const details = getCoinIconDetails(tokenConfig.symbol);
          setToToken((prev) => ({
            ...prev,
            symbol: tokenConfig.symbol,
            name: tokenConfig.name,
            balance: parseFloat(tokenBalance).toFixed(2),
            color: details.bg,
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

  const receiveNum = parseFloat(receiveAmount) || 0;
  const fmtUsd = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInr = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Helper to render dynamic custom styled coin icon component
  const renderCoinIcon = (symbol: string) => {
    const iconMeta = getCoinIconDetails(symbol);
    return (
      <View style={[styles.tokenIcon, { backgroundColor: iconMeta.bg }]}>
        {iconMeta.type === "font-awesome5" ? (
          <FontAwesome5 name={iconMeta.name as any} size={14} color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name={iconMeta.name as any} size={16} color="#FFFFFF" />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Swap</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="options-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* From / To block */}
          <View>
            {/* From */}
            <View style={[styles.panel, styles.panelTop]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelLabel}>You pay</Text>
                <TouchableOpacity
                  style={styles.maxBtn}
                  onPress={() => setPayAmount(fromToken.balance)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.maxText}>MAX</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="decimal-pad"
                  value={payAmount}
                  onChangeText={(val) => setPayAmount(val)}
                  placeholder="0.0"
                  placeholderTextColor={Colors.disabled}
                  numberOfLines={1}
                />
                <TouchableOpacity style={styles.tokenPill} activeOpacity={0.8}>
                  {renderCoinIcon(fromToken.symbol)}
                  <Text style={styles.tokenSymbol}>{fromToken.symbol}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText} numberOfLines={1}>
                  ≈ ${fmtUsd(usdValue)} · ₹{fmtInr(inrValue)}
                </Text>
                <Text style={styles.metaText}>
                  Bal {fromToken.balance} {fromToken.symbol}
                </Text>
              </View>
            </View>

            {/* To */}
            <View style={[styles.panel, styles.panelBottom]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelLabel}>You receive</Text>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.amountResult} numberOfLines={1} adjustsFontSizeToFit>
                  {receiveAmount}
                </Text>
                <TouchableOpacity style={styles.tokenPill} activeOpacity={0.8}>
                  {renderCoinIcon(toToken.symbol)}
                  <Text style={styles.tokenSymbol}>{toToken.symbol}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText} numberOfLines={1}>
                  ≈ ${fmtUsd(receiveNum)} · ₹{fmtInr(receiveNum * usdtInrRate)}
                </Text>
                <Text style={styles.metaText}>
                  Bal {toToken.balance} {toToken.symbol}
                </Text>
              </View>
            </View>

            {/* Switch button, sits on the seam between the two panels */}
            <View style={styles.switchWrap} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.switchButton}
                onPress={handleSwitchTokens}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-vertical" size={18} color={Colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rate & fee */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>
                1 {fromToken.symbol} ≈ {ethRate.toLocaleString()} {toToken.symbol}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network fee</Text>
              <Text style={styles.summaryValue}>
                ~${(0.85).toFixed(2)} · ₹{fmtInr(0.85 * usdtInrRate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Confirm */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, swapping && { opacity: 0.7 }]}
            onPress={handleConfirmSwap}
            disabled={swapping}
            activeOpacity={0.85}
          >
            {swapping ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm swap</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PANEL_BG = Colors.surfaceAlt ?? "#F6F6F6";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeContainer: { flex: 1, backgroundColor: Colors.backgroundLight },

  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  /* Panels */
  panel: {
    backgroundColor: PANEL_BG,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  panelTop: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  panelBottom: {
    marginTop: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 24,
  },
  panelLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  maxBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  maxText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: Colors.onPrimary,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1,
    color: Colors.textPrimary,
    padding: 0,
    marginRight: 12,
  },
  amountResult: {
    flex: 1,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1,
    color: Colors.textPrimary,
    marginRight: 12,
  },

  tokenPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenSymbol: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  metaText: { fontSize: 12, color: Colors.textSecondary, flexShrink: 1 },

  /* Switch button */
  switchWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -20,
    alignItems: "center",
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Summary */
  summary: { marginTop: 24, paddingHorizontal: 4 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  summaryLabel: { fontSize: 13.5, color: Colors.textSecondary },
  summaryValue: { fontSize: 13.5, fontWeight: "600", color: Colors.textPrimary },

  /* Footer */
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: Colors.onPrimary, fontSize: 16, fontWeight: "700" },
});