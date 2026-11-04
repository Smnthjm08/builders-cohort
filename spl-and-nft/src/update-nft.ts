import { fetchAsset, update } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { umi } from "./index";

umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz",
    providerUrl: "https://api.devnet.solana.com",
  }),
);

const IMAGE = "https://gateway.irys.xyz/Biuxrwa4Pgkhw6TnvfbSHeaRCWzpEZ7mTytC8EM13oUX";
const NEW_NAME = "Rainy Voxel Island (Updated)";

// 1. new metadata json, same image
const newUri = await umi.uploader.uploadJson({
  name: NEW_NAME,
  description: "Updated: the rain keeps falling on the voxel island.",
  image: IMAGE,
  attributes: [
    { trait_type: "weather", value: "rain" },
    { trait_type: "version", value: "2" },
  ],
  properties: { files: [{ uri: IMAGE, type: "image/png" }] },
});
console.log("new metadata uri:", newUri);

// 2. update on-chain (we are the update authority)
const asset = await fetchAsset(umi, publicKey("DntDYs4B6sNBME9HeM1QC3zETv6kABe9DrwyYX5KqtyR"));
const { signature } = await update(umi, { asset, name: NEW_NAME, uri: newUri }).sendAndConfirm(umi);
console.log("update tx:", base58.deserialize(signature)[0]);

// 3. verify
const assest = await fetchAsset(umi, asset.publicKey);
console.log("now:", assest.name, "|", assest.uri);
