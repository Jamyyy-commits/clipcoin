# 🎬 ClipCoin

ClipCoin is a short-form video platform where every uploaded video becomes a tokenized **creator coin**. Fans can invest in the next viral video, and creators can earn from their content through on-chain monetization.

## 🚀 Inspiration

I am inspired by TikTok’s explosive creator ecosystem and Zora's powerful coin infrastructure. What if creators could tokenize every video and build a market around their creative content? That’s what ClipCoin does — it transforms short-form videos into investable assets powered by Zora's CoinV4.

## 🔧 Built With

- **Zora SDK** (`@zoralabs/coins-sdk`) – for minting creator coins and interacting with the CoinV4 contract
- **Wagmi & ConnectKit** – for Ethereum wallet authentication and connection
- **React + TypeScript** – frontend
- **IPFS via Pinata** – for decentralized video storage
- **Tailwind CSS** – simple UI with dark theme

## ⚙️ Zora Integration

We use the Zora SDK to:
- Mint a new coin for each uploaded video using `createCoin`
- Tie the coin metadata to the uploaded video on IPFS
- Let users see the coin address and invest in creator coins

### 💻 Relevant Code:
- [`src/utils/mint.ts`](./src/utils/mint.ts) — where the Zora coin is created
- [`pages/upload.tsx`](./pages/upload.tsx) — UI to upload video and mint coin
- [`pages/explore.tsx`](./pages/explore.tsx) — display minted ClipCoins

## ✨ Features

- 🎥 Upload short videos
- 🪙 Mint a coin for each video via Zora
- 🧑‍🎨 View all minted videos and their coins
- 🔐 Connect your wallet to mint or invest
- 🌑 Clean dark-themed UI with soft light accents

## 📦 Running Locally

```bash
git clone https://github.com/jamyyy-commits/clipcoin.git
cd clipcoin
npm install
npm run dev
