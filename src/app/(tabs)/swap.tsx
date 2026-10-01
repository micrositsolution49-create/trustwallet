import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import {
  fetchCryptoPrices,
  fetchUsdtInrRate,
  getNativeBalance,
  getTokenBalance,
  TOKENS_CONFIG,
} from "@/services/cryptoService";
import { executeSwapPair } from "@/services/transactionService";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Token = {
  symbol: string;
  name: string;
  balance: string;
  icon: string;
  color: string;
  network: string;
};

const SUPPORTED_TOKENS: Omit<Token, "balance" | "network">[] = [
  { symbol: "ETH", name: "Ethereum", icon: "ethereum", color: "#627EEA" },
  { symbol: "USDC", name: "USD Coin", icon: "currency-usd", color: "#2775CA" },
  { symbol: "USDT", name: "Tether", icon: "currency-usd", color: "#26A17B" },
  { symbol: "BTC", name: "Bitcoin", icon: "bitcoin", color: "#F7931A" },
  { symbol: "BNB", name: "BNB", icon: "alpha-b-box", color: "#F3BA2F" },
  { symbol: "SOL", name: "Solana", icon: "flash", color: "#14F195" },
  { symbol: "XRP", name: "XRP", icon: "alpha-x-box", color: "#23292F" },
  { symbol: "ADA", name: "Cardano", icon: "alpha-a-box", color: "#0033AD" },
  { symbol: "DOGE", name: "Dogecoin", icon: "dog", color: "#C2A633" },
  { symbol: "DOT", name: "Polkadot", icon: "circle", color: "#E6007A" },
  { symbol: "AVAX", name: "Avalanche", icon: "triangle", color: "#E84142" },
  { symbol: "LINK", name: "Chainlink", icon: "link", color: "#2A5ADA" },
];

const INITIAL_PRICES: Record<string, number> = {
  ETH: 2648.5,
  USDC: 1,
  USDT: 1,
  BTC: 65000,
  BNB: 580,
  SOL: 150,
  XRP: 0.55,
  ADA: 0.4,
  DOGE: 0.12,
  DOT: 4.5,
  AVAX: 25,
  LINK: 12,
};

const getCoinIconDetails = (symbol: string) => {
  switch (symbol.toUpperCase()) {
    case "ETH":
      return { name: "ethereum", type: "material-community", bg: "#627EEA" };
    case "USDC":
      return { name: "currency-usd", type: "material-community", bg: "#2775CA" };
    case "USDT":
      return { name: "currency-usd", type: "material-community", bg: "#26A17B" };
    case "BTC":
      return { name: "bitcoin", type: "material-community", bg: "#F7931A" };
    case "SOL":
      return { name: "flash", type: "material-community", bg: "#14F195" };
    case "BNB":
      return { name: "alpha-b-box", type: "material-community", bg: "#F3BA2F" };
    case "XRP":
      return { name: "alpha-x-box", type: "material-community", bg: "#23292F" };
    case "ADA":
      return { name: "alpha-a-box", type: "material-community", bg: "#0033AD" };
    case "DOGE":
      return { name: "dog", type: "material-community", bg: "#C2A633" };
    case "DOT":
      return { name: "circle", type: "material-community", bg: "#E6007A" };
    case "AVAX":
      return { name: "triangle", type: "material-community", bg: "#E84142" };
    case "LINK":
      return { name: "link", type: "material-community", bg: "#2A5ADA" };
    default:
      return { name: "coins", type: "font-awesome5", bg: Colors.primary };
  }
};

const createToken = (symbol: string, balance = "0"): Token => {
  const token = SUPPORTED_TOKENS.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());

  return {
    symbol: token?.symbol ?? symbol.toUpperCase(),
    name: token?.name ?? symbol,
    icon: token?.icon ?? "coins",
    color: token?.color ?? Colors.primary,
    balance,
    network: "localhost",
  };
};

