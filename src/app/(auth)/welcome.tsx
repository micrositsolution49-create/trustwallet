import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    // Background ab white/light gradient ya pure white colors use karega
    <LinearGradient 
      colors={[Colors.cardGradientStart, Colors.cardGradientEnd]} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={44} color={Colors.primary} />
          </View>
          <Text style={styles.title}>TRITO</Text>
          <Text style={styles.subtitle}>
            A secure, non-custodial wallet.{"\n"}Your keys, your crypto.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/(auth)/create" as any)}
          >
            <Text style={styles.primaryBtnText}>Create a New Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/(auth)/import" as any)}
          >
            <Text style={styles.secondaryBtnText}>I already have a wallet</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree that TRITO cannot recover your wallet
            if you lose your recovery phrase.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 24 },
  logoSection: { alignItems: "center", marginTop: 100 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  buttonSection: { gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.onPrimary, fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.textPrimary, fontWeight: "600", fontSize: 15 },
  disclaimer: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
  },
});