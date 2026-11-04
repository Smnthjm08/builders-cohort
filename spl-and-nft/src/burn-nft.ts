import { burn, create, fetchAsset } from "@metaplex-foundation/mpl-core";
import {
  createSignerFromKeypair,
  generateSigner,
} from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { umi } from "./index";

const rec = createSignerFromKeypair(
  umi,
  umi.eddsa.createKeypairFromSecretKey(
    Uint8Array.from(await Bun.file("rec-wallet.json").json()),
  ),
);
const bal = async (pk: typeof rec.publicKey) =>
  (await umi.rpc.getBalance(pk)).basisPoints;
const snap = async () => ({
  payer: await bal(umi.identity.publicKey),
  rec: await bal(rec.publicKey),
});

const spareNFT = generateSigner(umi);

await create(umi, {
  asset: spareNFT,
  name: "spareNFT NFT burn",
  uri: "https://gateway.irys.xyz/J5nqMkE8AUuiWNdMw6DFhWoDLYYsrpL2EMRgQD8x9drD",
  owner: rec.publicKey,
}).sendAndConfirm(umi);
console.log("spare asset:", spareNFT.publicKey);

const before = await snap();
console.log("owner:", (await fetchAsset(umi, spareNFT.publicKey)).owner);

const { signature } = await burn(umi, {
  asset: await fetchAsset(umi, spareNFT.publicKey),
  authority: rec,
}).sendAndConfirm(umi);
console.log("burn tx:", base58.deserialize(signature)[0]);

const gone = await umi.rpc.getAccount(spareNFT.publicKey);
console.log("account exists after burn:", gone.exists);

const after = await snap();
console.log(
  "lamports change  payer(wallet.json):",
  after.payer - before.payer,
  " rec-wallet:",
  after.rec - before.rec,
);
