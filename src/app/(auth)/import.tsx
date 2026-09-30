import { 
  importWallet, 
  importWalletByPrivateKey, 
  importWalletByKeystore 
} from "@/services/walletService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Colors } from "@/constants/Colors";

type ImportMode = "phrase" | "privateKey" | "keystore";

export default function ImportWalletScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>("phrase");
  const [inputVal, setInputVal] = useState("");
  const [keystoreFileContent, setKeystoreFileContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [keystorePassword, setKeystorePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = inputVal.trim().split(/\s+/).filter(Boolean).length;
  const isPrivateKeyValid = inputVal.trim().length >= 64;
  const isKeystoreValid = keystoreFileContent.trim().length > 0 && keystorePassword.length > 0;

  const pickKeystoreFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        setFileName(result.assets[0].name);

        const fileString = await FileSystem.readAsStringAsync(fileUri);
        setKeystoreFileContent(fileString);
        if (error) setError(null);
      }
    } catch (e) {
      setError("Failed to read the keystore file.");
    }
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "phrase") {
        await importWallet(inputVal);
      } else if (mode === "privateKey") {
        await importWalletByPrivateKey(inputVal);
      } else {
        await importWalletByKeystore(keystoreFileContent, keystorePassword);
      }
      router.push("/(auth)/unlock?mode=setup" as any);
    } catch (e: any) {
      setError(
        e?.message || "Failed to import wallet. Please check your inputs.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    loading ||
    (mode === "phrase" && wordCount !== 12 && wordCount !== 24) ||
    (mode === "privateKey" && !isPrivateKeyValid) ||
    (mode === "keystore" && !isKeystoreValid);

  return (
    <LinearGradient
      colors={[Colors.cardGradientStart, Colors.cardGradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Import Wallet</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mode Switcher Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, mode === "phrase" && styles.activeTab]}
                onPress={() => {
                  setMode("phrase");
                  setInputVal("");
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "phrase" && styles.activeTabText,
                  ]}
                >
                  Phrase
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, mode === "privateKey" && styles.activeTab]}
                onPress={() => {
                  setMode("privateKey");
                  setInputVal("");
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "privateKey" && styles.activeTabText,
                  ]}
                >
                  Private Key
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, mode === "keystore" && styles.activeTab]}
                onPress={() => {
                  setMode("keystore");
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "keystore" && styles.activeTabText,
                  ]}
                >
                  Keystore JSON
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.instruction}>
              {mode === "phrase"
                ? "Enter your 12 or 24-word recovery phrase, separated by spaces."
                : mode === "privateKey"
                ? "Enter your private key (usually 64 hex characters, with or without '0x')."
                : "Upload your encrypted JSON keystore file and enter the decryption password."}
            </Text>

            {/* Inputs based on Mode */}
            {mode === "keystore" ? (
              <View style={{ marginBottom: 10 }}>
                <TouchableOpacity style={styles.filePickerBtn} onPress={pickKeystoreFile}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                  <Text style={styles.filePickerText} numberOfLines={1}>
                    {fileName ? fileName : "Select Keystore JSON File (.json)"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.textArea, { marginTop: 12, minHeight: 50 }]}
                  placeholder="Enter Keystore Password"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry
                  value={keystorePassword}
                  onChangeText={(p) => {
                    setKeystorePassword(p);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <TextInput
                style={styles.textArea}
                placeholder={
                  mode === "phrase"
                    ? "word1 word2 word3 ..."
                    : "0x... or private key string"
                }
                placeholderTextColor={Colors.textSecondary}
                value={inputVal}
                onChangeText={(t) => {
                  setInputVal(t);
                  if (error) setError(null);
                }}
                multiline
                numberOfLines={mode === "phrase" ? 5 : 3}
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
              />
            )}

            {/* Meta status / helper texts */}
            {mode === "phrase" ? (
              <View style={styles.metaRow}>
                <Text style={styles.wordCountText}>
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </Text>
                {(wordCount === 12 || wordCount === 24) && (
                  <View style={styles.validBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.positiveGreen} />
                    <Text style={styles.validBadgeText}>Valid length</Text>
                  </View>
                )}
              </View>
            ) : mode === "privateKey" ? (
              <View style={styles.metaRow}>
                <Text style={styles.wordCountText}>
                  {inputVal.trim().length} characters
                </Text>
                {isPrivateKeyValid && (
                  <View style={styles.validBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.positiveGreen} />
                    <Text style={styles.validBadgeText}>Ready</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.metaRow}>
                <Text style={styles.wordCountText}>
                  {fileName ? "File attached" : "No file selected"}
                </Text>
                {isKeystoreValid && (
                  <View style={styles.validBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.positiveGreen} />
                    <Text style={styles.validBadgeText}>Ready</Text>
                  </View>
                )}
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={16} color="#D97706" />
              <Text style={styles.warningText}>
                Never share your credentials. Anyone with your recovery phrase, private key, or keystore file will have full control of your funds.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.importBtn,
                isButtonDisabled && styles.importBtnDisabled,
              ]}
              disabled={isButtonDisabled}
              onPress={handleImport}
            >
              <Text style={styles.importBtnText}>
                {loading ? "Importing..." : "Import Wallet"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
  headerTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "600" },
  scrollContent: { paddingBottom: 30 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.accentCyan,
    borderRadius: 12,
    padding: 4,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  activeTabText: {
    color: Colors.onPrimary,
  },
  instruction: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 110,
  },
  filePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  filePickerText: {
    color: Colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  wordCountText: { color: Colors.textSecondary, fontSize: 12 },
  validBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  validBadgeText: { color: Colors.positiveGreen, fontSize: 12, fontWeight: "600" },
  errorBox: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  errorText: { color: Colors.negativeRed, fontSize: 13, lineHeight: 18 },
  warningBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(217, 119, 6, 0.08)",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "flex-start",
  },
  warningText: { flex: 1, color: "#D97706", fontSize: 12, lineHeight: 17 },
  importBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 26,
  },
  importBtnDisabled: { backgroundColor: Colors.disabled },
  importBtnText: { color: Colors.onPrimary, fontWeight: "700", fontSize: 15 },
});