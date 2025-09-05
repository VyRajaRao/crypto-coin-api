import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Filter, Download, TrendingUp, TrendingDown, Activity, Search, Zap, Volume2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useMarketScanner, useTop10Coins } from '@/hooks/useCryptoData';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Sparkline } from '@/components/AdvancedChart';
import { type CoinData, coinGeckoApi } from '@/services/coinGeckoApi';
import { toast } from 'sonner';

interface FilterConfig {
  priceChangeMin: string;
  priceChangeMax: string;
  volumeChangeMin: string;
  marketCapMin: string;
  marketCapMax: string;
  category: string;
  timeframe: '1h' | '24h' | '7d';
}

const PRESETS = [
  {
    id: 'top-gainers',
    name: 'Top Gainers 24h',
    description: 'Coins with highest 24h gains',
    icon: TrendingUp,
    color: 'text-crypto-gain'
  },
  {
    id: 'top-losers',
    name: 'Top Losers 24h',
    description: 'Coins with biggest 24h drops',
    icon: TrendingDown,
    color: 'text-crypto-loss'
  },
  {
    id: 'high-volume',
    name: 'High Volume Surge',
    description: 'Coins with unusually high volume',
    icon: Volume2,
    color: 'text-blue-400'
  },
  {
    id: 'small-caps',
    name: 'Small Cap Gems',
    description: 'Low market cap opportunities',
    icon: Target,
    color: 'text-yellow-400'
  }
];

export default function MarketScanner() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<CoinData[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({
    priceChangeMin: '',
    priceChangeMax: '',
    volumeChangeMin: '',
    marketCapMin: '',
    marketCapMax: '',
    category: '',
    timeframe: '24h'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setIsLoading(true);
        const data = await coinGeckoApi.getTopCoins(100, 'usd');
        setCoins(data);
        setFilteredCoins(data);
      } catch (error) {
        console.error('Error fetching coins:', error);
        toast.error('Failed to load market data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...coins];

    // Apply filters
    if (filters.priceChangeMin) {
      filtered = filtered.filter(coin => coin.price_change_percentage_24h >= parseFloat(filters.priceChangeMin));
    }
    if (filters.priceChangeMax) {
      filtered = filtered.filter(coin => coin.price_change_percentage_24h <= parseFloat(filters.priceChangeMax));
    }
    if (filters.volumeChangeMin) {
      // Note: We don't have volume change data from the API, this is a placeholder
      // In a real implementation, you'd need additional API calls for volume change data
    }
    if (filters.marketCapMin) {
      filtered = filtered.filter(coin => coin.market_cap >= parseFloat(filters.marketCapMin));
    }
    if (filters.marketCapMax) {
      filtered = filtered.filter(coin => coin.market_cap <= parseFloat(filters.marketCapMax));
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(coin => 
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCoins(filtered);
  }, [coins, filters, searchQuery]);

  const handlePreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Apply preset-specific filters
    let newFilters = {
      priceChangeMin: '',
      priceChangeMax: '',
      volumeChangeMin: '',
      marketCapMin: '',
      marketCapMax: '',
      category: '',
      timeframe: '24h' as const
    };

    switch (preset.id) {
      case 'top-gainers':
        newFilters.priceChangeMin = '5';
        break;
      case 'top-losers':
        newFilters.priceChangeMax = '-5';
        break;
      case 'high-volume':
        newFilters.volumeChangeMin = '50';
        break;
      case 'small-caps':
        newFilters.marketCapMax = '1000000000';
        break;
    }

    setFilters(newFilters);
    toast.success(`Applied ${preset.name} filter`);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Symbol', 'Price (USD)', '24h Change (%)', 'Market Cap', 'Volume'];
    const csvData = [
      headers.join(','),
      ...filteredCoins.map(coin => [
        coin.name,
        coin.symbol.toUpperCase(),
        coin.current_price,
        coin.price_change_percentage_24h.toFixed(2),
        coin.market_cap,
        coin.total_volume
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-scanner-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Market data exported to CSV');
  };

  const resetFilters = () => {
    setFilters({
      priceChangeMin: '',
      priceChangeMax: '',
      volumeChangeMin: '',
      marketCapMin: '',
      marketCapMax: '',
      category: '',
      timeframe: '24h'
    });
    setSearchQuery('');
    toast.success('Filters reset');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground text-sm sm:text-base">Loading market scanner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Market Scanner
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Find cryptocurrencies based on custom criteria and technical indicators
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {filteredCoins.length} Results
          </Badge>
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="touch-manipulation">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </motion.div>

      {/* Quick Presets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Scan Presets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                return (
                  <Button
                    key={preset.id}
                    variant="outline"
                    onClick={() => handlePreset(preset.id)}
                    className="flex items-center justify-start gap-3 h-auto p-3 sm:p-4 hover:bg-primary/10 transition-colors touch-manipulation"
                  >
                    <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${preset.color} shrink-0`} />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate">{preset.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{preset.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Reset All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 touch-manipulation"
              />
            </div>

            {/* Price Change Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Min Price Change (%)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={filters.priceChangeMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceChangeMin: e.target.value }))}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Max Price Change (%)</label>
                <Input
                  type="number"
                  placeholder="e.g. -5"
                  value={filters.priceChangeMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceChangeMax: e.target.value }))}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Min Market Cap</label>
                <Input
                  type="number"
                  placeholder="e.g. 1B"
                  value={filters.marketCapMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, marketCapMin: e.target.value }))}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Max Market Cap</label>
                <Input
                  type="number"
                  placeholder="e.g. 10B"
                  value={filters.marketCapMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, marketCapMax: e.target.value }))}
                  className="touch-manipulation"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-mobile">
              <table className="w-full min-w-[600px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Asset</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">Price</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">24h %</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">Market Cap</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-medium text-muted-foreground">Volume</th>
                    <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.map((coin, index) => {
                    const isPositive = coin.price_change_percentage_24h >= 0;
                    return (
                      <motion.tr
                        key={coin.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.02 }}
                        className="border-b border-border/30 hover:bg-secondary/30 transition-colors duration-200 touch-manipulation"
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <img src={coin.image} alt={coin.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm sm:text-base truncate">{coin.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground uppercase">{coin.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <p className="font-medium text-foreground text-sm sm:text-base">
                            ${coin.current_price.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-crypto-gain" />
                            ) : (
                              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-crypto-loss" />
                            )}
                            <span className={`font-medium text-sm sm:text-base ${isPositive ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                              {coin.price_change_percentage_24h.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <p className="text-muted-foreground text-sm">
                            ${(coin.market_cap / 1e9).toFixed(2)}B
                          </p>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <p className="text-muted-foreground text-sm">
                            ${(coin.total_volume / 1e6).toFixed(2)}M
                          </p>
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          <Badge variant="outline" className="text-xs">#{coin.market_cap_rank}</Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCoins.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
