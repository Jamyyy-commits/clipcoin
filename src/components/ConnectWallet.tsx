import { ConnectKitButton } from 'connectkit';
import styled from 'styled-components';

const WalletContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
`;

export function ConnectWallet() {
  return (
    <WalletContainer>
      <ConnectKitButton />
    </WalletContainer>
  );
} 