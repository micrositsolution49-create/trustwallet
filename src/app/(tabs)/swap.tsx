import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SwapScreen() {
  const [payAmount, setPayAmount] = useState("1");
  const ethRate = 3450.5; // Example conversion rate

  const receiveAmount =
    payAmount && !isNaN(Number(payAmount))
      ? (parseFloat(payAmount) * ethRate).toFixed(2)
      : "0.00";

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
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
            <Text style={styles.balanceHint}>Balance: 2.45 ETH</Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.tokenPickerBtn}>
              <MaterialCommunityIcons
                name="ethereum"
                size={22}
                color="#627EEA"
              />
              <Text style={styles.tokenPickerText}>Ethereum</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder="0.0"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <Text style={styles.usdEquivalent}>
            ≈ ${(parseFloat(payAmount || "0") * ethRate).toLocaleString()}
          </Text>
        </View>

        {/* Swap Switcher Button */}
        <View style={styles.switchButtonWrapper}>
          <TouchableOpacity style={styles.switchButton}>
            <Ionicons name="swap-vertical" size={20} color="#0090FF" />
          </TouchableOpacity>
        </View>

        {/* "To" Card */}
        <View style={[styles.swapCard, { marginTop: -14 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>To</Text>
            <Text style={styles.balanceHint}>Balance: 140.00 USDT</Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.tokenPickerBtn}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={22}
                color="#26A17B"
              />
              <Text style={styles.tokenPickerText}>USDT</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.amountResult}>{receiveAmount}</Text>
          </View>
          <Text style={styles.usdEquivalent}>≈ ${receiveAmount}</Text>
        </View>

        {/* Fee & Rate Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated conversion</Text>
            <Text style={styles.summaryValue}>1 ETH ≈ 3,450.50 USDT</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gas Fee estimate</Text>
            <Text style={styles.summaryValue}>~$0.85 USD</Text>
          </View>
        </View>

        {/* Confirm Action Button */}
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Confirm Swap</Text>
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
  },
  tokenPickerText: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  amountInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  amountResult: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
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
