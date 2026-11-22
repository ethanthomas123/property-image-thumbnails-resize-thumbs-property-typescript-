import { strict as assert } from "node:assert";
import { thumbnailSize } from "./thumbnail_decision.ts";

const input = { propertyType: "inspection", image: "base64-image" };
assert.deepEqual(thumbnailSize(input.propertyType), { width: 800, height: 600 });
console.log("inspection images use the 800x600 thumbnail policy");
