import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  if (value >= 1) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

export default function CoinListItem({ coin, onPress, isFavorite, onToggleFavorite, rank }) {
  const change = coin.price_change_percentage_24h;
  const changeColor = change >= 0 ? colors.positive : colors.negative;
  const changeText =
    change === undefined || change === null
      ? '—'
      : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rank}>{rank ?? coin.market_cap_rank ?? ''}</Text>
      {coin.image ? (
        <Image source={{ uri: coin.image }} style={styles.icon} />
      ) : (
        <View style={[styles.icon, styles.iconPlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {coin.name}
        </Text>
        <Text style={styles.symbol}>{(coin.symbol || '').toUpperCase()}</Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>
          {coin.current_price !== undefined ? `$${formatPrice(coin.current_price)}` : ''}
        </Text>
        <Text style={[styles.change, { color: changeColor }]}>{changeText}</Text>
      </View>
      <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.starBtn}>
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={22}
          color={isFavorite ? colors.star : colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  rowPressed: { opacity: 0.7 },
  rank: {
    width: 26,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: colors.bgElev,
  },
  iconPlaceholder: { backgroundColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  symbol: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  priceCol: { alignItems: 'flex-end', marginRight: 8, minWidth: 84 },
  price: { color: colors.text, fontSize: 14, fontWeight: '600' },
  change: { fontSize: 12, marginTop: 2 },
  starBtn: { padding: 4 },
});