export default function SwapScreen() {
  const { address } = useAuth();
  const router = useRouter();
  const { loadWalletData } = useWallet();

  const [fromToken, setFromToken] = useState<Token>(() => createToken("ETH", "0"));
  const [toToken, setToToken] = useState<Token>(() => createToken("USDC", "0"));

  const [payAmount, setPayAmount] = useState("0.001");
  const [usdtInrRate, setUsdtInrRate] = useState(88);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [tokenPickerFor, setTokenPickerFor] = useState<"from" | "to" | null>(null);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(INITIAL_PRICES);

  const fromPrice = marketPrices[fromToken.symbol.toUpperCase()] ?? 0;
  const toPrice = marketPrices[toToken.symbol.toUpperCase()] ?? 0;

  const amount = Number(payAmount || 0);

  const receiveAmount = (() => {
    if (!Number.isFinite(amount) || amount <= 0 || fromPrice <= 0 || toPrice <= 0) {
      return "0.00";
    }

    return ((amount * fromPrice) / toPrice).toFixed(6);
  })();

  const receiveNum = Number(receiveAmount) || 0;
  const usdValue = (Number(payAmount) || 0) * fromPrice;
  const inrValue = usdValue * usdtInrRate;
  const receiveUsdValue = receiveNum * toPrice;
  const receiveInrValue = receiveUsdValue * usdtInrRate;

  const fmtUsd = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtInr = (value: number) =>
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const loadTokenBalance = useCallback(
    async (symbol: string): Promise<string> => {
      if (!address) return "0";

      const config = TOKENS_CONFIG.find(
        (token) => token.symbol.toUpperCase() === symbol.toUpperCase(),
      );

      if (!config) return "0";

      try {
        if (config.type === "native") {
          return await getNativeBalance(address, config.network);
        }

        if (config.contractAddress) {
          return await getTokenBalance(address, config);
        }

        return "0";
      } catch (error) {
        console.error(`Failed to load ${symbol} balance:`, error);
        return "0";
      }
    },
    [address],
  );

  const loadSwapData = useCallback(async () => {
    if (!address) {
      setFromToken((previous) => ({ ...previous, balance: "0" }));
      setToToken((previous) => ({ ...previous, balance: "0" }));
      return;
    }

    setLoading(true);

    try {
      const [prices, inrRate] = await Promise.all([fetchCryptoPrices(), fetchUsdtInrRate()]);

      const idToSymbol: Record<string, string> = {
        ethereum: "ETH",
        "usd-coin": "USDC",
        tether: "USDT",
        bitcoin: "BTC",
        binancecoin: "BNB",
        solana: "SOL",
        ripple: "XRP",
        cardano: "ADA",
        dogecoin: "DOGE",
        polkadot: "DOT",
        "avalanche-2": "AVAX",
        chainlink: "LINK",
      };

      const nextPrices: Record<string, number> = {};

      Object.entries(prices ?? {}).forEach(([id, value]: [string, any]) => {
        const symbol = idToSymbol[id];
        const usdPrice = Number(value?.usd);

        if (symbol && Number.isFinite(usdPrice) && usdPrice > 0) {
          nextPrices[symbol] = usdPrice;
        }
      });

      setMarketPrices((current) => ({ ...current, ...nextPrices }));

      if (Number.isFinite(Number(inrRate)) && Number(inrRate) > 0) {
        setUsdtInrRate(Number(inrRate));
      }

      const [fromBalance, toBalance] = await Promise.all([
        loadTokenBalance(fromToken.symbol),
        loadTokenBalance(toToken.symbol),
      ]);

      setFromToken((previous) => ({
        ...previous,
        balance: Number(fromBalance || 0).toFixed(6),
      }));

      setToToken((previous) => ({
        ...previous,
        balance: Number(toBalance || 0).toFixed(6),
      }));
    } catch (error) {
      console.error("Failed to load swap data:", error);
    } finally {
      setLoading(false);
    }
  }, [address, fromToken.symbol, toToken.symbol, loadTokenBalance]);

  useEffect(() => {
    void loadSwapData();
  }, [loadSwapData]);

  const handleSelectToken = (symbol: string) => {
    const selectedToken = createToken(symbol, "0");

    if (tokenPickerFor === "from") {
      if (symbol === toToken.symbol) return;
      setFromToken(selectedToken);
    } else if (tokenPickerFor === "to") {
      if (symbol === fromToken.symbol) return;
      setToToken(selectedToken);
    }

    setTokenPickerFor(null);
    setPayAmount("0");
  };

  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setPayAmount("0");
  };

  const handleMaxAmount = () => {
    const balance = Number(fromToken.balance) || 0;

    // Keep a small ETH reserve for network gas fees.
    const reserveForGas = fromToken.symbol.toUpperCase() === "ETH" ? 0.01 : 0;

    const maxAmount = Math.max(0, balance - reserveForGas);
    setPayAmount(maxAmount.toFixed(6));
  };

  const handleConfirmSwap = async () => {
    if (!address) {
      Alert.alert("Wallet not connected", "Please connect your wallet first.");
      return;
    }

    const enteredAmount = Number(payAmount);
    const availableBalance = Number(fromToken.balance);

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than zero.");
      return;
    }

    if (enteredAmount > availableBalance) {
      Alert.alert(
        "Insufficient Balance",
        `Available balance: ${fromToken.balance} ${fromToken.symbol}`,
      );
      return;
    }

    try {
      setSwapping(true);

      const txHash = await executeSwapPair(
        fromToken.symbol,
        toToken.symbol,
        payAmount,
        receiveAmount,
        address,
      );
      const [remainingBalance, updatedToBalance] = await Promise.all([
        loadTokenBalance(fromToken.symbol),
        loadTokenBalance(toToken.symbol),
      ]);

      setFromToken((previous) => ({
        ...previous,
        balance: Number(remainingBalance || 0).toFixed(6),
      }));

      setToToken((previous) => ({
        ...previous,
        balance: Number(updatedToBalance || 0).toFixed(6),
      }));

      await loadWalletData(false);

      Alert.alert(
        "Transaction confirmed",
        `Local demo transaction mined successfully.\n\n` +
          `${fromToken.symbol}: ${Number(remainingBalance).toFixed(6)}\n` +
          `${toToken.symbol}: ${Number(updatedToBalance).toFixed(6)}\n\n` +
          `Transaction: ${txHash.substring(0, 15)}...`,
        [
          {
            text: "OK",
            onPress: () => setPayAmount("0"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Swap transaction failed:", error);
      Alert.alert("Swap failed", error?.message || "Transaction could not be completed.");
    } finally {
      setSwapping(false);
    }
  };

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

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => void loadSwapData()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={Colors.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Token picker modal */}
      <Modal
        visible={tokenPickerFor !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTokenPickerFor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select cryptocurrency</Text>

              <TouchableOpacity onPress={() => setTokenPickerFor(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {SUPPORTED_TOKENS.filter(
              (token) =>
                token.symbol !== (tokenPickerFor === "from" ? toToken.symbol : fromToken.symbol),
            ).map((token) => (
              <TouchableOpacity
                key={token.symbol}
                onPress={() => handleSelectToken(token.symbol)}
                style={styles.tokenOption}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: token.color }]}>
                  <MaterialCommunityIcons name={token.icon as any} size={21} color="#FFFFFF" />
                </View>

                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{token.name}</Text>
                  <Text style={styles.optionSymbol}>{token.symbol}</Text>
                </View>

                <Text style={styles.optionPrice}>
                  $
                  {(marketPrices[token.symbol] ?? 0).toLocaleString("en-US", {
                    maximumFractionDigits: 6,
                  })}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.modalNote}>
              Prices are indicative. On-chain balances require a token configured in your blockchain
              network.
            </Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* You pay */}
          <View>
            <View style={[styles.panel, styles.panelTop]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelLabel}>You pay</Text>

                <TouchableOpacity
                  style={styles.maxBtn}
                  onPress={handleMaxAmount}
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
                  onChangeText={setPayAmount}
                  placeholder="0.0"
                  placeholderTextColor={Colors.disabled}
                  numberOfLines={1}
                />

                <TouchableOpacity
                  style={styles.tokenPill}
                  activeOpacity={0.8}
                  onPress={() => setTokenPickerFor("from")}
                >
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

            {/* You receive */}
            <View style={[styles.panel, styles.panelBottom]}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelLabel}>You receive</Text>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.amountResult} numberOfLines={1} adjustsFontSizeToFit>
                  {receiveAmount}
                </Text>

                <TouchableOpacity
                  style={styles.tokenPill}
                  activeOpacity={0.8}
                  onPress={() => setTokenPickerFor("to")}
                >
                  {renderCoinIcon(toToken.symbol)}
                  <Text style={styles.tokenSymbol}>{toToken.symbol}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText} numberOfLines={1}>
                  ≈ ${fmtUsd(receiveUsdValue)} · ₹{fmtInr(receiveInrValue)}
                </Text>

                <Text style={styles.metaText}>
                  Bal {toToken.balance} {toToken.symbol}
                </Text>
              </View>
            </View>

            {/* Switch tokens */}
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

          {/* Rate and network fee */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>

              <Text style={styles.summaryValue}>
                1 {fromToken.symbol} ≈{" "}
                {fromPrice > 0 && toPrice > 0
                  ? (fromPrice / toPrice).toLocaleString("en-US", {
                      maximumFractionDigits: 6,
                    })
                  : "0"}{" "}
                {toToken.symbol}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated network fee</Text>

              <Text style={styles.summaryValue}>
                ~${fmtUsd(0.85)} · ₹{fmtInr(0.85 * usdtInrRate)}
              </Text>
            </View>

            <Text style={styles.disclaimer}>
              Estimated values only. Final received amount depends on the configured swap contract
              and actual execution.
            </Text>
          </View>
        </View>

        {/* Confirm button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, swapping && styles.disabledButton]}
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
  flex: {
    flex: 1,
  },

  safeContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },

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

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

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

  panelLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

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

  tokenSymbol: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },

  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 1,
  },

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

  summary: {
    marginTop: 24,
    paddingHorizontal: 4,
  },

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

  summaryLabel: {
    fontSize: 13.5,
    color: Colors.textSecondary,
  },

  summaryValue: {
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.textPrimary,
    flexShrink: 1,
    textAlign: "right",
  },

  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },

  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  confirmBtnText: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: Colors.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  tokenOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  optionInfo: {
    flex: 1,
  },

  optionName: {
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },

  optionSymbol: {
    color: Colors.textSecondary,
    marginTop: 2,
  },

  optionPrice: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  modalNote: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
});
