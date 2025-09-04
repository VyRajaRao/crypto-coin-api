# 🌟 CryptoVault - Advanced Cryptocurrency Dashboard

## 📋 Overview

CryptoVault is a modern, feature-rich cryptocurrency dashboard built with React, TypeScript, Tailwind CSS, and Supabase. The application provides real-time market data, portfolio management, trading simulation, and comprehensive analytics for cryptocurrency enthusiasts and investors.

### 🎯 Key Features

✅ **Authentication & User Management**
- Secure user registration and login with Supabase Auth
- Protected routes and role-based access
- Automatic session management

✅ **Real-time Market Data**
- Live cryptocurrency prices powered by CoinGecko API
- Top 10 market cap ranking with interactive charts
- Market trends and analysis

✅ **Portfolio Management**
- Add/remove/update cryptocurrency holdings
- Real-time portfolio valuation and P&L tracking
- Average purchase price tracking
- Export portfolio data to CSV

✅ **Advanced Market Analysis**
- Top 10 cryptocurrencies with interactive charts
- Technical indicators and analysis
- Search functionality for all cryptocurrencies
- Detailed coin information and statistics

✅ **Price Alerts System**
- Set custom price alerts (above/below thresholds)
- Real-time alert monitoring and notifications
- Alert history and management

✅ **Market Scanner**
- Advanced filtering by price change, market cap, volume
- Quick preset filters for common searches
- Export scan results to CSV
- Real-time data updates

✅ **Live Trading Simulator**
- Paper trading with virtual $10,000 balance
- Buy/sell orders with market and limit options
- Simulated order book and recent trades
- Trading history and performance tracking

✅ **Settings & Customization**
- Dark/Light theme selection
- Multi-currency support (USD, EUR, BTC, ETH)
- Auto-refresh rate configuration
- User preference persistence

