import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const iconsDir = "./src-tauri/icons";

async function generateIcons() {
  const svg = readFileSync(join(iconsDir, "icon.svg"));
  
  const sizes = [
    { name: "32x32.png", size: 32 },
    { name: "128x128.png", size: 128 },
    { name: "128x128@2x.png", size: 256 },
    { name: "icon.png", size: 512 },
  ];
  
  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, name));
    console.log(`Generated ${name}`);
  }
  
  const faviconSvg = readFileSync(join(iconsDir, "favicon.svg"));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(join(iconsDir, "32x32.png"));
  console.log("Generated favicon PNG");
  
  console.log("All icons generated!");
}

generateIcons().catch(console.error);