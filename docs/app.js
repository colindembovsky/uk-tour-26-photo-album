// Four Cities: album + slideshow. Vanilla JS, no build step.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// Ornament units. One keyline grammar: a double lozenge, a single hairline
// weight, and gilt fills that arrive after the lines are "tooled".
// .k = keyline (drawn), .g = gilt fill, .x = cut line (turns ground-coloured
// once the gilt lands), .d = blind-tooled dot.

const LEATHER = {
  edinburgh: '#5b3442', london: '#6b1f1d', belfast: '#22324a', dublin: '#1f4a35',
};
const COVER_LEATHER = '#4a2c1f';
const FALLBACK_LEATHER = ['#5b3442', '#6b1f1d', '#22324a', '#1f4a35', '#4a2c1f'];

const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const P = (cls, d, extra = '') => `<path class="${cls}" pathLength="1" d="${d}"${extra}/>`;

const FRAME = P('k', 'M32 3L61 32L32 61L3 32Z') + P('k', 'M32 8.5L55.5 32L32 55.5L8.5 32Z');

function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
}
function yAtX(curve, x, tMin = 0) {
  let best = null;
  for (let t = tMin; t <= 1.0001; t += 0.005) {
    const [px, py] = bez(...curve, t);
    if (!best || Math.abs(px - x) < Math.abs(best[0] - x)) best = [px, py];
  }
  return best[1];
}

const UNITS = {
  // Edinburgh: thistle
  thistle: () => [
    P('k', 'M32 43V54.5'),
    P('k g', 'M32 51.5C27 50 23 47 20.5 42.2C25 42.6 29 45 32 48.6Z'),
    P('k g', 'M32 51.5C37 50 41 47 43.5 42.2C39 42.6 35 45 32 48.6Z'),
    P('k g', 'M25.5 34.5C25.5 40.5 28.8 43.2 32 43.2C35.2 43.2 38.5 40.5 38.5 34.5Z'),
    P('k x', 'M27.8 36.6L34.6 42.4M36.2 36.6L29.4 42.4'),
    P('k', 'M24 34.5H40'),
    P('k', 'M26.6 34.5L22.6 23.6M29.3 34.5L27.6 20M32 34.5V18.4M34.7 34.5L36.4 20M37.4 34.5L41.4 23.6'),
  ].join(''),

  // London: plane leaf
  leaf: () => `<g transform="translate(32 34) scale(.82) translate(-32 -34)">${[
    P('k g', 'M32 48L24 44L18 46L20 40L12 36L19 32L14 24L23 26L24 18L30 23L32 13L34 23L40 18L41 26L50 24L45 32L52 36L44 40L46 46L40 44Z'),
    P('k x', 'M32 46V19M32 40L19 29M32 40L45 29M32 44L16.5 37M32 44L47.5 37'),
    P('k', 'M32 48V55'),
  ].join('')}</g>`,

  // Belfast: riveted porthole in a rope ring
  porthole: () => {
    const ticks = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const b = a + 0.16;
      const [x1, y1] = [32 + 14.2 * Math.cos(a), 32 + 14.2 * Math.sin(a)];
      const [x2, y2] = [32 + 16.6 * Math.cos(b), 32 + 16.6 * Math.sin(b)];
      ticks.push(`M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`);
    }
    const rivets = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      rivets.push(`<path class="d" d="${circle(+(32 + 11 * Math.cos(a)).toFixed(2), +(32 + 11 * Math.sin(a)).toFixed(2), 0.95)}"/>`);
    }
    return [
      P('k', ticks.join('')),
      P('k g', `${circle(32, 32, 13)}${circle(32, 32, 9)}`, ' fill-rule="evenodd"'),
      rivets.join(''),
      P('k', 'M26.6 30.6A5.8 5.8 0 0 1 30.6 26.4'),
    ].join('');
  },

  // Dublin: harp
  harp: () => {
    const neck = [[24, 22], [28, 15], [34, 22], [40, 16]];
    const pillar = [[24, 22], [21, 32], [26, 42], [39, 47]];
    const strings = [26.8, 29.4, 32, 34.6, 37]
      .map((x) => `M${x} ${(yAtX(neck, x) + 0.9).toFixed(2)}V${(yAtX(pillar, x, 0.35) - 0.9).toFixed(2)}`).join('');
    return `<g transform="translate(32 33) scale(.86) translate(-32 -33)">${[
      P('k', `M24 22C28 15 34 22 40 16`),
      P('k', `M24 22C21 32 26 42 39 47`),
      P('k g', 'M40 16L43.6 46.2L39 47.2L37.2 19.4Z'),
      P('k', strings),
      `<path class="d" d="${circle(24, 22, 1.3)}"/>`,
    ].join('')}</g>`;
  },
};
const UNIT_FOR = { edinburgh: 'thistle', london: 'leaf', belfast: 'porthole', dublin: 'harp' };
const UNIT_ORDER = ['thistle', 'leaf', 'porthole', 'harp'];
const unitName = (id, i) => UNIT_FOR[id] || UNIT_ORDER[i % UNIT_ORDER.length];

