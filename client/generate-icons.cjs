/* eslint-disable no-undef */
// client/generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, 'public');

// Create a simple colored square as placeholder
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb"/>
  <text x="50%" y="50%" font-size="200" font-family="Arial, sans-serif" 
        fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
    BAF
  </text>
</svg>
`;

async function generateIcons() {
  for (const size of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated icon-${size}x${size}.png`);
  }
  console.log('All icons generated!');
}

generateIcons().catch(console.error);