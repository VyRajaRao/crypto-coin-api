import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, TrendingUp, TrendingDown, Wallet, Bell, ArrowUpDown, 
  Settings, BarChart3, AlertCircle, DollarSign, Activity, Target, Clock,
  Grid3x3, List, Maximize2, Minimize2, RefreshCw, Filter, Search,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar } from '@/components/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { coinGeckoApi } from '@/services/coinGeckoApi';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

// Types
type PortfolioRow = Database['public']['Tables']['portfolio']['Row'];
type AlertRow = Database['public']['Tables']['alerts']['Row'];
type TradeRow = Database['public']['Tables']['trades']['Row'];

interface EnrichedAsset extends PortfolioRow {
  current_price: number;
  current_value: number;
  profit_loss: number;
  profit_percentage: number;
  name: string;
  symbol: string;
  image: string;
  alerts: AlertRow[];
  recent_trades: TradeRow[];
  price_change_24h: number;
}

interface DashboardWidget {
  id: string;
  type: 'portfolio' | 'alerts' | 'trading' | 'watchlist' | 'performance' | 'news';
  title: string;
  enabled: boolean;
  position: { x: number; y: number; w: number; h: number };
  settings: Record<string, any>;
}

interface QuickAction {
  type: 'buy' | 'sell' | 'alert' | 'watch';
  coinId: string;
  amount?: number;
  price?: number;
  targetPrice?: number;
}