function numberDrawn(svg) {
  svg.querySelectorAll('.k').forEach((el, i) => el.style.setProperty('--i', i));
  return svg;
}
function unitSVG(name, cls = '') {
  return `<svg class="orn ${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${FRAME}${UNITS[name]()}</svg>`;
}
function compoundSVG(names, cls = '') {
  const at = [[32, 0], [64, 32], [32, 64], [0, 32]];
  const parts = names.slice(0, 4).map((n, i) => `<g transform="translate(${at[i][0]} ${at[i][1]})">${FRAME}${UNITS[n]()}</g>`);
  return `<svg class="orn ${cls}" viewBox="0 0 128 128" aria-hidden="true" focusable="false">${parts.join('')}${P('k g', 'M64 59.5L68.5 64L64 68.5L59.5 64Z')}</svg>`;
}

const PLAY_MARK = `<span class="play-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="${circle(24, 24, 21)}"/><path d="M19 15.5v17l13.5-8.5z"/></svg></span>`;

// ---------------------------------------------------------------------------
// Album

const main = document.getElementById('album');
const tabs = document.querySelector('.tabs');
let album;
const seq = []; // slideshow sequence

const srcsetOf = (p) => p.srcset.map(([u, w]) => `${u} ${w}w`).join(', ');
const midSrc = (p) => (p.srcset.find(([, w]) => w >= 1200) || p.srcset.at(-1))[0];
const ratio = (p) => p.w / p.h;
const TILTS = [-0.35, 0.25, -0.15, 0.4, -0.25, 0.1, 0.3, -0.4];

function countLabel(ch) {
  const films = ch.photos.filter((p) => p.type === 'video').length;
  const photos = ch.photos.length - films;
  const parts = [];
  if (photos) parts.push(`${photos} photograph${photos === 1 ? '' : 's'}`);
  if (films) parts.push(`${films} film${films === 1 ? '' : 's'}`);
  return parts.join(', ') || 'Prints to come';
}

function printHTML(ch, p, n, sizes) {
  const isVideo = p.type === 'video';
  const caption = p.caption ? esc(p.caption) : '';
  const label = `${isVideo ? 'Play film' : 'Open photograph'} ${n}${p.caption ? `: ${esc(p.caption)}` : ''}`;
  const img = isVideo
    ? `<img src="${p.poster}" width="${p.w}" height="${p.h}" alt="" loading="lazy" decoding="async">`
    : `<img src="${midSrc(p)}" srcset="${srcsetOf(p)}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async">`;
  return `<figure class="print" style="--tilt:${TILTS[n % TILTS.length]}deg;--ar:${ratio(p).toFixed(4)}">
    <button class="photo${isVideo ? ' is-video' : ''}" type="button" data-ch="${ch.id}" data-n="${n}" aria-label="${label}" style="--tone:${p.color}">${img}${isVideo ? PLAY_MARK : ''}</button>
    <figcaption><span class="num">${pad(n)}</span>${caption ? `<span class="txt">${caption}</span>` : ''}</figcaption>
  </figure>`;
}

