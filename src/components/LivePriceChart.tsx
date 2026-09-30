import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";

interface LivePriceChartProps {
  symbol: string;
  currency: "inr" | "usd";
  usdtInrRate: number;
}

type Timeframe = "1H" | "1D" | "1W";

interface CandlePoint {
  time: number;
  close: number;
}

const MARKET_SYMBOLS: Record<string, string> = {
  btc: "BTCUSDT",
  eth: "ETHUSDT",
  bnb: "BNBUSDT",
  sol: "SOLUSDT",
  xrp: "XRPUSDT",
  ada: "ADAUSDT",
  doge: "DOGEUSDT",
  dot: "DOTUSDT",
  avax: "AVAXUSDT",
  link: "LINKUSDT",
};

const TIMEFRAME_CONFIG: Record<Timeframe, { interval: string; limit: number }> = {
  "1H": { interval: "1m", limit: 60 },
  "1D": { interval: "15m", limit: 96 },
  "1W": { interval: "1h", limit: 168 },
};

export default function LivePriceChart({
  symbol,
  currency,
  usdtInrRate,
}: LivePriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1H");
  const [points, setPoints] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const marketSymbol = MARKET_SYMBOLS[symbol.toLowerCase()];

  const loadHistory = async () => {
    if (!marketSymbol) {
      setError("Chart is not available for this coin.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const config = TIMEFRAME_CONFIG[timeframe];
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${marketSymbol}&interval=${config.interval}&limit=${config.limit}`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) {
        throw new Error(`Binance chart API failed: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid chart response");

      setPoints(
        data.map((candle: any[]) => ({
          time: Number(candle[0]),
          close: Number(candle[4]),
        })),
      );
    } catch (err) {
      console.warn("Chart data error:", err);
      setError("Unable to load chart data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPoints([]);
    loadHistory();

    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, [marketSymbol, timeframe]);

  useEffect(() => {
    if (!marketSymbol || timeframe !== "1H") return;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${marketSymbol.toLowerCase()}@kline_1m`,
    );

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const candle = message?.k;
        if (!candle) return;

        const nextPoint = {
          time: Number(candle.t),
          close: Number(candle.c),
        };

        setPoints((current) => {
          const next = [...current];
          const lastIndex = next.length - 1;

          if (lastIndex >= 0 && next[lastIndex].time === nextPoint.time) {
            next[lastIndex] = nextPoint;
          } else {
            next.push(nextPoint);
          }

          return next.slice(-60);
        });
      } catch (err) {
        console.warn("Chart WebSocket message error:", err);
      }
    };

    ws.onerror = () => {
      console.warn("Chart WebSocket connection error");
    };

    return () => ws.close();
  }, [marketSymbol, timeframe]);

  const chartValues = useMemo(
    () =>
      points.map((point) =>
        currency === "inr" ? point.close * usdtInrRate : point.close,
      ),
    [points, currency, usdtInrRate],
  );

  const displayValue = chartValues[chartValues.length - 1] ?? 0;
  const firstValue = chartValues[0] ?? 0;
  const change =
    firstValue > 0 ? ((displayValue - firstValue) / firstValue) * 100 : 0;
  const isUp = change >= 0;

  const chartWidth = 320;
  const chartHeight = 150;
  const padding = 8;

  const path = useMemo(() => {
    if (chartValues.length < 2) return "";

    const min = Math.min(...chartValues);
    const max = Math.max(...chartValues);
    const range = max - min || 1;

    return chartValues
      .map((value, index) => {
        const x =
          padding +
          (index / (chartValues.length - 1)) *
            (chartWidth - padding * 2);
        const y =
          chartHeight -
          padding -
          ((value - min) / range) * (chartHeight - padding * 2);

        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [chartValues]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Price Chart</Text>
          {displayValue > 0 && (
            <Text style={styles.price}>
              {currency === "inr" ? "₹" : "$"}
              {displayValue.toLocaleString(
                currency === "inr" ? "en-IN" : "en-US",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}
            </Text>
          )}
        </View>

        {displayValue > 0 && (
          <Text style={[styles.change, { color: isUp ? "#00C853" : "#FF3B30" }]}>
            {isUp ? "+" : ""}
            {change.toFixed(2)}%
          </Text>
        )}
      </View>

      <View style={styles.timeframes}>
        {(["1H", "1D", "1W"] as Timeframe[]).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setTimeframe(item)}
            style={[
              styles.timeframeBtn,
              timeframe === item && styles.timeframeBtnActive,
            ]}
          >
            <Text
              style={[
                styles.timeframeText,
                timeframe === item && styles.timeframeTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && points.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#0090FF" />
          <Text style={styles.loaderText}>Loading live chart...</Text>
        </View>
      ) : error ? (
        <View style={styles.loader}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <Svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            <Line x1="8" y1="20" x2="312" y2="20" stroke="#EEF2F6" />
            <Line x1="8" y1="75" x2="312" y2="75" stroke="#EEF2F6" />
            <Line x1="8" y1="130" x2="312" y2="130" stroke="#EEF2F6" />
            {path ? (
              <Path d={path} fill="none" stroke="#0090FF" strokeWidth="2.5" />
            ) : null}
          </Svg>
        </View>
      )}

      <Text style={styles.liveText}>● Live market data from Binance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    borderRadius: 18,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  price: { marginTop: 3, fontSize: 20, fontWeight: "800", color: "#0F172A" },
  change: { fontSize: 13, fontWeight: "700", marginTop: 18 },
  timeframes: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    marginTop: 12,
    marginBottom: 8,
  },
  timeframeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timeframeBtnActive: { backgroundColor: "#FFFFFF" },
  timeframeText: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  timeframeTextActive: { color: "#0090FF" },
  chartWrapper: { width: "100%", height: 150 },
  loader: { height: 150, alignItems: "center", justifyContent: "center", gap: 8 },
  loaderText: { fontSize: 12, color: "#64748B" },
  errorText: { fontSize: 12, color: "#E5484D" },
  liveText: { marginTop: 8, fontSize: 10, color: "#64748B" },
});
