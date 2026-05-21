import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { fetchMarketChart, fetchCoinsByIds } from '../api/coingecko';
import { useFavorites } from '../context/FavoritesContext';

const RANGES = [
  { key: 1, label: '1Д' },
  { key: 7, label: '7Д' },
  { key: 30, label: '30Д' },
  { key: 90, label: '90Д' },
  { key: 365, label: '1Р' },
];

function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

export default function DetailScreen({ route, navigation }) {
  const params = route.params || {};
  const routeCoin = params.coin || { id: params.id, name: params.id, symbol: '' };
  const { isFavorite, toggleFavorite } = useFavorites();
  const [days, setDays] = useState(7);
  const [chart, setChart] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [coinDetail, setCoinDetail] = useState(routeCoin);
  const [error, setError] = useState(null);

  const loadChart = useCallback(
    async (d) => {
      setChartLoading(true);
      setError(null);
      try {
        const data = await fetchMarketChart(routeCoin.id, d);
        setChart(data);
      } catch (e) {
        setError('Не вдалося завантажити графік');
        setChart(null);
      } finally {
        setChartLoading(false);
      }
    },
    [routeCoin.id]
  );

  useEffect(() => {
    loadChart(days);
  }, [days, loadChart]);

  useEffect(() => {
    if (routeCoin.current_price !== undefined) return;
    (async () => {
      try {
        const arr = await fetchCoinsByIds([routeCoin.id]);
        if (arr[0]) setCoinDetail({ ...routeCoin, ...arr[0] });
      } catch (e) {
        // keep route payload
      }
    })();
  }, [routeCoin]);

  const prices = (chart?.prices || []).map((p) => p[1]);
  const sampledPrices = (() => {
    if (prices.length <= 60) return prices;
    const step = Math.ceil(prices.length / 60);
    const out = [];
    for (let i = 0; i < prices.length; i += step) out.push(prices[i]);
    if (out[out.length - 1] !== prices[prices.length - 1]) out.push(prices[prices.length - 1]);
    return out;
  })();

  const change = coinDetail.price_change_percentage_24h;
  const changeColor = change >= 0 ? colors.positive : colors.negative;
  const chartWidth = Math.max(Dimensions.get('window').width - 32, 320);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            {(coinDetail.image || coinDetail.large) && (
              <Image
                source={{ uri: coinDetail.image || coinDetail.large }}
                style={styles.iconBig}
              />
            )}
            <View>
              <Text style={styles.coinName}>{coinDetail.name}</Text>
              <Text style={styles.coinSymbol}>{(coinDetail.symbol || '').toUpperCase()}</Text>
            </View>
          </View>
          <Pressable onPress={() => toggleFavorite(coinDetail)} hitSlop={10} style={styles.starBtn}>
            <Ionicons
              name={isFavorite(coinDetail.id) ? 'star' : 'star-outline'}
              size={26}
              color={isFavorite(coinDetail.id) ? colors.star : colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.price}>
            {coinDetail.current_price !== undefined ? `$${formatPrice(coinDetail.current_price)}` : '—'}
          </Text>
          {change !== undefined && change !== null ? (
            <Text style={[styles.change, { color: changeColor }]}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}% · 24г
            </Text>
          ) : null}
        </View>

        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => setDays(r.key)}
              style={[styles.rangeBtn, days === r.key && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeText, days === r.key && styles.rangeTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chartBox}>
          {chartLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.chartLoadingText}>Завантаження графіка…</Text>
            </View>
          ) : error ? (
            <Text style={styles.chartError}>{error}</Text>
          ) : sampledPrices.length > 1 ? (
            <LineChart
              data={{
                labels: [],
                datasets: [{ data: sampledPrices }],
              }}
              width={chartWidth}
              height={240}
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              withHorizontalLabels={true}
              chartConfig={{
                backgroundGradientFrom: colors.bg,
                backgroundGradientTo: colors.bg,
                color: (opacity = 1) => `rgba(91, 141, 239, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(155, 163, 199, ${opacity})`,
                strokeWidth: 2,
                propsForBackgroundLines: { stroke: colors.border },
                decimalPlaces: sampledPrices[0] > 100 ? 0 : 2,
              }}
              bezier
              style={{ borderRadius: 12 }}
            />
          ) : (
            <Text style={styles.chartError}>Немає даних для відображення</Text>
          )}
        </View>

        <View style={styles.statsBlock}>
          <Stat label="Капіталізація" value={fmt(coinDetail.market_cap)} />
          <Stat label="Об'єм 24г" value={fmt(coinDetail.total_volume)} />
          <Stat label="Макс. 24г" value={fmtPrice(coinDetail.high_24h)} />
          <Stat label="Мін. 24г" value={fmtPrice(coinDetail.low_24h)} />
          <Stat label="Циркуляція" value={fmtNum(coinDetail.circulating_supply)} />
          <Stat label="Ранг" value={coinDetail.market_cap_rank ? `#${coinDetail.market_cap_rank}` : '—'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function fmt(v) {
  if (v === undefined || v === null) return '—';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}
function fmtPrice(v) {
  if (v === undefined || v === null) return '—';
  return `$${formatPrice(v)}`;
}
function fmtNum(v) {
  if (v === undefined || v === null) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return String(Math.round(v));
}

function Stat({ label, value }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 6, marginRight: 6 },
  starBtn: { padding: 6 },
  iconBig: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  coinName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  coinSymbol: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  priceBlock: { paddingHorizontal: 20, marginTop: 12 },
  price: { color: colors.text, fontSize: 36, fontWeight: '700' },
  change: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  rangeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rangeBtnActive: { backgroundColor: colors.primary },
  rangeText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  rangeTextActive: { color: '#fff' },
  chartBox: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    minHeight: 260,
    justifyContent: 'center',
  },
  chartLoading: { alignItems: 'center', justifyContent: 'center', height: 240 },
  chartLoadingText: { color: colors.textMuted, marginTop: 8 },
  chartError: { color: colors.textMuted, textAlign: 'center', padding: 24 },
  statsBlock: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: { width: '50%', paddingVertical: 8, paddingHorizontal: 6 },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
});
