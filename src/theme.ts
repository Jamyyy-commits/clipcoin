import 'styled-components';

export const theme = {
  colors: {
    background: '#18181b',
    surface: '#232326',
    text: '#f4f4f5',
    coral: '#ff6f61',
    honey: '#ffd166',
    mint: '#4de1b3',
    card: '#232326',
    border: '#28282d',
    accent: '#ff6f61', // coral as main accent
  },
  borderRadius: '16px',
  font: {
    family: 'Inter, sans-serif',
    weight: 400,
    headingWeight: 700,
  },
};

declare module 'styled-components' {
  type Theme = typeof theme;
  export interface DefaultTheme extends Theme {
    // This dummy property ensures the interface is not empty
    _dummy?: never;
  }
} 