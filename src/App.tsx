import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';
import { GlobalStyle } from './globalStyles';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { UploadClip } from './components/UploadClip';
import { ProfilePage } from './components/ProfilePage';
import { Web3Provider } from './web3provider';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Web3Provider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navigation />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/upload" element={<UploadClip />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
      </div>
      </div>
        </BrowserRouter>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
