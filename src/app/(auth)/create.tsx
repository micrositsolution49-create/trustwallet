import { createWallet } from "@/services/walletService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateWalletScreen() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState<string>("");
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      try {
        const wallet = await createWallet();
        setMnemonic(wallet.mnemonic);
      } catch (e) {
        console.error("Failed to generate wallet:", e);
        setError(
          "Something went wrong generating your wallet. Please go back and try again.",
        );
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  const words = mnemonic ? mnemonic.split(" ") : [];

  return (
    <LinearGradient
      colors={["#07162C", "#0E335E", "#0B5997"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recovery Phrase</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text style={styles.warning}>
              ⚠️ Write these 12 words down in order and store them somewhere
              safe. Anyone with this phrase can access your funds. TrustWallet
              cannot recover it for you if it's lost.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : !revealed ? (
              <TouchableOpacity
                style={styles.revealBox}
                onPress={() => setRevealed(true)}
                disabled={loading}
              >
                <Ionicons name="eye-off-outline" size={28} color="#A0B3D6" />
                <Text style={styles.revealText}>
                  {loading
                    ? "Generating your wallet..."
                    : "Tap to reveal phrase"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.wordGrid}>
                {words.map((word, i) => (
                  <View key={i} style={styles.wordChip}>
                    <Text style={styles.wordIndex}>{i + 1}</Text>
                    <Text style={styles.wordText}>{word}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.continueBtn,
              (!revealed || loading || !!error) && styles.continueBtnDisabled,
            ]}
            disabled={!revealed || loading || !!error}
            onPress={() =>
              router.push({ pathname: "confirm" as any, params: { mnemonic } })
            }
          >
            <Text style={styles.continueBtnText}>
              {loading ? "Generating..." : "I've Saved It — Continue"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  warning: {
    fontSize: 13,
    color: "#FFD166",
    backgroundColor: "rgba(255, 209, 102, 0.1)",
    padding: 14,
    borderRadius: 12,
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    padding: 16,
    borderRadius: 12,
  },
  errorText: { color: "#FCA5A5", fontSize: 13, lineHeight: 18 },
  revealBox: {
    height: 220,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  revealText: { color: "#A0B3D6", fontSize: 14, fontWeight: "500" },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  wordChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "30.5%",
    gap: 6,
  },
  wordIndex: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  wordText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  continueBtn: {
    backgroundColor: "#0090FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  continueBtnDisabled: {
    backgroundColor: "#33475F",
  },
  continueBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
