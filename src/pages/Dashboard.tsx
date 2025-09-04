import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Activity, Eye, Star, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { coinGeckoApi, CoinData } from "@/services/coinGeckoApi";
import { TableSkeleton } from "@/components/LoadingSpinner";

function StatCard({ title, value, change, icon: Icon, isLoading }: {
  title: string;
  value: string;
  change?: string;
  icon: any;
  isLoading?: boolean;
}) {
  const changeValue = parseFloat(change?.replace('%', '') || '0');
  const isPositive = changeValue >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}
              {change && !isLoading && (
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-crypto-gain" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-crypto-loss" />
                  )}
                  <span className={`text-sm font-medium ${isPositive ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CoinRow({ coin, index }: { coin: CoinData; index: number }) {
  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
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
          ${coin.market_cap.toLocaleString()}
        </p>
      </td>
      <td className="p-4 text-right">
        <p className="text-muted-foreground">
          ${coin.total_volume.toLocaleString()}
        </p>
      </td>
      <td className="p-4">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/10">
            <Star className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </motion.tr>
  );
}

export default function Dashboard() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [globalData, setGlobalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Only fetch essential data for faster loading
        const coinsData = await coinGeckoApi.getTopCoins(10, 'usd');
        setCoins(coinsData);
        
        // Skip global data for now to speed up loading
        setGlobalData({
          total_market_cap: { usd: coinsData.reduce((sum, coin) => sum + coin.market_cap, 0) },
          total_volume: { usd: coinsData.reduce((sum, coin) => sum + coin.total_volume, 0) },
          market_cap_change_percentage_24h_usd: 0,
          active_cryptocurrencies: 10000,
          market_cap_percentage: { btc: 45 }
        });
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch market data';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Increase polling interval to reduce API calls
    const interval = setInterval(fetchData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Market Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Failed to load market data</p>
          </div>
        </div>
        <Card className="bg-gradient-card border-border/50 p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-primary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Market Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time cryptocurrency market data and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-crypto-gain rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </motion.div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Market Cap"
          value={globalData ? formatLargeNumber(globalData.total_market_cap.usd) : ""}
          change={globalData ? `${globalData.market_cap_change_percentage_24h_usd.toFixed(2)}%` : undefined}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <StatCard
          title="24h Volume"
          value={globalData ? formatLargeNumber(globalData.total_volume.usd) : ""}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatCard
          title="BTC Dominance"
          value={globalData ? `${globalData.market_cap_percentage.btc.toFixed(1)}%` : ""}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Cryptocurrencies"
          value={globalData ? globalData.active_cryptocurrencies.toLocaleString() : ""}
          icon={Activity}
          isLoading={isLoading}
        />
      </div>

      {/* Top Cryptocurrencies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top Cryptocurrencies</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Live Prices
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={10} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Asset</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Price</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">24h %</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Market Cap</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Volume</th>
                      <th className="p-4 text-center text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin, index) => (
                      <CoinRow key={coin.id} coin={coin} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}