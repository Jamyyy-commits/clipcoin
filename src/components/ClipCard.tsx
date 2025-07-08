import styled from 'styled-components';

const Card = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 1.5rem;
  padding: 1rem;
`;
const Video = styled.video`
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius};
`;
const Title = styled.h2`
  margin: 0.5rem 0 0.25rem 0;
`;
const Creator = styled.div`
  color: ${({ theme }) => theme.colors.mint};
  font-size: 0.95rem;
`;
const CoinValue = styled.div`
  color: ${({ theme }) => theme.colors.honey};
  font-weight: 600;
  margin-top: 0.5rem;
`;

export function ClipCard({ title, creator, coinValue, videoUrl }: { title: string, creator: string, coinValue: number, videoUrl: string }) {
  return (
    <Card>
      <Video controls src={videoUrl} />
      <Title>{title}</Title>
      <Creator>By {creator}</Creator>
      <CoinValue>Coin Value: {coinValue}</CoinValue>
    </Card>
  );
} 