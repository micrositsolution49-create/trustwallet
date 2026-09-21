import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TOKENS = [
  {
    id: "1",
    name: "Bitcoin",
    symbol: "BTC",
    balance: "$12,345.67",
    change: "+1.56%",
    isUp: true,
    icon: "currency-btc",
    color: "#F7931A",
  },
  {
    id: "2",
    name: "Ethereum",
    symbol: "ETH",
    balance: "$598.30",
    change: "+1.98%",
    isUp: true,
    icon: "ethereum",
    color: "#627EEA",
  },
  {
    id: "3",
    name: "Trust Wallet Token",
    symbol: "TWT",
    balance: "$0.00",
    change: "+6.53%",
    isUp: true,
    icon: "shield-check",
    color: "#3375BB",
  },
  {
    id: "4",
    name: "Tether USD",
    symbol: "USDT",
    balance: "$250.00",
    change: "-0.02%",
    isUp: false,
    icon: "currency-usd",
    color: "#26A17B",
  },
];

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />

      {/* Top Gradient Header & Balance Card */}
      <LinearGradient
        colors={["#07162C", "#0E335E", "#0B5997"]}
        style={styles.headerGradient}
      >
        {/* Top Navbar */}
        <View style={styles.topNav}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Wallet</Text>
          <TouchableOpacity>
            <Ionicons name="scan-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Balance Box */}
        <View style={styles.balanceSection}>
          <Text style={styles.walletLabel}>Multi-Coin Wallet 1</Text>
          <Text style={styles.totalBalance}>$12,345.67</Text>
          <View style={styles.growthBadge}>
            <Text style={styles.growthText}>+$28.00 ▲ 3.53%</Text>
          </View>
        </View>

        {/* Action Buttons: Send, Receive, Buy, Swap */}
        <View style={styles.actionsRow}>
          <ActionButton name="arrow-up" label="Send" />
          <ActionButton name="arrow-down" label="Receive" />
          <ActionButton name="card-outline" label="Buy" />
          <ActionButton name="swap-horizontal" label="Swap" />
        </View>
      </LinearGradient>

      {/* Assets / Token List Section */}
      <View style={styles.assetsContainer}>
        <View style={styles.assetsHeader}>
          <Text style={styles.assetsTitle}>Assets</Text>
          <TouchableOpacity>
            <Text style={styles.filterText}>Sort by ▾</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {TOKENS.map((token) => (
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
                  {token.symbol} {token.change}
                </Text>
              </View>

              <View style={styles.tokenPriceCol}>
                <Text style={styles.tokenAmount}>{token.balance}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ name, label }: { name: any; label: string }) {
  return (
    <TouchableOpacity style={styles.actionItem}>
      <View style={styles.actionCircle}>
        <Ionicons name={name} size={22} color="#FFF" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#07162C",
  },
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
  navTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  balanceSection: {
    alignItems: "center",
    marginVertical: 10,
  },
  walletLabel: {
    color: "#A0B3D6",
    fontSize: 14,
    marginBottom: 6,
  },
  totalBalance: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  growthBadge: {
    backgroundColor: "rgba(0, 209, 143, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  growthText: {
    color: "#00D18F",
    fontWeight: "600",
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 26,
  },
  actionItem: {
    alignItems: "center",
    gap: 6,
  },
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
  actionLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
  },
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
  assetsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  filterText: {
    fontSize: 13,
    color: "#64748B",
  },
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
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  tokenChange: {
    fontSize: 13,
    marginTop: 2,
  },
  tokenPriceCol: {
    alignItems: "flex-end",
  },
  tokenAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
});
