import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ConnectWallet } from './ConnectWallet';

const NavBar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  padding: 1rem 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;
const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;
const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${({ theme, $active }) => $active ? theme.colors.coral : theme.colors.text};
  font-weight: 600;
  font-size: 1.1rem;
  padding: 0.25rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ $active, theme }) => $active ? theme.colors.background : 'transparent'};
  transition: background 0.2s, color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.honey};
  }
`;

export function Navigation() {
  const location = useLocation();
  return (
    <NavBar>
      <NavLinks>
        <NavLink to="/" $active={location.pathname === '/'}>Home</NavLink>
        <NavLink to="/upload" $active={location.pathname === '/upload'}>Upload</NavLink>
        <NavLink to="/profile" $active={location.pathname === '/profile'}>Profile</NavLink>
      </NavLinks>
      <ConnectWallet />
    </NavBar>
  );
} 