import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.family};
    margin: 0;
    padding: 0;
    min-height: 100vh;
    letter-spacing: 0.01em;
    transition: background 0.2s, color 0.2s;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.font.headingWeight};
    margin: 0 0 0.5em 0;
  }
  a {
    color: ${({ theme }) => theme.colors.coral};
    text-decoration: none;
  }
`; 