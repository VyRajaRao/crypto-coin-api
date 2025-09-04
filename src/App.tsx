import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const FastPortfolio = lazy(() => import("@/pages/FastPortfolio"));
const IntegratedPortfolio = lazy(() => import("@/pages/IntegratedPortfolio"));
const WidgetDashboard = lazy(() => import("@/pages/WidgetDashboard"));
const Trends = lazy(() => import("@/pages/Trends"));
const TopCoinsAnalysis = lazy(() => import("@/pages/TopCoinsAnalysis"));
const FastSettings = lazy(() => import("@/pages/FastSettings"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const MarketScanner = lazy(() => import("@/pages/MarketScanner"));
const FastPriceAlerts = lazy(() => import("@/pages/FastPriceAlerts"));
const FastLiveTrading = lazy(() => import("@/pages/FastLiveTrading"));
const CoinDetail = lazy(() => import("@/pages/CoinDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner message="Loading application..." /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/*"
                  element={
                    <Layout>
                      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/portfolio" element={<IntegratedPortfolio />} />
                          <Route path="/portfolio/fast" element={<FastPortfolio />} />
                          <Route path="/dashboard/widgets" element={<WidgetDashboard />} />
                          <Route path="/trends" element={<Trends />} />
                          <Route path="/analysis" element={<TopCoinsAnalysis />} />
                          <Route path="/settings" element={<FastSettings />} />
                          <Route path="/scanner" element={<MarketScanner />} />
                          <Route path="/alerts" element={<FastPriceAlerts />} />
                          <Route path="/trading" element={<FastLiveTrading />} />
                          <Route path="/coins/:id" element={<CoinDetail />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  }
                />
              </Routes>
            </Suspense>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;