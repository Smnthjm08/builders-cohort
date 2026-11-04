import { mplCore } from "@metaplex-foundation/mpl-core";
import { createSignerFromKeypair, keypairIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

export const umi = createUmi("https://api.devnet.solana.com").use(mplCore());

const secret = Uint8Array.from(await Bun.file("wallet.json").json());
const signer = createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(secret));
umi.use(keypairIdentity(signer));

if (import.meta.main) console.log("identity:", umi.identity.publicKey);
