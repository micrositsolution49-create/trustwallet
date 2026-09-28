import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  fetchCryptoPrices,
  getNativeBalance,
  getTokenBalance,
  TOKENS_CONFIG,
  TokenConfig,
} from "@/services/cryptoService";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect } from "expo-router";

interface DisplayToken extends TokenConfig {
  rawBalance: string;
  balanceUSD: string;
  price: number;
  change: string;
  isUp: boolean;  
}

export default function WalletScreen() {
  const { address } = useAuth();
  const router = useRouter();

  const [tokens, setTokens] = useState<DisplayToken[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState("$0.00");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadWalletData = useCallback(
    async (isBackground = false) => {
      if (!address) return;
      if (!isBackground) setLoading(true);

      try {
        const prices = await fetchCryptoPrices();

        const results = await Promise.all(
          TOKENS_CONFIG.map(async (token) => {
            const rawBalance =
              token.type === "native"
                ? await getNativeBalance(address, token.network)
                : await getTokenBalance(
                    address,
                    token.contractAddress!,
                    token.network,
                  );

            const marketData = prices?.[token.coingeckoId];
            let price = marketData ? marketData.usd : 0;
            
            // ROBUST FIX: Agar token USDC hai toh explicitly 1.0 set karo agar price 0 hai
            if (
              token.symbol?.toUpperCase() === "USDC" || 
              token.name?.toLowerCase().includes("usd coin")
            ) {
              price = price > 0 ? price : 1.0;
            }

            const priceChange = marketData ? marketData.usd_24h_change : 0;
            const balanceNum = parseFloat(rawBalance) || 0;
            const balanceUSDNum = balanceNum * price; 

            return {
              ...token,
              rawBalance, 
              price,
              balanceUSD: `$${balanceUSDNum.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}`,
              change: `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
              isUp: priceChange >= 0,
              _usdValue: balanceUSDNum,
            };
          }),
        );

        const total = results.reduce((sum, t) => sum + (t as any)._usdValue, 0);

        setTokens(results);
        setTotalBalanceUSD(
          `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        );
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to load wallet data:", error);
        if (!isBackground) {
          Alert.alert(
            "Error",
            "Couldn't load balances. Check your connection and try again.",
          );
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [address],
  );

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [loadWalletData]),
  );

  useEffect(() => {
    if (!address) return;
    loadWalletData();

    const interval = setInterval(() => {
      loadWalletData(true);
    }, 15000); // 15s — public RPCs rate-limit aggressively, don't go faster than this

    return () => clearInterval(interval);
  }, [address, loadWalletData]);

  const handleCopyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#07162C", "#0E335E", "#0B5997"]}
        style={styles.headerGradient}
      >
        <View style={styles.topNav}>
          <TouchableOpacity
            onPress={() => loadWalletData(false)}
            disabled={loading}
          >
            <Ionicons name="reload-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Wallet</Text>
          <TouchableOpacity onPress={() => setWalletModalVisible(true)}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#00D18F"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.walletLabel}>My Secure Wallet</Text>
          <Text style={styles.totalBalance}>
            {loading ? "Loading..." : totalBalanceUSD}
          </Text>

          <View style={styles.growthBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.growthText}>
              {lastUpdated
                ? `On-chain • Updated ${lastUpdated}`
                : "Fetching on-chain data..."}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <ActionButton name="arrow-up" label="Send" />
          <ActionButton name="arrow-down" label="Receive" />
          <ActionButton name="card-outline" label="Buy" />
          <ActionButton
            name="swap-horizontal"
            label="Swap"
            onPress={() => router.push("/swap")}
          />
        </View>
      </LinearGradient>

      <View style={styles.assetsContainer}>
        <View style={styles.assetsHeader}>
          <Text style={styles.assetsTitle}>Assets</Text>
          <TouchableOpacity onPress={() => setWalletModalVisible(true)}>
            <Text style={styles.createWalletLink}>Wallet Details</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {tokens.map((token) => (
            <View key={token.id} style={styles.tokenRow}>
              <View
                style={[
                  styles.tokenIconWrapper,
                  { backgroundColor: `${token.color}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name={token.icon as any}
                  size={24}
                  color={token.color}
                />
              </View>

              <View style={styles.tokenInfo}>
                <Text style={styles.tokenName}>{token.name}</Text>
                <Text
                  style={[
                    styles.tokenChange,
                    { color: token.isUp ? "#00C087" : "#FF4D4F" },
                  ]}
                >
                  {parseFloat(token.rawBalance).toFixed(4)} {token.symbol} ·{" "}
                  {token.change}
                </Text>
              </View>

              <View style={styles.tokenPriceCol}>
                <Text style={styles.tokenAmount}>{token.balanceUSD}</Text>
              </View>
            </View>
          ))}

          {!loading && tokens.length === 0 && (
            <Text style={styles.emptyText}>No balances found yet.</Text>
          )}
        </ScrollView>
      </View>

      {/* Wallet Details Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={walletModalVisible}
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet Details</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              This is your public address. Share it to receive funds — never
              share your recovery phrase.
            </Text>

            <View style={styles.walletDetailsBox}>
              <Text style={styles.detailLabel}>Public Address</Text>
              <Text style={styles.detailValue} selectable>
                {address}
              </Text>

              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyAddress}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color="#0284C7"
                />
                <Text style={styles.copyBtnText}>
                  {copied ? "Copied!" : "Copy Address"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.seedHint}>
              Need to view your recovery phrase? Go to Settings → Security.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface ActionButtonProps {
  name: any;
  label: string;
  onPress?: () => void;
}

function ActionButton({ name, label, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionCircle}>
        <Ionicons name={name} size={22} color="#FFF" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#07162C" },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navTitle: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  balanceSection: { alignItems: "center", marginVertical: 10 },
  walletLabel: { color: "#A0B3D6", fontSize: 14, marginBottom: 6 },
  totalBalance: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 209, 143, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00D18F" },
  growthText: { color: "#00D18F", fontWeight: "600", fontSize: 11 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 26,
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0090FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0090FF",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionLabel: { color: "#E2E8F0", fontSize: 12, fontWeight: "500" },
  assetsContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  assetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  assetsTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  createWalletLink: { fontSize: 13, color: "#0284C7", fontWeight: "600" },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tokenIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  tokenInfo: { flex: 1 },
  tokenName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  tokenChange: { fontSize: 13, marginTop: 2 },
  tokenPriceCol: { alignItems: "flex-end" },
  tokenAmount: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 18,
  },
  walletDetailsBox: {
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 12,
  },
  detailLabel: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
  detailValue: {
    fontSize: 13,
    color: "#0284C7",
    marginTop: 6,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    alignSelf: "flex-start",
  },
  copyBtnText: { fontSize: 13, color: "#0284C7", fontWeight: "600" },
  seedHint: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 20,
  },
});