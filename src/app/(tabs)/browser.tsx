import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const DAPPS = [
  {
    id: "1",
    name: "Uniswap",
    subtitle: "Decentralized exchange",
    icon: "swap-horizontal-circle",
    color: "#FF007A",
  },
  {
    id: "2",
    name: "PancakeSwap",
    subtitle: "Trade and earn crypto",
    icon: "cake-variant",
    color: "#00D1FF",
  },
  {
    id: "3",
    name: "OpenSea",
    subtitle: "NFT marketplace",
    icon: "sail-boat",
    color: "#2081E2",
  },
];

const NFTS = [
  {
    id: "1",
    name: "Bored Ape",
    subtitle: "Floor: 12.4 ETH",
    icon: "alien-outline",
    color: "#F59E0B",
  },
  {
    id: "2",
    name: "Azuki",
    subtitle: "Floor: 4.8 ETH",
    icon: "sword-cross",
    color: "#EF4444",
  },
  {
    id: "3",
    name: "Pudgy Penguins",
    subtitle: "Floor: 9.1 ETH",
    icon: "snowflake",
    color: "#06B6D4",
  },
];

export default function BrowserScreen() {
  const [activeSegment, setActiveSegment] = useState<"Home" | "Discover">(
    "Home",
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Top Search & Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="menu-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browser/Discover</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="search-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Segmented Controller (Home / Discover) */}
      <View style={styles.segmentWrapper}>
        <TouchableOpacity
          onPress={() => setActiveSegment("Home")}
          style={[
            styles.segmentBtn,
            activeSegment === "Home" && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "Home" && styles.segmentTextActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveSegment("Discover")}
          style={[
            styles.segmentBtn,
            activeSegment === "Discover" && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "Discover" && styles.segmentTextActive,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* URL / Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="globe-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search or enter website URL"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        {/* Section 1: DApps */}
        <SectionHeader title="DApps" />
        <View style={styles.gridContainer}>
          {DAPPS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: `${item.color}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={28}
                  color={item.color}
                />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 2: NFTs */}
        <SectionHeader title="NFTs" />
        <View style={styles.gridContainer}>
          {NFTS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: `${item.color}15` },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={28}
                  color={item.color}
                />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <TouchableOpacity>
        <Text style={styles.seeAllText}>See All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  iconBtn: { padding: 4 },
  segmentWrapper: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: "500", color: "#64748B" },
  segmentTextActive: { color: "#0F172A", fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 6,
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#0F172A" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  sectionHeading: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  seeAllText: { fontSize: 13, color: "#0284C7", fontWeight: "600" },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  cardSubtitle: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 2,
  },
});
