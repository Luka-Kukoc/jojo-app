/* Built-in SVG tooth illustrations (buccal / labial view).
   Every shape is drawn crown-UP with the mesial side on the RIGHT, i.e. as a
   RIGHT-side tooth. Left-side teeth are mirrored, and upper teeth are flipped
   vertically only when the "anatomical" orientation is selected.
   Coordinate space: 240 x 340. */

const ART_W = 240, ART_H = 340;

/* Catmull-Rom -> cubic bezier, closed smooth path through the given points. */
function smoothClosed(pts, k = 1 / 6) {
  const n = pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) * k, c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k, c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + ' Z';
}

/* Open smooth line (for grooves and texture lines). */
function smoothOpen(pts, k = 1 / 6) {
  const n = pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) * k, c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k, c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/* Geometry per arch/position.
   crown: outline points, roots: array of outlines (drawn back to front),
   back: roots drawn behind (palatal roots), grooves: open polylines on the crown,
   lines: extra open polylines on roots (texture / fusion grooves). */
const TOOTH_GEOMETRY = {
  upper: {
    1: {
      crown: [[74,44],[96,31],[120,29],[144,31],[166,42],[172,80],[164,124],[142,146],[120,150],[98,146],[76,124],[68,80]],
      roots: [[[88,140],[152,140],[150,190],[138,260],[122,312],[112,318],[104,308],[92,250],[86,190]]],
      grooves: [[[104,40],[102,80],[104,120]],[[136,40],[138,80],[136,120]]],
    },
    2: {
      crown: [[80,52],[100,36],[120,32],[140,36],[160,50],[166,86],[160,124],[140,146],[120,150],[100,146],[80,124],[74,86]],
      roots: [[[92,140],[148,140],[146,190],[136,255],[118,306],[106,318],[98,310],[94,255],[90,190]]],
      grooves: [[[108,44],[106,90],[108,120]],[[132,44],[134,90],[132,120]]],
    },
    3: {
      crown: [[68,74],[90,44],[124,20],[156,46],[172,78],[168,124],[144,152],[120,156],[96,152],[72,124],[64,100]],
      roots: [[[86,144],[154,144],[154,200],[144,270],[126,326],[114,328],[104,300],[90,240],[84,190]]],
      grooves: [[[124,30],[122,80],[120,130]]],
    },
    4: {
      crown: [[74,68],[90,44],[112,26],[130,38],[154,62],[168,90],[164,126],[142,150],[120,154],[98,150],[76,126],[66,96]],
      back: [[[96,176],[144,176],[140,236],[116,300],[102,306],[92,270],[92,220]]],
      roots: [[[88,144],[152,144],[150,200],[142,258],[128,306],[116,310],[104,272],[94,210]]],
      grooves: [[[114,38],[112,90],[110,130]]],
    },
    5: {
      crown: [[72,70],[92,46],[120,32],[148,46],[168,72],[168,100],[162,128],[142,150],[120,154],[98,150],[78,128],[66,100]],
      roots: [[[88,144],[152,144],[150,200],[140,262],[122,314],[112,316],[100,272],[92,210]]],
      grooves: [[[120,40],[120,90],[120,130]]],
    },
    6: {
      crown: [[52,70],[60,48],[80,36],[100,42],[114,62],[130,42],[158,32],[184,42],[196,68],[198,112],[192,142],[164,158],[120,162],[76,158],[50,142],[44,112]],
      back: [[[96,178],[146,178],[152,220],[150,270],[136,300],[120,304],[106,290],[98,250]]],
      roots: [
        [[54,150],[110,150],[112,188],[96,230],[74,282],[58,296],[50,286],[48,250],[50,200]],
        [[130,150],[190,150],[194,200],[196,250],[190,290],[176,300],[166,282],[144,235],[130,188]],
      ],
      grooves: [[[118,54],[120,80],[118,112]]],
    },
    7: {
      crown: [[58,72],[66,50],[86,38],[104,44],[118,62],[132,44],[156,34],[180,44],[192,70],[192,112],[186,142],[160,156],[120,160],[80,156],[54,142],[50,112]],
      back: [[[98,178],[142,178],[144,220],[136,268],[118,292],[104,286],[96,250]]],
      roots: [
        [[60,150],[110,150],[110,188],[92,230],[70,272],[58,284],[52,274],[52,240],[54,200]],
        [[128,150],[184,150],[184,200],[180,248],[166,280],[152,286],[144,270],[134,232],[126,190]],
      ],
      grooves: [[[120,56],[122,82],[120,110]]],
    },
    8: {
      crown: [[66,76],[76,56],[94,44],[110,50],[120,64],[132,50],[154,42],[174,54],[184,80],[182,114],[176,140],[152,154],[120,158],[88,154],[64,140],[58,112]],
      roots: [[[70,148],[172,148],[170,190],[152,240],[118,268],[94,262],[74,236],[66,196]]],
      lines: [[[112,190],[108,230],[104,256]]],
      grooves: [[[122,60],[124,84],[122,110]],[[96,70],[100,100]]],
    },
  },
  lower: {
    1: {
      crown: [[90,42],[104,32],[120,30],[136,32],[150,42],[154,86],[150,124],[136,146],[120,150],[104,146],[90,124],[86,86]],
      roots: [[[96,140],[144,140],[142,200],[134,262],[122,312],[116,314],[108,262],[98,200]]],
      grooves: [[[110,40],[110,110]],[[130,40],[130,110]]],
    },
    2: {
      crown: [[84,50],[100,34],[120,30],[140,32],[156,38],[160,86],[156,124],[140,146],[120,150],[100,146],[84,124],[80,86]],
      roots: [[[94,140],[146,140],[144,200],[134,262],[118,314],[108,318],[100,268],[94,200]]],
      grooves: [[[108,44],[108,112]],[[132,42],[132,112]]],
    },
    3: {
      crown: [[78,74],[96,46],[126,24],[150,52],[162,84],[160,126],[142,152],[120,156],[98,152],[80,126],[74,100]],
      roots: [[[90,144],[150,144],[150,200],[142,270],[128,326],[116,328],[106,296],[94,240],[88,190]]],
      grooves: [[[126,34],[122,84],[120,130]]],
    },
    4: {
      crown: [[74,74],[92,44],[122,26],[148,46],[168,76],[170,104],[164,130],[144,152],[120,156],[96,152],[76,130],[68,104]],
      roots: [[[90,144],[150,144],[148,200],[138,262],[122,310],[112,312],[102,268],[92,206]]],
      grooves: [[[120,40],[118,90],[118,130]]],
    },
    5: {
      crown: [[70,76],[90,50],[120,38],[150,50],[172,78],[172,108],[166,132],[144,154],[120,158],[96,154],[76,132],[66,108]],
      roots: [[[90,146],[152,146],[150,202],[140,262],[124,310],[112,312],[102,268],[92,206]]],
      grooves: [[[120,48],[120,92],[120,132]]],
    },
    6: {
      crown: [[44,76],[52,54],[70,42],[86,48],[100,64],[116,44],[136,38],[150,46],[164,60],[184,36],[196,58],[198,110],[192,144],[166,160],[120,164],[74,160],[46,144],[40,110]],
      roots: [
        [[48,150],[108,150],[108,190],[94,240],[74,284],[58,298],[48,288],[46,240],[46,200]],
        [[132,150],[194,150],[196,200],[194,256],[184,296],[168,304],[158,290],[146,246],[134,196]],
      ],
      grooves: [[[100,58],[102,84],[100,112]],[[164,46],[166,80],[164,112]]],
    },
    7: {
      crown: [[54,76],[62,52],[84,40],[104,46],[120,66],[136,46],[158,38],[180,48],[190,72],[190,112],[186,144],[162,160],[120,164],[78,160],[54,144],[50,112]],
      roots: [
        [[58,150],[110,150],[110,190],[92,236],[70,276],[58,286],[52,274],[52,236],[54,196]],
        [[130,150],[186,150],[188,200],[184,252],[170,286],[156,292],[148,276],[136,236],[128,194]],
      ],
      grooves: [[[120,58],[122,84],[120,112]]],
    },
    8: {
      crown: [[62,80],[72,58],[92,46],[110,52],[122,66],[134,52],[156,44],[176,56],[186,84],[184,116],[178,142],[154,158],[120,162],[86,158],[62,142],[56,114]],
      roots: [[[70,150],[172,150],[168,196],[148,244],[112,270],[86,262],[62,230],[60,196]]],
      lines: [[[118,192],[114,232],[108,258]]],
      grooves: [[[122,62],[124,86],[122,112]],[[98,72],[102,102]]],
    },
  },
};

