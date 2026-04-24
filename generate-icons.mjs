import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sourcePath = join(process.env.HOME, "downloads", "Gemini_Generated_Image_1xf2471xf2471xf2.png");
const iconsDir = join(process.cwd(), "src-tauri", "icons");

async function generateIcons() {
  console.log("Source:", sourcePath);
  console.log("Target:", iconsDir);

  if (!existsSync(sourcePath)) {
    console.error("Source image not found!");
    process.exit(1);
  }

  const sizes = [
    { name: "32x32.png", size: 32 },
    { name: "128x128.png", size: 128 },
    { name: "128x128@2x.png", size: 256 },
    { name: "icon.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    await sharp(sourcePath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(iconsDir, name));
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate favicon
  await sharp(sourcePath)
    .resize(32, 32, { fit: "contain" })
    .png()
    .toFile(join(iconsDir, "favicon.png"));
  console.log("✓ Generated favicon.png");

  // Generate .ico (multi-size)
  const pngToIco = (await import("png-to-ico")).default;
  const icoBuffer = await pngToIco([
    join(iconsDir, "32x32.png"),
    join(iconsDir, "128x128.png"),
    join(iconsDir, "icon.png"),
  ]);
  writeFileSync(join(iconsDir, "icon.ico"), icoBuffer);
  console.log("✓ Generated icon.ico");

  console.log("\n✅ All icons generated!");
  console.log("\nNext steps:");
  console.log("1. Generate .icns: iconutil -c icns -o src-tauri/icons/icon.icns src-tauri/icons/icon.iconset");
  console.log("   (Or use: npm run tauri build — it will auto-generate)");
}

generateIcons().catch(console.error);
