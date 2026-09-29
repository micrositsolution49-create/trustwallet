import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

const INITIAL_COINS: CryptoCoin[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "eth",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    id: "binancecoin",
    name: "BNB",
    symbol: "bnb",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "sol",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  },
  {
    id: "ripple",
    name: "XRP",
    symbol: "xrp",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ada",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "doge",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
  },
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "dot",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
  },
  {
    id: "avalanche-2",
    name: "Avalanche",
    symbol: "avax",
    current_price: 0,
    price_change_percentage_24h: 0,
    image:
      "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    id: "chainlink",
    name: "Chainlink",
    symbol: "link",
    current_price: 0,
    price_change_percentage_24h: 0,
    image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
  },
];

export default function BrowserScreen() {
  const [activeSegment, setActiveSegment] = useState<"Home" | "Discover">("Home");

  const [coins, setCoins] = useState<CryptoCoin[]>(INITIAL_COINS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");
  const [menuVisible, setMenuVisible] = useState(false);

  // Compact market view
  const [compactMode, setCompactMode] = useState(false);

  const router = useRouter();

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Load watchlist on app start
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const savedWatchlist = await AsyncStorage.getItem("@crypto_watchlist");

        if (savedWatchlist) {
          setWatchlist(JSON.parse(savedWatchlist));
        }
      } catch (err) {
        console.log("Failed to load watchlist:", err);
      }
    };

    loadWatchlist();
  }, []);

  // Toggle watchlist
  const toggleWatchlist = async (coinId: string) => {
    try {
      let updatedWatchlist: string[];

      if (watchlist.includes(coinId)) {
        updatedWatchlist = watchlist.filter((id) => id !== coinId);
      } else {
        updatedWatchlist = [...watchlist, coinId];
      }

      setWatchlist(updatedWatchlist);

      await AsyncStorage.setItem("@crypto_watchlist", JSON.stringify(updatedWatchlist));
    } catch (err) {
      console.log("Failed to save watchlist:", err);
    }
  };

  // Reload settings whenever Home gets focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      // Currency
      AsyncStorage.getItem("@crypto_currency").then((saved) => {
        if (active && (saved === "inr" || saved === "usd")) {
          setCurrency(saved);
        }
      });

      // Watchlist
      AsyncStorage.getItem("@crypto_watchlist").then((saved) => {
        if (!active) return;

        if (saved) {
          try {
            const parsedWatchlist = JSON.parse(saved);

            if (Array.isArray(parsedWatchlist)) {
              setWatchlist(parsedWatchlist);
            }
          } catch (error) {
            console.log("Failed to parse watchlist:", error);
            setWatchlist([]);
          }
        } else {
          setWatchlist([]);
        }
      });

      // Compact Market View
      AsyncStorage.getItem("@compact_market_view").then((saved) => {
        if (!active) return;

        if (saved !== null) {
          try {
            setCompactMode(JSON.parse(saved));
          } catch (error) {
            console.log("Failed to parse compact mode:", error);
            setCompactMode(false);
          }
        } else {
          setCompactMode(false);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  // API Data Fetching
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=20&page=1&sparkline=false`,
        );

        const data = await response.json();

        if (Array.isArray(data)) {
          setCoins((prevCoins) =>
            prevCoins.map((coin) => {
              const matched = data.find((item: any) => item.id === coin.id);

              if (matched) {
                return {
                  ...coin,
                  current_price: matched.current_price || 0,
                  price_change_percentage_24h: matched.price_change_percentage_24h || 0,
                  image: matched.image || coin.image,
                };
              }

              return coin;
            }),
          );
        }
      } catch (err) {
        console.log("API fetch error:", err);
      }
    };

    fetchCryptoData();

    const interval = setInterval(fetchCryptoData, 30000);

    return () => clearInterval(interval);
  }, [currency]);

  // Filtering
  const displayedCoins = coins.filter((coin) => {
    const matchesSearch =
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeSegment === "Discover") {
      return matchesSearch && watchlist.includes(coin.id);
    }

    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Open navigation menu"
        >
          <Ionicons name="menu-outline" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Crypto Markets</Text>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="pulse" size={20} color="#00D18F" />
        </TouchableOpacity>
      </View>

      {/* Market / Watchlist Tabs */}
      <View style={styles.segmentWrapper}>
        <TouchableOpacity
          onPress={() => setActiveSegment("Home")}
          style={[styles.segmentBtn, activeSegment === "Home" && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, activeSegment === "Home" && styles.segmentTextActive]}>
            Market
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSegment("Discover")}
          style={[styles.segmentBtn, activeSegment === "Discover" && styles.segmentBtnActive]}
        >
          <Text
            style={[styles.segmentText, activeSegment === "Discover" && styles.segmentTextActive]}
          >
            Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />

          <TextInput
            placeholder="Search coin (e.g. Bitcoin, ETH)..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>
            {activeSegment === "Home" ? "Live Markets" : "Your Watchlist"}
          </Text>

          <View style={styles.currencyToggleContainer}>
            <TouchableOpacity
              style={[styles.currencyBtn, currency === "inr" && styles.currencyBtnActive]}
              onPress={() => setCurrency("inr")}
            >
              <Text style={[styles.currencyText, currency === "inr" && styles.currencyTextActive]}>
                ₹ INR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.currencyBtn, currency === "usd" && styles.currencyBtnActive]}
              onPress={() => setCurrency("usd")}
            >
              <Text style={[styles.currencyText, currency === "usd" && styles.currencyTextActive]}>
                $ USD
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crypto List */}
        <View style={styles.listContainer}>
          {displayedCoins.length > 0 ? (
            displayedCoins.map((coin) => {
              const isProfit = coin.price_change_percentage_24h >= 0;

              const isWatchlisted = watchlist.includes(coin.id);

              return (
                <View
                  key={coin.id}
                  style={[styles.cryptoRow, compactMode && styles.compactCryptoRow]}
                >
                  {/* Left Side */}
                  <View style={[styles.coinLeft, compactMode && styles.compactCoinLeft]}>
                    <View
                      style={[styles.iconPlaceholder, compactMode && styles.compactIconPlaceholder]}
                    >
                      {coin.image ? (
                        <Image
                          source={{ uri: coin.image }}
                          style={[styles.coinImage, compactMode && styles.compactCoinImage]}
                        />
                      ) : (
                        <MaterialCommunityIcons name="currency-usd" size={20} color="#0284C7" />
                      )}
                    </View>

                    <View>
                      <Text style={[styles.coinName, compactMode && styles.compactCoinName]}>
                        {coin.name}
                      </Text>

                      <Text style={[styles.coinSymbol, compactMode && styles.compactCoinSymbol]}>
                        {coin.symbol.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Right Side */}
                  <View
                    style={[
                      styles.coinRightContainer,
                      compactMode && styles.compactCoinRightContainer,
                    ]}
                  >
                    <View style={styles.coinRight}>
                      <Text style={[styles.coinPrice, compactMode && styles.compactCoinPrice]}>
                        {coin.current_price > 0
                          ? `${currency === "inr" ? "₹" : "$"}${coin.current_price.toLocaleString(
                              currency === "inr" ? "en-IN" : "en-US",
                              {
                                minimumFractionDigits: 2,
                              },
                            )}`
                          : "Loading..."}
                      </Text>

                      {coin.current_price > 0 && (
                        <Text
                          style={[
                            styles.coinPercentage,
                            compactMode && styles.compactCoinPercentage,
                            {
                              color: isProfit ? "#00C853" : "#FF3B30",
                            },
                          ]}
                        >
                          {isProfit ? "+" : ""}
                          {coin.price_change_percentage_24h.toFixed(2)}%
                        </Text>
                      )}
                    </View>

                    {/* Star */}
                    <TouchableOpacity
                      onPress={() => toggleWatchlist(coin.id)}
                      style={styles.starBtn}
                    >
                      <Ionicons
                        name={isWatchlisted ? "star" : "star-outline"}
                        size={22}
                        color={isWatchlisted ? "#F59E0B" : "#94A3B8"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeSegment === "Discover"
                  ? "No coins in your watchlist yet! Tap the star icon on any coin to add it."
                  : "No coins found."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Hamburger Drawer */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity activeOpacity={1} onPress={() => setMenuVisible(false)} />

          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandMark}>
                <Ionicons
                  name="logo-bitcoin"
                  size={22}
                  color="#FFFFFF"
                  style={{
                    transform: [{ rotate: "10deg" }],
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.drawerBrand}>Crypto Wallet</Text>

                <Text style={styles.drawerSubtitle}>Markets & wallet</Text>
              </View>

              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            <Text style={styles.drawerSectionTitle}>NAVIGATION</Text>

            <DrawerItem
              icon="trending-up-outline"
              label="Markets"
              active
              onPress={() => setMenuVisible(false)}
            />

            <DrawerItem
              icon="wallet-outline"
              label="Wallet"
              onPress={() => {
                setMenuVisible(false);
                router.push("/wallet");
              }}
            />

            <DrawerItem
              icon="swap-horizontal-outline"
              label="Swap / Exchange"
              onPress={() => {
                setMenuVisible(false);
                router.push("/swap");
              }}
            />

            <DrawerItem
              icon="settings-outline"
              label="Settings"
              onPress={() => {
                setMenuVisible(false);
                router.push("/settings");
              }}
            />

            <View style={styles.drawerDivider} />

            <Text style={styles.drawerSectionTitle}>WALLET</Text>

            <DrawerItem
              icon="lock-closed-outline"
              label="Lock Wallet"
              danger
              onPress={() => {
                setMenuVisible(false);

                Alert.alert(
                  "Lock wallet?",
                  "You will need to unlock your wallet again to access it.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Lock",
                      style: "destructive",
                      onPress: () => router.replace("/(auth)/unlock"),
                    },
                  ],
                );
              }}
            />

            <View style={styles.drawerBottom}>
              <Ionicons name="shield-checkmark-outline" size={17} color="#00A878" />

              <Text style={styles.drawerSafeText}>Your wallet stays on your device</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
  active = false,
  danger = false,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.drawerItem, active && styles.drawerItemActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.drawerIcon, active && styles.drawerIconActive]}>
        <Ionicons
          name={icon}
          size={19}
          color={danger ? "#E5484D" : active ? "#0560FA" : "#64748B"}
        />
      </View>

      <Text
        style={[
          styles.drawerItemText,
          active && styles.drawerItemTextActive,
          danger && styles.drawerItemTextDanger,
        ]}
      >
        {label}
      </Text>

      {!danger && <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  iconBtn: {
    padding: 4,
  },

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

  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },

  segmentTextActive: {
    color: "#0F172A",
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

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
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  currencyToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 2,
  },

  currencyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  currencyBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  currencyText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },

  currencyTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },

  listContainer: {
    gap: 8,
  },

  /* NORMAL MODE */
  cryptoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  /* COMPACT MODE */
  compactCryptoRow: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  coinLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  compactCoinLeft: {
    gap: 8,
  },

  iconPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  compactIconPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  coinImage: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },

  compactCoinImage: {
    width: 21,
    height: 21,
  },

  coinName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },

  compactCoinName: {
    fontSize: 12.5,
  },

  coinSymbol: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "uppercase",
  },

  compactCoinSymbol: {
    fontSize: 10,
  },

  coinRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  compactCoinRightContainer: {
    gap: 6,
  },

  coinRight: {
    alignItems: "flex-end",
  },

  coinPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  compactCoinPrice: {
    fontSize: 12,
  },

  coinPercentage: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  compactCoinPercentage: {
    fontSize: 10,
    marginTop: 1,
  },

  starBtn: {
    padding: 4,
  },

  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },

  /* DRAWER */

  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },

  drawer: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    paddingTop: 58,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 16,
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 4,
    marginBottom: 18,
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 50,
    backgroundColor: "#f7931a",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#0560FA",
    borderWidth: 2,
  },

  drawerBrand: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  drawerSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },

  drawerDivider: {
    height: 1,
    backgroundColor: "#EEF2F6",
    marginVertical: 14,
  },

  drawerSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#94A3B8",
    marginBottom: 7,
    marginLeft: 5,
  },

  drawerItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    paddingHorizontal: 9,
    marginBottom: 4,
  },

  drawerItemActive: {
    backgroundColor: "#EFF6FF",
  },

  drawerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  drawerIconActive: {
    backgroundColor: "#DBEAFE",
  },

  drawerItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  drawerItemTextActive: {
    color: "#0560FA",
    fontWeight: "700",
  },

  drawerItemTextDanger: {
    color: "#E5484D",
  },

  drawerBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F0FDF9",
    borderRadius: 12,
    padding: 11,
    marginTop: "auto",
    marginBottom: 28,
  },

  drawerSafeText: {
    flex: 1,
    fontSize: 11,
    color: "#087F5B",
    fontWeight: "600",
  },
});
