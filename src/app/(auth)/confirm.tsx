import { wipeWallet } from "@/services/walletService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ConfirmPhraseScreen() {
  const router = useRouter();
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>();

  const correctWords = useMemo(
    () => (mnemonic ? mnemonic.split(" ") : []),
    [mnemonic],
  );
  const shuffledWords = useMemo(() => shuffle(correctWords), [correctWords]);

  const [selected, setSelected] = useState<string[]>([]);
  const [usedIndexes, setUsedIndexes] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Safety net: if someone lands here with no mnemonic (e.g. deep link, refresh), bounce back
    if (!mnemonic) {
      router.replace("/(auth)/welcome" as any);
    }
  }, [mnemonic, router]);

  const handleWordTap = (word: string, index: number) => {
    if (usedIndexes.has(index)) return;
    const next = [...selected, word];
    setSelected(next);
    setUsedIndexes(new Set(usedIndexes).add(index));

    // Check as soon as full length reached
    if (next.length === correctWords.length) {
      const isCorrect = next.every((w, i) => w === correctWords[i]);
      if (!isCorrect) {
        setFailed(true);
      }
    }
  };

  const handleReset = () => {
    setSelected([]);
    setUsedIndexes(new Set());
    setFailed(false);
  };

  const handleAbandon = () => {
    Alert.alert(
      "Cancel wallet creation?",
      "This will discard the wallet you just generated. You'll need to start over.",
      [
        { text: "Keep going", style: "cancel" },
        {
          text: "Discard & go back",
          style: "destructive",
          onPress: async () => {
            await wipeWallet();
            router.replace("/(auth)/welcome" as any);
          },
        },
      ],
    );
  };

  const handleContinue = () => {
    // Verified — move to PIN setup. Wallet + mnemonic already stored by createWallet().
    router.push("/(auth)/unlock?mode=setup" as any);
  };

  const isComplete =
    selected.length === correctWords.length &&
    selected.every((w, i) => w === correctWords[i]);

  return (
    <LinearGradient
      colors={["#07162C", "#0E335E", "#0B5997"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleAbandon}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Phrase</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.instruction}>
            Tap the words in the correct order to confirm you saved your
            recovery phrase.
          </Text>

          {/* Selected words preview */}
          <View style={styles.selectedBox}>
            {correctWords.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.selectedSlot,
                  failed && styles.selectedSlotError,
                ]}
              >
                <Text style={styles.selectedSlotText}>{selected[i] || ""}</Text>
              </View>
            ))}
          </View>

          {failed && (
            <Text style={styles.errorText}>
              That's not quite right. Tap "Reset" and try again.
            </Text>
          )}

          {/* Word bank */}
          <View style={styles.wordBank}>
            {shuffledWords.map((word, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.wordChip,
                  usedIndexes.has(i) && styles.wordChipUsed,
                ]}
                disabled={usedIndexes.has(i) || failed}
                onPress={() => handleWordTap(word, i)}
              >
                <Text
                  style={[
                    styles.wordChipText,
                    usedIndexes.has(i) && styles.wordChipTextUsed,
                  ]}
                >
                  {word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                !isComplete && styles.continueBtnDisabled,
              ]}
              disabled={!isComplete}
              onPress={handleContinue}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: { paddingBottom: 30 },
  instruction: {
    fontSize: 14,
    color: "#A0B3D6",
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  selectedBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    minHeight: 110,
  },
  selectedSlot: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 60,
    alignItems: "center",
  },
  selectedSlotError: {
    borderColor: "#DC2626",
  },
  selectedSlotText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  wordBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  wordChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  wordChipUsed: {
    opacity: 0.25,
  },
  wordChipText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  wordChipTextUsed: { color: "#64748B" },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  resetBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  continueBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#0090FF",
  },
  continueBtnDisabled: { backgroundColor: "#33475F" },
  continueBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
