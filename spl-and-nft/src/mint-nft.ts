import { create } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { umi } from "./index";

const asset = generateSigner(umi); // its public key becomes the NFT address

const { signature } = await create(umi, {
  asset,
  name: "Rainy Voxel Island",
  uri: "https://gateway.irys.xyz/J5nqMkE8AUuiWNdMw6DFhWoDLYYsrpL2EMRgQD8x9drD",
}).sendAndConfirm(umi);

console.log("asset:", asset.publicKey);
console.log("tx:", base58.deserialize(signature)[0]);
