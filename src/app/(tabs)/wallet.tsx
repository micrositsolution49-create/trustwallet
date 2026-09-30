import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import QRCode from "react-native-qrcode-svg";
import {
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
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { Colors } from "@/constants/Colors";

export default function WalletScreen() {
  const { address } = useAuth();
  const router = useRouter();
  const { tokens, totalBalanceUSD, loading, lastUpdated, loadWalletData } =
    useWallet();

  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />

      {/* Modern High-Contrast Top Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={() => loadWalletData(false)}
            disabled={loading}
          >
            <Ionicons name="reload-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Wallet</Text>
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
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.walletLabel}>My Secure Wallet</Text>
          <Text style={styles.totalBalance}>
            {loading && tokens.length === 0 ? "Loading..." : totalBalanceUSD}
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
          <ActionButton name="arrow-up" label="Send" onPress={() => router.push("/send")} />
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
      </View>

      {/* Receive Modal (QR Code & Address) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={receiveModalVisible}
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receive Crypto</Text>
              <TouchableOpacity onPress={() => setReceiveModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Send only Ethereum or supported tokens to this address. Sending
              other assets may result in permanent loss.
            </Text>

            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              {address ? (
                <QRCode
                  value={address}
                  size={180}
                  color={Colors.textPrimary}
                  backgroundColor={Colors.backgroundLight}
                />
              ) : (
                <Text style={{ color: Colors.textSecondary }}>Loading Address...</Text>
              )}
            </View>

            <View style={styles.walletDetailsBox}>
              <Text style={styles.detailLabel}>Your Public Address</Text>
              <Text style={styles.detailValue} selectable={true}>
                {address}
              </Text>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.actionBtnStyle}
                  onPress={handleCopyAddress}
                >
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={16}
                    color={Colors.textPrimary}
                  />
                  <Text style={styles.copyBtnText}>
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.seedHint}>
              Need to view your recovery phrase? Go to Settings → Security.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Assets Section */}
      <View style={styles.assetsContainer}>
        <View style={styles.assetsHeader}>
          <Text style={styles.assetsTitle}>Assets</Text>
          <TouchableOpacity onPress={() => setDetailsModalVisible(true)}>
            <Text style={styles.createWalletLink}>Wallet Details</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {tokens.map((token) => {
            const numericBalance = parseFloat(token.rawBalance || "0");
            const formattedBalance =
              numericBalance === 0 ? "0.00" : numericBalance.toFixed(4);

            return (
              <View key={token.id} style={styles.tokenRow}>
                <View
                  style={[
                    styles.tokenIconWrapper,
                    { backgroundColor: Colors.accentCyan },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={token.icon as any}
                    size={22}
                    color={Colors.textPrimary}
                  />
                </View>

                {/* Token Name and Balance Row */}
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenName}>{token.name}</Text>
                  <Text style={styles.tokenBalanceText}>
                    {formattedBalance} {token.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.tokenChange,
                      { color: token.isUp ? Colors.positiveGreen : Colors.negativeRed },
                    ]}
                  >
                    {token.change}
                  </Text>
                </View>

                {/* Right side USD Value */}
                <View style={styles.tokenPriceCol}>
                  <Text style={styles.tokenAmount}>{token.balanceUSD}</Text>
                </View>
              </View>
            );
          })}

          {!loading && tokens.length === 0 && (
            <Text style={styles.emptyText}>No balances found yet.</Text>
          )}
        </ScrollView>
      </View>

      {/* Wallet Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              This is your public address. Share it to receive funds — never
              share your recovery phrase.
            </Text>

            <View style={styles.walletDetailsBox}>
              <Text style={styles.detailLabel}>Public Address</Text>
              <Text style={styles.detailValue} selectable={true}>
                {address}
              </Text>

              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyAddress}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color={Colors.textPrimary}
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
        <Ionicons name={name} size={20} color={Colors.onPrimary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeContainer: { 
    flex: 1, 
    backgroundColor: Colors.backgroundLight 
  },
  headerContainer: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: { 
    color: Colors.textPrimary, 
    fontSize: 17, 
    fontWeight: "700",
    letterSpacing: -0.3 
  },
  balanceSection: { 
    alignItems: "center", 
    marginVertical: 12 
  },
  walletLabel: { 
    color: Colors.textSecondary, 
    fontSize: 13, 
    marginBottom: 4,
    fontWeight: "500" 
  },
  totalBalance: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentCyan,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: Colors.positiveGreen,
    marginRight: 6,
  },
  growthText: { 
    color: Colors.textPrimary, 
    fontWeight: "600", 
    fontSize: 11 
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  actionItem: { 
    alignItems: "center", 
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    marginBottom: 6,
  },
  actionLabel: { 
    color: Colors.textPrimary, 
    fontSize: 12, 
    fontWeight: "600" 
  },
  assetsContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  assetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  assetsTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  createWalletLink: { 
    fontSize: 13, 
    color: Colors.textPrimary, 
    fontWeight: "600",
    textDecorationLine: "underline" 
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
    padding: 20,
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalActionRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "flex-start",
  },
  actionBtnStyle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentCyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tokenIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenInfo: { flex: 1 },
  tokenName: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: Colors.textPrimary 
  },
  tokenBalanceText: { 
    fontSize: 13, 
    color: Colors.textSecondary, 
    marginTop: 2,
    fontWeight: "500" 
  },
  tokenChange: { 
    fontSize: 12, 
    marginTop: 1, 
    fontWeight: "600" 
  },
  tokenPriceCol: { alignItems: "flex-end" },
  tokenAmount: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 40,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  walletDetailsBox: {
    backgroundColor: Colors.accentCyan,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailLabel: { 
    fontSize: 12, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  detailValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 6,
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyBtnText: { 
    fontSize: 13, 
    color: Colors.textPrimary, 
    fontWeight: "600",
    marginLeft: 6,
  },
  seedHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
});