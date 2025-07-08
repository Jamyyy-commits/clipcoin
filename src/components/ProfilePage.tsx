import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAccount } from 'wagmi';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';

const COIN_V4_FACTORY = '0x777777751622c0d3258f214F9DF38E35BF45baF3';
const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
const alchemyUrl = `https://base-sepolia.g.alchemy.com/v2/${alchemyId}`;
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(alchemyUrl),
});

const PageWrapper = styled.div`
  min-height: 80vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ProfileContainer = styled.div`
  max-width: 600px;
  width: 100%;
  padding: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
`;
const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Thumbnail = styled.img`
  width: 100%;
  max-width: 320px;
  border-radius: ${({ theme }) => theme.borderRadius};
  margin-bottom: 1rem;
`;
const Title = styled.h2`
  font-size: 1.2rem;
  margin: 0.5rem 0 0.25rem 0;
  text-align: center;
`;
const PlayButton = styled.button`
  margin-top: 0.5rem;
  background: ${({ theme }) => theme.colors.coral};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.honey};
    color: ${({ theme }) => theme.colors.background};
  }
`;
const Video = styled.video`
  width: 100%;
  max-width: 600px;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const BLOCK_LOOKBACK = 100000n;

export function ProfilePage() {
  const { address } = useAccount();
  const [coins, setCoins] = useState<Array<{
    address: string;
    creator: string;
    name: string;
    symbol: string;
    uri: string;
    metadata: {
      image: string;
      animation_url: string;
      [key: string]: unknown;
    } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{
    address: string;
    creator: string;
    name: string;
    symbol: string;
    uri: string;
    metadata: {
      image: string;
      animation_url: string;
      [key: string]: unknown;
    } | null;
  } | null>(null);

  useEffect(() => {
    if (!address) {
      setCoins([]);
      setLoading(false);
      return;
    }
    async function fetchCoins() {
      setLoading(true);
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > BLOCK_LOOKBACK ? latestBlock - BLOCK_LOOKBACK : 0n;
        const batchSize = 500n;
        let logs: unknown[] = [];
        for (let start = fromBlock; start <= latestBlock; start += batchSize) {
          const end = (start + batchSize - 1n) < latestBlock ? (start + batchSize - 1n) : latestBlock;
          const batchLogs = await publicClient.getLogs({
            address: COIN_V4_FACTORY,
            event: parseAbiItem('event CoinCreatedV4(address indexed coin, address indexed creator, string name, string symbol, string uri, uint256 initialSupply, uint256 maxSupply)'),
            fromBlock: start,
            toBlock: end,
          });
          logs = logs.concat(batchLogs);
        }
        const coinsWithMeta: Array<{
          address: string;
          creator: string;
          name: string;
          symbol: string;
          uri: string;
          metadata: { image: string; animation_url: string; [key: string]: unknown } | null;
        }> = [];
        for (const log of logs) {
          const { args } = log as { args: { coin: string; creator: string; name: string; symbol: string; uri: string; initialSupply: bigint; maxSupply: bigint } };
          if (!args || !args.coin || !args.creator || !args.name || !args.symbol || !args.uri) {
            continue;
          }
          // Only include coins created by the connected address
          if (!address || args.creator.toLowerCase() !== address.toLowerCase()) {
            continue;
          }
          let metadata = null;
          try {
            if (args.uri) {
              const res = await fetch(args.uri);
              metadata = await res.json();
            }
          } catch {
            metadata = null;
          }
          coinsWithMeta.push({
            address: args.coin as string,
            creator: args.creator as string,
            name: args.name as string,
            symbol: args.symbol as string,
            uri: args.uri as string,
            metadata,
          });
          await new Promise(res => setTimeout(res, 200));
        }
        // Filter for video coins
        const filtered = coinsWithMeta
          .filter((c): c is {
            address: string;
            creator: string;
            name: string;
            symbol: string;
            uri: string;
            metadata: { [key: string]: unknown; image: string; animation_url: string; } | null;
          } =>
            !!c &&
            !!c.metadata &&
            typeof c.metadata.animation_url === 'string' &&
            (
              c.metadata.animation_url.endsWith('.mp4') ||
              c.metadata.animation_url.endsWith('.webm') ||
              c.metadata.animation_url.endsWith('.mov') ||
              c.metadata.animation_url.endsWith('.ogg')
            ) &&
            typeof c.metadata.image === 'string'
          );
        setCoins(filtered);
      } catch {
        setCoins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCoins();
  }, [address]);

  return (
    <PageWrapper>
      <ProfileContainer>
        <h1>Your Profile</h1>
        {loading ? (
          <p style={{color: '#4de1b3'}}>Loading your coins...</p>
        ) : coins.length === 0 ? (
          <p style={{color: '#4de1b3'}}>No video coins minted yet. Upload your first clip!</p>
        ) : (
          <Grid>
            {coins.map((coin, idx) => (
              coin.metadata ? (
                <Card key={coin.address + idx}>
                  <Thumbnail src={coin.metadata.image} alt={coin.name} />
                  <Title>{coin.name}</Title>
                  <p style={{fontSize: '0.9rem', color: '#aaa', margin: 0}}>by you</p>
                  <PlayButton onClick={() => setSelected(coin)}>Play</PlayButton>
                </Card>
              ) : null
            ))}
          </Grid>
        )}
        {selected && selected.metadata && (
          <div style={{marginTop: '2rem'}}>
            <h2>{selected.name}</h2>
            <Video controls src={selected.metadata.animation_url} poster={selected.metadata.image} />
            <PlayButton onClick={() => setSelected(null)} style={{marginTop: '1rem'}}>Close</PlayButton>
          </div>
        )}
      </ProfileContainer>
    </PageWrapper>
  );
} 