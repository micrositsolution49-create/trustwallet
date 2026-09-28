import { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSecure, setIsSecure] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleAuthAction = () => {
    console.log(
      `${authMode === "login" ? "Logging in" : "Signing up"} with:`,
      email,
    );
  };

  const lletConnect = (walletName: string) => {
    console.log(`Connecting to ${walletName}...`);
  };

  const handleBiometricAuth = () => {
    console.log("Triggering Passkey / FaceID login...");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <View style={styles.innerDot} />
            </View>
            <Text style={styles.brandTitle}>Trust Wallet</Text>
            <Text style={styles.brandSubtitle}>
              Secure Web3 & Financial Gateway
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, authMode === "login" && styles.activeTab]}
                onPress={() => setAuthMode("login")}
              >
                <Text
                  style={[
                    styles.tabText,
                    authMode === "login" && styles.activeTabText,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authMode === "signup" && styles.activeTab]}
                onPress={() => setAuthMode("signup")}
              >
                <Text
                  style={[
                    styles.tabText,
                    authMode === "signup" && styles.activeTabText,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>Password</Text>
                {authMode === "login" && (
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={isSecure}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsSecure(!isSecure)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>
                    {isSecure ? "Show" : "Hide"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuthAction}
            >
              <Text style={styles.primaryButtonText}>
                {authMode === "login" ? "Access Account" : "Create Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Text style={styles.biometricText}>
                🔒 Quick Login with FaceID / Passkey
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with web3</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Web3 / Crypto Options */}
            {/* <View style={styles.web3Container}>
              <TouchableOpacity 
                style={styles.web3Button} 
                onPress={() => lletConnect('Trust Wallet')}
              >
                <Text style={styles.web3ButtonText}>🛡️ Trust Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.web3Button} 
                onPress={() => lletConnect('MetaMask')}
              >
                <Text style={styles.web3ButtonText}>🦊 MetaMask</Text>
              </TouchableOpacity>
            </View> */}

            <View style={styles.ssoRow}>
              <TouchableOpacity style={styles.ssoButton}>
                <Image
                  src="https://static.vecteezy.com/system/resources/previews/013/948/549/non_2x/google-logo-on-transparent-white-background-free-vector.jpg"
                  alt="google"
                />
                <Text style={styles.ssoText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ssoButton}>
                <Text style={styles.ssoText}>Apple ID</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerTerms}>
            By continuing, you agree to Trust Wallet's{" "}
            <Text style={styles.linkText}>Terms of Service</Text> and{" "}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  innerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentCyan,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.surfaceCard,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.brandBlue,
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.surfaceCard,
    fontSize: 16,
    fontWeight: "700",
  },
  biometricButton: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  biometricText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  web3Container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  web3Button: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  web3ButtonText: {
    color: Colors.surfaceCard,
    fontSize: 12,
    fontWeight: "600",
  },
  ssoRow: {
    flexDirection: "row",
    gap: 10,
  },
  ssoButton: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ssoText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  footerTerms: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  linkText: {
    color: Colors.accentCyan,
    textDecorationLine: "underline",
  },
});
