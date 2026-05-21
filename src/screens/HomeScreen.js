import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fetchTopCoins } from '../api/coingecko';
import CoinListItem from '../components/CoinListItem';
import { useFavorites } from '../context/FavoritesContext';

export default function HomeScreen({ navigation }) {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTopCoins(20);
      setCoins(data);
    } catch (e) {
      setError(e.message || 'Не вдалося завантажити дані');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Завантаження топ-20 криптовалют…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Топ-20</Text>
        <Text style={styles.subtitle}>Капіталізація · USD</Text>
      </View>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Потягніть вниз, щоб повторити.</Text>
        </View>
      ) : null}
      <FlatList
        data={coins}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <CoinListItem
            coin={item}
            rank={index + 1}
            isFavorite={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(item)}
            onPress={() => navigation.navigate('Detail', { coin: item })}
          />
        )}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.textMuted, marginTop: 12 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  errorBox: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#3A1721',
    borderRadius: 10,
  },
  errorText: { color: colors.negative, fontWeight: '600' },
  errorHint: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
});
