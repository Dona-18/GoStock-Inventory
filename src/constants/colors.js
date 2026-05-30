export const lightColors = {
  primary: '#3B5BDB',
  primaryDark: '#2F4AC0',
  primaryLight: '#EEF2FF',
  primaryMid: '#C5D0FF',

  background: '#F5F6FA',
  card: '#FFFFFF',
  cardShadow: 'rgba(59, 91, 219, 0.08)',

  textPrimary: '#1A1A2E',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  textOnPrimary: '#FFFFFF',

  danger: '#FA5252',
  dangerLight: '#FFF0F0',
  warning: '#E65C00', // Rich warning orange
  warningLight: 'rgba(230, 92, 0, 0.06)', // Semi-transparent clean tint
  success: '#40C057',
  successLight: '#EBFBEE',

  border: '#E9ECEF',
  borderLight: '#F1F3F5',

  tabBar: '#FFFFFF',
  tabBarActive: '#3B5BDB',
  tabBarInactive: '#ADB5BD',

  splash: '#3B5BDB',

  // Chart / misc
  purple: '#7950F2',
  purpleLight: '#F3F0FF',
};

export const darkColors = {
  // Brand — brighter so it reads clearly on dark surfaces
  primary: '#748FFC',
  primaryDark: '#5C7CFA',
  // Icon/badge backgrounds — visible tinted surface, not near-black
  primaryLight: '#1A2660',
  primaryMid: '#2E42A0',

  // Three-level surface system for clear visual hierarchy
  background: '#0C0D1A',   // Deepest — screen background
  card: '#14162B',         // Mid — cards, list items (distinct from bg)
  cardShadow: 'rgba(0, 0, 0, 0.6)',

  textPrimary: '#EEF0FF',      // Near-white with cool tint — crisp & clear
  textSecondary: '#8E9CC9',    // Readable mid-tone — not washed out
  textMuted: '#5C6694',        // Clearly tertiary, still readable
  textOnPrimary: '#FFFFFF',

  // Semantic colours — vivid enough to read on dark card (#14162B)
  danger: '#FF6B6B',
  dangerLight: '#2E1119',      // Tinted deep red — clearly coloured
  warning: '#FFB347',          // Warm amber — readable on dark
  warningLight: 'rgba(255,179,71,0.13)',
  success: '#6BCB7F',          // Bright green — pops on dark
  successLight: '#0A2416',     // Deep green tint — visible

  // Borders — clearly defined separators
  border: '#252847',
  borderLight: '#1B1E3A',

  tabBar: '#14162B',
  tabBarActive: '#748FFC',
  tabBarInactive: '#434770',

  splash: '#3B5BDB',

  // Chart / misc
  purple: '#9775FA',
  purpleLight: '#1E1645',
};

// Fallback — always light for non-hook contexts
export const Colors = lightColors;
