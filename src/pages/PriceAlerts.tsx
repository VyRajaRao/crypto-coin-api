import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, BellOff, TrendingUp, TrendingDown, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { coinGeckoApi } from '@/services/coinGeckoApi';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type Alert = Database['public']['Tables']['alerts']['Row'];
type AlertInsert = Database['public']['Tables']['alerts']['Insert'];

interface AlertWithCoinData extends Alert {
  coin_name?: string;
  coin_symbol?: string;
  coin_image?: string;
  current_price?: number;
}

export default function PriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertWithCoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertWithCoinData | null>(null);
  const [newAlert, setNewAlert] = useState<Partial<AlertInsert>>({
    coin_id: '',
    direction: 'above',
    target_price: 0,
    active: true
  });

  useEffect(() => {
    if (user) {
      fetchAlerts();
      // Set up polling for price checks every minute
      const interval = setInterval(checkAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data: alertsData, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with coin data
      const enrichedAlerts = await Promise.all(
        (alertsData || []).map(async (alert) => {
          try {
            const coinData = await coinGeckoApi.getCoinDetails(alert.coin_id);
            return {
              ...alert,
              coin_name: coinData.name,
              coin_symbol: coinData.symbol.toUpperCase(),
              coin_image: coinData.image.small,
              current_price: coinData.market_data.current_price.usd
            };
          } catch (error) {
            console.error('Error fetching coin data for alert:', alert.coin_id, error);
            return alert;
          }
        })
      );

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load price alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAlerts = async () => {
    if (!user || alerts.length === 0) return;

    const activeAlerts = alerts.filter(alert => alert.active && !alert.triggered_at);
    
    for (const alert of activeAlerts) {
      try {
        const coinData = await coinGeckoApi.getCoinDetails(alert.coin_id);
        const currentPrice = coinData.market_data.current_price.usd;
        
        let shouldTrigger = false;
        if (alert.direction === 'above' && currentPrice >= alert.target_price) {
          shouldTrigger = true;
        } else if (alert.direction === 'below' && currentPrice <= alert.target_price) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Update alert as triggered
          await supabase
            .from('alerts')
            .update({ triggered_at: new Date().toISOString() })
            .eq('id', alert.id);

          // Show notification
          const direction = alert.direction === 'above' ? 'above' : 'below';
          const coinName = alert.coin_name || alert.coin_id;
          toast.success(
            `🚨 Price Alert Triggered! ${coinName} is now ${direction} $${alert.target_price}`,
            { duration: 10000 }
          );

          // Refresh alerts
          fetchAlerts();
        }
      } catch (error) {
        console.error('Error checking alert:', alert.id, error);
      }
    }
  };

  const handleCreateAlert = async () => {
    if (!user || !newAlert.coin_id || !newAlert.target_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('alerts')
        .insert([{
          ...newAlert,
          user_id: user.id,
          target_price: Number(newAlert.target_price)
        }]);

      if (error) throw error;

      toast.success('Price alert created successfully');
      setShowCreateDialog(false);
      setNewAlert({
        coin_id: '',
        direction: 'above',
        target_price: 0,
        active: true
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create price alert');
    }
  };

  const handleUpdateAlert = async (alertId: string, updates: Partial<Alert>) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert updated successfully');
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Failed to update alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert deleted successfully');
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const handleCoinSelect = (coin: { id: string; name: string; symbol: string }) => {
    setNewAlert(prev => ({ ...prev, coin_id: coin.id }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-muted-foreground">Please sign in to manage your price alerts.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading price alerts...</p>
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
            Price Alerts
          </h1>
          <p className="text-muted-foreground mt-1">
            Get notified when cryptocurrencies reach your target prices
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Cryptocurrency</label>
                <SearchBar onCoinSelect={handleCoinSelect} />
              </div>
              <div>
                <label className="text-sm font-medium">Direction</label>
                <Select
                  value={newAlert.direction}
                  onValueChange={(value: 'above' | 'below') => 
                    setNewAlert(prev => ({ ...prev, direction: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Price goes above</SelectItem>
                    <SelectItem value="below">Price goes below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Price (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAlert.target_price}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, target_price: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAlert.active}
                  onCheckedChange={(checked) => setNewAlert(prev => ({ ...prev, active: checked }))}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <Button onClick={handleCreateAlert} className="w-full">
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-crypto-gain/20">
                <AlertTriangle className="w-6 h-6 text-crypto-gain" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">
                  {alerts.filter(alert => alert.active && !alert.triggered_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-secondary/20">
                <BellOff className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Triggered</p>
                <p className="text-2xl font-bold">
                  {alerts.filter(alert => alert.triggered_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Your Price Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Price Alerts</h3>
                <p className="text-muted-foreground">Create your first alert to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      alert.triggered_at 
                        ? 'bg-secondary/30 border-secondary' 
                        : alert.active 
                          ? 'bg-background/30 border-border/50' 
                          : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {alert.coin_image && (
                          <img 
                            src={alert.coin_image} 
                            alt={alert.coin_name} 
                            className="w-10 h-10 rounded-full" 
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{alert.coin_name || alert.coin_id}</h4>
                            {alert.coin_symbol && (
                              <Badge variant="outline">{alert.coin_symbol}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {alert.direction === 'above' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span>
                              Price {alert.direction} ${alert.target_price.toLocaleString()}
                            </span>
                            {alert.current_price && (
                              <span>• Current: ${alert.current_price.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.triggered_at && (
                          <Badge variant="secondary" className="bg-crypto-gain/20 text-crypto-gain">
                            Triggered
                          </Badge>
                        )}
                        {!alert.triggered_at && (
                          <>
                            <Switch
                              checked={alert.active}
                              onCheckedChange={(checked) => 
                                handleUpdateAlert(alert.id, { active: checked })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAlert(alert)}
                              className="hover:bg-primary/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