✅ **Mobile Responsive Design**
- Optimized for all screen sizes
- Touch-friendly interface
- Progressive Web App features

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI, Shadcn/UI
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: CoinGecko API for market data
- **Charts**: Chart.js, Recharts
- **State Management**: React Hooks, Context API

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- CoinGecko API access (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd crypto-coin-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://hqkqklruuzddckzhdeyo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CoinGecko API Configuration
VITE_COINGECKO_KEY=your_coingecko_api_key
```

4. **Database Setup**

Run the SQL migrations in your Supabase dashboard:
- Execute `supabase/migrations/20250904200000_update_schema.sql`
- Ensure Row Level Security (RLS) is enabled
- Verify all policies are created correctly

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎨 Design System

The application uses a custom dark theme with neon accents:

- **Primary Colors**: Neon cyan (#00D4FF)
- **Accent Colors**: Neon purple (#B066FF)
- **Success**: Bright green (#00FF57)
- **Loss**: Neon red (#FF3366)
- **Background**: Dark slate (#0F172A)

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User data isolation through Supabase Auth
- API rate limiting implemented
- Input validation and sanitization
- Secure session management

## 📱 Usage

### Getting Started
1. Register a new account or sign in
2. Complete the onboarding process
3. Start by adding cryptocurrencies to your portfolio

### Portfolio Management
- Click "Add Asset" to add cryptocurrencies
- Use the search bar to find specific coins
- Enter amount and average purchase price
- View real-time portfolio performance

### Price Alerts
- Set alerts for price movements
- Choose "above" or "below" thresholds
- Receive browser notifications when triggered

### Market Analysis
- Browse top 10 cryptocurrencies with charts
- Search for any cryptocurrency
- View detailed market statistics
- Filter and sort market data

### Trading Simulation
- Practice trading with $10,000 virtual balance
- Place market and limit orders
- Track your trading performance
- View order history and statistics

---

**CryptoVault** - Your gateway to advanced cryptocurrency portfolio management and trading simulation.

# CryptoVault - Crypto & Stock Tracking App

> **🚀 FULLY FUNCTIONAL & PRODUCTION READY** - Complete crypto tracking app with authentication, real-time data, and portfolio management.

A professional cryptocurrency and stock tracking application built with React, TypeScript, Supabase, and CoinGecko API. Features complete user authentication, real-time portfolio tracking, interactive charts, and comprehensive market analysis.

## ✨ Key Features

### 🔐 Complete Authentication System
- ✅ **Sign Up & Sign In** with Supabase Auth (email + password)
- ✅ **Email Confirmation** support with user-friendly messaging
- ✅ **Error Handling** for all auth scenarios (invalid credentials, rate limits, etc.)
- ✅ **Automatic Redirects** to dashboard after successful login
- ✅ **Protected Routes** with authentication guards

### 📊 Full-Featured Dashboard
- ✅ **Real-time Market Data** from CoinGecko API
- ✅ **Interactive Price Charts** with 24h, 7d, 30d filters
- ✅ **Portfolio Management** - Add/remove coins with live P&L tracking
- ✅ **Portfolio Analysis** - Allocation charts and performance metrics
- ✅ **Trending Coins** display with clickable chart switching
- ✅ **User Settings** - Theme and currency preferences

### 🗄️ Backend Integration
- ✅ **Supabase Database** with Row-Level Security (RLS)
- ✅ **Real-time Price Updates** from CoinGecko API
- ✅ **User Portfolio Persistence** across sessions
- ✅ **Secure Data Access** with proper authentication

### 🎨 Modern UI/UX
- ✅ **Dark Theme** with neon glow effects
- ✅ **Mobile-First Responsive Design**
- ✅ **Framer Motion Animations** for smooth transitions
- ✅ **Professional Styling** with custom CSS system

## 🚀 Quick Start

### 1. Setup Database (REQUIRED)
**You must set up the database first before running the app:**

1. Go to your Supabase dashboard: https://hqkqklruuzddckzhdeyo.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `supabase/init.sql`
4. Click **"Run"** to create all tables and policies

### 2. Install & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### 3. Test the App
1. **Visit** http://localhost:8080
2. **Click "Sign Up"** to create an account
3. **Verify** email confirmation works (or sign in directly if disabled)
4. **Explore** all features:
   - Dashboard with live crypto data
   - Trends page with interactive charts
   - Portfolio management
   - Analysis with charts
   - Settings page

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18.3.1** - Modern hooks-based React
- **TypeScript** - Full type safety
- **Vite** - Fast development and builds
- **TailwindCSS + Custom CSS** - Beautiful dark theme with neon effects
- **Shadcn/ui** - High-quality component library
- **Framer Motion** - Smooth animations
- **Recharts** - Interactive data visualization
- **React Router DOM** - Client-side routing
- **TanStack Query** - Server state management

### Backend Services
- **Supabase** - Authentication, database, real-time features
- **CoinGecko API** - Live cryptocurrency market data (free tier)

### Database Schema
```sql
-- User investment portfolio
portfolio (id, user_id, coin_id, amount, created_at)

-- Price alerts (future feature)
alerts (id, user_id, coin_id, target_price, created_at)

-- User preferences
preferences (id, user_id, theme, currency)
```

## 📱 Application Pages

| Page | Route | Features |
|------|-------|----------|
| **Authentication** | `/auth` | Sign up/in with email + password |
| **Dashboard** | `/dashboard` | Live market overview, top cryptos |
| **Trends** | `/trends` | Interactive charts, trending coins |
| **Portfolio** | `/portfolio` | Add/remove coins, P&L tracking |
| **Analysis** | `/analysis` | Allocation charts, performance metrics |
| **Settings** | `/settings` | Theme/currency preferences |

## 🛡️ Security & Error Handling

### ✅ Comprehensive Error Handling
- **Authentication Errors** - Invalid credentials, email confirmation, rate limits
- **API Errors** - CoinGecko rate limits, network failures, server errors
- **Database Errors** - Connection issues, permission problems
- **User-Friendly Messages** - Clear error explanations and recovery suggestions

### ✅ Security Features
- **Row-Level Security** - Users can only access their own data
- **Protected Routes** - Authentication required for all pages
- **Input Validation** - Client and server-side validation
- **Rate Limiting Respect** - Proper API usage within free tier limits

## 🎯 Production Ready Features

- ✅ **Complete User Authentication Flow**
- ✅ **Real-time Market Data Integration**
- ✅ **Persistent User Portfolios**
- ✅ **Responsive Mobile Design**
- ✅ **Professional Error Handling**
- ✅ **Type-Safe TypeScript**
- ✅ **Optimized Performance**
- ✅ **Clean Code Architecture**

## 🔧 Development Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Code linting
npm run preview  # Preview production build
```

## 🌐 Deployment Ready

This app is ready for deployment on:
- **Vercel** (recommended)
- **Netlify**
- **Railway**
- Any static hosting service

---

**🎉 Congratulations! You now have a fully functional, production-ready crypto tracking application.**

*Built with modern React, TypeScript, and industry best practices.*
