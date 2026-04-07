# Kugava App Redesign - Documentation

## Overview
Complete visual and UX redesign of the Kugava luxury real estate app for Moçambique.

## Design System: Sage & Stone

### Philosophy
Nature-inspired luxury that feels organic, calming, and distinctly premium. Replaces generic blue/slate with:

- **Sage Green** (#5A6B5A) - Primary brand color
- **Terracotta** (#A67B5B) - Warm accent
- **Cream** (#F7F5F3) - Surface backgrounds
- **Forest** (#2D3A2D) - Text and contrast

### Why This Works
1. **Reflects Moçambique's landscape** - Savanna, coastline, forests
2. **Evokes traditional architecture** - Terracotta warmth
3. **Differentiation** - Not another blue real estate app
4. **Luxury positioning** - Premium without ostentation

## New Components

### HeroPropertyCard
Full-bleed immersive cards (75% width) with:
- Gradient overlay for text legibility
- Floating transaction badge + favorite button
- Spring animations on press
- Haptic feedback

### HeroPropertyList
Horizontal scrolling "Stories" style list:
- Snap-to-card behavior
- Pagination dots
- Smooth momentum scrolling

### AnimatedMeshGradient
Living background with 4 floating gradient orbs:
- Vine/sage colors
- Organic slow movement (8-15s cycles)
- Creates subtle depth

## Home Screen Layout

```
┌─────────────────────────────┐
│ Header                      │
│   - Greeting + Name         │
│   - Search toggle           │
│   - Location chip           │
├─────────────────────────────┤
│ Filter Pills (horizontal)   │
│   [All][Houses][Land]...    │
├─────────────────────────────┤
│ Featured Section            │
│   - Hero cards horizontal   │
│   - Pagination dots         │
├─────────────────────────────┤
│ Recent Section              │
│   - More property cards     │
└─────────────────────────────┘
```

## Animation Strategy

| Animation | Implementation | Purpose |
|-----------|---------------|---------|
| Page entrance | FadeInDown/FadeInUp | Smooth content reveal |
| Staggered items | delay(index * 50) | Elegant progressive load |
| Card press | withSpring (scale 0.97→1) | Responsive feedback |
| Filter pills | Immediate | Snappy interaction |
| Background | Continuous sine waves | Living app feel |

## Technical Stack

- **react-native-reanimated** - 60fps animations
- **expo-haptics** - Tactile feedback
- **expo-blur** - Glass effects
- **Ionicons** - Consistent iconography

## Build

```bash
npm run build:web
```

Output: `dist/` folder with export ready for deployment.

## Next Steps (To Make It "Real")

1. **Property Detail Screen** - Redesign with immersive gallery
2. **Search/Filters** - Bottom sheet with advanced options
3. **Map Integration** - Property pins with card preview
4. **Favorites Sync** - Real-time Supabase sync
5. **Booking Flow** - Appointment scheduling UI
6. **Agent Profiles** - Contact and messaging

---

Designed with ❤️ for luxury real estate in Moçambique.
