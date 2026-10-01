import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppHeaderProps {
  title?: string;                          // Center me simple text title ke liye
  leftComponent?: React.ReactNode;         // Left side ke liye custom icon/button
  rightComponent?: React.ReactNode;        // Right side ke liye custom icon/button
  centerComponent?: React.ReactNode;       // Agar center me title ke alawa kuch aur rakhna ho
  style?: ViewStyle;
}

export default function AppHeader({
  title,
  leftComponent,
  rightComponent,
  centerComponent,
  style,
}: AppHeaderProps) {
  return (
    <View style={[styles.headerContainer, style]}>
      {/* Left Slot */}
      <View style={styles.leftContainer}>
        {leftComponent}
      </View>

      {/* Center Slot */}
      <View style={styles.centerContainer}>
        {centerComponent ? (
          centerComponent
        ) : title ? (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      {/* Right Slot */}
      <View style={styles.rightContainer}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  leftContainer: {
    minWidth: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  rightContainer: {
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
});