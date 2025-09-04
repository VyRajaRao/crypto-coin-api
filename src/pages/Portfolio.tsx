import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { coinGeckoApi } from "@/services/coinGeckoApi";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Portfolio as PortfolioRow } from "@/types/database";

interface PortfolioItem {
  id: number;
  coinId: string;
  name?: string;
  symbol?: string;
  amount: number;
  purchasePrice?: number;
  currentPrice?: number;
  image?: string;
  created_at?: string;
}

function PortfolioItemCard({ item, onRemove }: { 
  item: PortfolioItem & { currentPrice: number; image: string; name: string; symbol: string }; 
  onRemove: (id: number) => void 
}) {
  const currentValue = item.amount * item.currentPrice;
  const purchaseValue = item.amount * (item.purchasePrice || item.currentPrice);
  const profit = currentValue - purchaseValue;
  const profitPercentage = ((currentValue - purchaseValue) / purchaseValue) * 100;
  const isProfit = profit >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground uppercase">{item.symbol}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Holdings</p>
              <p className="font-medium text-foreground">{item.amount.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="font-medium text-foreground">${item.currentPrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="font-semibold text-foreground">${currentValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 text-crypto-gain" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-crypto-loss" />
                )}
                <div className="text-sm">
                  <p className={`font-medium ${isProfit ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                    ${Math.abs(profit).toLocaleString()}
                  </p>
                  <p className={`text-xs ${isProfit ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                    {profitPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddAssetDialog({ onAdd }: { onAdd: (coinId: string, amount: number) => void }) {
  const [open, setOpen] = useState(false);
  const [coinId, setCoinId] = useState("");
  const [name, setName] = useState("");  
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchCoins = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await coinGeckoApi.searchCoins(query);
      setSearchResults(response.coins.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectCoin = (coin: any) => {
    setCoinId(coin.id);
    setName(coin.name);
    setSymbol(coin.symbol);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinId || !amount) return;

    setIsLoading(true);
    try {
      await onAdd(coinId, parseFloat(amount));
      
      // Reset form
      setCoinId("");
      setName("");
      setSymbol("");
      setAmount("");
      setPurchasePrice("");
      setOpen(false);
    } catch (error) {
      console.error('Error adding asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Cryptocurrency</Label>
            <Input
              id="search"
              placeholder="Bitcoin, Ethereum, etc..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                searchCoins(e.target.value);
              }}
              className="bg-background border-border/50"
            />
            {searchResults.length > 0 && (
              <div className="border border-border/50 rounded-lg bg-background max-h-40 overflow-y-auto">
                {searchResults.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => selectCoin(coin)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <div className="text-left">
                      <p className="font-medium">{coin.name}</p>
                      <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Purchase Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="bg-background border-border/50"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!coinId || !amount || isLoading}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isLoading ? "Adding..." : "Add Asset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Portfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioWithPrices, setPortfolioWithPrices] = useState<(PortfolioItem & { currentPrice: number; image: string; name: string; symbol: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load portfolio from Supabase
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching portfolio:', error);
          toast.error('Failed to load portfolio');
          return;
        }

        setPortfolio(data || []);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        toast.error('Failed to load portfolio');
      }
    };

    fetchPortfolio();
  }, [user]);

  // Fetch current prices for portfolio items
  useEffect(() => {
    const fetchPrices = async () => {
      if (portfolio.length === 0) {
        setPortfolioWithPrices([]);
        return;
      }

      setIsLoading(true);
      try {
        const coinIds = portfolio.map(item => item.coinId);
        const coinsData = await coinGeckoApi.getCoinsByIds(coinIds, 'usd');
        
        const updatedPortfolio = portfolio.map(item => {
          const coinData = coinsData.find(coin => coin.id === item.coinId);
          return {
            ...item,
            currentPrice: coinData?.current_price || 0,
            image: coinData?.image || '',
            name: coinData?.name || item.coinId,
            symbol: coinData?.symbol || '',
          };
        });

        setPortfolioWithPrices(updatedPortfolio);
      } catch (error) {
        console.error('Error fetching prices:', error);
        toast.error('Failed to fetch current prices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, [portfolio]);

  const addAsset = async (coinId: string, amount: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('portfolio')
        .insert({
          user_id: user.id,
          coin_id: coinId,
          amount: amount
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding asset:', error);
        toast.error('Failed to add asset');
        return;
      }

      setPortfolio(prev => [...prev, data]);
      toast.success('Asset added to portfolio');
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
  };

  const removeAsset = async (id: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('portfolio')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing asset:', error);
        toast.error('Failed to remove asset');
        return;
      }

      setPortfolio(prev => prev.filter(item => item.id !== id));
      toast.success('Asset removed from portfolio');
    } catch (error) {
      console.error('Error removing asset:', error);
      toast.error('Failed to remove asset');
    }
  };

  const totalValue = portfolioWithPrices.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
  const totalInvested = portfolioWithPrices.reduce((sum, item) => sum + (item.amount * (item.purchasePrice || item.currentPrice)), 0);
  const totalProfit = totalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

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
            Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your cryptocurrency investments
          </p>
        </div>
        <AddAssetDialog onAdd={addAsset} />
      </motion.div>

      {/* Portfolio Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Portfolio Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold text-foreground">${totalInvested.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <div className="flex items-center justify-center gap-2">
                  {totalProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-crypto-gain" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-crypto-loss" />
                  )}
                  <div>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                      ${Math.abs(totalProfit).toLocaleString()}
                    </p>
                    <p className={`text-sm ${totalProfit >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                      {totalProfitPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Portfolio Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {portfolioWithPrices.length === 0 ? (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-12 text-center">
              <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Your portfolio is empty</h3>
              <p className="text-muted-foreground mb-6">
                Add your first cryptocurrency to start tracking your investments
              </p>
              <AddAssetDialog onAdd={addAsset} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioWithPrices.map((item) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                onRemove={removeAsset}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}