function buildRows(photos) {
  const rows = [];
  let side = 0;
  for (let i = 0; i < photos.length;) {
    if (ratio(photos[i]) >= 1.2) { rows.push({ type: 'wide', items: [i], flip: side++ % 2 === 1 }); i += 1; continue; }
    if (photos[i + 1] && ratio(photos[i + 1]) < 1.2) { rows.push({ type: 'pair', items: [i, i + 1] }); i += 2; continue; }
    rows.push({ type: 'tall', items: [i], flip: side++ % 2 === 1 });
    i += 1;
  }
  return rows;
}

const SIZES = {
  wide: '(min-width: 1180px) 720px, (min-width: 900px) 62vw, 94vw',
  pair: '(min-width: 1180px) 500px, (min-width: 900px) 44vw, 94vw',
  tall: '(min-width: 1180px) 460px, (min-width: 900px) 40vw, 94vw',
};

function chapterHTML(ch, ci) {
  const unit = unitName(ch.id, ci);
  const rows = buildRows(ch.photos);
  const leaves = [];
  for (let i = 0; i < rows.length; i += 3) leaves.push(rows.slice(i, i + 3));

  const plates = leaves.map((leafRows, li) => `
    <div class="leaf card">
      ${leafRows.map((r) => `<div class="row ${r.type}${r.flip ? ' flip' : ''}">${r.items.map((i) => printHTML(ch, ch.photos[i], i + 1, SIZES[r.type])).join('')}</div>`).join('')}
      <footer class="folio">${unitSVG(unit, 'static')}<span>${esc(ch.name)} · ${li + 1}</span></footer>
    </div>`).join('');

  return `
  <section class="chapter" id="${ch.id}" aria-labelledby="h-${ch.id}" style="--leather:${LEATHER[ch.id] || FALLBACK_LEATHER[ci % FALLBACK_LEATHER.length]}">
    <header class="leaf leather chapter-cover">
      <div class="tooling">
        ${unitSVG(unit, 'centre')}
        <h2 id="h-${ch.id}">${esc(ch.name)}</h2>
        ${ch.dates ? `<p class="dates">${esc(ch.dates)}</p>` : ''}
      </div>
      ${['tl', 'tr', 'bl', 'br'].map((c) => unitSVG(unit, `corner ${c} static`)).join('')}
      ${ch.history ? `<div class="glassine"><p>${esc(ch.history)}</p></div>` : ''}
    </header>
    ${plates || '<div class="leaf card empty"><p>The prints for this chapter are still at the chemist.</p></div>'}
  </section>`;
}

