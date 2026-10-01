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
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Optional Skip Checkbox State
  const [isChecked, setIsChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Safety net: if someone lands here with no mnemonic (e.g. deep link, refresh), bounce back
    if (!mnemonic) {
      router.replace("/(auth)/welcome" as any);
    }
  }, [mnemonic, router]);

  const handleWordTap = (word: string, index: number) => {
    if (usedIndexes.has(index) || isChecked) return; // Agar skip checked hai toh taps disable rahein
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

  const handleCompleteCreation = async (isBackedUp: boolean) => {
    try {
      setIsSaving(true);
      // Backup status save karein (@wallet_backed_up: true agar verified ya ticked, false agar skip)
      await AsyncStorage.setItem("@wallet_backed_up", isBackedUp ? "true" : "false");
      router.push("/(auth)/unlock?mode=setup" as any);
    } catch (err) {
      console.error("Failed to update backup status:", err);
      Alert.alert("Error", "Kuch gadbad ho gayi, kripya dobara koshish karein.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    // Agar user ne skip checkbox tick kiya hai
    if (isChecked) {
      Alert.alert(
        "Skip Verification?",
        "Kya aapne apna recovery phrase surakshit jagah likh liya hai? Agar device kho gaya aur phrase nahi mila, toh funds wapas nahi milenge.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Skip",
            style: "destructive",
            onPress: () => handleCompleteCreation(false), // false matlab unverified/skipped
          },
        ]
      );
    } else {
      // Normal Verified Continue
      handleCompleteCreation(true); // true matlab successfully verified
    }
  };

  const isComplete =
    (selected.length === correctWords.length &&
      selected.every((w, i) => w === correctWords[i])) ||
    isChecked;

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
            recovery phrase, or select the option below to skip.
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
          <View style={[styles.wordBank, isChecked && { opacity: 0.4 }]}>
            {shuffledWords.map((word, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.wordChip,
                  usedIndexes.has(i) && styles.wordChipUsed,
                ]}
                disabled={usedIndexes.has(i) || failed || isChecked}
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

          {/* Optional Checkbox / Skip Option */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            activeOpacity={0.8}
            onPress={() => {
              setIsChecked(!isChecked);
              if (!isChecked) {
                setFailed(false);
              }
            }}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have safely saved my mnemonic. Skip verification for now.
            </Text>
          </TouchableOpacity>

          <View style={styles.actionsRow}>
            {!isChecked && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.continueBtn,
                !isComplete && styles.continueBtnDisabled,
                isChecked && { flex: 1 },
              ]}
              disabled={!isComplete || isSaving}
              onPress={handleContinue}
            >
              <Text style={styles.continueBtnText}>
                {isSaving ? "Saving..." : isChecked ? "Skip & Continue" : "Continue"}
              </Text>
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 20,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#A0B3D6",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0090FF",
    borderColor: "#0090FF",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#A0B3D6",
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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