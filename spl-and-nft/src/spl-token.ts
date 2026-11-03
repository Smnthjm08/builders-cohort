import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import {
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";

const payer = Keypair.fromSecretKey(
  Uint8Array.from(await Bun.file("wallet.json").json()),
);

const mintAuthority = Keypair.fromSecretKey(
  Uint8Array.from(await Bun.file("wallet.json").json()),
);

const freezeAuthority = Keypair.fromSecretKey(
  Uint8Array.from(await Bun.file("wallet.json").json()),
);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const mint = await createMint(
  connection,
  payer,
  mintAuthority.publicKey,
  freezeAuthority.publicKey,
  9,
);

console.log("=======", mint.toBase58());

const mintInfo = await getMint(connection, mint);

console.log("mint info", mintInfo.address.toBase58());

const ata = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,
  payer.publicKey,
);

console.log(">>>>>>", ata.address.toBase58());

await mintTo(
  connection,
  payer,
  mint,
  ata.address,
  mintAuthority,
  100n * 10n ** 9n,
);

const toWallet = Keypair.fromSecretKey(
  Uint8Array.from(await Bun.file("rec-wallet.json").json()),
);

const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, toWallet.publicKey);

const transferSignature = await transfer(
  connection,
  payer,
  ata.address,
  toTokenAccount.address,
  payer,
  50n * 10n ** 9n,
);

console.log("transfer tx:", transferSignature);