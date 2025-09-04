# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a cryptocurrency portfolio management and market tracking application built with React, TypeScript, and Vite. The app integrates with CoinGecko API for real-time crypto data and uses Supabase for user authentication and portfolio storage.

## Development Commands

### Core Commands
```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Supabase Database Commands
```bash
# Start local Supabase services
supabase start

# Apply database migrations
supabase db push

# Reset local database
supabase db reset

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Architecture Overview

### Application Structure
- **Framework**: React 18 with TypeScript, built on Vite
- **UI Components**: shadcn/ui with Radix UI primitives and Tailwind CSS
- **State Management**: React Context for auth, TanStack Query for server state
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **External API**: CoinGecko API for cryptocurrency market data
- **Authentication**: Supabase Auth with email/password

### Key Directories
```
src/
├── components/          # Reusable UI components (Layout, Sidebar, SearchBar)
├── pages/              # Route-based page components
├── hooks/              # Custom React hooks (auth, portfolio, mobile detection)
├── services/           # External API integrations (CoinGecko)
├── integrations/       # Generated Supabase client and types
└── lib/                # Utility functions
```

### Routing Architecture
- **Public Routes**: `/` (landing), `/auth` (authentication)  
- **Protected Routes**: All main app routes are wrapped in `<Layout>` component
  - `/dashboard` - Market overview with top cryptocurrencies
  - `/portfolio` - User's crypto portfolio management
  - `/trends` - Trending cryptocurrencies
  - `/analysis` - Market analysis tools
  - `/settings` - User preferences

### Data Flow Architecture
1. **Authentication Layer**: `AuthProvider` context manages user session state
2. **API Layer**: `cryptoApi` service handles CoinGecko API calls with axios
3. **Database Layer**: Supabase client with RLS policies for data security
4. **State Management**: TanStack Query for server state caching and synchronization

## Database Schema

### Core Tables
- **portfolio**: User crypto holdings (`user_id`, `coin_id`, `amount`, `avg_buy_price`)
- **alerts**: Price alerts (`user_id`, `coin_id`, `target_price`, `alert_type`)  
- **preferences**: User settings (`user_id`, `theme`, `default_currency`)

### Row Level Security
All tables have RLS enabled with policies ensuring users can only access their own data using `auth.uid() = user_id` checks.

## External API Integration

### CoinGecko API Service
Located in `src/services/cryptoApi.ts` - handles all cryptocurrency market data:
- Market data for coins (prices, market cap, volume)
- Trending coins
- Global market statistics
- Historical price data
- Coin search functionality

**API Key**: Configured in service file (CG-HnpEbeYmceViPb2zW9gVZE6s)

## Authentication System

### Implementation
- Uses Supabase Auth with email/password authentication
- `AuthProvider` context provides auth state and methods globally
- Authentication state persisted in localStorage with auto-refresh tokens

### Auth Flow
1. Users sign up/in via `/auth` page
2. Successful auth redirects to `/dashboard`
3. `useAuth` hook provides `user`, `session`, `loading` state and auth methods

## Development Guidelines

### Component Patterns
- Functional components with TypeScript interfaces for props
- Custom hooks for complex state logic (e.g., `useSupabasePortfolio`)
- Framer Motion animations for enhanced UX
- shadcn/ui components for consistent design system

### API Data Fetching
- Use TanStack Query for server state management
- CoinGecko API calls wrapped in try/catch with proper error handling
- Real-time updates via polling intervals (Dashboard polls every 30 seconds)

### Styling Approach
- Tailwind CSS with custom CSS variables for theming
- Gradient backgrounds and glassmorphism effects
- Custom animations with tailwindcss-animate
- Responsive design with mobile-first approach

### Testing Strategy
The project currently has no test setup. To add testing:
```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add test script to package.json
"test": "vitest"
```

## Environment Setup

### Required Environment Variables
Create `.env` file with:
```
VITE_SUPABASE_URL=https://hqkqklruuzddckzhdeyo.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
```

### Local Development
1. Clone repository
2. Install dependencies: `npm i`  
3. Set up environment variables
4. Start Supabase local development: `supabase start`
5. Run development server: `npm run dev`

## Common Development Tasks

### Adding New Cryptocurrency Features
1. Extend `CoinData` interface in `cryptoApi.ts` if new data fields needed
2. Add new API methods to `CryptoApiService` class
3. Create React components with TanStack Query for data fetching
4. Use existing UI patterns from Dashboard/Portfolio pages

### Database Schema Changes  
1. Create new migration: `supabase migration new <name>`
2. Write SQL in migration file
3. Apply locally: `supabase db push`
4. Regenerate types: `supabase gen types typescript --local`

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.tsx` within protected layout
3. Add navigation item in `AppSidebar.tsx` 
4. Ensure proper TypeScript interfaces and error handling

### Portfolio Management Enhancements
The `useSupabasePortfolio` hook provides full CRUD operations. When extending:
- Maintain real-time price updates by enriching Supabase data with CoinGecko API
- Preserve RLS security patterns for user data isolation
- Use optimistic updates pattern for better UX
