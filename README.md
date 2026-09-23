# Jojo App

A small static web app for practicing tooth identification. Press **Start**, look at the
tooth, pick one of four answers, and get a score at the end. No backend, no build step.

## Features

- All 32 permanent teeth with built-in illustrations (buccal / labial view).
- **3D models** of every tooth from the University of Dundee (CC BY), shown in the Sketchfab
  viewer and rotatable, or the built-in **illustrations** (offline). Switchable on the start screen.
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

The **3D model** display uses the [University of Dundee, School of Dentistry "Permanent Teeth"](https://sketchfab.com/DundeeDental/collections/permanent-teeth-4c0d0548c40c463c8cdceb6e0d08df7f)
models (17 CT-derived models, one per tooth type, **CC BY 4.0**) through Sketchfab's embed
viewer. Nothing is downloaded or hosted: `assets/teeth/manifest.js` maps each of the 32 teeth
to a Sketchfab model id, right-side teeth are mirrored copies of the left-side models, and the
credit line required by the license is shown under the model.

- The viewer is embedded oversized inside a clipped card so Sketchfab's title bar, logo and
  annotation list (which would name the tooth) never show. Annotations are also disabled.
- The next question's model is preloaded in a hidden slot, so advancing is instant.
- Needs an internet connection. The **Illustration** setting uses the built-in drawings and works offline.
- To use a different Sketchfab model for a tooth, change its `sketchfab` id in the manifest and
  set `crownUp` to match how that model is posed.

## Adding your own images or models

Register any file in `assets/teeth/manifest.js`, keyed by FDI number:

```js
window.TOOTH_ASSETS = {
  16: { sketchfab: 'e719a474ef7e4bd7abec508f85f1e984', crownUp: false, credit: '...' }, // Sketchfab embed
  26: { src: 'assets/teeth/26.glb', crownUp: false, mirror: true },                     // local 3D file, mirrored
  36: { src: 'assets/teeth/36.jpg' },                                                    // photo, crown-up
};
```

- `.glb` / `.gltf` files are shown with [`<model-viewer>`](https://modelviewer.dev) (loaded from
  a CDN only when a model is present) and can be rotated with the mouse or finger.
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
assets/teeth/manifest.js Sketchfab ids (Dundee set) / optional local files
```
