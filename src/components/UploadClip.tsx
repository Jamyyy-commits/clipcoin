import { useState } from 'react';
import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import { useWalletClient, useAccount } from 'wagmi';
import { createCoin, DeployCurrency, type ValidMetadataURI } from '@zoralabs/coins-sdk';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const UploadContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;
const Preview = styled.video`
  width: 100%;
  margin-top: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
`;
const TitleInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;
const MintButton = styled.button`
  margin-top: 1.5rem;
  background: ${({ theme }) => theme.colors.coral};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.honey};
    color: ${({ theme }) => theme.colors.background};
  }
`;

const PageWrapper = styled.div`
  min-height: 80vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

// Helper to extract the first frame of a video file as a PNG Blob
async function extractFirstFrame(videoFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.currentTime = 0;
    video.onloadeddata = () => {
      // Wait for the first frame to be ready
      video.currentTime = 0;
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create thumbnail blob'));
        }, 'image/png');
      }, 100); // slight delay to ensure frame is rendered
    };
    video.onerror = () => reject(new Error('Failed to load video for thumbnail'));
  });
}

export function UploadClip() {
  const [video, setVideo] = useState<File|null>(null);
  const [title, setTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleMint() {
    if (!video || !title) return;
    setLoading(true);
    try {
      // 1. Upload video to Pinata IPFS
      const formData = new FormData();
      formData.append('file', video);
      const pinataJwt = import.meta.env.VITE_PINATA_JWT;
      if (!pinataJwt) throw new Error('Pinata JWT not set in .env');
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('IPFS upload failed');
      const data = await res.json();
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

      // 2. Extract first frame as thumbnail and upload to Pinata
      const thumbnailBlob = await extractFirstFrame(video);
      const thumbFormData = new FormData();
      thumbFormData.append('file', thumbnailBlob, 'thumbnail.png');
      const thumbRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pinataJwt}` },
        body: thumbFormData,
      });
      if (!thumbRes.ok) throw new Error('Thumbnail upload failed');
      const thumbData = await thumbRes.json();
      const thumbUrl = `https://gateway.pinata.cloud/ipfs/${thumbData.IpfsHash}`;

      // 3. Create metadata JSON and upload to Pinata IPFS
      const metadata = {
        name: title,
        description: `Clip uploaded to ClipCoin: ${title}`,
        image: thumbUrl, // Thumbnail image
        animation_url: ipfsUrl, // Video file
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFormData = new FormData();
      metadataFormData.append('file', metadataBlob, 'metadata.json');
      const metadataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pinataJwt}` },
        body: metadataFormData,
      });
      if (!metadataRes.ok) throw new Error('Metadata upload failed');
      const metadataData = await metadataRes.json();
      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataData.IpfsHash}`;

      if (!walletClient || !address) throw new Error('Wallet not connected or address missing');

      // Create a viem public client for Base Sepolia
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      // 4. Use metadataUrl as the metadata URI for minting
      console.log('Minting with config:', {
        name: title,
        symbol: 'CLIP',
        uri: metadataUrl,
        payoutRecipient: address,
        currency: DeployCurrency.ETH,
        chainId: 84532,
      });
      const result = await createCoin({
        name: title,
        symbol: 'CLIP',
        uri: metadataUrl as ValidMetadataURI,
        payoutRecipient: address,
        currency: DeployCurrency.ETH,
        chainId: 84532,
      }, walletClient, publicClient);
      console.log('createCoin result:', result);

      alert('Minted!');
    } catch (err) {
      alert('Minting failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageWrapper>
      <UploadContainer>
        <h1>Upload a Clip</h1>
        <input type="file" accept="video/*" onChange={handleVideoChange} />
        <TitleInput
          type="text"
          placeholder="Enter a title for your clip"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        {previewUrl && (
          <Preview controls src={previewUrl} />
        )}
        <MintButton onClick={handleMint} disabled={!video || !title || loading}>
          {loading ? 'Uploading...' : 'Mint Coin'}
        </MintButton>
      </UploadContainer>
    </PageWrapper>
  );
} 