import { createVuetify } from 'vuetify';
import { pt } from 'vuetify/locale';

const dote = {
  dark: true,
  colors: {
    background: '#050505',
    surface: '#0C0C0C',
    'surface-bright': '#151515',
    'surface-variant': '#151515',
    'surface-light': '#131313',
    outline: '#1E1E1E',

    primary: '#39FF14',  
    'neon-300': '#9DFF85',  
    'neon-600': '#2BC40F',  
    'neon-800': '#1E7A0E',  
    'neon-950': '#0A2405',  
    secondary: '#2BC40F',  

    success: '#39FF14',  
    error: '#FF2E3A',  
    warning: '#E5FF00',  
    info: '#9DFF85',

    'on-background': '#EDEDED',
    'on-surface': '#EDEDED',
    'on-surface-bright': '#EDEDED',
    'on-surface-variant': '#7A7A7A',
    muted: '#7A7A7A',
    'on-primary': '#000000',
    'on-success': '#000000',
    'on-secondary': '#000000',
    'on-warning': '#000000',
    'on-error': '#000000',
    'on-neon-300': '#000000',
    'on-neon-950': '#9DFF85',
  },
  variables: {
    'border-color': '#1E1E1E',
    'border-opacity': 1,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.72,
    'disabled-opacity': 0.38,
    'hover-opacity': 0.05,
    'focus-opacity': 0.08,
    'selected-opacity': 0.06,
    'activated-opacity': 0.08,
    'pressed-opacity': 0.1,
  },
};

const doteClaro = {
  dark: false,
  colors: {
    background: '#F6F7F5',
    surface: '#FFFFFF',
    'surface-bright': '#F2F4F0',
    'surface-variant': '#F2F4F0',
    'surface-light': '#FFFFFF',
    outline: '#E1E4DE',

    primary: '#0B7A00',  
    'neon-300': '#126B07',  
    'neon-600': '#1A7F0C',  
    'neon-800': '#5FB04F',  
    'neon-950': '#E3F6DD',  
    secondary: '#1A7F0C',

    success: '#0B7A00',
    error: '#C4121F',
    warning: '#8A6A00',
    info: '#126B07',

    'on-background': '#161816',
    'on-surface': '#161816',
    'on-surface-bright': '#161816',
    'on-surface-variant': '#62675F',
    muted: '#62675F',
    'on-primary': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'on-error': '#FFFFFF',
    'on-neon-300': '#FFFFFF',
    'on-neon-950': '#0B4D05',
  },
  variables: {
    'border-color': '#E1E4DE',
    'border-opacity': 1,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.72,
    'disabled-opacity': 0.38,
    'hover-opacity': 0.04,
    'focus-opacity': 0.08,
  },
};

const campo = {
  variant: 'solo-filled',
  flat: true,
  rounded: 'sm',
  density: 'comfortable',
  color: 'primary',
  baseColor: 'muted',
  bgColor: 'surface-bright',
};

export default createVuetify({
  locale: { locale: 'pt', messages: { pt } },
  theme: {
    defaultTheme: 'dote',
    themes: { dote, doteClaro },
  },
  defaults: {
    VBtn: {
      rounded: 'sm',
      variant: 'flat',
    },
    VCard: {
      rounded: 'md',
      variant: 'flat',
      color: 'surface',
    },
    VTextField: campo,
    VSelect: campo,
    VChip: {
      rounded: 'sm',
      variant: 'flat',
      color: 'neon-950',
      size: 'small',
    },
    VProgressLinear: {
      color: 'neon-600',
      bgColor: 'neon-950',
      bgOpacity: 1,
      height: 6,
      rounded: true,
    },
    VList: {
      bgColor: 'surface',
    },
    VDivider: {
      color: 'outline',
      opacity: 1,
    },
    VDataTable: {
      density: 'comfortable',
      hover: true,
    },
  },
});
