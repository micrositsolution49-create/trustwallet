import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CURRENCY_KEY = "@crypto_currency";
const WATCHLIST_KEY = "@crypto_watchlist";
const COMPACT_MODE_KEY = "@compact_market_view";

export default function SettingsScreen() {
  const router = useRouter();
  const { address, lock } = useAuth();
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");
  const [copied, setCopied] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_KEY).then((value) => {
      if (value === "inr" || value === "usd") {
        setCurrency(value);
      }
    });

    AsyncStorage.getItem(COMPACT_MODE_KEY).then((value) => {
      if (value !== null) {
        setCompactMode(JSON.parse(value));
      }
    });
  }, []);

  const changeCurrency = async (value: "inr" | "usd") => {
    setCurrency(value);
    await AsyncStorage.setItem(CURRENCY_KEY, value);
  };

  const copyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const clearWatchlist = () => {
    Alert.alert("Clear watchlist?", "All saved market coins will be removed from your watchlist.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(WATCHLIST_KEY);
          Alert.alert("Done", "Your watchlist has been cleared.");
        },
      },
    ]);
  };

  const lockWallet = () => {
    lock();
    router.replace("/(auth)/unlock");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your wallet experience</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={21} color={Colors.textPrimary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SectionTitle title="Preferences" />
        <View style={styles.card}>
          <SettingRow
            icon="cash-outline"
            title="Preferred currency"
            subtitle="Used to display market prices"
            right={
              <View style={styles.currencyToggle}>
                <TouchableOpacity
                  onPress={() => changeCurrency("inr")}
                  style={[styles.currencyPill, currency === "inr" && styles.currencyPillActive]}
                >
                  <Text
                    style={[
                      styles.currencyPillText,
                      currency === "inr" && styles.currencyPillTextActive,
                    ]}
                  >
                    ₹ INR
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => changeCurrency("usd")}
                  style={[styles.currencyPill, currency === "usd" && styles.currencyPillActive]}
                >
                  <Text
                    style={[
                      styles.currencyPillText,
                      currency === "usd" && styles.currencyPillTextActive,
                    ]}
                  >
                    $ USD
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
          <Divider />
          <SettingRow
            icon="phone-portrait-outline"
            title="Compact market view"
            subtitle="Use a tighter list on the Markets screen"
            right={
              <Switch
                value={compactMode}
                onValueChange={async (value) => {
                  setCompactMode(value);
                  await AsyncStorage.setItem(COMPACT_MODE_KEY, JSON.stringify(value));
                }}
                trackColor={{ false: Colors.border, true: Colors.disabled }}
                thumbColor={compactMode ? Colors.primary : Colors.backgroundLight}
              />
            }
          />
        </View>

        <SectionTitle title="Security" />
        <View style={styles.card}>
          <SettingRow
            icon="shield-checkmark-outline"
            iconTone="green"
            title="Wallet security"
            subtitle="Your private keys stay on this device"
            right={<Ionicons name="checkmark-circle" size={22} color={Colors.positiveGreen} />}
          />
          <Divider />
          <TouchableOpacity style={styles.actionRow} onPress={lockWallet}>
            <View style={[styles.rowIcon, styles.redIcon]}>
              <Ionicons name="lock-closed-outline" size={19} color={Colors.negativeRed} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Lock wallet</Text>
              <Text style={styles.rowSubtitle}>Require wallet unlock again</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.disabled} />
          </TouchableOpacity>
        </View>

        <SectionTitle title="Wallet" />
        <View style={styles.card}>
          <SettingRow
            icon="wallet-outline"
            title="Wallet address"
            subtitle={
              address ? `${address.slice(0, 10)}...${address.slice(-8)}` : "No wallet connected"
            }
            right={
              address ? (
                <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={16}
                    color={Colors.textPrimary}
                  />
                  <Text style={styles.copyText}>{copied ? "Copied" : "Copy"}</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        <SectionTitle title="Data" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={clearWatchlist}>
            <View style={styles.rowIcon}>
              <Ionicons name="star-outline" size={19} color={Colors.textSecondary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Clear watchlist</Text>
              <Text style={styles.rowSubtitle}>Remove all saved market coins</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.disabled} />
          </TouchableOpacity>
        </View>

        <SectionTitle title="About" />
        <View style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            title="Crypto Wallet"
            subtitle="Version 1.0.0"
            right={<Text style={styles.version}>v1.0.0</Text>}
          />
          <Divider />
          <SettingRow
            icon="pulse-outline"
            title="Market data"
            subtitle="Prices are provided by CoinGecko"
            right={<Ionicons name="open-outline" size={17} color={Colors.textSecondary} />}
          />
        </View>

        <Text style={styles.footerText}>
          Never share your recovery phrase or private keys with anyone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  iconTone,
}: {
  icon: any;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  iconTone?: "green";
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.rowIcon, iconTone === "green" && styles.greenIcon]}>
        <Ionicons
          name={icon}
          size={19}
          color={iconTone === "green" ? Colors.positiveGreen : Colors.textSecondary}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundLight },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 25, fontWeight: "800", color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 3,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  settingRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  greenIcon: { backgroundColor: "#E8F8EE" },
  redIcon: { backgroundColor: "#FFEBEA" },
  rowText: { flex: 1, paddingRight: 10 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  rowSubtitle: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },
  currencyToggle: {
    flexDirection: "row",
    backgroundColor: Colors.accentCyan,
    padding: 3,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 },
  currencyPillActive: {
    backgroundColor: Colors.surfaceCard,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  currencyPillText: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary },
  currencyPillTextActive: { color: Colors.textPrimary },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.accentCyan,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyText: { fontSize: 11, fontWeight: "700", color: Colors.textPrimary },
  version: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: Colors.textSecondary,
    paddingHorizontal: 30,
    marginTop: 24,
  },
});