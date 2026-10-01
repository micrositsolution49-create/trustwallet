import { fetchBinanceChart, type CandlePoint } from "@/services/cryptoService";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

const INTERVALS = [
  { label: "1H", value: "1m", limit: 60 },
  { label: "24H", value: "15m", limit: 96 },
  { label: "7D", value: "4h", limit: 42 },
  { label: "30D", value: "1d", limit: 30 },
] as const;

type Props = {
  symbol?: string;
  title?: string;
};

export default function LivePriceChart({ symbol = "BTCUSDT", title = "Bitcoin" }: Props) {
  const [intervalIndex, setIntervalIndex] = useState(1);
  const [points, setPoints] = useState<CandlePoint[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const selectedInterval = INTERVALS[intervalIndex];

  const loadChart = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      setError("");

      try {
        const result = await fetchBinanceChart(
          symbol,
          selectedInterval.value,
          selectedInterval.limit,
        );

        if (!result.length) {
          throw new Error("No historical market data returned.");
        }

        setPoints(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load Binance chart.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [symbol, selectedInterval.value, selectedInterval.limit],
  );

  // Load historical candles when coin or time range changes.
  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await fetchBinanceChart(
          symbol,
          selectedInterval.value,
          selectedInterval.limit,
        );

        if (active) {
          if (!result.length) {
            throw new Error("No historical market data returned.");
          }
          setPoints(result);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Unable to load Binance chart.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [symbol, selectedInterval.value, selectedInterval.limit]);

  // Fetch the latest Binance ticker price every 3 seconds.
  useEffect(() => {
    let active = true;
    let inFlight = false;

    const fetchLivePrice = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(
            symbol.toUpperCase(),
          )}`,
        );

        if (!response.ok) {
          throw new Error(`Binance ticker error: ${response.status}`);
        }

        const data = await response.json();
        const price = Number(data?.price);

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("Invalid live price received.");
        }

        if (active) setLivePrice(price);
      } catch (e) {
        // Keep the last valid price if a refresh fails.
        console.warn("Live ticker refresh failed:", e);
      } finally {
        inFlight = false;
      }
    };

    fetchLivePrice();
    const timer = setInterval(fetchLivePrice, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [symbol]);

  const prices = useMemo(
    () => points.map((point) => point.price).filter(Number.isFinite),
    [points],
  );

  const firstPrice = prices[0] ?? 0;
  const chartLastPrice = prices[prices.length - 1] ?? 0;
  const displayPrice = livePrice ?? chartLastPrice;

  const periodChange =
    firstPrice > 0 && chartLastPrice > 0 ? ((chartLastPrice - firstPrice) / firstPrice) * 100 : 0;

  const width = 320;
  const height = 160;
  const padding = 10;

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 1;
  const range = maxPrice - minPrice || Math.max(maxPrice * 0.001, 1);

  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);

    const y = height - padding - ((point.price - minPrice) / range) * (height - padding * 2);

    return { x, y };
  });

  const polylinePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  const lastCoordinate = coordinates[coordinates.length - 1];

  const formatPrice = (price: number) =>
    price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.subheading}>{symbol.toUpperCase()}</Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {loading && points.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#8B5CF6" size="large" />
          <Text style={styles.muted}>Loading Binance chart...</Text>
        </View>
      ) : error && points.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            style={styles.retry}
            onPress={() => {
              setRefreshing(true);
              loadChart();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.price}>
            {displayPrice > 0 ? `$${formatPrice(displayPrice)}` : "Loading..."}
          </Text>

          <View style={styles.changeRow}>
            <Text style={[styles.change, { color: periodChange >= 0 ? "#22C55E" : "#EF4444" }]}>
              {periodChange >= 0 ? "+" : ""}
              {periodChange.toFixed(2)}%
            </Text>
            <Text style={styles.muted}> selected period</Text>
            {refreshing && (
              <ActivityIndicator size="small" color="#8B5CF6" style={{ marginLeft: 8 }} />
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartContainer}
          >
            <Svg width={width} height={height}>
              {[0.25, 0.5, 0.75].map((fraction) => (
                <Line
                  key={fraction}
                  x1={0}
                  y1={height * fraction}
                  x2={width}
                  y2={height * fraction}
                  stroke="#303044"
                  strokeDasharray="4 5"
                />
              ))}

              {coordinates.length > 1 && (
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={periodChange >= 0 ? "#22C55E" : "#EF4444"}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {lastCoordinate && (
                <Circle cx={lastCoordinate.x} cy={lastCoordinate.y} r={4} fill="#8B5CF6" />
              )}
            </Svg>
          </ScrollView>

          <View style={styles.priceRange}>
            <Text style={styles.axisPrice}>${formatPrice(minPrice)}</Text>
            <Text style={styles.axisPrice}>${formatPrice(maxPrice)}</Text>
          </View>

          <View style={styles.periods}>
            {INTERVALS.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => setIntervalIndex(index)}
                style={[styles.periodButton, intervalIndex === index && styles.activePeriod]}
              >
                <Text
                  style={[styles.periodText, intervalIndex === index && styles.activePeriodText]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() => {
              setRefreshing(true);
              loadChart(false);
            }}
          >
            <Text style={styles.refreshText}>Refresh chart</Text>
          </Pressable>

          {error ? <Text style={styles.warning}>{error}</Text> : null}

          <Text style={styles.footer}>Binance market data · Price refreshes every 3 seconds</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#171725",
    borderRadius: 20,
    padding: 18,
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  subheading: {
    color: "#A1A1B5",
    fontSize: 12,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173327",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  liveText: {
    color: "#22C55E",
    fontSize: 11,
    fontWeight: "700",
  },
  price: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 18,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    marginBottom: 18,
  },
  change: {
    fontSize: 13,
    fontWeight: "700",
  },
  loader: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  muted: {
    color: "#A1A1B5",
    fontSize: 12,
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
  },
  retry: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chartContainer: {
    paddingVertical: 4,
  },
  priceRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  axisPrice: {
    color: "#77778D",
    fontSize: 10,
  },
  periods: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  periodButton: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  activePeriod: {
    backgroundColor: "#8B5CF6",
  },
  periodText: {
    color: "#A1A1B5",
    fontWeight: "600",
  },
  activePeriodText: {
    color: "#FFFFFF",
  },
  refreshButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 14,
  },
  refreshText: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "600",
  },
  warning: {
    color: "#F59E0B",
    fontSize: 11,
    marginTop: 6,
  },
  footer: {
    color: "#77778D",
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
  },
});
