import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#07162C", "#0E335E", "#0B5997"]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={44} color="#00D18F" />
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
            By continuing, you agree that TrustWallet cannot recover your wallet
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
    backgroundColor: "rgba(0, 209, 143, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#FFF", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#A0B3D6", textAlign: "center", lineHeight: 20 },
  buttonSection: { gap: 12 },
  primaryBtn: {
    backgroundColor: "#0090FF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  secondaryBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  disclaimer: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
  },
});