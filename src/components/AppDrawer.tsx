import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  currentRoute?: string; // Yeh batane ke liye ki abhi kaunsa page active hai
}

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.8, 340);
const PANEL_BG = Colors.surfaceAlt ?? "#F6F6F6";

export default function AppDrawer({ visible, onClose, currentRoute }: AppDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Slide the panel in whenever the drawer opens
  useEffect(() => {
    if (visible) {
      slide.setValue(-DRAWER_WIDTH);
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.drawerOverlay}>
        {/* Background overlay: tap to close */}
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 20,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandMark}>
              <Ionicons
                name="logo-bitcoin"
                size={24}
                color={Colors.onPrimary}
                style={{ transform: [{ rotate: "10deg" }] }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.drawerBrand}>Crypto Wallet</Text>
              <Text style={styles.drawerSubtitle}>Markets & wallet</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Navigation */}
          <Text style={styles.drawerSectionTitle}>Navigate</Text>

          <DrawerItem
            icon="trending-up-outline"
            label="Markets"
            active={currentRoute === "markets"}
            onPress={() => {
              onClose();
              router.push("/markets" as any); // Agar markets route hai
            }}
          />

          <DrawerItem
            icon="wallet-outline"
            label="Wallet"
            active={currentRoute === "wallet"}
            onPress={() => {
              onClose();
              router.push("/wallet" as any);
            }}
          />

          <DrawerItem
            icon="swap-horizontal-outline"
            label="Swap / Exchange"
            active={currentRoute === "swap"}
            onPress={() => {
              onClose();
              router.push("/swap" as any);
            }}
          />

          <DrawerItem
            icon="settings-outline"
            label="Settings"
            active={currentRoute === "settings"}
            onPress={() => {
              onClose();
              router.push("/settings" as any);
            }}
          />

          {/* Wallet / Security */}
          <Text style={[styles.drawerSectionTitle, { marginTop: 22 }]}>Wallet</Text>

          <DrawerItem
            icon="lock-closed-outline"
            label="Lock wallet"
            danger
            onPress={() => {
              onClose();
              Alert.alert(
                "Lock wallet?",
                "You will need to unlock your wallet again to access it.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Lock",
                    style: "destructive",
                    onPress: () => router.replace("/(auth)/unlock" as any),
                  },
                ]
              );
            }}
          />

          {/* Footer note (pinned to bottom) */}
          <View style={styles.drawerBottom}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.positiveGreen} />
            </View>
            <Text style={styles.drawerSafeText}>Your wallet stays on your device</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Helper sub-component for drawer items
interface DrawerItemProps {
  icon: any;
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}

function DrawerItem({ icon, label, active, danger, onPress }: DrawerItemProps) {
  const iconColor = danger
    ? Colors.negativeRed
    : active
      ? Colors.onPrimary
      : Colors.textPrimary;

  return (
    <TouchableOpacity
      style={[styles.drawerItem, active && styles.drawerItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={21} color={iconColor} />
      <Text
        style={[
          styles.drawerItemText,
          active && styles.drawerItemTextActive,
          danger && styles.drawerItemTextDanger,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    flexDirection: "row",
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    backgroundColor: Colors.backgroundLight,
    height: "100%",
    paddingHorizontal: 20,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },

  /* Header */
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  drawerBrand: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  drawerSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PANEL_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Sections */
  drawerSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },

  /* Items */
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: Colors.primary,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: 14,
  },
  drawerItemTextActive: {
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  drawerItemTextDanger: {
    color: Colors.negativeRed,
  },

  /* Footer */
  drawerBottom: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    borderRadius: 16,
  },
  shieldWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.positiveGreen + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerSafeText: {
    flex: 1,
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginLeft: 10,
    fontWeight: "500",
  },
});