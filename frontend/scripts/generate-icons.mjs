// Genera los iconos PNG de la PWA a partir de un SVG (cruz médica sobre fondo teal).
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#00796b"/>
  <rect x="216" y="116" width="80" height="280" rx="20" fill="#ffffff"/>
  <rect x="116" y="216" width="280" height="80" rx="20" fill="#ffffff"/>
</svg>`;

mkdirSync('public', { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/pwa-${size}.png`);
  console.log(`public/pwa-${size}.png generado`);
}