function render() {
  const names = album.chapters.map((c, i) => unitName(c.id, i));
  const compound = names.length >= 4 ? compoundSVG(names, 'centre') : unitSVG(names[0] || 'thistle', 'centre');

  main.innerHTML = `
  <section class="table-top" id="top" aria-labelledby="title">
    <div class="album-cover leather" style="--leather:${COVER_LEATHER}">
      <div class="tooling">
        ${compound}
        <h1 id="title">${esc(album.title)}</h1>
        ${album.subtitle ? `<p class="subtitle">${esc(album.subtitle)}</p>` : ''}
        ${album.dates ? `<p class="dates">${esc(album.dates)}</p>` : ''}
      </div>
    </div>
    <div class="cover-actions">
      <a class="action" href="#contents">Open the album</a>
      <button class="action" type="button" data-play="0">Play the slideshow</button>
    </div>
  </section>

  <nav class="leaf card contents" id="contents" aria-labelledby="h-contents" tabindex="-1">
    <h2 id="h-contents">Contents</h2>
    <ol>
      ${album.chapters.map((ch, i) => `
      <li><a href="#${ch.id}" style="--leather:${LEATHER[ch.id] || FALLBACK_LEATHER[i % FALLBACK_LEATHER.length]}">
        <span class="toc-unit">${unitSVG(names[i], 'static')}</span>
        <span class="toc-name">${esc(ch.name)}</span>
        <span class="toc-dates">${esc(ch.dates || '')}</span>
        <span class="toc-leader" aria-hidden="true"></span>
        <span class="toc-count">${countLabel(ch)}</span>
      </a></li>`).join('')}
    </ol>
  </nav>

  ${album.chapters.map(chapterHTML).join('')}

  <footer class="leaf leather endpaper" style="--leather:${COVER_LEATHER}">
    <div class="tooling">
      ${names.length >= 4 ? compoundSVG(names, 'centre small') : unitSVG(names[0] || 'thistle', 'centre small')}
      <p class="home">Home again.</p>
      <div class="cover-actions">
        <button class="action" type="button" data-play="0">Play the slideshow</button>
        <a class="action" href="#top">Back to the cover</a>
      </div>
    </div>
  </footer>`;

  tabs.innerHTML = `${album.chapters.map((ch, i) => `
    <a href="#${ch.id}" style="--leather:${LEATHER[ch.id] || FALLBACK_LEATHER[i % FALLBACK_LEATHER.length]}" aria-label="${esc(ch.name)}" title="${esc(ch.name)}">${unitSVG(names[i], 'static')}</a>`).join('')}
    <button type="button" class="tab-play" data-play="0" aria-label="Play the slideshow" title="Slideshow">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6v12l9.5-6z"/></svg>
    </button>`;

  main.querySelectorAll('svg.orn, .tabs svg.orn').forEach(numberDrawn);
  tabs.querySelectorAll('svg.orn').forEach(numberDrawn);

  // Slideshow sequence: a cover for each city, then its prints.
  album.chapters.forEach((ch, ci) => {
    seq.push({ kind: 'cover', ch, ci });
    ch.photos.forEach((p, i) => seq.push({ kind: 'photo', ch, ci, p, n: i + 1 }));
  });
  seq.push({ kind: 'end' });
}

// Keylines are drawn with pathLength=1, which rules out non-scaling-stroke (Chrome then
// measures dashes in screen space). Instead each ornament learns its own scale.
const ornSizer = 'ResizeObserver' in window ? new ResizeObserver((entries) => {
  for (const e of entries) {
    const vb = e.target.viewBox.baseVal;
    if (vb && e.contentRect.width) e.target.style.setProperty('--s', (vb.width / e.contentRect.width).toFixed(4));
  }
}) : null;
function sizeOrnaments(root) { root.querySelectorAll('svg.orn').forEach((s) => ornSizer?.observe(s)); }

// Ornaments tool themselves in as they arrive on screen.
function watchTooling() {
  const svgs = main.querySelectorAll('svg.orn.centre');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) { svgs.forEach((s) => s.classList.add('tooled')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('tooled'); io.unobserve(e.target); }
  }, { threshold: 0.45 });
  svgs.forEach((s) => io.observe(s));
}

function watchChapters() {
  const cover = main.querySelector('.table-top');
  const links = [...tabs.querySelectorAll('a')];
  new IntersectionObserver(([e]) => { tabs.hidden = e.isIntersecting; }, { threshold: 0.15 }).observe(cover);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === `#${e.target.id}`));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  main.querySelectorAll('.chapter').forEach((s) => io.observe(s));
}

// ---------------------------------------------------------------------------
// Slideshow: one print at a time, laid on the table.

const dlg = document.querySelector('dialog.show');
const stage = dlg.querySelector('.show-stage');
const where = dlg.querySelector('.show-where');
const playBtn = dlg.querySelector('.show-play');
const progress = dlg.querySelector('.show-progress > span');
const DWELL = { photo: 6500, cover: 4200 };
const show = { i: 0, playing: false, timer: 0 };

