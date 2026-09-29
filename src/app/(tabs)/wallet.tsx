import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import QRCode from "react-native-qrcode-svg";
// import * as Sharing from "expo-sharing";
import { Color } from "expo-router";
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
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#333334", "#0e1114", "#000000"]}
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
          <TouchableOpacity onPress={() => setDetailsModalVisible(true)}>
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
          <ActionButton name="arrow-up" label="Send" onPress={()=> router.push("../send")}  />
          <ActionButton
            name="arrow-down"
            label="Receive"
            onPress={() => setReceiveModalVisible(true)}
          />
          <ActionButton name="card-outline" label="Buy" />
          <ActionButton
            name="swap-horizontal"
            label="Swap"
            onPress={() => router.push("/swap")}
          />
        </View>
      </LinearGradient>

      {/* Receive Modal (QR Code & Address) */}
      <Modal
        animationType="slide"
        transparent
        visible={receiveModalVisible}
        onRequestClose={() => setReceiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receive Crypto</Text>
              <TouchableOpacity onPress={() => setReceiveModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
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
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <Text style={{ color: "#64748B" }}>Loading Address...</Text>
              )}
            </View>

            <View style={styles.walletDetailsBox}>
              <Text style={styles.detailLabel}>Your Public Address</Text>
              <Text style={styles.detailValue} selectable>
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
                    color="#0284C7"
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
                    { backgroundColor: `${token.color}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={token.icon as any}
                    size={24}
                    color={token.color}
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
                      { color: token.isUp ? "#00C087" : "#FF4D4F" },
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

      {/* Wallet Details Modal (Only Details) */}
      <Modal
        animationType="slide"
        transparent
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wallet Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
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
  safeContainer: { flex: 1, backgroundColor: "#fafafa" },
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
  walletLabel: { color: "#fcfdff", fontSize: 14, marginBottom: 6 },
  totalBalance: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 23, 18, 0.15)",
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
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalActionRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "flex-start",
  },
  actionBtnStyle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
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
  tokenBalanceText: { fontSize: 13, color: "#64748B", marginTop: 2 },
  tokenChange: { fontSize: 12, marginTop: 1, fontWeight: "500" },
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