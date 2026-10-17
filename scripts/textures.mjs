// Generates the walnut and leather textures in docs/assets/. Run once: node scripts/textures.mjs
import sharp from 'sharp';
import path from 'node:path';

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../docs/assets');

// Walnut: long horizontal grain, warm and dark. Shown with background-size: cover (no tiling).
const walnut = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1400">
  <filter id="g" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.07" numOctaves="4" seed="7" stitchTiles="stitch" result="n"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.004" numOctaves="2" seed="2" stitchTiles="stitch" result="w"/>
    <feDisplacementMap in="n" in2="w" scale="34" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="d" type="matrix" values="
      0 0 0 0 0.24
      0 0 0 0 0.15
      0 0 0 0 0.09
      1.8 0 0 0 -0.62"/>
  </filter>
  <filter id="f" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0012 0.42" numOctaves="2" seed="3" stitchTiles="stitch" result="n"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.004" numOctaves="2" seed="2" stitchTiles="stitch" result="w"/>
    <feDisplacementMap in="n" in2="w" scale="34" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feColorMatrix in="d" type="matrix" values="
      0 0 0 0 0.09
      0 0 0 0 0.05
      0 0 0 0 0.03
      0 0 0 1.6 -0.70"/>
  </filter>
  <rect width="100%" height="100%" fill="#2a1c13"/>
  <rect width="100%" height="100%" filter="url(#g)"/>
  <rect width="100%" height="100%" filter="url(#f)"/>
</svg>`;

// Leather: fine pebbled grain as a neutral alpha overlay, reused for every cover colour.
const grain = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <filter id="p" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="11" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="
      0 0 0 0 0
      0 0 0 0 0
      0 0 0 0 0
      0 0 0 -2.2 1.25"/>
  </filter>
  <filter id="m" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="5" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="
      0 0 0 0 0
      0 0 0 0 0
      0 0 0 0 0
      0 0 0 0.9 -0.32"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#p)" opacity="0.32"/>
  <rect width="100%" height="100%" filter="url(#m)" opacity="0.5"/>
</svg>`;

// librsvg ignores stitchTiles, so make the tile seamless by cross-fading it with a
// half-offset copy of itself, one axis at a time.
async function seamless(svg, size) {
  const { data } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pass = (src, axis) => {
    const out = Buffer.alloc(src.length);
    const h = size / 2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const t = axis === 'x' ? x : y;
      const w = Math.sin((Math.PI * t) / size) ** 2;
      const sx = axis === 'x' ? (x + h) % size : x;
      const sy = axis === 'y' ? (y + h) % size : y;
      const a = (y * size + x) * 4, b = (sy * size + sx) * 4;
      for (let c = 0; c < 4; c++) out[a + c] = Math.round(src[a + c] * w + src[b + c] * (1 - w));
    }
    return out;
  };
  return sharp(pass(pass(data, 'x'), 'y'), { raw: { width: size, height: size, channels: 4 } });
}

await sharp(Buffer.from(walnut)).extract({ left: 100, top: 100, width: 2000, height: 1200 }).webp({ quality: 80 }).toFile(path.join(OUT, 'walnut.webp'));
await (await seamless(grain, 512)).png({ compressionLevel: 9, palette: false }).toFile(path.join(OUT, 'leather.png'));
console.log('textures written');
