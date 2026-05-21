import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useFavorites } from '../context/FavoritesContext';
import { fetchCoinsByIds } from '../api/coingecko';
import CoinListItem from '../components/CoinListItem';

export default function FavoritesScreen({ navigation }) {
  const { favorites, isFavorite, toggleFavorite, ready } = useFavorites();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!ready) return;
    try {
      if (favorites.length === 0) {
        setCoins([]);
        return;
      }
      const data = await fetchCoinsByIds(favorites.map((f) => f.id));
      setCoins(data);
    } catch (e) {
      setCoins(favorites);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites, ready]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && favorites.length > 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Обране</Text>
        <Text style={styles.subtitle}>
          {favorites.length === 0
            ? 'Поки порожньо'
            : `${favorites.length} ${favorites.length === 1 ? 'монета' : 'монет(и)'}`}
        </Text>
      </View>
      {favorites.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Список обраного порожній</Text>
          <Text style={styles.emptyText}>
            Натисніть зірочку біля будь-якої монети на вкладці «Топ-20» або «Пошук»,
            щоб додати її сюди.
          </Text>
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  emptyBox: { paddingHorizontal: 24, paddingTop: 40 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyText: { color: colors.textMuted, marginTop: 8, lineHeight: 20, textAlign: 'center' },
});
