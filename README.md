# Four Cities

A family photo album of Edinburgh, London, Belfast and Dublin (October 2026), as a static site for GitHub Pages. Browse it as an album, or press **Play** for a slideshow.

## Editing

All the words live in `content.yml`: the album title, each city's history paragraph, and a caption for every photo. Lines marked `CHECK` are guesses to confirm.

- Reorder photos by moving their entries.
- Hide one with `hide: true`.
- New files dropped into `photos/<city>/` are appended in capture order on the next build.

## Building

```sh
npm install
npm run build      # photos/ + content.yml -> docs/media + docs/album.json
npm run serve      # preview at http://localhost:8080
```

The build resizes images to WebP (800/1600/2400px), compresses videos to H.264 with a poster frame (needs `ffmpeg`), and caches results so later builds are quick. `npm run build -- --force` re-encodes everything.

Images under 1200px on the long edge are skipped with a warning.

### Signature

Every photo is signed at build time with `signature.jpeg` (dark ink on a light background). The ink is lifted into a transparent mask and stamped in a bottom corner: right by default, left when that corner is noticeably calmer. It's white on dark corners and black on light ones. Films aren't signed. To override a photo in `content.yml`:

```yaml
      - file: 20261004_144541.jpg
        signature: left    # left | right | none
        ink: white         # black | white
```

Replacing `signature.jpeg` re-signs everything on the next build. Size, margin and opacity are the `SIG_*` constants in `scripts/build.mjs`.

`node scripts/textures.mjs` regenerates the walnut and leather textures in `docs/assets/`.

## Publishing

Commit and push, then in the repository settings set **Pages → Build and deployment → Deploy from a branch → `main` / `/docs`**. The originals in `photos/` are git-ignored; only the web-sized copies in `docs/media` are published.

## Links

- `#edinburgh` scrolls to a chapter.
- `#london/3` opens the slideshow at a photo (`/0` is the chapter cover).
- `#slideshow` starts playing from the beginning.
