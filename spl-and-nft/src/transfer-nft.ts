import { fetchAsset, transfer } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { umi } from "./index";

const ASSET = "DntDYs4B6sNBME9HeM1QC3zETv6kABe9DrwyYX5KqtyR";
const NEW_OWNER = "2wYdsBFKruNSSYNiZLMKJi3yHm3PkQVZzN99AJUSpL3V"; // rec

const asset = await fetchAsset(umi, publicKey(ASSET));
console.log("owner before:", asset.owner);

const { signature } = await transfer(umi, {
  asset,
  newOwner: publicKey(NEW_OWNER),
}).sendAndConfirm(umi);
console.log("signature", signature);
console.log("transfer tx:", base58.deserialize(signature)[0]);

const after = await fetchAsset(umi, asset.publicKey);
console.log("owner after: ", after.owner);
