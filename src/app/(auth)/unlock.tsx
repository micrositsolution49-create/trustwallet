import { useAuth } from "@/context/AuthContext";
import { setPin, tryBiometricUnlock, verifyPin } from "@/services/authServices";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PIN_LENGTH = 6;
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function UnlockScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSetupMode = mode === "setup";
  const { refresh, unlock } = useAuth();

  // Setup mode has two steps: enter PIN, then confirm PIN
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPinInput] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkingBiometric, setCheckingBiometric] = useState(!isSetupMode);

  useEffect(() => {
    if (!isSetupMode) {
      const attemptBiometric = async () => {
        const success = await tryBiometricUnlock();
        if (success) {
          unlock();
          await refresh();
          router.replace("/(tabs)");
        } else {
          setCheckingBiometric(false);
        }
      };
      attemptBiometric();
    }
  }, [isSetupMode]);

  const handleKeyPress = async (key: string) => {
    setError(null);
    if (key === "del") {
      setPinInput((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPinInput(next);

    if (next.length === PIN_LENGTH) {
      if (isSetupMode) {
        if (step === "enter") {
          setFirstPin(next);
          setStep("confirm");
          setPinInput("");
        } else {
          if (next === firstPin) {
            await setPin(next);
            unlock();
            await refresh();
            router.replace("/(tabs)");
          } else {
            Vibration.vibrate(200);
            setError("PINs didn't match. Try again.");
            setStep("enter");
            setFirstPin("");
            setPinInput("");
          }
        }
      } else {
        const valid = await verifyPin(next);
        if (valid) {
          unlock();
          await refresh();
          router.replace("/(tabs)");
        } else {
          Vibration.vibrate(200);
          setError("Incorrect PIN. Try again.");
          setPinInput("");
        }
      }
    }
  };

  const handleBiometricRetry = async () => {
    const success = await tryBiometricUnlock();
    if (success) {
      unlock();
      await refresh();
      router.replace("/(tabs)");
    }
  };

  if (checkingBiometric) {
    return (
      <LinearGradient
        colors={["#07162C", "#0E335E", "#0B5997"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.centeredSafe}>
          <StatusBar barStyle="light-content" />
          <Text style={styles.checkingText}>Checking biometrics...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const title = isSetupMode
    ? step === "enter"
      ? "Create a PIN"
      : "Confirm your PIN"
    : "Enter your PIN";

  const subtitle = isSetupMode
    ? "This PIN protects your wallet on this device."
    : "Enter your PIN to unlock your wallet.";

  return (
    <LinearGradient
      colors={["#07162C", "#0E335E", "#0B5997"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Ionicons name="lock-closed" size={32} color="#00D18F" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.keypad}>
          {KEYPAD.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.key, key === "" && styles.keyHidden]}
              onPress={() => handleKeyPress(key)}
              disabled={key === ""}
            >
              {key === "del" ? (
                <Ionicons name="backspace-outline" size={22} color="#FFF" />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {!isSetupMode && (
          <TouchableOpacity
            style={styles.biometricLink}
            onPress={handleBiometricRetry}
          >
            <Ionicons name="finger-print-outline" size={18} color="#A0B3D6" />
            <Text style={styles.biometricLinkText}>Use biometrics instead</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, alignItems: "center", paddingTop: 60 },
  centeredSafe: { flex: 1, alignItems: "center", justifyContent: "center" },
  checkingText: { color: "#A0B3D6", fontSize: 14 },
  header: { alignItems: "center", gap: 10, marginBottom: 40 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  subtitle: {
    color: "#A0B3D6",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  dotsRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  dotFilled: { backgroundColor: "#0090FF", borderColor: "#0090FF" },
  dotError: { borderColor: "#DC2626" },
  errorText: { color: "#FCA5A5", fontSize: 13, marginBottom: 10 },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 280,
    justifyContent: "center",
    marginTop: 30,
  },
  key: {
    width: 80,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  keyHidden: { opacity: 0 },
  keyText: { color: "#FFF", fontSize: 24, fontWeight: "500" },
  biometricLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 30,
  },
  biometricLinkText: { color: "#A0B3D6", fontSize: 13, fontWeight: "500" },
});
