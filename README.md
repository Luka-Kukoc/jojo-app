# Jojo App

A small static web app for practicing tooth identification. Press **Start**, look at the
tooth, pick one of four answers, and get a score at the end. No backend, no build step.

## Features

- All 32 permanent teeth with built-in illustrations (buccal / labial view).
- **3D models** of every tooth from the University of Dundee (CC BY), rotatable, or the
  built-in **illustrations**. Switchable on the start screen.
- Your own photos or `.glb` models can also be dropped in per tooth, see below.
- **Orientation** setting so the arch is not given away:
  - *Uniform*: every tooth is shown crown-up (default).
  - *Anatomical*: upper teeth are shown inverted, as in the mouth.
  - *Random*: each tooth is flipped at random.
- Universal (1-32) or FDI (11-48) numbering.
- Filter by tooth group (incisors, canines, premolars, molars) and arch (upper, lower).
- Distractors are chosen to be similar (mirror side, other arch, neighbouring tooth).
- Score screen with percentage, time, list of mistakes and a "retry mistakes" round.
- Best score per setup is stored in the browser (localStorage).
- Keyboard: `1`-`4` to answer, `Enter` / `Space` for next, `Esc` to quit.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Jojo App"
git branch -M main
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
The site will be at `https://<you>.github.io/<repo>/`. Netlify Drop, Cloudflare Pages or
Vercel work the same way: point them at this folder.

## 3D models (default)

The **3D model** display shows the [University of Dundee, School of Dentistry "Permanent Teeth"](https://sketchfab.com/DundeeDental/collections/permanent-teeth-4c0d0548c40c463c8cdceb6e0d08df7f)
models (17 CT-derived models, one per tooth type, **CC BY 4.0**), shipped as local `.glb` files
in `assets/teeth/` and rendered with [`<model-viewer>`](https://modelviewer.dev). Each model was
compressed from about 3-5 MB to a few hundred KB (Draco geometry + WebP textures) with
`@gltf-transform/cli optimize`, so the whole set is a few MB.

- `assets/teeth/manifest.js` maps each of the 32 teeth to a file. The models are left-side
  teeth, so right-side teeth are mirrored copies; uppers are posed crown-down, so the
  orientation setting rolls them 180° in 3D when needed.
- The next question's model is preloaded in a hidden slot, so advancing is instant.
- Works offline once loaded; only the model-viewer library comes from a CDN.
- The credit line required by the license is shown under the model; see `assets/teeth/ATTRIBUTION.md`.
- The **Illustration** setting uses the built-in drawings instead.

## Adding your own images or models

Register any file in `assets/teeth/manifest.js`, keyed by FDI number:

```js
window.TOOTH_ASSETS = {
  16: { src: 'assets/teeth/16.glb', crownUp: false, credit: '...' },  // local 3D file, posed crown-down
  26: { src: 'assets/teeth/16.glb', crownUp: false, mirror: true },   // same file, mirrored
  36: { src: 'assets/teeth/36.jpg' },                                  // photo, crown-up
  46: { sketchfab: 'e719a474ef7e4bd7abec508f85f1e984' },              // Sketchfab embed (needs internet)
};
```

- `.glb` / `.gltf` files are shown with `<model-viewer>` and can be rotated with the mouse or finger.
- `sketchfab` entries use Sketchfab's embed viewer (the viewer's own hint and title are clipped away).
- Anything else (`png`, `jpg`, `webp`, `svg`) is shown as an image.
- `crownUp: false` tells the app the file shows the tooth crown-down, so the orientation
  setting is applied correctly.
- Local files are checked at startup; a tooth whose file is missing uses the built-in drawing.
- Entries are only used when the **3D model** display is selected.

## Files

```
index.html               markup
styles.css               styling
js/teeth.js              tooth data, numbering, notes
js/tooth-art.js          built-in SVG illustrations
js/app.js                quiz logic
assets/teeth/manifest.js maps teeth to the model files
assets/teeth/*.glb       Dundee models (compressed)
```