function slideHTML(item) {
  if (item.kind === 'cover') {
    const { ch, ci } = item;
    const cover = `<div class="mini-cover leather">
      <div class="tooling">${unitSVG(unitName(ch.id, ci), 'centre')}<h2>${esc(ch.name)}</h2>${ch.dates ? `<p class="dates">${esc(ch.dates)}</p>` : ''}</div>
    </div>`;
    return `<div class="intro${ch.history ? ' has-history' : ''}" style="--leather:${LEATHER[ch.id] || FALLBACK_LEATHER[ci % FALLBACK_LEATHER.length]}">
      ${cover}${ch.history ? `<div class="glassine"><p>${esc(ch.history)}</p></div>` : ''}
    </div>`;
  }
  if (item.kind === 'end') {
    const names = album.chapters.map((c, i) => unitName(c.id, i));
    return `<div class="mini-cover leather" style="--leather:${COVER_LEATHER}">
      <div class="tooling">${names.length >= 4 ? compoundSVG(names, 'centre') : unitSVG(names[0], 'centre')}<h2>Home again</h2>
      <p class="dates"><button class="action" type="button" data-restart>Play it again</button></p></div>
    </div>`;
  }
  const { p } = item;
  const media = p.type === 'video'
    ? `<video src="${p.src}" poster="${p.poster}" width="${p.w}" height="${p.h}" playsinline controls preload="auto"></video>`
    : `<img src="${midSrc(p)}" srcset="${srcsetOf(p)}" sizes="92vw" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" decoding="async">`;
  return `<div class="frame" style="--ar:${ratio(p).toFixed(4)};--tone:${p.color}">${media}</div>
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}`;
}

function setWhere(item) {
  if (item.kind === 'photo') {
    where.innerHTML = `<span>${esc(item.ch.name)}</span> ${item.n} <span class="of">of</span> ${item.ch.photos.length}`;
    history.replaceState(null, '', `#${item.ch.id}/${item.n}`);
  } else if (item.kind === 'cover') {
    where.innerHTML = `<span>${esc(item.ch.name)}</span>`;
    history.replaceState(null, '', `#${item.ch.id}/0`);
  } else {
    where.textContent = '';
  }
}

function preload(i) {
  const item = seq[i];
  if (item?.kind === 'photo' && item.p.type === 'image') {
    const im = new Image();
    im.sizes = '92vw';
    im.srcset = srcsetOf(item.p);
  }
}

function startProgress(ms) {
  progress.style.animation = 'none';
  void progress.offsetWidth; // restart the CSS animation
  progress.style.animation = ms ? `progress ${ms}ms linear forwards` : 'none';
}

function schedule() {
  clearTimeout(show.timer);
  const item = seq[show.i];
  if (!show.playing || item.kind === 'end') { startProgress(0); return; }
  if (item.kind === 'photo' && item.p.type === 'video') { startProgress(0); return; } // advances on 'ended'
  // City intros hold long enough to read the history (~250ms a word).
  const words = item.kind === 'cover' ? (item.ch.history || '').split(/\s+/).filter(Boolean).length : 0;
  const ms = Math.max(DWELL[item.kind], words * 250 + 2500);
  startProgress(ms);
  show.timer = setTimeout(() => go(1), ms);
}

function goTo(i, dir = 1) {
  show.i = Math.max(0, Math.min(seq.length - 1, i));
  const item = seq[show.i];
  const el = document.createElement('figure');
  el.className = `slide slide-${item.kind}`;
  el.style.setProperty('--dx', `${(Math.random() * 2 - 1) * 7}px`);
  el.style.setProperty('--dy', `${(Math.random() * 2 - 1) * 5}px`);
  el.style.setProperty('--from', `${dir * 14}px`);
  el.innerHTML = slideHTML(item);
  el.querySelectorAll('svg.orn').forEach(numberDrawn);

  for (const old of stage.children) {
    old.classList.add('out');
    old.querySelector('video')?.pause();
    setTimeout(() => old.remove(), reduceMotion.matches ? 0 : 1100);
  }
  stage.append(el);
  sizeOrnaments(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add('in');
    el.querySelector('svg.orn')?.classList.add('tooled');
  }));

  const video = el.querySelector('video');
  if (video) {
    video.addEventListener('ended', () => { if (show.playing) go(1); });
    video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
  }
  el.querySelector('[data-restart]')?.addEventListener('click', () => { setPlaying(true); goTo(0); });

  setWhere(item);
  dlg.querySelector('.show-prev').disabled = show.i === 0;
  dlg.querySelector('.show-next').disabled = show.i === seq.length - 1;
  preload(show.i + 1);
  schedule();
}

