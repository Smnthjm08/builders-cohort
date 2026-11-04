# Week 1: SPL token and MPL Core NFT

Everything runs on **Solana devnet** with [Bun](https://bun.com). All five tasks (3 required, 2 extension) are done and were checked on-chain.

## Setup

```bash
bun install
```

Two keypair files are needed in this folder. They are gitignored and never committed:

- `wallet.json`: main wallet. It pays fees, mints, and is the NFT update authority. Needs devnet SOL.
- `rec-wallet.json`: second wallet, used as the recipient.

```bash
solana-keygen new -o wallet.json --no-bip39-passphrase
solana-keygen new -o rec-wallet.json --no-bip39-passphrase
solana transfer $(solana address -k wallet.json) 2 --allow-unfunded-recipient   # fund from your CLI wallet, or use an airdrop
```

## Wallets

| File              | Address                                        |
| ----------------- | ---------------------------------------------- |
| `wallet.json`     | `7234Lc3Gjxpjbqt3yXUSKZqVdNLtCJUVs6RgjKtXpsB9` |
| `rec-wallet.json` | `2wYdsBFKruNSSYNiZLMKJi3yHm3PkQVZzN99AJUSpL3V` |

## Results

Links are on Solana Explorer, devnet cluster.

### Task 1: mint and transfer an SPL token

Script: [src/spl-token.ts](src/spl-token.ts). Classic Token program, 9 decimals. Minted 100 tokens, transferred 50 to `rec-wallet`. Final balances: 50 and 50.

- Mint: [`FJgKVuxaBD3aCEKzxXny39eNaLW4jUuN6C3Zhot2wfCq`](https://explorer.solana.com/address/FJgKVuxaBD3aCEKzxXny39eNaLW4jUuN6C3Zhot2wfCq?cluster=devnet)
- Transfer tx: [`3HKSxbAACCzhijXm6cTautc7sR2N8vtNcKdT7kJ4kmZM1BRDg1ynttLK9L8z5UHgWLwjVMai3BbYfSGqKZT4iynR`](https://explorer.solana.com/tx/3HKSxbAACCzhijXm6cTautc7sR2N8vtNcKdT7kJ4kmZM1BRDg1ynttLK9L8z5UHgWLwjVMai3BbYfSGqKZT4iynR?cluster=devnet)

### Task 2: mint an NFT with MPL Core

Scripts: [src/upload-nft.ts](src/upload-nft.ts) uploads the image and metadata JSON to Irys (devnet), then [src/mint-nft.ts](src/mint-nft.ts) creates the asset.

- Asset: [`DntDYs4B6sNBME9HeM1QC3zETv6kABe9DrwyYX5KqtyR`](https://core.metaplex.com/explorer/DntDYs4B6sNBME9HeM1QC3zETv6kABe9DrwyYX5KqtyR?env=devnet)
- Mint tx: [`2yMXQz9dyT5Rz9TdN8eB85NT5G6HCshHeHS9t3wTz4pKAmkQ3TFcMbsj5ahNAi7AmMu8uGUMFEvCi6t54dGwFuKp`](https://explorer.solana.com/tx/2yMXQz9dyT5Rz9TdN8eB85NT5G6HCshHeHS9t3wTz4pKAmkQ3TFcMbsj5ahNAi7AmMu8uGUMFEvCi6t54dGwFuKp?cluster=devnet)
- Image: https://gateway.irys.xyz/Biuxrwa4Pgkhw6TnvfbSHeaRCWzpEZ7mTytC8EM13oUX
- Original metadata: https://gateway.irys.xyz/J5nqMkE8AUuiWNdMw6DFhWoDLYYsrpL2EMRgQD8x9drD

### Task 3: update name and metadata (update authority)

Script: [src/update-nft.ts](src/update-nft.ts). Name changed from "Rainy Voxel Island" to "Rainy Voxel Island (Updated)", URI points to a new metadata JSON.

- Update tx: [`5b4LCoLLtHpHaQabSZC4DHMvBaD8JcJar9Bqr72utCb8haTTvmfxxysK2ifRUnfUUNQYnL8ePt1NGmSB9vmAQWqt`](https://explorer.solana.com/tx/5b4LCoLLtHpHaQabSZC4DHMvBaD8JcJar9Bqr72utCb8haTTvmfxxysK2ifRUnfUUNQYnL8ePt1NGmSB9vmAQWqt?cluster=devnet)
- New metadata: https://gateway.irys.xyz/4gXU57GSEtUQnvSyot6nXGbKS6tQ3PiqPQtXJrJsJXpL

### Task 4 (extension): transfer ownership

Script: [src/transfer-nft.ts](src/transfer-nft.ts). Owner changed from `wallet.json` to `rec-wallet.json`. The update authority stays with `wallet.json`. **The main NFT is currently owned by `rec-wallet.json`.**

- Transfer tx: [`3U1CfimaV2WazNicVQESvzSEBCgRVLBSbQwj9YBud5E8VsTNGxTujfB6UMREXoo6oLD1dhLYxd3Ekf6YJzq6sQbw`](https://explorer.solana.com/tx/3U1CfimaV2WazNicVQESvzSEBCgRVLBSbQwj9YBud5E8VsTNGxTujfB6UMREXoo6oLD1dhLYxd3Ekf6YJzq6sQbw?cluster=devnet)

### Task 5 (extension): burn and reclaim rent

Script: [src/burn-nft.ts](src/burn-nft.ts). To keep the main NFT, the script mints a spare NFT owned by `rec-wallet`, then burns it with `rec-wallet` signing as owner.

- Spare asset: `Gjzm2vCcVNeYCsq5SbFTNZvpxrJcNQQnKgf86oRkcocZ`
- Burn tx: [`wzi8jMC7WXUCJ7LNhBZhZw1vUqVczQxdcaknFzPB5gfNKKepaBxAT6jLXxNobjmx1cTStp7vMAFyz1zn8UDGkHk`](https://explorer.solana.com/tx/wzi8jMC7WXUCJ7LNhBZhZw1vUqVczQxdcaknFzPB5gfNKKepaBxAT6jLXxNobjmx1cTStp7vMAFyz1zn8UDGkHk?cluster=devnet)

Observed on-chain: the asset account shrinks to a 1-byte stub, and the original payer (`wallet.json`) got back about 0.00081 SOL net of the fee. Part of the rent (about 0.00216 SOL) stays in the stub account, so the reclaim is partial.

## Notes

- Each run of `spl-token.ts`, `mint-nft.ts`, `update-nft.ts` and `burn-nft.ts` sends new transactions. `spl-token.ts` creates a new mint every time and `mint-nft.ts` a new NFT, so the addresses above are from one specific run. Don't rerun them if you want the results to stay as listed.
- Shared Umi setup (devnet RPC, `mplCore()`, wallet identity) lives in [src/index.ts](src/index.ts).
- Devnet storage on Irys is temporary, so the image and metadata links may expire.
