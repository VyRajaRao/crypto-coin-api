import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, Minus, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { coinGeckoApi, type CoinData } from '@/services/coinGeckoApi';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type Trade = Database['public']['Tables']['trades']['Row'];
type Wallet = Database['public']['Tables']['wallet']['Row'];

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface SimulatedTrade {
  id: string;
  price: number;
  amount: number;
  timestamp: Date;
  type: 'buy' | 'sell';
}

export default function LiveTrading() {
  const { user } = useAuth();
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  }>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<SimulatedTrade[]>([]);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      initializeUser();
      fetchTrades();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCoin) {
      generateOrderBook();
      generateRecentTrades();
      const interval = setInterval(() => {
        generateOrderBook();
        generateRecentTrades();
      }, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedCoin]);

  const initializeUser = async () => {
    if (!user) return;

    try {
      // Check if user has wallet, create if not
      const { data: existingWallet, error: fetchError } = await supabase
        .from('wallet')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingWallet) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallet')
          .insert([{ user_id: user.id, balance: 10000 }])
          .select()
          .single();

        if (createError) throw createError;
        setWallet(newWallet);
        toast.success('Welcome! You\'ve been given $10,000 in virtual funds to start trading.');
      } else {
        setWallet(existingWallet);
      }

      // Load default coin (Bitcoin)
      const btcData = await coinGeckoApi.getCoinDetails('bitcoin');
      const coinData: CoinData = {
        id: btcData.id,
        symbol: btcData.symbol,
        name: btcData.name,
        image: btcData.image.small,
        current_price: btcData.market_data.current_price.usd,
        market_cap: btcData.market_data.market_cap.usd,
        market_cap_rank: btcData.market_cap_rank,
        fully_diluted_valuation: btcData.market_data.fully_diluted_valuation?.usd || null,
        total_volume: btcData.market_data.total_volume.usd,
        high_24h: btcData.market_data.high_24h.usd,
        low_24h: btcData.market_data.low_24h.usd,
        price_change_24h: btcData.market_data.price_change_24h,
        price_change_percentage_24h: btcData.market_data.price_change_percentage_24h,
        market_cap_change_24h: btcData.market_data.market_cap_change_24h,
        market_cap_change_percentage_24h: btcData.market_data.market_cap_change_percentage_24h,
        circulating_supply: btcData.market_data.circulating_supply,
        total_supply: btcData.market_data.total_supply,
        max_supply: btcData.market_data.max_supply,
        ath: btcData.market_data.ath.usd,
        ath_change_percentage: btcData.market_data.ath_change_percentage.usd,
        ath_date: btcData.market_data.ath_date.usd,
        atl: btcData.market_data.atl.usd,
        atl_change_percentage: btcData.market_data.atl_change_percentage.usd,
        atl_date: btcData.market_data.atl_date.usd,
        roi: null,
        last_updated: new Date().toISOString()
      };
      setSelectedCoin(coinData);
    } catch (error) {
      console.error('Error initializing user:', error);
      toast.error('Failed to initialize trading account');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrades = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const generateOrderBook = () => {
    if (!selectedCoin) return;

    const basePrice = selectedCoin.current_price;
    const spread = basePrice * 0.001; // 0.1% spread

    // Generate bids (buy orders) - below current price
    const bids: OrderBookEntry[] = [];
    for (let i = 0; i < 10; i++) {
      const price = basePrice - spread - (i * basePrice * 0.0005);
      const amount = Math.random() * 5 + 0.1;
      bids.push({
        price: parseFloat(price.toFixed(2)),
        amount: parseFloat(amount.toFixed(4)),
        total: parseFloat((price * amount).toFixed(2))
      });
    }

    // Generate asks (sell orders) - above current price
    const asks: OrderBookEntry[] = [];
    for (let i = 0; i < 10; i++) {
      const price = basePrice + spread + (i * basePrice * 0.0005);
      const amount = Math.random() * 5 + 0.1;
      asks.push({
        price: parseFloat(price.toFixed(2)),
        amount: parseFloat(amount.toFixed(4)),
        total: parseFloat((price * amount).toFixed(2))
      });
    }

    setOrderBook({ bids, asks });
  };

  const generateRecentTrades = () => {
    if (!selectedCoin) return;

    const trades: SimulatedTrade[] = [];
    const basePrice = selectedCoin.current_price;

    for (let i = 0; i < 20; i++) {
      const priceVariation = (Math.random() - 0.5) * basePrice * 0.002; // ±0.2%
      const price = basePrice + priceVariation;
      const amount = Math.random() * 2 + 0.01;
      
      trades.push({
        id: `trade-${i}`,
        price: parseFloat(price.toFixed(2)),
        amount: parseFloat(amount.toFixed(4)),
        timestamp: new Date(Date.now() - i * 30000), // 30 seconds apart
        type: Math.random() > 0.5 ? 'buy' : 'sell'
      });
    }

    setRecentTrades(trades);
  };

  const executeTrade = async () => {
    if (!user || !selectedCoin || !wallet) {
      toast.error('Please ensure you are logged in and have selected a coin');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      let executionPrice = selectedCoin.current_price;
      
      if (orderType === 'limit' && price) {
        executionPrice = parseFloat(price);
      }

      const tradeAmount = parseFloat(amount);
      const totalCost = tradeAmount * executionPrice;

      // Check if user has enough balance for buy orders
      if (tradeType === 'buy' && totalCost > wallet.balance) {
        toast.error('Insufficient balance');
        return;
      }

      // Execute trade
      const { error: tradeError } = await supabase
        .from('trades')
        .insert([{
          user_id: user.id,
          coin_id: selectedCoin.id,
          type: tradeType,
          amount: tradeAmount,
          price: executionPrice
        }]);

      if (tradeError) throw tradeError;

      // Update wallet balance
      const newBalance = tradeType === 'buy' 
        ? wallet.balance - totalCost
        : wallet.balance + totalCost;

      const { error: walletError } = await supabase
        .from('wallet')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      setWallet({ ...wallet, balance: newBalance });
      
      toast.success(
        `${tradeType.toUpperCase()} order executed: ${tradeAmount} ${selectedCoin.symbol.toUpperCase()} at $${executionPrice.toLocaleString()}`
      );

      // Reset form
      setAmount('');
      setPrice('');
      
      // Refresh trades
      fetchTrades();
    } catch (error) {
      console.error('Error executing trade:', error);
      toast.error('Failed to execute trade');
    }
  };

  const handleCoinSelect = async (coin: { id: string; name: string; symbol: string }) => {
    try {
      const coinDetails = await coinGeckoApi.getCoinDetails(coin.id);
      const coinData: CoinData = {
        id: coinDetails.id,
        symbol: coinDetails.symbol,
        name: coinDetails.name,
        image: coinDetails.image.small,
        current_price: coinDetails.market_data.current_price.usd,
        market_cap: coinDetails.market_data.market_cap.usd,
        market_cap_rank: coinDetails.market_cap_rank,
        fully_diluted_valuation: coinDetails.market_data.fully_diluted_valuation?.usd || null,
        total_volume: coinDetails.market_data.total_volume.usd,
        high_24h: coinDetails.market_data.high_24h.usd,
        low_24h: coinDetails.market_data.low_24h.usd,
        price_change_24h: coinDetails.market_data.price_change_24h,
        price_change_percentage_24h: coinDetails.market_data.price_change_percentage_24h,
        market_cap_change_24h: coinDetails.market_data.market_cap_change_24h,
        market_cap_change_percentage_24h: coinDetails.market_data.market_cap_change_percentage_24h,
        circulating_supply: coinDetails.market_data.circulating_supply,
        total_supply: coinDetails.market_data.total_supply,
        max_supply: coinDetails.market_data.max_supply,
        ath: coinDetails.market_data.ath.usd,
        ath_change_percentage: coinDetails.market_data.ath_change_percentage.usd,
        ath_date: coinDetails.market_data.ath_date.usd,
        atl: coinDetails.market_data.atl.usd,
        atl_change_percentage: coinDetails.market_data.atl_change_percentage.usd,
        atl_date: coinDetails.market_data.atl_date.usd,
        roi: null,
        last_updated: new Date().toISOString()
      };
      setSelectedCoin(coinData);
    } catch (error) {
      console.error('Error loading coin:', error);
      toast.error('Failed to load coin data');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-muted-foreground">Please sign in to access the trading simulator.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Initializing trading account...</p>
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
            Live Trading
          </h1>
          <p className="text-muted-foreground mt-1">
            Practice trading with simulated orders and real market data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-crypto-gain/20 text-crypto-gain">
            Virtual Trading
          </Badge>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-bold">${wallet?.balance.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Coin Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <SearchBar onCoinSelect={handleCoinSelect} />
              {selectedCoin && (
                <div className="flex items-center gap-3">
                  <img src={selectedCoin.image} alt={selectedCoin.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="font-medium">{selectedCoin.name}</p>
                    <p className="text-sm text-muted-foreground">${selectedCoin.current_price.toLocaleString()}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    selectedCoin.price_change_percentage_24h >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'
                  }`}>
                    {selectedCoin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {selectedCoin.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedCoin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Trade {selectedCoin.symbol.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="text-crypto-gain data-[state=active]:bg-crypto-gain/20">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="text-crypto-loss data-[state=active]:bg-crypto-loss/20">
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div>
                  <label className="text-sm font-medium">Order Type</label>
                  <Select value={orderType} onValueChange={(value) => setOrderType(value as 'market' | 'limit')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderType === 'limit' && (
                  <div>
                    <label className="text-sm font-medium">Price (USD)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={selectedCoin.current_price.toString()}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Amount ({selectedCoin.symbol.toUpperCase()})</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {amount && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="font-bold">
                      ${(parseFloat(amount) * (orderType === 'limit' && price ? parseFloat(price) : selectedCoin.current_price)).toLocaleString()}
                    </p>
                  </div>
                )}

                <Button
                  onClick={executeTrade}
                  className={`w-full ${
                    tradeType === 'buy' 
                      ? 'bg-crypto-gain hover:bg-crypto-gain/90' 
                      : 'bg-crypto-loss hover:bg-crypto-loss/90'
                  }`}
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  {tradeType === 'buy' ? <Plus className="w-4 h-4 mr-2" /> : <Minus className="w-4 h-4 mr-2" />}
                  {tradeType.toUpperCase()} {selectedCoin.symbol.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Book & Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Book */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Order Book
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {/* Asks */}
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-crypto-loss mb-2">Asks (Sell Orders)</h4>
                      <div className="space-y-1">
                        {orderBook.asks.slice().reverse().map((ask, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-crypto-loss">${ask.price}</span>
                            <span className="text-muted-foreground">{ask.amount}</span>
                            <span className="text-muted-foreground">${ask.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border px-4 py-2">
                      <div className="text-center">
                        <span className="font-bold">${selectedCoin.current_price.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-2">Market Price</span>
                      </div>
                    </div>

                    {/* Bids */}
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-crypto-gain mb-2">Bids (Buy Orders)</h4>
                      <div className="space-y-1">
                        {orderBook.bids.map((bid, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-crypto-gain">${bid.price}</span>
                            <span className="text-muted-foreground">{bid.amount}</span>
                            <span className="text-muted-foreground">${bid.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Trades
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {recentTrades.map((trade) => (
                        <div key={trade.id} className="flex justify-between text-xs">
                          <span className={trade.type === 'buy' ? 'text-crypto-gain' : 'text-crypto-loss'}>
                            ${trade.price}
                          </span>
                          <span className="text-muted-foreground">{trade.amount}</span>
                          <span className="text-muted-foreground">
                            {trade.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}

      {/* Trading History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Your Trading History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {trades.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Trades Yet</h3>
                <p className="text-muted-foreground">Start trading to see your history here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Time</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Coin</th>
                      <th className="p-4 text-center text-sm font-medium text-muted-foreground">Type</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Price</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, index) => (
                      <tr key={trade.id} className="border-b border-border/30">
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(trade.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm font-medium">
                          {trade.coin_id.toUpperCase()}
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant={trade.type === 'buy' ? 'default' : 'secondary'}
                            className={trade.type === 'buy' ? 'bg-crypto-gain text-white' : 'bg-crypto-loss text-white'}
                          >
                            {trade.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-right text-sm">
                          {trade.amount.toFixed(6)}
                        </td>
                        <td className="p-4 text-right text-sm">
                          ${trade.price.toLocaleString()}
                        </td>
                        <td className="p-4 text-right text-sm font-medium">
                          ${(trade.amount * trade.price).toLocaleString()}
                        </td>
                      </tr>
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
