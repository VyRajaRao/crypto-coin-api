import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Download, TrendingUp, TrendingDown, Activity, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { coinGeckoApi, type CoinData } from '@/services/coinGeckoApi';
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

const PRESETS = {
  'top-gainers': {
    name: 'Top Gainers 24h',
    config: { priceChangeMin: '5', timeframe: '24h' as const }
  },
  'top-losers': {
    name: 'Top Losers 24h', 
    config: { priceChangeMax: '-5', timeframe: '24h' as const }
  },
  'volume-surge': {
    name: 'High Volume Surge',
    config: { volumeChangeMin: '50', timeframe: '24h' as const }
  },
  'large-cap': {
    name: 'Large Cap Coins',
    config: { marketCapMin: '1000000000', timeframe: '24h' as const }
  }
};

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

  const handlePreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setFilters(prevFilters => ({
      ...prevFilters,
      ...preset.config,
      // Reset other filters
      priceChangeMin: preset.config.priceChangeMin || '',
      priceChangeMax: preset.config.priceChangeMax || '',
      volumeChangeMin: preset.config.volumeChangeMin || '',
      marketCapMin: preset.config.marketCapMin || '',
      marketCapMax: '',
      category: ''
    }));
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
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading market scanner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Market Scanner
          </h1>
          <p className="text-muted-foreground mt-1">
            Find cryptocurrencies based on custom criteria and technical indicators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {filteredCoins.length} Results
          </Badge>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
            <div className="flex flex-wrap gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset(key as keyof typeof PRESETS)}
                  className="hover:bg-primary/10"
                >
                  {preset.name}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Reset All
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
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Price Change Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Min Price Change (%)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={filters.priceChangeMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceChangeMin: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Price Change (%)</label>
                <Input
                  type="number"
                  placeholder="e.g. -5"
                  value={filters.priceChangeMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceChangeMax: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Min Market Cap</label>
                <Input
                  type="number"
                  placeholder="e.g. 1000000000"
                  value={filters.marketCapMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, marketCapMin: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Market Cap</label>
                <Input
                  type="number"
                  placeholder="e.g. 10000000000"
                  value={filters.marketCapMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, marketCapMax: e.target.value }))}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Asset</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Price</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">24h %</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Market Cap</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Volume</th>
                    <th className="p-4 text-center text-sm font-medium text-muted-foreground">Rank</th>
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
                        className="border-b border-border/30 hover:bg-secondary/30 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                            <div>
                              <p className="font-medium text-foreground">{coin.name}</p>
                              <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <p className="font-medium text-foreground">
                            ${coin.current_price.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4 text-crypto-gain" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-crypto-loss" />
                            )}
                            <span className={`font-medium ${isPositive ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                              {coin.price_change_percentage_24h.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-muted-foreground">
                            ${(coin.market_cap / 1e9).toFixed(2)}B
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-muted-foreground">
                            ${(coin.total_volume / 1e6).toFixed(2)}M
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline">#{coin.market_cap_rank}</Badge>
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
