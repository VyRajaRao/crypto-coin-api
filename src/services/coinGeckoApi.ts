import axios from 'axios'
import { apiCache } from '@/lib/cache'

const BASE_URL = 'https://api.coingecko.com/api/v3'

// Rate limiting helper - reduced for better performance
let lastApiCall = 0
const RATE_LIMIT_MS = 500 // 500ms between calls for better performance

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const rateLimitedRequest = async (url: string) => {
  const now = Date.now()
  const timeSinceLastCall = now - lastApiCall
  
  if (timeSinceLastCall < RATE_LIMIT_MS) {
    await delay(RATE_LIMIT_MS - timeSinceLastCall)
  }
  
  lastApiCall = Date.now()
  return axios.get(url, { timeout: 10000 }) // 10 second timeout
}

export interface CoinData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  roi: null | {
    times: number
    currency: string
    percentage: number
  }
  last_updated: string
}

export interface TrendingCoin {
  id: string
  coin_id: number
  name: string
  symbol: string
  market_cap_rank: number
  thumb: string
  small: string
  large: string
  slug: string
  price_btc: number
  score: number
}

export interface CoinDetails {
  id: string
  symbol: string
  name: string
  description: {
    en: string
  }
  image: {
    thumb: string
    small: string
    large: string
  }
  market_cap_rank: number
  market_data: {
    current_price: {
      usd: number
    }
    market_cap: {
      usd: number
    }
    total_volume: {
      usd: number
    }
    price_change_24h: number
    price_change_percentage_24h: number
    price_change_percentage_7d: number
    price_change_percentage_30d: number
    market_cap_change_24h: number
    market_cap_change_percentage_24h: number
    circulating_supply: number
    total_supply: number | null
    max_supply: number | null
    ath: {
      usd: number
    }
    ath_change_percentage: {
      usd: number
    }
    ath_date: {
      usd: string
    }
    atl: {
      usd: number
    }
    atl_change_percentage: {
      usd: number
    }
    atl_date: {
      usd: string
    }
  }
}

class CoinGeckoAPI {
  private handleApiError(error: unknown, context: string): never {
    console.error(`CoinGecko API Error - ${context}:`, error);
    
    const axiosError = error as any; // Type assertion for axios error structure
    
    const debugInfo: any = {
      context,
      timestamp: new Date().toISOString(),
      url: axiosError?.config?.url || 'Unknown URL',
      method: axiosError?.config?.method?.toUpperCase() || 'Unknown Method'
    };
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data?.error || axiosError.response.statusText;
      const headers = axiosError.response.headers;
      
      debugInfo.response = {
        status,
        message,
        data: axiosError.response.data,
        rateLimitRemaining: headers['x-ratelimit-remaining'],
        rateLimitReset: headers['x-ratelimit-reset']
      };
      
      switch (status) {
        case 429:
          throw new Error('Rate limit exceeded. Please wait and try again.');
        case 404:
          throw new Error('Cryptocurrency data not found.');
        case 403:
          throw new Error('API access forbidden.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Service temporarily unavailable. Please try again later.');
        default:
          throw new Error(`API Error: ${message || 'Unknown error'}`);
      }
    } else if (axiosError.request) {
      debugInfo.network = {
        timeout: axiosError.code === 'ECONNABORTED',
        offline: !navigator.onLine,
        code: axiosError.code
      };
      
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      }
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw new Error('Network error. Please check your connection.');
    } else {
      debugInfo.client = {
        message: axiosError.message || 'Unknown error',
        stack: axiosError.stack
      };
      
      throw new Error(`Configuration error: ${axiosError.message || 'Unknown error'}`);
    }
  }

  async getTopCoins(limit: number = 100, currency: string = 'usd'): Promise<CoinData[]> {
    const cacheKey = `top-coins-${limit}-${currency}`;
    
    // Check cache first
    if (apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    try {
      const response = await rateLimitedRequest(
        `${BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
      )
      
      // Cache the result for 2 minutes
      apiCache.set(cacheKey, response.data, 120000);
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getTopCoins')
    }
  }

  async getTrendingCoins(): Promise<{ coins: TrendingCoin[] }> {
    try {
      const response = await rateLimitedRequest(`${BASE_URL}/search/trending`)
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getTrendingCoins')
    }
  }

  async getCoinDetails(coinId: string): Promise<CoinDetails> {
    try {
      const response = await rateLimitedRequest(
        `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      )
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getCoinDetails')
    }
  }

  async getCoinsByIds(coinIds: string[], currency: string = 'usd'): Promise<CoinData[]> {
    const cacheKey = `coins-${coinIds.sort().join(',')}-${currency}`;
    
    // Check cache first
    if (apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    try {
      const response = await rateLimitedRequest(
        `${BASE_URL}/coins/markets?vs_currency=${currency}&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=250&page=1&sparkline=false`
      )
      
      // Cache the result for 1 minute (shorter for portfolio data)
      apiCache.set(cacheKey, response.data, 60000);
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getCoinsByIds')
    }
  }

  async searchCoins(query: string): Promise<{
    coins: Array<{
      id: string
      name: string
      symbol: string
      market_cap_rank: number
      thumb: string
    }>
  }> {
    try {
      const response = await rateLimitedRequest(`${BASE_URL}/search?query=${encodeURIComponent(query)}`)
      return response.data
    } catch (error) {
      this.handleApiError(error, 'searchCoins')
    }
  }

  async getCoinHistory(coinId: string, days: number = 7, currency: string = 'usd'): Promise<{
    prices: Array<[number, number]>
    market_caps: Array<[number, number]>
    total_volumes: Array<[number, number]>
  }> {
    try {
      const response = await rateLimitedRequest(
        `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
      )
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getCoinHistory')
    }
  }

  async getCoinOHLC(coinId: string, days: number = 7): Promise<Array<[number, number, number, number, number]>> {
    try {
      const response = await rateLimitedRequest(
        `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
      )
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getCoinOHLC')
    }
  }

  async getTopCoinsWithSparklines(limit: number = 100, currency: string = 'usd'): Promise<CoinData[]> {
    try {
      const response = await rateLimitedRequest(
        `${BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
      )
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getTopCoinsWithSparklines')
    }
  }

  async getGlobalMarketData(): Promise<{
    data: {
      active_cryptocurrencies: number
      upcoming_icos: number
      ongoing_icos: number
      ended_icos: number
      markets: number
      total_market_cap: { [key: string]: number }
      total_volume: { [key: string]: number }
      market_cap_percentage: { [key: string]: number }
      market_cap_change_percentage_24h_usd: number
      updated_at: number
    }
  }> {
    try {
      const response = await rateLimitedRequest(`${BASE_URL}/global`)
      return response.data
    } catch (error) {
      this.handleApiError(error, 'getGlobalMarketData')
    }
  }
}

export const coinGeckoApi = new CoinGeckoAPI()
