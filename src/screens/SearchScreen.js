import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { searchCoins } from '../api/coingecko';
import { useFavorites } from '../context/FavoritesContext';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const timerRef = useRef(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await searchCoins(q.trim());
      setResults(r.slice(0, 30));
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (text) => {
    setQuery(text);
    setTouched(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(text), 350);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Пошук</Text>
        <Text style={styles.subtitle}>Знайдіть монету та додайте в обране</Text>
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={onChange}
          placeholder="Bitcoin, ETH, Solana…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 ? (
          <Pressable onPress={clear} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centerInline}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {!loading && touched && query.trim() && results.length === 0 ? (
        <Text style={styles.empty}>Нічого не знайдено за запитом «{query}».</Text>
      ) : null}

      {!touched ? (
        <Text style={styles.hint}>Почніть вводити назву або символ криптовалюти.</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => navigation.navigate('Detail', { coin: item })}
          >
            {item.large || item.thumb ? (
              <Image source={{ uri: item.large || item.thumb }} style={styles.icon} />
            ) : (
              <View style={[styles.icon, { backgroundColor: colors.border }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.symbol}>
                {(item.symbol || '').toUpperCase()}
                {item.market_cap_rank ? ` · #${item.market_cap_rank}` : ''}
              </Text>
            </View>
            <Pressable onPress={() => toggleFavorite(item)} hitSlop={10} style={styles.starBtn}>
              <Ionicons
                name={isFavorite(item.id) ? 'star' : 'star-outline'}
                size={22}
                color={isFavorite(item.id) ? colors.star : colors.textMuted}
              />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, marginHorizontal: 8 },
  centerInline: { paddingVertical: 20, alignItems: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  hint: { color: colors.textMuted, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowPressed: { opacity: 0.7 },
  icon: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  symbol: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  starBtn: { padding: 4 },
});