export default function IntegratedPortfolio() {
  const { user } = useAuth();
  
  // Core data states
  const [portfolio, setPortfolio] = useState<EnrichedAsset[]>([]);
  const [balance, setBalance] = useState(10000);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'profit' | 'name' | 'change'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'gains' | 'losses' | 'alerts'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Widget customization
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { 
      id: 'portfolio', 
      type: 'portfolio', 
      title: 'Portfolio Overview',
      enabled: true, 
      position: { x: 0, y: 0, w: 12, h: 6 },
      settings: { showSmallHoldings: true, compactView: false }
    },
    { 
      id: 'quick-trade', 
      type: 'trading', 
      title: 'Quick Trading',
      enabled: true, 
      position: { x: 0, y: 6, w: 6, h: 4 },
      settings: { defaultAction: 'buy', quickAmounts: [100, 500, 1000] }
    },
    { 
      id: 'active-alerts', 
      type: 'alerts', 
      title: 'Price Alerts',
      enabled: true, 
      position: { x: 6, y: 6, w: 6, h: 4 },
      settings: { showTriggered: false, maxItems: 5 }
    },
    { 
      id: 'performance', 
      type: 'performance', 
      title: 'Performance',
      enabled: true, 
      position: { x: 0, y: 10, w: 12, h: 4 },
      settings: { timeframe: '24h', showChart: true }
    }
  ]);
  
  // Modal states
  const [showCustomization, setShowCustomization] = useState(false);
  const [showQuickTrade, setShowQuickTrade] = useState(false);
  const [showQuickAlert, setShowQuickAlert] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<EnrichedAsset | null>(null);
  
  // Quick action states
  const [quickAction, setQuickAction] = useState<QuickAction>({ type: 'buy', coinId: '' });

  // Load all data
  useEffect(() => {
    if (user) {
      loadIntegratedData();
      const interval = setInterval(loadIntegratedData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadIntegratedData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load all data in parallel
      const [portfolioRes, alertsRes, tradesRes, walletRes] = await Promise.all([
        supabase.from('portfolio').select('*').eq('user_id', user.id),
        supabase.from('alerts').select('*').eq('user_id', user.id),
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('wallet').select('*').eq('user_id', user.id)
      ]);

      if (portfolioRes.error) throw portfolioRes.error;

      const portfolioData = portfolioRes.data || [];
      const alertsData = alertsRes.data || [];
      const tradesData = tradesRes.data || [];
      const walletData = walletRes.data || [];

      // Update balance
      const usdBalance = walletData.find(w => w.asset === 'USD')?.balance || 10000;
      setBalance(usdBalance);

      if (portfolioData.length === 0) {
        setPortfolio([]);
        setIsLoading(false);
        return;
      }

      // Enrich with market data
      const coinIds = portfolioData.map(item => item.coin_id);
      const marketData = await coinGeckoApi.getCoinsByIds(coinIds, 'usd');

      const enrichedPortfolio: EnrichedAsset[] = portfolioData.map(item => {
        const coinData = marketData.find(coin => coin.id === item.coin_id);
        const current_price = coinData?.current_price || 0;
        const current_value = item.amount * current_price;
        const invested_value = item.amount * item.avg_price;
        const profit_loss = current_value - invested_value;
        const profit_percentage = invested_value > 0 ? (profit_loss / invested_value) * 100 : 0;

        // Find related alerts and trades
        const relatedAlerts = alertsData.filter(alert => alert.coin_id === item.coin_id);
        const recentTrades = tradesData.filter(trade => trade.coin_id === item.coin_id).slice(0, 5);

        return {
          ...item,
          current_price,
          current_value,
          profit_loss,
          profit_percentage,
          name: coinData?.name || item.coin_id,
          symbol: coinData?.symbol.toUpperCase() || item.coin_id.toUpperCase(),
          image: coinData?.image || '',
          alerts: relatedAlerts,
          recent_trades: recentTrades,
          price_change_24h: coinData?.price_change_percentage_24h || 0
        };
      });

      setPortfolio(enrichedPortfolio);
    } catch (error) {
      console.error('Error loading integrated data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Actions
  const executeQuickTrade = async (action: 'buy' | 'sell', asset: EnrichedAsset, amount: number) => {
    if (!user) return;

    try {
      const price = asset.current_price;
      const total = amount * price;

      if (action === 'buy' && total > balance) {
        toast.error('Insufficient balance');
        return;
      }

      // Execute trade
      await supabase.from('trades').insert({
        user_id: user.id,
        coin_id: asset.coin_id,
        trade_type: action,
        amount: amount,
        price: price
      });

      // Update wallet
      if (action === 'buy') {
        await supabase.from('wallet').upsert({
          user_id: user.id,
          asset: 'USD',
          balance: balance - total
        });
        await supabase.from('portfolio').upsert({
          user_id: user.id,
          coin_id: asset.coin_id,
          amount: asset.amount + amount,
          avg_price: ((asset.amount * asset.avg_price) + (amount * price)) / (asset.amount + amount),
          asset_type: 'crypto'
        });
      }

      toast.success(`${action === 'buy' ? 'Bought' : 'Sold'} ${amount} ${asset.symbol}`);
      loadIntegratedData(); // Refresh data
    } catch (error) {
      console.error('Error executing trade:', error);
      toast.error('Failed to execute trade');
    }
  };

  const createQuickAlert = async (asset: EnrichedAsset, targetPrice: number, condition: 'above' | 'below') => {
    if (!user) return;

    try {
      await supabase.from('alerts').insert({
        user_id: user.id,
        coin_id: asset.coin_id,
        target_price: targetPrice,
        condition: condition
      });

      toast.success(`Alert created for ${asset.symbol} ${condition} $${targetPrice}`);
      loadIntegratedData(); // Refresh data
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    }
  };

  // Filter and sort portfolio
  const filteredPortfolio = portfolio
    .filter(asset => {
      if (!showHidden && asset.current_value < 1) return false;
      if (searchTerm && !asset.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      switch (filterBy) {
        case 'gains': return asset.profit_loss > 0;
        case 'losses': return asset.profit_loss < 0;
        case 'alerts': return asset.alerts.length > 0;
        default: return true;
      }
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'value': aValue = a.current_value; bValue = b.current_value; break;
        case 'profit': aValue = a.profit_percentage; bValue = b.profit_percentage; break;
        case 'name': aValue = a.name; bValue = b.name; break;
        case 'change': aValue = a.price_change_24h; bValue = b.price_change_24h; break;
        default: aValue = a.current_value; bValue = b.current_value;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Calculate totals
  const totalValue = portfolio.reduce((sum, asset) => sum + asset.current_value, 0);
  const totalInvested = portfolio.reduce((sum, asset) => sum + (asset.amount * asset.avg_price), 0);
  const totalProfit = totalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  if (!user) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
        <p className="text-muted-foreground">Please sign in to access your integrated portfolio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with customization */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Smart Portfolio Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified portfolio management, trading, and alerts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadIntegratedData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowCustomization(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">${(totalValue + balance).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-crypto-gain/20' : 'bg-crypto-loss/20'}`}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-crypto-gain" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-crypto-loss" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                  {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/20">
                <Bell className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-xl font-bold">
                  {portfolio.reduce((sum, asset) => sum + asset.alerts.filter(a => !a.triggered).length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/20">
                <DollarSign className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Balance</p>
                <p className="text-xl font-bold">${balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col lg:flex-row gap-4 p-4 bg-gradient-card rounded-lg border border-border/50"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="gains">Gains</SelectItem>
              <SelectItem value="losses">Losses</SelectItem>
              <SelectItem value="alerts">With Alerts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="change">24h Change</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Show Small</span>
            <Switch checked={showHidden} onCheckedChange={setShowHidden} />
          </div>
        </div>
      </motion.div>

      {/* Portfolio Grid/List */}
      <AnimatePresence>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredPortfolio.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No assets found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try a different search term' : 'Start building your portfolio'}
            </p>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredPortfolio.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-card border-border/50 hover:shadow-glow transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Asset Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {asset.image ? (
                          <img src={asset.image} alt={asset.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                        )}
                        <div>
                          <h3 className="font-semibold">{asset.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground uppercase">{asset.symbol}</span>
                            {asset.alerts.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Bell className="w-3 h-3 mr-1" />
                                {asset.alerts.length}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setQuickAction({ type: 'buy', coinId: asset.coin_id });
                            setShowQuickTrade(true);
                          }}
                          className="text-crypto-gain hover:bg-crypto-gain/20"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setQuickAction({ type: 'sell', coinId: asset.coin_id });
                            setShowQuickTrade(true);
                          }}
                          className="text-crypto-loss hover:bg-crypto-loss/20"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowQuickAlert(true);
                          }}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Asset Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Holdings</p>
                        <p className="font-medium">{asset.amount.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="font-medium">${asset.current_price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-semibold">${asset.current_value.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">P&L</p>
                        <div className={`flex items-center gap-1 ${asset.profit_loss >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                          {asset.profit_loss >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-sm font-medium">
                            {asset.profit_percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 24h Change */}
                    <div className={`flex items-center justify-between p-2 rounded ${
                      asset.price_change_24h >= 0 ? 'bg-crypto-gain/10' : 'bg-crypto-loss/10'
                    }`}>
                      <span className="text-sm">24h Change</span>
                      <span className={`text-sm font-medium ${
                        asset.price_change_24h >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'
                      }`}>
                        {asset.price_change_24h >= 0 ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                      </span>
                    </div>

                    {/* Recent Activity */}
                    {asset.recent_trades.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Recent Trades</p>
                        <div className="flex gap-1">
                          {asset.recent_trades.slice(0, 3).map((trade, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className={`text-xs ${
                                trade.trade_type === 'buy' ? 'border-crypto-gain text-crypto-gain' : 'border-crypto-loss text-crypto-loss'
                              }`}
                            >
                              {trade.trade_type.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Quick Trade Dialog */}
      <Dialog open={showQuickTrade} onOpenChange={setShowQuickTrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Quick {quickAction.type === 'buy' ? 'Buy' : 'Sell'} {selectedAsset?.symbol}
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img src={selectedAsset.image} alt={selectedAsset.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium">{selectedAsset.name}</p>
                  <p className="text-sm text-muted-foreground">${selectedAsset.current_price.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[0.1, 0.5, 1.0].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => executeQuickTrade(quickAction.type, selectedAsset, amount)}
                    className={quickAction.type === 'buy' ? 'hover:bg-crypto-gain/20' : 'hover:bg-crypto-loss/20'}
                  >
                    {amount} {selectedAsset.symbol}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Custom amount"
                  step="0.00001"
                  onChange={(e) => setQuickAction(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                />
                <Button
                  onClick={() => quickAction.amount && executeQuickTrade(quickAction.type, selectedAsset, quickAction.amount)}
                  className={quickAction.type === 'buy' ? 'bg-crypto-gain' : 'bg-crypto-loss'}
                  disabled={!quickAction.amount}
                >
                  {quickAction.type === 'buy' ? 'Buy' : 'Sell'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Alert Dialog */}
      <Dialog open={showQuickAlert} onOpenChange={setShowQuickAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert for {selectedAsset?.symbol}</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img src={selectedAsset.image} alt={selectedAsset.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium">{selectedAsset.name}</p>
                  <p className="text-sm text-muted-foreground">Current: ${selectedAsset.current_price.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => setQuickAction(prev => ({ ...prev, targetPrice: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Condition</label>
                  <Select onValueChange={(value: 'above' | 'below') => setQuickAction(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={() => quickAction.targetPrice && createQuickAlert(selectedAsset, quickAction.targetPrice, (quickAction as any).condition)}
                className="w-full"
                disabled={!quickAction.targetPrice}
              >
                Create Alert
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customization Dialog */}
      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Dashboard Widgets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {widgets.map(widget => (
                  <Card key={widget.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{widget.title}</h4>
                      <Switch
                        checked={widget.enabled}
                        onCheckedChange={(enabled) => {
                          setWidgets(prev => prev.map(w => 
                            w.id === widget.id ? { ...w, enabled } : w
                          ));
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {widget.type === 'portfolio' && 'Main portfolio overview and management'}
                      {widget.type === 'trading' && 'Quick buy/sell actions'}
                      {widget.type === 'alerts' && 'Price alerts and notifications'}
                      {widget.type === 'performance' && 'Performance charts and analytics'}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Display Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Default View Mode</label>
                    <p className="text-sm text-muted-foreground">Choose between grid or list view</p>
                  </div>
                  <Select value={viewMode} onValueChange={setViewMode}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Show Small Holdings</label>
                    <p className="text-sm text-muted-foreground">Display assets with value under $1</p>
                  </div>
                  <Switch checked={showHidden} onCheckedChange={setShowHidden} />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
