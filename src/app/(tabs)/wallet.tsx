import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import QRCode from "react-native-qrcode-svg";
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { Colors } from "@/constants/Colors";
import AppDrawer from "@/components/AppDrawer";
import AppHeader from "@/components/AppHeader"; // Reusable Header

/**
 * Brand colour + icon per coin. Add more symbols here as you add tokens.
 * Unknown symbols fall back to token.icon with a neutral colour.
 */
const COIN_META: Record<string, { color: string; icon: string }> = {
  ETH: { color: "#627EEA", icon: "ethereum" },
  BTC: { color: "#F7931A", icon: "bitcoin" },
  USDC: { color: "#2775CA", icon: "currency-usd" },
  USDT: { color: "#26A17B", icon: "currency-usd" },
  DAI: { color: "#F5AC37", icon: "currency-usd" },
  BNB: { color: "#F3BA2F", icon: "alpha-b-circle-outline" },
  SOL: { color: "#9945FF", icon: "alpha-s-circle-outline" },
  MATIC: { color: "#8247E5", icon: "hexagon-outline" },
  POL: { color: "#8247E5", icon: "hexagon-outline" },
  LINK: { color: "#2A5ADA", icon: "link-variant" },
  XRP: { color: "#23292F", icon: "alpha-x-circle-outline" },
  DOGE: { color: "#C2A633", icon: "dog" },
};

const getCoinMeta = (symbol: string, fallbackIcon: string) => {
  const meta = COIN_META[(symbol || "").toUpperCase()];
  return meta ?? { color: Colors.textPrimary, icon: fallbackIcon };
};

const PANEL_BG = Colors.surfaceAlt ?? "#F6F6F6";

