import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
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

type Currency = "inr" | "usd";

export default function SettingsScreen() {
  const router = useRouter();
  const { address, lock } = useAuth();
  const [currency, setCurrency] = useState<Currency>("inr");
  const [copied, setCopied] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_KEY).then((value) => {
      if (value === "inr" || value === "usd") setCurrency(value);
    });
    AsyncStorage.getItem(COMPACT_MODE_KEY).then((value) => {
      if (value !== null) setCompactMode(JSON.parse(value));
    });
  }, []);

  const changeCurrency = async (value: Currency) => {
    setCurrency(value);
    await AsyncStorage.setItem(CURRENCY_KEY, value);
  };

  const toggleCompact = async (value: boolean) => {
    setCompactMode(value);
    await AsyncStorage.setItem(COMPACT_MODE_KEY, JSON.stringify(value));
  };

  const copyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const clearWatchlist = () => {
    Alert.alert(
      "Clear watchlist?",
      "All saved market coins will be removed from your watchlist.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(WATCHLIST_KEY);
            Alert.alert("Done", "Your watchlist has been cleared.");
          },
        },
      ]
    );
  };

  const lockWallet = () => {
    lock();
    router.replace("/(auth)/unlock");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your wallet experience</Text>
        </View>

        {/* Wallet hero card (address + security status) */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Wallet</Text>
            <View style={styles.secureBadge}>
              <View style={styles.secureDot} />
              <Text style={styles.secureText}>Keys stored on device</Text>
            </View>
          </View>

          <Text style={styles.heroAddress} numberOfLines={1}>
            {address
              ? `${address.slice(0, 10)}...${address.slice(-8)}`
              : "No wallet connected"}
          </Text>

          {address ? (
            <TouchableOpacity
              style={styles.heroCopy}
              onPress={copyAddress}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={15}
                color={Colors.primary}
              />
              <Text style={styles.heroCopyText}>
                {copied ? "Copied" : "Copy address"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Preferences */}
        <Section title="Preferences">
          <Row
            icon="cash-outline"
            title="Currency"
            subtitle="Used to display market prices"
            right={
              <View style={styles.segment}>
                {(["inr", "usd"] as Currency[]).map((c) => {
                  const active = currency === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => changeCurrency(c)}
                      style={[styles.segmentItem, active && styles.segmentItemActive]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.segmentText, active && styles.segmentTextActive]}
                      >
                        {c === "inr" ? "₹ INR" : "$ USD"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            }
          />
          <Divider />
          <Row
            icon="list-outline"
            title="Compact market view"
            subtitle="Tighter list on the Markets screen"
            right={
              <Switch
                value={compactMode}
                onValueChange={toggleCompact}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.backgroundLight}
                ios_backgroundColor={Colors.border}
              />
            }
          />
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            icon="lock-closed-outline"
            title="Lock wallet"
            subtitle="Require unlock again"
            onPress={lockWallet}
            right={
              <Ionicons name="chevron-forward" size={18} color={Colors.disabled} />
            }
          />
        </Section>

        {/* Data */}
        <Section title="Data">
          <Row
            icon="star-outline"
            title="Clear watchlist"
            subtitle="Remove all saved market coins"
            onPress={clearWatchlist}
            destructive
          />
        </Section>

        {/* About */}
        <Section title="About">
          <Row
            icon="information-circle-outline"
            title="Crypto Wallet"
            subtitle="Version 1.0.0"
            right={<Text style={styles.value}>v1.0.0</Text>}
          />
          <Divider />
          <Row
            icon="pulse-outline"
            title="Market data"
            subtitle="Prices are provided by CoinGecko"
            onPress={() => Linking.openURL("https://www.coingecko.com")}
            right={
              <Ionicons name="arrow-up-outline" size={16} color={Colors.textSecondary}
                style={{ transform: [{ rotate: "45deg" }] }} />
            }
          />
        </Section>

        <View style={styles.footer}>
          <Ionicons name="alert-circle-outline" size={15} color={Colors.textSecondary} />
          <Text style={styles.footerText}>
            Never share your recovery phrase or private keys with anyone.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Building blocks ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <Ionicons
        name={icon}
        size={21}
        color={destructive ? Colors.negativeRed : Colors.textPrimary}
        style={styles.rowIcon}
      />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, destructive && { color: Colors.negativeRed }]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
      {content}
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundLight },
  content: { paddingHorizontal: 22, paddingBottom: 120 },

  header: { paddingTop: 18, paddingBottom: 22 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    color: Colors.textPrimary,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  /* Hero */
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 8,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.positiveGreen,
  },
  secureText: { fontSize: 11, fontWeight: "600", color: Colors.onPrimary },
  heroAddress: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.onPrimary,
    marginTop: 26,
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  heroCopy: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: Colors.onPrimary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 18,
  },
  heroCopyText: { fontSize: 13, fontWeight: "700", color: Colors.primary },

  /* Sections */
  section: { marginTop: 28 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },

  /* Rows */
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowIcon: { width: 24, marginRight: 14 },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  rowSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 38,
  },
  value: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },

  /* Segmented control */
  segment: {
    flexDirection: "row",
    backgroundColor: Colors.accentCyan,
    padding: 3,
    borderRadius: 10,
  },
  segmentItem: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8 },
  segmentItemActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  segmentTextActive: { color: Colors.onPrimary },

  /* Footer */
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 36,
    paddingHorizontal: 2,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});