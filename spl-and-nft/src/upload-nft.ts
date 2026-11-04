import { createGenericFile } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { umi } from "./index";

// explicit devnet node: the default points at mainnet
umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz",
    providerUrl: "https://api.devnet.solana.com",
  }),
);

// 1. image
const bytes = await Bun.file("nft-resized.png").arrayBuffer();
const [imageUri] = await umi.uploader.upload([
  createGenericFile(new Uint8Array(bytes), "nft.png", { contentType: "image/png" }),
]);
console.log("image uri:", imageUri);

// 2. metadata json (this uri is what the NFT stores on-chain)
const metadataUri = await umi.uploader.uploadJson({
  name: "Rainy Voxel Island",
  description: "A voxel island in the rain. Turbin3 week 1 assignment.",
  image: imageUri,
  attributes: [{ trait_type: "weather", value: "rain" }],
  properties: { files: [{ uri: imageUri, type: "image/png" }] },
});
console.log("metadata uri:", metadataUri);
