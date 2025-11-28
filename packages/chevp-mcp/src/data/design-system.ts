import type { DesignSystem, CategoryConfig } from '../types/design-system.js';

export const designSystem: DesignSystem = {
  colors: {
    arctic: {
      '50': '#f0f9ff',
      '100': '#e0f2fe',
      '200': '#bae6fd',
      '300': '#7dd3fc',
      '400': '#38bdf8',
      '500': '#0ea5e9',
      '600': '#0284c7',
      '700': '#0369a1',
      '800': '#075985',
      '900': '#0c4a6e',
    },
    categoryColors: {
      blue: { gradient: 'from-blue-500 to-blue-600', text: 'text-blue-400', border: 'border-blue-500/20' },
      green: { gradient: 'from-green-500 to-green-600', text: 'text-green-400', border: 'border-green-500/20' },
      purple: { gradient: 'from-purple-500 to-purple-600', text: 'text-purple-400', border: 'border-purple-500/20' },
      orange: { gradient: 'from-orange-500 to-orange-600', text: 'text-orange-400', border: 'border-orange-500/20' },
      red: { gradient: 'from-red-500 to-red-600', text: 'text-red-400', border: 'border-red-500/20' },
      pink: { gradient: 'from-pink-500 to-pink-600', text: 'text-pink-400', border: 'border-pink-500/20' },
      indigo: { gradient: 'from-indigo-500 to-indigo-600', text: 'text-indigo-400', border: 'border-indigo-500/20' },
      cyan: { gradient: 'from-cyan-500 to-cyan-600', text: 'text-cyan-400', border: 'border-cyan-500/20' },
      teal: { gradient: 'from-teal-500 to-teal-600', text: 'text-teal-400', border: 'border-teal-500/20' },
      amber: { gradient: 'from-amber-500 to-amber-600', text: 'text-amber-400', border: 'border-amber-500/20' },
      lime: { gradient: 'from-lime-500 to-lime-600', text: 'text-lime-400', border: 'border-lime-500/20' },
    },
    semantic: {
      background: 'bg-slate-950',
      surface: 'glass', // rgba(255, 255, 255, 0.05) with backdrop-filter
      border: 'border-slate-700/50',
      text: {
        primary: 'text-slate-100',
        secondary: 'text-slate-300',
        muted: 'text-slate-400',
      },
      accent: 'text-blue-400',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  components: {
    card: {
      glass: 'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1);',
      hover: 'transform: translateY(-2px); border-color: rgba(59, 130, 246, 0.5); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);',
      border: 'rounded-xl border border-slate-700/50',
    },
    button: {
      filter: 'padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.7);',
      filterActive: 'background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.5); color: #60a5fa;',
    },
    squircle: {
      small: 'M 0.5 0 C 0.9 0, 1 0.1, 1 0.5 C 1 0.9, 0.9 1, 0.5 1 C 0.1 1, 0 0.9, 0 0.5 C 0 0.1, 0.1 0, 0.5 0',
    },
  },
  layout: {
    maxWidth: '1400px',
    gridColumns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  },
};

export const categoryConfig: Record<string, CategoryConfig> = {
  'Projects': { icon: 'star', color: 'blue' },
  'Assets': { icon: 'inventory_2', color: 'green' },
  'Data': { icon: 'database', color: 'purple' },
  'Development': { icon: 'code', color: 'orange' },
  'Engine': { icon: 'settings', color: 'red' },
  'Frameworks': { icon: 'view_in_ar', color: 'pink' },
  'Gaming': { icon: 'sports_esports', color: 'indigo' },
  'Graphics': { icon: 'brush', color: 'cyan' },
  'Platform': { icon: 'cloud', color: 'teal' },
  'Tools': { icon: 'build', color: 'amber' },
  'Web': { icon: 'language', color: 'lime' },
};

export const materialIcons = [
  'star', 'inventory_2', 'database', 'code', 'settings', 'view_in_ar',
  'sports_esports', 'brush', 'cloud', 'build', 'language', 'folder',
  'category', 'search', 'filter_list', 'open_in_new', 'search_off',
];

export const availableColors = [
  'blue', 'green', 'purple', 'orange', 'red', 'pink',
  'indigo', 'cyan', 'teal', 'amber', 'lime',
];
