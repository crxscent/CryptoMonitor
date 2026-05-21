const BASE_URL = 'https://api.coingecko.com/api/v3';

async function request(path, params = {}) {
  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
  });
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`CoinGecko ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export function fetchTopCoins(limit = 20, currency = 'usd') {
  return request('/coins/markets', {
    vs_currency: currency,
    order: 'market_cap_desc',
    per_page: limit,
    page: 1,
    sparkline: false,
    price_change_percentage: '24h',
  });
}

export function fetchCoinsByIds(ids, currency = 'usd') {
  if (!ids || ids.length === 0) return Promise.resolve([]);
  return request('/coins/markets', {
    vs_currency: currency,
    ids: ids.join(','),
    order: 'market_cap_desc',
    sparkline: false,
    price_change_percentage: '24h',
  });
}

export function searchCoins(query) {
  return request('/search', { query }).then((r) => r.coins || []);
}

export function fetchMarketChart(id, days = 7, currency = 'usd') {
  return request(`/coins/${id}/market_chart`, {
    vs_currency: currency,
    days,
  });
}
