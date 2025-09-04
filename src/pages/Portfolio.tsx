import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSupabasePortfolio } from "@/hooks/useSupabasePortfolio";
import { cryptoApi } from "@/services/cryptoApi";
import { toast } from "@/components/ui/sonner";
import { Navigate } from "react-router-dom";

function AddAssetDialog({ onAdd }: { onAdd: (symbol: string, amount: number, buyPrice: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchCoins = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await cryptoApi.searchCoins(query);
      setSearchResults(response.coins.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectCoin = (coin: any) => {
    setSymbol(coin.symbol);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !amount || !buyPrice) return;

    setIsLoading(true);
    try {
      await onAdd(symbol, parseFloat(amount), parseFloat(buyPrice));
      
      // Reset form
      setSymbol("");
      setAmount("");
      setBuyPrice("");
      setOpen(false);
      
      toast.success("Asset added to portfolio successfully!");
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error("Failed to add asset to portfolio");
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
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Purchase Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="bg-background border-border/50"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!symbol || !amount || !buyPrice || isLoading}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isLoading ? "Adding..." : "Add Asset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PortfolioItemCard({ 
  item, 
  onRemove, 
  onUpdate 
}: { 
  item: any; 
  onRemove: (id: string) => void;
  onUpdate: (id: string, amount: number, avgBuyPrice: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(item.amount.toString());
  const [editPrice, setEditPrice] = useState(item.avg_buy_price.toString());

  const currentValue = item.amount * item.currentPrice;
  const purchaseValue = item.amount * item.avg_buy_price;
  const profit = currentValue - purchaseValue;
  const profitPercentage = purchaseValue > 0 ? ((profit / purchaseValue) * 100) : 0;
  const isProfit = profit >= 0;

  const handleUpdate = async () => {
    try {
      await onUpdate(item.id, parseFloat(editAmount), parseFloat(editPrice));
      setIsEditing(false);
      toast.success("Portfolio item updated successfully!");
    } catch (error) {
      toast.error("Failed to update portfolio item");
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove(item.id);
      toast.success("Asset removed from portfolio");
    } catch (error) {
      toast.error("Failed to remove asset");
    }
  };

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
              {item.image && (
                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground uppercase">{item.asset_symbol}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="any"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Avg Buy Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="any"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="bg-gradient-primary"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
                      {isProfit ? '+' : ''}${Math.abs(profit).toLocaleString()}
                    </p>
                    <p className={`text-xs ${isProfit ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                      {isProfit ? '+' : ''}{profitPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Portfolio() {
  const { user } = useAuth();
  const { 
    portfolio, 
    isLoading, 
    addToPortfolio, 
    removeFromPortfolio, 
    updatePortfolioItem 
  } = useSupabasePortfolio();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const totalValue = portfolio.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
  const totalInvested = portfolio.reduce((sum, item) => sum + (item.amount * item.avg_buy_price), 0);
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
        <AddAssetDialog onAdd={addToPortfolio} />
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
                      {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toLocaleString()}
                    </p>
                    <p className={`text-sm ${totalProfit >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                      {totalProfit >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
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
        {isLoading ? (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading portfolio...</p>
            </CardContent>
          </Card>
        ) : portfolio.length === 0 ? (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-12 text-center">
              <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Your portfolio is empty</h3>
              <p className="text-muted-foreground mb-6">
                Add your first cryptocurrency to start tracking your investments
              </p>
              <AddAssetDialog onAdd={addToPortfolio} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                onRemove={removeFromPortfolio}
                onUpdate={updatePortfolioItem}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}