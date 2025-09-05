# 📱 Mobile Typography Guide

## Unified Responsive Font System

This guide explains the unified responsive typography system implemented across all pages.

### 🎯 **Font Classes**

#### **Responsive Classes (Auto-adjust by orientation)**
- `responsive-title` - Main page titles
- `responsive-heading` - Section headings 
- `responsive-subheading` - Subsection headings
- `responsive-body` - Body text, descriptions
- `responsive-small` - Small text, captions  
- `responsive-caption` - Very small text, labels

#### **Card-specific Classes**
- `card-title-responsive` - Card titles (maps to responsive-heading)
- `card-description-responsive` - Card descriptions (maps to responsive-small)
- `button-text-responsive` - Button text (maps to responsive-small)

### 📐 **Font Sizes by Orientation**

#### **Portrait Mobile (< 768px, portrait)**
- `responsive-title`: text-xl (20px)
- `responsive-heading`: text-lg (18px)  
- `responsive-subheading`: text-base (16px)
- `responsive-body`: text-sm (14px)
- `responsive-small`: text-xs (12px)
- `responsive-caption`: text-xs (12px)

#### **Landscape Mobile (< 768px, landscape)**  
- `responsive-title`: text-lg (18px)
- `responsive-heading`: text-base (16px)
- `responsive-subheading`: text-sm (14px)
- `responsive-body`: text-xs (12px)
- `responsive-small`: text-xs (12px)  
- `responsive-caption`: text-xs (12px)

#### **Desktop (≥ 768px)**
- `responsive-title`: text-2xl → text-3xl → text-4xl
- `responsive-heading`: text-lg → text-xl → text-2xl
- `responsive-subheading`: text-base → text-lg → text-xl
- `responsive-body`: text-sm → text-base → text-lg
- `responsive-small`: text-xs → text-sm → text-base
- `responsive-caption`: text-xs → text-xs → text-sm

### 🔄 **Migration Guide**

#### **Replace these old patterns:**

```tsx
// OLD ❌
className="text-2xl sm:text-3xl lg:text-4xl font-bold landscape:text-lg"
className="text-sm sm:text-base landscape:text-xs"  
className="text-xs sm:text-sm font-medium landscape:text-xs"

// NEW ✅  
className="responsive-title font-bold"
className="responsive-body"
className="responsive-caption font-medium"
```

#### **Page Headers:**
```tsx
// OLD ❌
<h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent landscape:text-lg">
  Market Scanner
</h1>

// NEW ✅
<h1 className="responsive-title bg-gradient-primary bg-clip-text text-transparent">
  📊 Market Scanner  
</h1>
```

#### **Card Headers:**
```tsx
// OLD ❌
<CardTitle className="flex items-center gap-2 text-lg sm:text-xl landscape:text-base">
  <Activity className="w-5 h-5 text-primary" />
  Quick Presets
</CardTitle>

// NEW ✅
<CardTitle className="card-title-responsive flex items-center gap-2">
  <Activity className="w-4 h-4 text-primary" />
  ⚡ Quick Presets
</CardTitle>
```

#### **Form Labels:**
```tsx
// OLD ❌  
<label className="text-xs sm:text-sm font-medium landscape:text-xs">
  Min Price Change (%)
</label>

// NEW ✅
<label className="responsive-caption font-medium">
  Min %
</label>
```

### 🎨 **Additional Responsive Classes**

#### **Container & Spacing:**
- `container-mobile` - Mobile-safe container
- `portrait:space-y-3` - Portrait spacing
- `landscape:space-y-2` - Landscape spacing

#### **Touch Targets:**
- `touch-target` - 44px minimum touch target
- `responsive-button` - Auto-sizing buttons

#### **Card Improvements:**
- `card-mobile-header` - Mobile-optimized card headers
- `card-mobile-content` - Mobile-optimized card content

### ✅ **Updated Pages**

- ✅ **MarketScanner** - Fully updated with unified system
- ✅ **Analysis** - Fully updated with unified system  
- ✅ **LiveTrading** - Header updated, needs content update
- ⏳ **Dashboard** - Needs update
- ⏳ **Portfolio** - Needs update
- ⏳ **Settings** - Needs update

### 🚀 **Benefits**

1. **Consistent Sizing** - All pages use same font sizes
2. **Orientation Adaptive** - Auto-adjusts for portrait/landscape
3. **Maintainable** - Single source of truth for typography
4. **Accessible** - Proper contrast and sizing ratios
5. **Performance** - CSS-only solution, no JavaScript

### 📝 **Quick Migration Checklist**

For each page:

- [ ] Replace page title with `responsive-title`
- [ ] Replace descriptions with `responsive-small`  
- [ ] Replace card titles with `card-title-responsive`
- [ ] Replace form labels with `responsive-caption`
- [ ] Replace body text with `responsive-body`
- [ ] Update container to `container-mobile max-w-full`
- [ ] Add portrait/landscape spacing classes
- [ ] Test on mobile portrait and landscape orientations

### 🎯 **Example Complete Page Structure**

```tsx
return (
  <div className="container-mobile max-w-full space-y-3 sm:space-y-4 lg:space-y-6 pb-4 portrait:space-y-3 landscape:space-y-2">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="responsive-title bg-gradient-primary bg-clip-text text-transparent">
          📊 Page Title
        </h1>
        <p className="responsive-small text-muted-foreground mt-1">
          Page description
        </p>
      </div>
    </div>

    {/* Cards */}
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="px-3 py-2 sm:px-4 sm:py-3">
        <CardTitle className="card-title-responsive">
          💫 Section Title  
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
        <p className="responsive-body">Content text</p>
        <label className="responsive-caption font-medium">Label</label>
      </CardContent>
    </Card>
  </div>
);
```

This system ensures all pages have consistent, orientation-adaptive typography! 🎉
