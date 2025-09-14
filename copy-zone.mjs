import { mkdir, copyFile } from "fs/promises";
import path from "path";

const src = path.resolve("node_modules/zone.js/fesm2015/zone.min.js");
const destDir = path.resolve("public");
const dest = path.join(destDir, "zone.min.js");

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);