function go(delta) {
  const next = show.i + delta;
  if (next < 0 || next >= seq.length) return;
  goTo(next, delta);
}

function setPlaying(on) {
  show.playing = on;
  playBtn.setAttribute('aria-pressed', String(on));
  playBtn.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow');
  if (on && seq[show.i].kind === 'end') { goTo(0); return; }
  schedule();
}

function openShow(i, play) {
  if (!dlg.open) dlg.showModal();
  document.documentElement.classList.add('showing');
  show.playing = play;
  playBtn.setAttribute('aria-pressed', String(play));
  playBtn.setAttribute('aria-label', play ? 'Pause slideshow' : 'Play slideshow');
  stage.replaceChildren();
  goTo(i);
}

function closeShow() {
  if (dlg.open) dlg.close();
}

dlg.addEventListener('close', () => {
  clearTimeout(show.timer);
  stage.querySelectorAll('video').forEach((v) => v.pause());
  stage.replaceChildren();
  document.documentElement.classList.remove('showing');
  const item = seq[show.i];
  if (item?.ch) {
    history.replaceState(null, '', `#${item.ch.id}`);
    const target = item.kind === 'photo'
      ? main.querySelector(`.photo[data-ch="${item.ch.id}"][data-n="${item.n}"]`)
      : document.getElementById(item.ch.id);
    target?.scrollIntoView({ block: 'center', behavior: 'instant' });
    (item.kind === 'photo' ? target : null)?.focus({ preventScroll: true });
  } else {
    history.replaceState(null, '', location.pathname);
  }
});

dlg.querySelector('.show-close').addEventListener('click', closeShow);
dlg.querySelector('.show-prev').addEventListener('click', () => go(-1));
dlg.querySelector('.show-next').addEventListener('click', () => go(1));
playBtn.addEventListener('click', () => setPlaying(!show.playing));

dlg.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLVideoElement)) {
    setPlaying(!show.playing); e.preventDefault();
  }
});

// Swipe between prints
let touch = null;
stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') touch = [e.clientX, e.clientY]; });
stage.addEventListener('pointerup', (e) => {
  if (!touch) return;
  const dx = e.clientX - touch[0];
  const dy = e.clientY - touch[1];
  touch = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
});
stage.addEventListener('click', (e) => {
  // Clicking the empty table around a print closes, like putting it down.
  if (e.target === stage || e.target.classList.contains('slide')) closeShow();
});

const seqIndexOf = (chId, n) => seq.findIndex((s) => s.ch?.id === chId && (n === 0 ? s.kind === 'cover' : s.n === n));

document.addEventListener('click', (e) => {
  const photo = e.target.closest('.photo[data-ch]');
  if (photo) { openShow(seqIndexOf(photo.dataset.ch, +photo.dataset.n), false); return; }
  const play = e.target.closest('[data-play]');
  if (play) openShow(+play.dataset.play, true);
});

// ---------------------------------------------------------------------------
// Deep links: #dublin scrolls to the chapter, #dublin/12 opens print 12.

function route() {
  const [id, n] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (!id) return;
  if (id === 'slideshow') { openShow(0, true); return; }
  if (n !== undefined && album.chapters.some((c) => c.id === id)) {
    const i = seqIndexOf(id, +n);
    if (i >= 0) { openShow(i, false); return; }
  }
  if (dlg.open) closeShow();
  const el = document.getElementById(id);
  if (el) requestAnimationFrame(() => el.scrollIntoView());
}

async function init() {
  try {
    album = await fetch('album.json', { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  } catch {
    main.innerHTML = '<p class="noscript">The album could not be opened. Try reloading the page.</p>';
    return;
  }
  document.title = `${album.title} · ${album.subtitle || ''}`.replace(/ · $/, '');
  render();
  main.setAttribute('aria-busy', 'false');
  sizeOrnaments(document);
  watchTooling();
  watchChapters();
  route();
  addEventListener('hashchange', route);
}

init();
