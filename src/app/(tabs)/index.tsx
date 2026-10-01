import { fetchCryptoPrices, fetchUsdtInrRate } from "@/services/cryptoService";
import LivePriceChart from "@/components/LivePriceChart";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "@/components/AppHeader";
import AppDrawer from "@/components/AppDrawer";
import { Colors } from "@/constants/Colors";

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
    image:
      "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
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
    image:
      "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
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
    image:
      "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
  },
];

const PANEL_BG = Colors.surfaceAlt ?? "#F6F6F6";
const STAR_ON = "#F59E0B";

// Some logos are white-on-transparent and vanish on a light circle.
const DARK_LOGO_BG: Record<string, string> = {
  ripple: "#23292F",
};

export default function BrowserScreen() {
  const [activeSegment, setActiveSegment] = useState<"Home" | "Discover">(
    "Home",
  );

  const [coins, setCoins] = useState<CryptoCoin[]>(INITIAL_COINS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");
  const [menuVisible, setMenuVisible] = useState(false);

  // Compact market view
  const [compactMode, setCompactMode] = useState(false);

  const router = useRouter();

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [usdtInrRate, setUsdtInrRate] = useState(96);

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

      await AsyncStorage.setItem(
        "@crypto_watchlist",
        JSON.stringify(updatedWatchlist),
      );
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

  // Live Market Data
  useEffect(() => {
    let mounted = true;

    const fetchCryptoData = async () => {
      try {
        const [prices, usdtInrRate] = await Promise.all([
          fetchCryptoPrices(),
          fetchUsdtInrRate(),
        ]);

        if (!mounted) return;

        setUsdtInrRate(usdtInrRate);

        setCoins((prevCoins) =>
          prevCoins.map((coin) => {
            const marketData = prices?.[coin.id];

            if (!marketData) {
              return coin;
            }

            const usdPrice = Number(marketData.usd || 0);

            const displayPrice =
              currency === "inr" ? usdPrice * usdtInrRate : usdPrice;

            return {
              ...coin,
              current_price: displayPrice,
              price_change_percentage_24h: Number(
                marketData.usd_24h_change || 0,
              ),
            };
          }),
        );
      } catch (error) {
        console.log("Live market fetch error:", error);
      }
    };

    fetchCryptoData();

    const interval = setInterval(fetchCryptoData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />

      <AppHeader
        title="Crypto Markets"
        leftComponent={
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMenuVisible(true)}
            accessibilityLabel="Open navigation menu"
          >
            <Ionicons name="menu-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="pulse" size={20} color={Colors.positiveGreen} />
          </TouchableOpacity>
        }
      />

      {/* Market / Watchlist tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveSegment("Home")}
          style={styles.tab}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeSegment === "Home" && styles.tabTextActive]}
          >
            Market
          </Text>
          <View
            style={[styles.tabLine, activeSegment === "Home" && styles.tabLineActive]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSegment("Discover")}
          style={styles.tab}
          activeOpacity={0.7}
        >
          <View style={styles.tabLabelRow}>
            <Text
              style={[
                styles.tabText,
                activeSegment === "Discover" && styles.tabTextActive,
              ]}
            >
              Watchlist
            </Text>
            <View
              style={[
                styles.countBadge,
                activeSegment === "Discover" && styles.countBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  activeSegment === "Discover" && styles.countTextActive,
                ]}
              >
                {watchlist.length}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.tabLine,
              activeSegment === "Discover" && styles.tabLineActive,
            ]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />

          <TextInput
            placeholder="Search Bitcoin, ETH..."
            placeholderTextColor={Colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.disabled} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>
            {activeSegment === "Home" ? "Live markets" : "Your watchlist"}
          </Text>

          <View style={styles.currencyToggleContainer}>
            {(["inr", "usd"] as const).map((c) => {
              const active = currency === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyBtn, active && styles.currencyBtnActive]}
                  onPress={() => setCurrency(c)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.currencyText, active && styles.currencyTextActive]}
                  >
                    {c === "inr" ? "₹ INR" : "$ USD"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Crypto list */}
        <View>
          {displayedCoins.length > 0 ? (
            displayedCoins.map((coin, index) => {
              const isProfit = coin.price_change_percentage_24h >= 0;
              const isWatchlisted = watchlist.includes(coin.id);
              const isLast = index === displayedCoins.length - 1;
              const logoBg = DARK_LOGO_BG[coin.id] ?? PANEL_BG;

              return (
                <TouchableOpacity
                  key={coin.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCoin(coin)}
                  style={[
                    styles.cryptoRow,
                    compactMode && styles.compactCryptoRow,
                    !isLast && styles.rowDivider,
                  ]}
                >
                  {/* Left */}
                  <View style={[styles.coinLeft, compactMode && styles.compactCoinLeft]}>
                    <View
                      style={[
                        styles.logoWrap,
                        compactMode && styles.compactLogoWrap,
                        { backgroundColor: logoBg },
                      ]}
                    >
                      {coin.image ? (
                        <Image
                          source={{ uri: coin.image }}
                          style={[styles.coinImage, compactMode && styles.compactCoinImage]}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="currency-usd"
                          size={20}
                          color={Colors.textPrimary}
                        />
                      )}
                    </View>

                    <View>
                      <Text
                        style={[styles.coinName, compactMode && styles.compactCoinName]}
                      >
                        {coin.name}
                      </Text>
                      <Text
                        style={[styles.coinSymbol, compactMode && styles.compactCoinSymbol]}
                      >
                        {coin.symbol.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Right */}
                  <View
                    style={[
                      styles.coinRightContainer,
                      compactMode && styles.compactCoinRightContainer,
                    ]}
                  >
                    <View style={styles.coinRight}>
                      <Text
                        style={[styles.coinPrice, compactMode && styles.compactCoinPrice]}
                      >
                        {coin.current_price > 0
                          ? `${currency === "inr" ? "₹" : "$"}${coin.current_price.toLocaleString(
                              currency === "inr" ? "en-IN" : "en-US",
                              { minimumFractionDigits: 2 },
                            )}`
                          : "Loading..."}
                      </Text>

                      {coin.current_price > 0 && (
                        <View
                          style={[
                            styles.changePill,
                            compactMode && styles.compactChangePill,
                            {
                              backgroundColor: isProfit
                                ? Colors.positiveGreen + "1A"
                                : Colors.negativeRed + "1A",
                            },
                          ]}
                        >
                          <Ionicons
                            name={isProfit ? "caret-up" : "caret-down"}
                            size={compactMode ? 8 : 10}
                            color={isProfit ? Colors.positiveGreen : Colors.negativeRed}
                          />
                          <Text
                            style={[
                              styles.coinPercentage,
                              compactMode && styles.compactCoinPercentage,
                              {
                                color: isProfit ? Colors.positiveGreen : Colors.negativeRed,
                              },
                            ]}
                          >
                            {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Star */}
                    <TouchableOpacity
                      onPress={() => toggleWatchlist(coin.id)}
                      style={styles.starBtn}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={isWatchlisted ? "star" : "star-outline"}
                        size={21}
                        color={isWatchlisted ? STAR_ON : Colors.disabled}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={activeSegment === "Discover" ? "star-outline" : "search-outline"}
                  size={24}
                  color={Colors.textPrimary}
                />
              </View>
              <Text style={styles.emptyText}>
                {activeSegment === "Discover"
                  ? "No coins in your watchlist yet! Tap the star icon on any coin to add it."
                  : "No coins found."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AppDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentRoute="markets"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  iconBtn: { padding: 4 },

  /* Tabs */
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 24,
  },
  tab: { paddingTop: 8 },
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
    paddingBottom: 10,
  },
  tabTextActive: { color: Colors.textPrimary, fontWeight: "800" },
  tabLine: { height: 2.5, borderRadius: 2, backgroundColor: "transparent" },
  tabLineActive: { backgroundColor: Colors.primary },
  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: PANEL_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  countBadgeActive: { backgroundColor: Colors.primary },
  countText: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary },
  countTextActive: { color: Colors.onPrimary },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14.5,
    color: Colors.textPrimary,
    padding: 0,
  },

  /* Section header */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  currencyToggleContainer: {
    flexDirection: "row",
    backgroundColor: PANEL_BG,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  currencyBtnActive: { backgroundColor: Colors.primary },
  currencyText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  currencyTextActive: { color: Colors.onPrimary },

  /* Rows */
  cryptoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  compactCryptoRow: { paddingVertical: 8 },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },

  coinLeft: { flexDirection: "row", alignItems: "center", gap: 13 },
  compactCoinLeft: { gap: 9 },

  logoWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactLogoWrap: { width: 32, height: 32, borderRadius: 16 },
  coinImage: { width: 30, height: 30, resizeMode: "contain" },
  compactCoinImage: { width: 22, height: 22 },

  coinName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  compactCoinName: { fontSize: 13.5 },
  coinSymbol: {
    fontSize: 12.5,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase",
  },
  compactCoinSymbol: { fontSize: 10.5, marginTop: 1 },

  coinRightContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  compactCoinRightContainer: { gap: 6 },
  coinRight: { alignItems: "flex-end" },
  coinPrice: { fontSize: 15.5, fontWeight: "700", color: Colors.textPrimary },
  compactCoinPrice: { fontSize: 13 },

  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
  },
  compactChangePill: { paddingHorizontal: 5, paddingVertical: 1, marginTop: 3 },
  coinPercentage: { fontSize: 12, fontWeight: "700" },
  compactCoinPercentage: { fontSize: 10.5 },

  starBtn: { padding: 4 },

  /* Empty */
  emptyContainer: { paddingVertical: 48, paddingHorizontal: 30, alignItems: "center" },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
