import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SendScreen() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      // Yahan apna sendNativeTransaction ya crypto service call karein
      // Jaise: await sendNativeTransaction(recipient, amount);
      
      console.log(`Sending ${amount} to ${recipient}`);
      
      // Simulate delay for transaction
      setTimeout(() => {
        setLoading(false);
        Alert.alert("Success", "Transaction sent successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }, 1500);
      
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Transaction Failed", error.message || "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Crypto</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form Inputs */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          placeholder="0x... or domain name"
          placeholderTextColor="#666"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="0.0"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenText}>ETH</Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Continue & Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfbfb",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#040404",
    fontSize: 18,
    fontWeight: "bold",
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    color: "#4a4545",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#eeeeee",
    borderWidth: 1,
    borderColor: "#252525",
    borderRadius: 12,
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  tokenBadge: {
    backgroundColor: "#f7d200",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#2e6ee1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
