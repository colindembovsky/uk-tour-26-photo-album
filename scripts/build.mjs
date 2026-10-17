// Builds docs/ (the GitHub Pages site) from photos/ + content.yml.
//   npm run build            -> process new/changed media, write docs/album.json
//   npm run build -- --force -> re-encode everything
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import exifr from 'exifr';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PHOTOS = path.join(ROOT, 'photos');
const DOCS = path.join(ROOT, 'docs');
const MEDIA = path.join(DOCS, 'media');
const CONTENT = path.join(ROOT, 'content.yml');
const CACHE_FILE = path.join(ROOT, '.build-cache.json');

const FORCE = process.argv.includes('--force');
const MIN_LONG_EDGE = 1200; // smaller files are treated as placeholders and skipped
const WIDTHS = [800, 1600, 2400];
const PORTRAIT_MAX_W = 1800;
const IMAGE_RE = /\.(jpe?g|png|webp|heic|tiff?)$/i;
const VIDEO_RE = /\.(mp4|mov|m4v)$/i;

const cache = fs.existsSync(CACHE_FILE) && !FORCE ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const warnings = [];
const warn = (m) => { warnings.push(m); };

const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .filter((e) => !e.name.startsWith('.'))
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

const slug = (rel) => rel.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

// Capture time in true UTC. Cameras disagree about time zones, so read the raw
// local timestamp and apply the camera's own recorded offset.
async function captureTime(file) {
  const base = path.basename(file);
  if (IMAGE_RE.test(file)) {
    try {
      const x = await exifr.parse(file, { pick: ['DateTimeOriginal', 'OffsetTimeOriginal', 'OffsetTime'], reviveValues: false });
      if (x?.DateTimeOriginal) {
        const [d, t] = String(x.DateTimeOriginal).split(' ');
        const off = x.OffsetTimeOriginal || x.OffsetTime || '+00:00';
        const ms = Date.parse(`${d.replace(/:/g, '-')}T${t}${off}`);
        if (!Number.isNaN(ms)) return ms;
      }
    } catch { /* fall through */ }
  }
  const m = base.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (m) return Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+01:00`);
  return null;
}

const outPath = (city, s, suffix) => path.join(MEDIA, city, `${s}${suffix}`);
const url = (p) => path.relative(DOCS, p).split(path.sep).join('/');

// Signature: ink from signature.jpeg becomes an alpha mask, tinted black or
// white per photo and laid into a bottom corner.
const SIGNATURE = path.join(ROOT, 'signature.jpeg');
const SIG_VERSION = 1;
const SIG_WIDTH = 0.24;   // of the photo's short edge
const SIG_MARGIN = 0.035; // of the photo's short edge
const SIG_OPACITY = 0.85;
const sigStamp = fs.existsSync(SIGNATURE) ? `sig${SIG_VERSION}-${Math.round(fs.statSync(SIGNATURE).mtimeMs)}` : 'nosig';
let sigMask;
async function signatureMask() {
  if (sigMask !== undefined) return sigMask;
  if (!fs.existsSync(SIGNATURE)) return (sigMask = null);
  // Ink → opaque, paper (and JPEG noise) → clear, with soft anti-aliased edges.
  const { data, info } = await sharp(await sharp(SIGNATURE).greyscale().negate().linear(1.5, -45).toBuffer())
    .trim({ threshold: 10 }).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  return (sigMask = { data, width: info.width, height: info.height });
}

const lum = ({ channels: c }) => 0.2126 * c[0].mean + 0.7152 * c[1].mean + 0.0722 * c[2].mean;
const busy = ({ channels: c }) => (c[0].stdev + c[1].stdev + c[2].stdev) / 3;

async function sign(raw, info, opts) {
  const mask = await signatureMask();
  if (!mask || opts.signature === 'none') return raw;
  const { width: W, height: H } = info;
  const short = Math.min(W, H);
  const sw = Math.round(short * SIG_WIDTH);
  const sh = Math.round(sw * mask.height / mask.width);
  const m = Math.round(short * SIG_MARGIN);
  const top = H - m - sh;
  const at = { left: m, right: W - m - sw };
  const region = (left) => sharp(raw, { raw: info }).extract({ left, top, width: sw, height: sh }).stats();
  const stats = { left: await region(at.left), right: await region(at.right) };

  // Prefer the right; move left only when that corner is clearly calmer.
  const side = opts.signature === 'left' || opts.signature === 'right' ? opts.signature
    : busy(stats.left) < busy(stats.right) * 0.75 ? 'left' : 'right';
  const ink = opts.ink === 'black' || opts.ink === 'white' ? opts.ink : lum(stats[side]) < 140 ? 'white' : 'black';
  const v = ink === 'white' ? 255 : 0;

  const alpha = await sharp(mask.data, { raw: { width: mask.width, height: mask.height, channels: 1 } })
    .resize(sw, sh, { kernel: 'lanczos3' }).linear(SIG_OPACITY, 0).extractChannel(0).raw().toBuffer();
  const stamp = await sharp({ create: { width: sw, height: sh, channels: 3, background: { r: v, g: v, b: v } } })
    .joinChannel(alpha, { raw: { width: sw, height: sh, channels: 1 } }).png().toBuffer();
  const out = await sharp(raw, { raw: info }).composite([{ input: stamp, left: at[side], top }]).removeAlpha().raw().toBuffer();
  if (out.length !== raw.length) throw new Error(`signature composite changed the buffer layout (${out.length} vs ${raw.length})`);
  return out;
}

async function encodeImage(src, city, rel, opts = {}) {
  const s = slug(rel);
  const meta = await sharp(src).metadata();
  const swap = (meta.orientation || 1) >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;
  if (Math.max(w, h) < MIN_LONG_EDGE) return { skipped: `${w}×${h}` };

  const maxW = h > w ? Math.min(w, PORTRAIT_MAX_W) : w;
  let widths = WIDTHS.filter((x) => x <= maxW);
  if (!widths.length || widths[widths.length - 1] < Math.min(maxW, WIDTHS.at(-1))) widths.push(Math.min(maxW, WIDTHS.at(-1)));
  widths = [...new Set(widths)];

  fs.mkdirSync(path.join(MEDIA, city), { recursive: true });
  // Sign one master at the largest size, then derive the smaller sizes from it.
  // sharp drops EXIF/GPS by default; rotate() bakes in the orientation first.
  const { data, info } = await sharp(src).rotate().resize({ width: widths.at(-1), withoutEnlargement: true })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const master = await sign(data, info, opts);
  const srcset = [];
  for (const width of widths) {
    const out = outPath(city, s, `-${width}.webp`);
    await sharp(master, { raw: info }).resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(out);
    srcset.push([url(out), width]);
  }
  const { dominant } = await sharp(src).rotate().resize(64).stats();
  const color = `rgb(${dominant.r},${dominant.g},${dominant.b})`;
  return { type: 'image', w, h, srcset, color };
}

async function encodeVideo(src, city, rel, posterAt = 1.5) {
  if (!hasFfmpeg) return { skipped: 'ffmpeg not installed' };
  const s = slug(rel);
  fs.mkdirSync(path.join(MEDIA, city), { recursive: true });
  const out = outPath(city, s, '.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src,
    '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
    '-map_metadata', '-1', out]);
  const frame = outPath(city, s, '-poster.png');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(posterAt), '-i', out, '-frames:v', '1', frame]);
  const meta = await sharp(frame).metadata();
  const poster = outPath(city, s, '-poster.webp');
  await sharp(frame).webp({ quality: 78 }).toFile(poster);
  const { dominant } = await sharp(frame).resize(64).stats();
  fs.rmSync(frame);
  return {
    type: 'video', w: meta.width, h: meta.height, src: url(out), poster: url(poster),
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
  };
}

async function processFile(city, rel, opts = {}) {
  const src = path.join(PHOTOS, city, rel);
  const st = fs.statSync(src);
  const key = `${city}/${rel}`;
  const isVideo = VIDEO_RE.test(rel);
  const sig = isVideo
    ? `${st.size}:${Math.round(st.mtimeMs)}:${opts.poster_time ?? ''}`
    : `${st.size}:${Math.round(st.mtimeMs)}:${sigStamp}:${opts.signature ?? ''}:${opts.ink ?? ''}`;
  const hit = cache[key];
  const outputsExist = hit?.data && (hit.data.skipped || (hit.data.srcset || [[hit.data.src]]).every(([u]) => fs.existsSync(path.join(DOCS, u))));
  if (hit?.sig === sig && outputsExist) return hit.data;
  process.stdout.write(`  encoding ${key}\n`);
  const data = isVideo ? await encodeVideo(src, city, rel, opts.poster_time) : await encodeImage(src, city, rel, opts);
  cache[key] = { sig, data };
  return data;
}

// ---------------------------------------------------------------------------

const doc = YAML.parseDocument(fs.readFileSync(CONTENT, 'utf8'));
if (doc.errors.length) {
  console.error(`content.yml has a problem:\n\n${doc.errors[0].message}\n\nTip: wrap a caption in "double quotes" if it contains a colon.`);
  process.exit(1);
}
const content = doc.toJS();

// Typewriter quotes in content.yml become typographer's quotes on the page.
function smart(s) {
  return String(s ?? '').trim()
    .replace(/(^|[\s([{—–-])"/g, '$1\u201C').replace(/"/g, '\u201D')
    .replace(/(^|[\s([{—–-])'/g, '$1\u2018').replace(/'/g, '\u2019');
}
let yamlChanged = false;

const album = {
  title: content.title, subtitle: content.subtitle, dates: content.dates, chapters: [],
};

for (const [ci, ch] of content.chapters.entries()) {
  const dir = path.join(PHOTOS, ch.id);
  console.log(`${ch.name}`);
  if (!fs.existsSync(dir)) { warn(`${ch.name}: folder photos/${ch.id} not found`); continue; }

  const onDisk = walk(dir).map((f) => path.relative(dir, f).split(path.sep).join('/'))
    .filter((f) => IMAGE_RE.test(f) || VIDEO_RE.test(f));
  const listed = new Set((ch.photos || []).map((p) => p.file));

  // New files get appended to content.yml in capture order, with blank captions.
  const fresh = [];
  for (const f of onDisk.filter((f) => !listed.has(f))) fresh.push({ f, t: (await captureTime(path.join(dir, f))) ?? Infinity });
  fresh.sort((a, b) => a.t - b.t || a.f.localeCompare(b.f));
  if (fresh.length) {
    const seq = doc.getIn(['chapters', ci, 'photos']) ?? doc.createNode([]);
    for (const { f } of fresh) seq.add(doc.createNode({ file: f, caption: '' }));
    doc.setIn(['chapters', ci, 'photos'], seq);
    ch.photos = [...(ch.photos || []), ...fresh.map(({ f }) => ({ file: f, caption: '' }))];
    yamlChanged = true;
    console.log(`  added ${fresh.length} new file(s) to content.yml`);
  }

  const photos = [];
  for (const p of ch.photos || []) {
    if (p.hide) continue;
    if (!onDisk.includes(p.file)) { warn(`${ch.name}: ${p.file} is listed in content.yml but missing from photos/`); continue; }
    const data = await processFile(ch.id, p.file, p);
    if (data.skipped) { warn(`${ch.name}: ${p.file} skipped (${data.skipped}, needs a full-size export)`); continue; }
    photos.push({ ...data, caption: smart(p.caption), alt: String(p.alt || p.caption || '').trim() });
  }
  album.chapters.push({
    id: ch.id, name: ch.name, dates: ch.dates, history: smart(ch.history), photos,
  });
}

fs.writeFileSync(path.join(DOCS, 'album.json'), JSON.stringify(album));
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
if (yamlChanged) fs.writeFileSync(CONTENT, doc.toString({ lineWidth: 0 }));

// Clean up media no longer referenced.
const used = new Set();
for (const ch of album.chapters) for (const p of ch.photos) {
  (p.srcset || []).forEach(([u]) => used.add(u));
  if (p.src) used.add(p.src);
  if (p.poster) used.add(p.poster);
}
if (fs.existsSync(MEDIA)) for (const f of walk(MEDIA)) if (!used.has(url(f))) fs.rmSync(f);

const total = album.chapters.reduce((n, c) => n + c.photos.length, 0);
console.log(`\nBuilt docs/album.json: ${total} items across ${album.chapters.length} chapters.`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
