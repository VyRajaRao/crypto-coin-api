import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart, Target, TrendingUp, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSupabasePortfolio } from "@/hooks/useSupabasePortfolio";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Navigate } from "react-router-dom";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))', '#8b5cf6', '#06d6a0', '#f72585', '#4cc9f0'];

export default function Analysis() {
  const { user } = useAuth();
  const { portfolio, isLoading } = useSupabasePortfolio();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const totalValue = portfolio.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
  const totalInvested = portfolio.reduce((sum, item) => sum + (item.amount * item.avg_buy_price), 0);
  const totalProfit = totalValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Prepare chart data
  const pieChartData = portfolio.map((item, index) => ({
    name: item.name,
    value: item.amount * item.currentPrice,
    percentage: totalValue > 0 ? (((item.amount * item.currentPrice) / totalValue) * 100).toFixed(1) : 0,
    color: COLORS[index % COLORS.length]
  }));

  const barChartData = portfolio.map(item => {
    const currentValue = item.amount * item.currentPrice;
    const investedValue = item.amount * item.avg_buy_price;
    const profit = currentValue - investedValue;
    const profitPercentage = investedValue > 0 ? (profit / investedValue) * 100 : 0;

    return {
      name: item.asset_symbol.toUpperCase(),
      profit: profit,
      profitPercentage: profitPercentage
    };
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading portfolio analysis...</p>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="text-center py-12">
        <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">No Portfolio Data</h2>
        <p className="text-muted-foreground">Add some assets to your portfolio to see analysis.</p>
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
            Portfolio Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed insights into your investment performance
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-crypto-gain/20' : 'bg-crypto-loss/20'}`}>
                <TrendingUp className={`w-6 h-6 ${totalProfit >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                  {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${totalProfitPercentage >= 0 ? 'bg-crypto-gain/20' : 'bg-crypto-loss/20'}`}>
                <Percent className={`w-6 h-6 ${totalProfitPercentage >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className={`text-2xl font-bold ${totalProfitPercentage >= 0 ? 'text-crypto-gain' : 'text-crypto-loss'}`}>
                  {totalProfitPercentage >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Portfolio Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pieChartData.slice(0, 8).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profit/Loss Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Profit/Loss by Asset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'profit' ? `$${value.toLocaleString()}` : `${value.toFixed(2)}%`,
                        name === 'profit' ? 'Profit/Loss' : 'Return %'
                      ]}
                    />
                    <Bar 
                      dataKey="profit" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Holdings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Detailed Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.map((item, index) => {
                const currentValue = item.amount * item.currentPrice;
                const investedValue = item.amount * item.avg_buy_price;
                const profit = currentValue - investedValue;
                const profitPercentage = investedValue > 0 ? (profit / investedValue) * 100 : 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.amount.toFixed(6)} {item.asset_symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">${currentValue.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={profit >= 0 ? "default" : "destructive"}
                          className={profit >= 0 ? "bg-crypto-gain text-white" : "bg-crypto-loss text-white"}
                        >
                          {profit >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}