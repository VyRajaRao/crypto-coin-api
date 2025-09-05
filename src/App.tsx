import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy, useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import "@/styles/mobile-utils.css";

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
  useEffect(() => {
    // Add mobile optimization class to body
    document.body.classList.add('mobile-optimized');
    
    // Add viewport meta tag if it doesn't exist
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(viewport);
    }
    
    // Prevent zoom on input focus for iOS
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (window.innerWidth < 768) {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
          }
        }
      });
      
      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
        }
      });
    });
    
    return () => {
      document.body.classList.remove('mobile-optimized');
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<div className="min-h-screen error-state-mobile"><LoadingSpinner message="Loading application..." /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/*"
                  element={
                    <Layout>
                      <Suspense fallback={<div className="error-state-mobile"><LoadingSpinner message="Loading page..." /></div>}>
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