let artSeq = 0;

/* Returns an SVG string for a tooth.
   opts.mirror: flip horizontally (used for left-side teeth)
   opts.flip:   flip vertically (crown down) */
function renderToothSVG(tooth, opts = {}) {
  const g = TOOTH_GEOMETRY[tooth.arch][tooth.pos];
  const uid = 'ta' + (++artSeq);
  const sx = opts.mirror ? -1 : 1, sy = opts.flip ? -1 : 1;
  const tx = opts.mirror ? ART_W : 0, ty = opts.flip ? ART_H : 0;

  const rootPath = pts => `<path d="${smoothClosed(pts)}" fill="url(#${uid}-root)" stroke="#8c7a55" stroke-opacity="0.55" stroke-width="1.2"/>`;
  const backPath = pts => `<path d="${smoothClosed(pts)}" fill="url(#${uid}-rootBack)" stroke="#7d6b48" stroke-opacity="0.5" stroke-width="1.2"/>`;
  const rootTexture = pts => {
    // two faint longitudinal lines per root for a bit of texture
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2, w = maxX - minX, h = maxY - minY;
    const l1 = smoothOpen([[cx - w * 0.16, minY + h * 0.2], [cx - w * 0.12, minY + h * 0.55], [cx - w * 0.02, minY + h * 0.85]]);
    const l2 = smoothOpen([[cx + w * 0.2, minY + h * 0.25], [cx + w * 0.16, minY + h * 0.6], [cx + w * 0.06, minY + h * 0.82]]);
    return `<path d="${l1}" class="rt"/><path d="${l2}" class="rt"/>`;
  };

  const backRoots = (g.back || []).map(backPath).join('');
  const roots = g.roots.map(pts => rootPath(pts) + rootTexture(pts)).join('');
  const extraLines = (g.lines || []).map(pts => `<path d="${smoothOpen(pts)}" class="rl"/>`).join('');
  const crown = smoothClosed(g.crown);
  const grooves = (g.grooves || []).map(pts => `<path d="${smoothOpen(pts)}" class="gr"/>`).join('');

  // crown highlight: an ellipse near the top-left of the crown bounding box
  const cxs = g.crown.map(p => p[0]), cys = g.crown.map(p => p[1]);
  const cminX = Math.min(...cxs), cmaxX = Math.max(...cxs), cminY = Math.min(...cys), cmaxY = Math.max(...cys);
  const cw = cmaxX - cminX, ch = cmaxY - cminY;
  const hx = cminX + cw * 0.34, hy = cminY + ch * 0.32;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ART_W} ${ART_H}" class="tooth-svg" role="img" aria-label="Tooth illustration">
  <defs>
    <linearGradient id="${uid}-root" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#bda981"/><stop offset="0.45" stop-color="#e2d3ad"/><stop offset="1" stop-color="#b39c70"/>
    </linearGradient>
    <linearGradient id="${uid}-rootBack" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9f8b63"/><stop offset="0.5" stop-color="#c4b088"/><stop offset="1" stop-color="#968257"/>
    </linearGradient>
    <linearGradient id="${uid}-enamel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#f1efea"/><stop offset="1" stop-color="#cfcac0"/>
    </linearGradient>
    <radialGradient id="${uid}-shine" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="${uid}-crownClip"><path d="${crown}"/></clipPath>
    <filter id="${uid}-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <style>
    .rt{fill:none;stroke:#8a7650;stroke-opacity:.25;stroke-width:1.4;stroke-linecap:round}
    .rl{fill:none;stroke:#7a6844;stroke-opacity:.5;stroke-width:1.6;stroke-linecap:round}
    .gr{fill:none;stroke:#7f7a70;stroke-opacity:.6;stroke-width:1.8;stroke-linecap:round}
  </style>
  <g transform="translate(${tx},${ty}) scale(${sx},${sy})" filter="url(#${uid}-shadow)">
    ${backRoots}
    ${roots}
    ${extraLines}
    <path d="${crown}" fill="url(#${uid}-enamel)" stroke="#b7b2a8" stroke-width="1.2"/>
    <g clip-path="url(#${uid}-crownClip)">
      ${grooves}
      <ellipse cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" rx="${(cw * 0.22).toFixed(1)}" ry="${(ch * 0.16).toFixed(1)}" fill="url(#${uid}-shine)"/>
    </g>
  </g>
</svg>`;
}
