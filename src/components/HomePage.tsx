import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';

const COIN_V4_FACTORY = '0x777777751622c0d3258f214F9DF38E35BF45baF3';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
console.log('alchemyId:', alchemyId);
const alchemyUrl = `https://base-sepolia.g.alchemy.com/v2/${alchemyId}`;
console.log('alchemyUrl:', alchemyUrl);
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(alchemyUrl),
});

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  padding: 2rem;
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
const VideoModalBg = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const VideoModal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Video = styled.video`
  width: 100%;
  max-width: 600px;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const BLOCK_LOOKBACK = 100000n;

export function HomePage() {
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
    console.log('HomePage useEffect running');
    async function fetchCoins() {
      console.log('fetchCoins called');
      setLoading(true);
      try {
        console.log('Calling publicClient.getBlockNumber()');
        let latestBlock;
        try {
          latestBlock = await publicClient.getBlockNumber();
          console.log('latestBlock:', latestBlock);
        } catch (err) {
          console.error('Error in getBlockNumber:', err);
          throw err;
        }
        const fromBlock = latestBlock > BLOCK_LOOKBACK ? latestBlock - BLOCK_LOOKBACK : 0n;
        const batchSize = 500n;
        let logs: unknown[] = [];
        // Throttled metadata fetch
        const coinsWithMeta: Array<{
          address: string;
          creator: string;
          name: string;
          symbol: string;
          uri: string;
          metadata: { image: string; animation_url: string; [key: string]: unknown } | null;
        }> = [];
        for (let start = fromBlock; start <= latestBlock; start += batchSize) {
          const end = (start + batchSize - 1n) < latestBlock ? (start + batchSize - 1n) : latestBlock;
          console.log('Fetching logs from', start, 'to', end);
          const batchLogs = await publicClient.getLogs({
            address: COIN_V4_FACTORY,
            event: parseAbiItem('event CoinCreated(address indexed coin, address indexed creator, string name, string symbol, string uri, uint256 initialSupply, uint256 maxSupply)'),
            fromBlock: start,
            toBlock: end,
          });
          console.log('Fetched', batchLogs.length, 'logs in this batch');
          logs = logs.concat(batchLogs);
        }
        console.log('Total logs fetched:', logs.length);
        console.log('Logs:', logs);
        for (const log of logs) {
          console.log('Raw log:', log);
          const { args } = log as { args: { coin: string; creator: string; name: string; symbol: string; uri: string; initialSupply: bigint; maxSupply: bigint } };
          console.log('Log args:', args);
          if (!args || !args.coin || !args.creator || !args.name || !args.symbol || !args.uri) {
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
          // Throttle requests to avoid rate limiting
          await new Promise(res => setTimeout(res, 200));
        }
        // Restore video coin filtering
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
      } catch (err) {
        console.error('Failed to fetch coins:', err);
        setCoins([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCoins();
  }, []);

  return (
    <div>
      <h1 style={{textAlign: 'center', marginTop: '2rem'}}>Latest Clips</h1>
      {loading ? (
        <p style={{textAlign: 'center'}}>Loading...</p>
      ) : (
        <Grid>
          {coins.map((coin, idx) => (
            coin.metadata ? (
              <Card key={coin.address + idx}>
                <Thumbnail src={coin.metadata.image} alt={coin.name} />
                <Title>{coin.name}</Title>
                <p style={{fontSize: '0.9rem', color: '#aaa', margin: 0}}>by {coin.creator.slice(0, 6)}...{coin.creator.slice(-4)}</p>
                <PlayButton onClick={() => setSelected(coin)}>Play</PlayButton>
              </Card>
            ) : null
          ))}
        </Grid>
      )}
      {selected && selected.metadata && (
        <VideoModalBg onClick={() => setSelected(null)}>
          <VideoModal onClick={e => e.stopPropagation()}>
            <h2>{selected.name}</h2>
            <Video controls src={selected.metadata.animation_url} poster={selected.metadata.image} />
            <PlayButton onClick={() => setSelected(null)} style={{marginTop: '1rem'}}>Close</PlayButton>
          </VideoModal>
        </VideoModalBg>
      )}
    </div>
  );
} 