export default function WalletScreen() {
  const { address } = useAuth();
  const router = useRouter();
  const { tokens, totalBalanceUSD, loading, lastUpdated, loadWalletData } =
    useWallet();

  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadWalletData(false);
    } catch (error) {
      console.error("Failed to refresh wallet:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadWalletData]);

  const handleCopyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.backgroundLight}
      />

      {/* Reusable AppHeader Component */}
      <AppHeader
        title="Wallet"
        leftComponent={
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={() => setDetailsModalVisible(true)}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={Colors.positiveGreen}
            />
          </TouchableOpacity>
        }
      />

      {/* Reusable AppDrawer Component */}
      <AppDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentRoute="wallet"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ---------- Balance ---------- */}
        <View style={styles.balanceSection}>
          <View style={styles.labelRow}>
            <Text style={styles.walletLabel}>Total balance</Text>
            {shortAddress ? (
              <TouchableOpacity
                style={styles.addressChip}
                onPress={handleCopyAddress}
                activeOpacity={0.7}
              >
                <Text style={styles.addressChipText}>{shortAddress}</Text>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={12}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.totalBalance} numberOfLines={1} adjustsFontSizeToFit>
            {loading && tokens.length === 0 ? "$0.00" : totalBalanceUSD}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.liveDot} />
            <Text style={styles.growthText}>
              {lastUpdated
                ? `On-chain • Updated ${lastUpdated}`
                : tokens.length === 0 && !loading
                  ? "New wallet • 0 Balance"
                  : "Fetching on-chain data..."}
            </Text>
          </View>
        </View>

        {/* ---------- Actions ---------- */}
        <View style={styles.actionsRow}>
          <ActionButton
            name="arrow-up"
            label="Send"
            primary
            onPress={() => router.push("/send")}
          />
          <ActionButton
            name="swap-horizontal"
            label="Swap"
            onPress={() => router.push("/swap")}
          />
          <ActionButton
            name="arrow-down"
            label="Receive"
            onPress={() => setReceiveModalVisible(true)}
          />
        </View>

        {/* ---------- Assets ---------- */}
        <View style={styles.assetsHeader}>
          <Text style={styles.assetsTitle}>Assets</Text>
          <TouchableOpacity
            style={styles.detailsLink}
            onPress={() => setDetailsModalVisible(true)}
          >
            <Text style={styles.createWalletLink}>Wallet details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View>
          {tokens.map((token, index) => {
            const numericBalance = parseFloat(token.rawBalance || "0");
            const formattedBalance =
              numericBalance === 0 ? "0.00" : numericBalance.toFixed(4);
            const meta = getCoinMeta(token.symbol, token.icon);
            const isLast = index === tokens.length - 1;

            return (
              <View
                key={token.id}
                style={[styles.tokenRow, !isLast && styles.tokenRowDivider]}
              >
                {/* Coin icon in its brand colour */}
                <View
                  style={[
                    styles.tokenIconWrapper,
                    { backgroundColor: meta.color + "1A" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={meta.icon as any}
                    size={24}
                    color={meta.color}
                  />
                </View>

                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenName}>{token.name}</Text>
                  <Text style={styles.tokenBalanceText}>
                    {formattedBalance} {token.symbol}
                  </Text>
                </View>

                <View style={styles.tokenPriceCol}>
                  <Text style={styles.tokenAmount}>{token.balanceUSD}</Text>
                  <Text
                    style={[
                      styles.tokenChange,
                      {
                        color: token.isUp
                          ? Colors.positiveGreen
                          : Colors.negativeRed,
                      },
                    ]}
                  >
                    {token.change}
                  </Text>
                </View>
              </View>
            );
          })}

          {!loading && tokens.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="wallet-outline" size={26} color={Colors.textPrimary} />
              </View>
              <Text style={styles.emptyText}>No token balances found.</Text>
              <Text style={styles.emptySubText}>
                Your new wallet is ready to receive funds.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ---------- Receive Modal ---------- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={receiveModalVisible}
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receive crypto</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setReceiveModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Send only Ethereum or supported tokens to this address. Sending
              other assets may result in permanent loss.
            </Text>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              {address ? (
                <QRCode
                  value={address}
                  size={176}
                  color={Colors.textPrimary}
                  backgroundColor={Colors.backgroundLight}
                />
              ) : (
                <Text style={{ color: Colors.textSecondary }}>
                  Loading Address...
                </Text>
              )}
            </View>

            <View style={styles.walletDetailsBox}>
              <Text style={styles.detailLabel}>Your public address</Text>
              <Text style={styles.detailValue} selectable={true}>
                {address}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCopyAddress}
              activeOpacity={0.85}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={17}
                color={Colors.onPrimary}
              />
              <Text style={styles.primaryBtnText}>
                {copied ? "Copied!" : "Copy address"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.seedHint}>
              Need to view your recovery phrase? Go to Settings → Security.
            </Text>
          </View>
        </View>
      </Modal>

      {/* ---------- Wallet Details Modal ---------- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet details</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.secureRow}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={Colors.positiveGreen}
              />
              <Text style={styles.secureText}>Secured on this device</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              This is your public address. Share it to receive funds — never
              share your recovery phrase.
            </Text>

            <View style={styles.walletDetailsBox}>
              <Text style={styles.detailLabel}>Public address</Text>
              <Text style={styles.detailValue} selectable={true}>
                {address}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCopyAddress}
              activeOpacity={0.85}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={17}
                color={Colors.onPrimary}
              />
              <Text style={styles.primaryBtnText}>
                {copied ? "Copied!" : "Copy address"}
              </Text>
            </TouchableOpacity>

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
  primary?: boolean;
  onPress?: () => void;
}

function ActionButton({ name, label, primary, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionItem, primary && styles.actionItemPrimary]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={name}
        size={22}
        color={primary ? Colors.onPrimary : Colors.textPrimary}
      />
      <Text style={[styles.actionLabel, primary && { color: Colors.onPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Balance */
  balanceSection: {
    paddingTop: 18,
    paddingBottom: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  addressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PANEL_BG,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  totalBalance: {
    color: Colors.textPrimary,
    fontSize: 46,
    fontWeight: "800",
    letterSpacing: -1.8,
    marginTop: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.positiveGreen,
    marginRight: 7,
  },
  growthText: {
    color: Colors.textSecondary,
    fontWeight: "500",
    fontSize: 12.5,
  },

  /* Actions */
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  actionItem: {
    flex: 1,
    height: 78,
    borderRadius: 20,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionItemPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },

  /* Assets */
  assetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 34,
    marginBottom: 6,
  },
  assetsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  detailsLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  createWalletLink: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "600",
  },

  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  tokenRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tokenIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  tokenInfo: { flex: 1 },
  tokenName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tokenBalanceText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    fontWeight: "500",
  },
  tokenPriceCol: { alignItems: "flex-end" },
  tokenAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tokenChange: {
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 36,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  emptySubText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PANEL_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 19,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  secureText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.positiveGreen,
  },
  qrContainer: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletDetailsBox: {
    backgroundColor: PANEL_BG,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    marginTop: 6,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    marginTop: 14,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onPrimary,
  },
  seedHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 18,
  },
});