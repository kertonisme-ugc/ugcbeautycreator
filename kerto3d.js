/* Kerto 3D — maskot vero. + produk 3D generik (three.js).
   Dimuat setelah halaman siap. Kalau WebGL / CDN gagal, web tetap jalan normal tanpa 3D. */
const V = '0.187.0';
const CDN = 'https://cdn.jsdelivr.net/npm/three@' + V;
const REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function boot() {
  import(CDN + '/+esm').then((T) => {
    try { init(T, roomEnv); } catch (e) { console.warn('[kerto]', e); }
  }).catch((e) => console.warn('[kerto] 3D tidak dimuat', e));
}
/* ruangan studio kecil untuk pantulan glossy (versi ringkas RoomEnvironment three.js) */
function roomEnv(T) {
  const s = new T.Scene(); s.position.y = -3.5;
  const geo = new T.BoxGeometry(); geo.deleteAttribute('uv');
  const light = new T.PointLight(0xffffff, 900, 28, 2); light.position.set(0.418, 16.199, 0.3); s.add(light);
  const room = new T.Mesh(geo, new T.MeshStandardMaterial({ side: T.BackSide })); room.position.set(-0.757, 13.219, 0.717); room.scale.set(31.713, 28.305, 28.591); s.add(room);
  const boxMat = new T.MeshStandardMaterial();
  [[-10.906, 2.009, 1.846, -0.195, 2.328, 7.905, 4.651], [-5.607, -0.754, -0.758, 0.994, 1.97, 1.534, 3.955], [6.167, 0.857, 7.803, 0.561, 3.927, 6.285, 3.687],
   [-2.017, 0.018, 6.124, 0.333, 2.002, 4.566, 2.064], [2.291, -0.756, -2.621, -0.286, 1.546, 1.552, 1.496], [-2.193, -0.369, -5.547, 0.516, 3.875, 3.487, 2.986]]
    .forEach((b) => { const m = new T.Mesh(geo, boxMat); m.position.set(b[0], b[1], b[2]); m.rotation.y = b[3]; m.scale.set(b[4], b[5], b[6]); s.add(m); });
  [[50, -16.116, 14.37, 8.208, 0.1, 2.428, 2.739], [50, -16.109, 18.021, -8.207, 0.1, 2.425, 2.751], [17, 14.904, 12.198, -1.832, 0.15, 4.265, 6.331],
   [43, -0.462, 8.89, 14.52, 4.38, 5.441, 0.088], [20, 3.235, 11.486, -12.541, 2.5, 2, 0.1], [100, 0, 20, 0, 1, 0.1, 1]]
    .forEach((l) => { const m = new T.Mesh(geo, new T.MeshLambertMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: l[0] })); m.position.set(l[1], l[2], l[3]); m.scale.set(l[4], l[5], l[6]); s.add(m); });
  return s;
}
const later = (fn) => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 400);
if (document.readyState === 'complete') later(boot); else addEventListener('load', () => later(boot), { once: true });

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const q = (s) => document.querySelector(s);

const PAL = {
  pink: ['#FFD3E4', '#FF6FA8', '#D0105A'],
  lilac: ['#F1EAFF', '#B9A2FF', '#6E56D8'],
  butter: ['#FFF6CF', '#FFD45C', '#D08F10'],
  peach: ['#FFE3D5', '#FFA27E', '#DB6238'],
  mint: ['#E0F6EA', '#8FD3AE', '#3E8C64'],
  plum: ['#F0BDD3', '#9A3466', '#4A0D2A']
};
const CAT_TINT = { all: 'pink', makeup: 'pink', skin: 'lilac', hair: 'butter', life: 'peach' };

function init(T, makeRoom) {
  const canvas = document.createElement('canvas');
  canvas.id = 'kerto3d';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:8';
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  document.body.appendChild(canvas);
  document.documentElement.classList.add('k3d');

  const isSmall = () => innerWidth < 760 || !(window.matchMedia && matchMedia('(pointer: fine)').matches);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeRoom(T), 0.04).texture;
  pmrem.dispose();
  const keyL = new T.DirectionalLight(0xffffff, 1.5); keyL.position.set(-0.6, 1, 1.4); scene.add(keyL);
  const rimL = new T.DirectionalLight(0xffd6e6, 0.9); rimL.position.set(1, 0.4, -0.6); scene.add(rimL);
  scene.add(new T.AmbientLight(0xffffff, 0.3));
  const cam = new T.OrthographicCamera(0, 1, 0, -1, 1, 5000);
  cam.position.z = 2500;

  const col = (h) => new T.Color(h);
  const RT = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return tx;
  })();
  function lathe(pts, seg = 48, n = 40) {
    const ps = new T.SplineCurve(pts.map((p) => new T.Vector2(p[0], p[1]))).getPoints(n);
    ps[0].x = 0; ps[ps.length - 1].x = 0;
    return new T.LatheGeometry(ps, seg);
  }
  const gloss = (c, rough = 0.3) => new T.MeshPhysicalMaterial({ color: col(c), roughness: rough, clearcoat: 1, clearcoatRoughness: 0.07 });
  const glass = (p) => new T.MeshPhysicalMaterial({ color: col(p[1]), roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.6, sheenRoughness: 0.4, sheenColor: col(p[0]) });
  const GOLD = new T.MeshStandardMaterial({ color: col('#E7B547'), metalness: 1, roughness: 0.26 });
  const DARK = gloss('#2A0A17', 0.32);
  const LABEL = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, side: T.DoubleSide });

  /* ---------------- Kerto ---------------- */
  function makeKerto() {
    const pal = PAL.pink;
    const bodyMat = new T.MeshPhysicalMaterial({ color: col(pal[1]), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 1, sheenRoughness: 0.35, sheenColor: col(pal[0]) });
    const deepMat = new T.MeshPhysicalMaterial({ color: col(pal[2]), roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.1 });
    const ink = new T.MeshPhysicalMaterial({ color: col('#24060F'), roughness: 0.25, clearcoat: 1 });
    const white = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 1 });
    const shine = new T.MeshBasicMaterial({ color: 0xffffff });
    const blush = new T.MeshBasicMaterial({ color: col('#FF3F86'), map: RT, transparent: true, opacity: 0.5, depthWrite: false });
    const heartMat = new T.MeshPhysicalMaterial({ color: col('#E3125A'), roughness: 0.3, clearcoat: 1 });

    const root = new T.Group(), bob = new T.Group(), sq = new T.Group(), body = new T.Group();
    root.add(bob); bob.add(sq); sq.add(body);
    sq.position.y = -1.0; body.position.y = 1.0;

    const prof = [[0, -0.9], [0.5, -0.89], [0.84, -0.78], [0.99, -0.48], [1.01, -0.1], [0.94, 0.34], [0.75, 0.7], [0.42, 0.94], [0, 1.0]];
    const pts = new T.SplineCurve(prof.map((p) => new T.Vector2(p[0], p[1]))).getPoints(64);
    pts[0].x = 0; pts[pts.length - 1].x = 0;
    const blob = new T.Mesh(new T.LatheGeometry(pts, 64), bodyMat);
    body.add(blob);
    const rAt = (y) => { let b = pts[0], d = 9; for (const p of pts) { const dd = Math.abs(p.y - y); if (dd < d) { d = dd; b = p; } } return b.x; };
    const zAt = (x, y) => Math.sqrt(Math.max(rAt(y) * rAt(y) - x * x, 0));

    const tuft = new T.Mesh(lathe([[0, 0], [0.15, 0.05], [0.19, 0.16], [0.13, 0.3], [0.05, 0.42], [0, 0.5]], 32, 24), bodyMat);
    tuft.position.set(0.1, 0.9, 0); tuft.rotation.z = -0.4; body.add(tuft);

    const hs = new T.Shape();
    hs.moveTo(0.25, 0.25); hs.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0); hs.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
    hs.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95); hs.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
    hs.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0); hs.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
    const heartGeo = new T.ExtrudeGeometry(hs, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 16 });
    heartGeo.center(); heartGeo.rotateZ(Math.PI); heartGeo.scale(0.3, 0.3, 0.3);

    const eyes = [];
    for (const sx of [-1, 1]) {
      const x = 0.34 * sx, y = 0.2, z = zAt(x, y) - 0.05;
      const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(x, z); g.rotation.x = -0.12;
      const w = new T.Mesh(new T.SphereGeometry(0.2, 32, 24), white); w.scale.set(1, 1.22, 0.5); g.add(w);
      const pupil = new T.Group(); pupil.position.set(0, 0, 0.07); g.add(pupil);
      const pm = new T.Mesh(new T.SphereGeometry(0.115, 24, 16), ink); pm.scale.set(1, 1.15, 0.5); pupil.add(pm);
      const s1 = new T.Mesh(new T.SphereGeometry(0.036, 12, 8), shine); s1.position.set(-0.035, 0.05, 0.06); pupil.add(s1);
      const s2 = new T.Mesh(new T.SphereGeometry(0.018, 8, 6), shine); s2.position.set(0.04, -0.045, 0.06); pupil.add(s2);
      const heart = new T.Mesh(heartGeo, heartMat); heart.position.set(0, -0.01, 0.1); heart.visible = false; g.add(heart);
      body.add(g); eyes.push({ g, pupil, heart });
    }
    for (const sx of [-1, 1]) {
      const x = 0.6 * sx, y = -0.08, z = zAt(x, y) + 0.03;
      const m = new T.Mesh(new T.PlaneGeometry(0.36, 0.22), blush); m.position.set(x, y, z); m.rotation.y = Math.atan2(x, z); body.add(m);
    }
    const mz = zAt(0, -0.08);
    const mouths = {
      happy: new T.Mesh(new T.TorusGeometry(0.1, 0.028, 10, 28, Math.PI), ink),
      wow: new T.Mesh(new T.SphereGeometry(0.075, 20, 14), ink),
      love: new T.Mesh(new T.TorusGeometry(0.13, 0.032, 10, 28, Math.PI), ink),
      sleepy: new T.Mesh(new T.CapsuleGeometry(0.022, 0.08, 4, 8), ink)
    };
    mouths.happy.rotation.z = Math.PI; mouths.happy.position.set(0, -0.04, mz - 0.01);
    mouths.love.rotation.z = Math.PI; mouths.love.position.set(0, -0.03, mz - 0.01);
    mouths.wow.scale.set(1, 1.3, 0.4); mouths.wow.position.set(0, -0.13, mz - 0.01);
    mouths.sleepy.rotation.z = Math.PI / 2; mouths.sleepy.position.set(0, -0.12, mz - 0.005);
    for (const k in mouths) { mouths[k].visible = k === 'happy'; body.add(mouths[k]); }

    const armGeo = new T.CapsuleGeometry(0.11, 0.2, 6, 14);
    const arms = [];
    for (const sx of [-1, 1]) {
      const pv = new T.Group(); pv.position.set(0.86 * sx, -0.3, 0.05);
      const m = new T.Mesh(armGeo, bodyMat); m.rotation.z = Math.PI / 2; m.position.x = 0.17 * sx; pv.add(m);
      pv.rotation.z = -0.65 * sx; body.add(pv); arms.push(pv);
    }
    for (const sx of [-1, 1]) {
      const f = new T.Mesh(new T.SphereGeometry(0.24, 24, 16), deepMat); f.scale.set(1.15, 0.55, 1.25); f.position.set(0.38 * sx, -0.88, 0.12); body.add(f);
    }
    const shadow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: col('#7A0F3A'), map: RT, transparent: true, opacity: 0.32, depthWrite: false }));
    shadow.scale.set(2.2, 0.34, 1); shadow.position.set(0, -0.99, -1.4); root.add(shadow);

    const tint = { cur: 'pink', from: null, t: 1 };
    const tc = { body: bodyMat.color.clone(), sheen: bodyMat.sheenColor.clone(), deep: deepMat.color.clone() };
    function setTint(name) {
      if (!PAL[name] || name === tint.cur) return;
      tint.cur = name; tint.t = 0;
      tint.from = { body: bodyMat.color.clone(), sheen: bodyMat.sheenColor.clone(), deep: deepMat.color.clone() };
      tc.body = col(PAL[name][1]); tc.sheen = col(PAL[name][0]); tc.deep = col(PAL[name][2]);
    }
    const st = { lx: 0, ly: 0.1, mood: 'happy', blinkAt: 2, blinkEnd: 0, sqY: 1, sqV: 0 };
    function update(dt, t, o) {
      st.lx = lerp(st.lx, o.lx, Math.min(1, dt * 9));
      st.ly = lerp(st.ly, o.ly, Math.min(1, dt * 9));
      body.rotation.y = st.lx * 0.5;
      body.rotation.x = st.ly * 0.32;
      const sleepy = o.mood === 'sleepy';
      for (const e of eyes) {
        e.pupil.position.x = st.lx * 0.06;
        e.pupil.position.y = sleepy ? -0.06 : -st.ly * 0.07;
        e.pupil.visible = o.mood !== 'love';
        e.heart.visible = o.mood === 'love';
        if (e.heart.visible) e.heart.scale.setScalar(1 + Math.sin(t * 12) * 0.08);
      }
      if (t > st.blinkAt) { st.blinkEnd = t + 0.13; st.blinkAt = t + 2.4 + Math.random() * 3; }
      const blinking = t < st.blinkEnd && o.mood !== 'love';
      const big = o.mood === 'wow' ? 1.12 : 1;
      const ey = blinking ? 0.1 : (sleepy ? 0.38 : 1);
      for (const e of eyes) { e.g.scale.set(big, lerp(e.g.scale.y, ey * big, Math.min(1, dt * 30)), big); }
      for (const k in mouths) mouths[k].visible = k === (o.mood === 'wave' ? 'happy' : o.mood);
      if (!mouths.happy.visible && !mouths.wow.visible && !mouths.love.visible && !mouths.sleepy.visible) mouths.happy.visible = true;
      const wave = o.wave;
      const ka = Math.min(1, dt * 8);
      arms[0].rotation.z = lerp(arms[0].rotation.z, o.air ? -0.55 : 0.65 + Math.sin(t * 2.1 + 1) * 0.05, ka);
      if (wave && !o.air) arms[1].rotation.z = 0.95 + Math.sin(t * 10) * 0.38;
      else arms[1].rotation.z = lerp(arms[1].rotation.z, o.air ? 0.55 : -0.65 + Math.sin(t * 2.1) * 0.05, ka);
      const speed = sleepy ? 1.1 : (o.walk ? 7 : 1.9);
      bob.position.y = o.still ? 0 : Math.abs(Math.sin(t * speed)) * (o.walk ? 0.12 : 0.06) * (sleepy ? 0.5 : 1);
      // squash spring (sq pivot = feet)
      const acc = (1 - st.sqY) * 170 - st.sqV * 13;
      st.sqV += acc * dt; st.sqY += st.sqV * dt;
      st.sqY = clamp(st.sqY, 0.7, 1.3);
      const sx = 1 / Math.sqrt(st.sqY);
      sq.scale.set(sx, st.sqY, sx);
      if (tint.t < 1) {
        tint.t = Math.min(1, tint.t + dt * 2.5);
        bodyMat.color.copy(tint.from.body).lerp(tc.body, tint.t);
        bodyMat.sheenColor.copy(tint.from.sheen).lerp(tc.sheen, tint.t);
        deepMat.color.copy(tint.from.deep).lerp(tc.deep, tint.t);
      }
    }
    return { root, update, setTint, kick: (v) => { st.sqV += v; } };
  }

  /* ---------------- produk generik ---------------- */
  function normalize(g) {
    const b = new T.Box3().setFromObject(g); const h = b.max.y - b.min.y; const c = b.getCenter(new T.Vector3());
    g.position.set(-c.x, -c.y, -c.z); const w = new T.Group(); w.add(g); w.scale.setScalar(1 / h);
    const o = new T.Group(); o.add(w); return o;
  }
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };
  const BUILD = {
    serum(p) {
      const g = new T.Group();
      g.add(M(lathe([[0, 0], [0.17, 0], [0.2, 0.03], [0.205, 0.1], [0.205, 0.5], [0.19, 0.58], [0.12, 0.64], [0.085, 0.66], [0, 0.66]]), glass(p)));
      g.add(M(new T.CylinderGeometry(0.209, 0.209, 0.22, 48, 1, true, -1.1, 2.2), LABEL, 0, 0.3));
      g.add(M(new T.CylinderGeometry(0.1, 0.1, 0.1, 32), GOLD, 0, 0.71));
      g.add(M(new T.CapsuleGeometry(0.075, 0.1, 8, 16), DARK, 0, 0.86));
      return g;
    },
    lip(p) {
      const g = new T.Group();
      g.add(M(new T.CylinderGeometry(0.13, 0.13, 0.5, 40), gloss('#5A1F38', 0.28), 0, 0.25));
      g.add(M(new T.CylinderGeometry(0.134, 0.134, 0.05, 40), GOLD, 0, 0.47));
      g.add(M(new T.CylinderGeometry(0.105, 0.105, 0.12, 40), GOLD, 0, 0.56));
      const bg = new T.CylinderGeometry(0.085, 0.085, 0.32, 40, 6);
      const pos = bg.attributes.position;
      for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0.15) pos.setY(i, pos.getY(i) + pos.getX(i) * 0.5);
      bg.computeVertexNormals();
      g.add(M(bg, gloss(p[1], 0.35), 0, 0.77));
      return g;
    },
    jar(p) {
      const g = new T.Group();
      g.add(M(lathe([[0, 0], [0.44, 0], [0.5, 0.04], [0.5, 0.4], [0.47, 0.44], [0, 0.44]], 56), new T.MeshPhysicalMaterial({ color: col(p[0]), roughness: 0.42, clearcoat: 0.6 })));
      g.add(M(new T.CylinderGeometry(0.503, 0.503, 0.08, 56, 1, true), gloss(p[2]), 0, 0.22));
      g.add(M(lathe([[0, 0.42], [0.5, 0.42], [0.53, 0.45], [0.53, 0.62], [0.5, 0.66], [0, 0.66]], 56), gloss(p[1], 0.25)));
      return g;
    },
    pump(p) {
      const g = new T.Group();
      g.add(M(lathe([[0, 0], [0.17, 0], [0.21, 0.04], [0.215, 0.12], [0.215, 0.5], [0.2, 0.58], [0.13, 0.64], [0.08, 0.66], [0, 0.66]]), glass(p)));
      g.add(M(new T.CylinderGeometry(0.219, 0.219, 0.24, 48, 1, true, -1.05, 2.1), LABEL, 0, 0.3));
      g.add(M(new T.CylinderGeometry(0.085, 0.09, 0.08, 32), DARK, 0, 0.7));
      g.add(M(new T.CylinderGeometry(0.025, 0.025, 0.08, 16), GOLD, 0, 0.78));
      g.add(M(new T.CylinderGeometry(0.07, 0.07, 0.06, 32), DARK, 0, 0.84));
      g.add(M(new T.BoxGeometry(0.16, 0.032, 0.045), DARK, 0.1, 0.855));
      return g;
    },
    tube(p) {
      const g = new T.Group();
      const tg = new T.CylinderGeometry(0.17, 0.17, 0.8, 40, 20);
      const pos = tg.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const k = clamp((pos.getY(i) + 0.4) / 0.8, 0, 1);
        pos.setZ(i, pos.getZ(i) * (1 - 0.88 * Math.pow(k, 1.6)));
        pos.setX(i, pos.getX(i) * (1 + 0.28 * k));
      }
      tg.computeVertexNormals();
      g.add(M(tg, gloss(p[1], 0.28), 0, 0.58));
      g.add(M(new T.BoxGeometry(0.44, 0.05, 0.035), gloss(p[1], 0.28), 0, 0.99));
      g.add(M(new T.BoxGeometry(0.2, 0.03, 0.01), LABEL, 0, 0.56, 0.14));
      g.add(M(new T.CylinderGeometry(0.12, 0.13, 0.18, 32), gloss('#FFFFFF', 0.25), 0, 0.09));
      return g;
    },
    cushion(p) {
      const g = new T.Group();
      g.add(M(lathe([[0, 0], [0.44, 0], [0.5, 0.04], [0.5, 0.18], [0.46, 0.22], [0, 0.22]], 56), gloss(p[1], 0.26)));
      g.add(M(new T.CylinderGeometry(0.22, 0.22, 0.012, 48), new T.MeshStandardMaterial({ color: col(p[0]), metalness: 1, roughness: 0.12 }), 0, 0.225));
      return g;
    },
    pop(p) {
      const g = new T.Group();
      const arch = (r, y0) => { const s = new T.Shape(); s.moveTo(-r, y0); s.absarc(0, 0.42, r, Math.PI, 0, true); s.lineTo(r, y0); return s; };
      const ice = new T.ExtrudeGeometry(arch(0.18, 0), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 24 }); ice.translate(0, 0, -0.05);
      const coat = new T.ExtrudeGeometry(arch(0.19, 0.3), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 24 }); coat.translate(0, 0, -0.06);
      g.add(M(ice, gloss(p[1], 0.32)));
      g.add(M(coat, gloss('#4A1028', 0.28)));
      g.add(M(new T.BoxGeometry(0.07, 0.3, 0.03), new T.MeshStandardMaterial({ color: col('#E2BE84'), roughness: 0.7 }), 0, -0.13));
      return g;
    }
  };
  const PROD_DESK = [
    ['serum', 'lilac', -0.04, 0.52, 0.86, 26, -0.32],
    ['tube', 'mint', 0.06, 0.2, 0.56, 32, 0.5],
    ['lip', 'pink', 1.02, 0.4, 0.62, 34, 0.32],
    ['pump', 'peach', 0.95, 0.82, 0.72, 22, 0.14],
    ['jar', 'butter', 0.0, 0.86, 0.34, 16, -0.14],
    ['cushion', 'pink', 0.76, 1.05, 0.21, 12, 0.1]
  ];
  const PROD_SMALL = [
    ['serum', 'lilac', 0.08, 0.5, 0.62, 10, -0.3],
    ['lip', 'pink', 0.93, 0.42, 0.5, 12, 0.3],
    ['jar', 'butter', 0.16, 0.93, 0.3, 8, -0.12],
    ['pump', 'peach', 0.88, 0.88, 0.56, 10, 0.12]
  ];
  const prods = [];
  function buildProds() {
    for (const p of prods) scene.remove(p.obj);
    prods.length = 0;
    (isSmall() ? PROD_SMALL : PROD_DESK).forEach((c, i) => {
      const obj = normalize(BUILD[c[0]](PAL[c[1]]));
      obj.rotation.y = i * 0.9;
      scene.add(obj);
      prods.push({ obj, fx: c[2], fy: c[3], h: c[4], depth: c[5], rz: c[6], dir: i % 2 ? 1 : -1, i, spin: 0 });
    });
  }

  const K = makeKerto();
  K.root.position.z = 400;
  scene.add(K.root);
  buildProds();

  /* ---------------- bubble ---------------- */
  const bubble = document.createElement('div');
  bubble.className = 'k3d-bubble'; bubble.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bubble);
  let bubbleUntil = 0;
  function say(id, en, ms = 2400) {
    bubble.textContent = document.documentElement.lang === 'en' ? en : id;
    bubble.classList.add('show'); bubbleUntil = performance.now() + ms;
  }

  /* ---------------- input ---------------- */
  const ptr = { x: innerWidth * 0.5, y: innerHeight * 0.4, at: -1e9, touch: false };
  let hoverEl = null;
  const ray = new T.Raycaster(); const ndc = new T.Vector2();
  function hitTest(x, y) {
    ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (ray.intersectObject(K.root, true).length) return 'kerto';
    for (const p of prods) if (p.obj.visible && ray.intersectObject(p.obj, true).length) return p;
    return null;
  }
  addEventListener('pointermove', (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now(); ptr.touch = e.pointerType !== 'mouse';
    hoverEl = e.target && e.target.closest ? e.target.closest('a,button,.chip,.frame') : null;
    if (e.pointerType === 'mouse') document.documentElement.classList.toggle('k3d-hover', hitTest(e.clientX, e.clientY) === 'kerto');
    wake();
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now(); ptr.touch = e.pointerType !== 'mouse';
    const h = hitTest(e.clientX, e.clientY);
    if (h === 'kerto') poke();
    else if (h && h.obj) h.spin = 1;
    wake();
  }, { passive: true });
  let loveUntil = 0, waveUntil = 0;
  const POKES = [['Hehe, geli!', 'Hehe, that tickles!'], ['Hai lagi!', 'Hi again!'], ['Yuk lihat karya Vero!', 'Check out Vero’s work!']];
  let pokeN = 0;
  function poke() {
    loveUntil = clock + 1.6; K.kick(-5);
    const m = POKES[pokeN++ % POKES.length]; say(m[0], m[1], 1800);
  }
  let filterTint = 'pink';
  const filters = document.getElementById('filters');
  if (filters) filters.addEventListener('click', () => setTimeout(() => {
    const b = filters.querySelector('[aria-pressed="true"]');
    filterTint = CAT_TINT[b ? b.getAttribute('data-cat') : 'all'] || 'pink';
    K.kick(-3); wake();
  }, 0));

  /* ---------------- sections & anchors ---------------- */
  const SECS = [
    ['hero', q('.hero')], ['stats', q('.stats')], ['about', q('#about')], ['work', q('#work')], ['brands', q('.brands')],
    ['services', q('#services')], ['process', q('section[aria-labelledby="process-title"]')], ['contact', q('#contact')], ['contact', q('.foot')]
  ].filter((s) => s[1]);
  let lastSec = 'hero';
  function activeSec() {
    const y = H * 0.55;
    for (const [k, el] of SECS) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y) return k; }
    return lastSec;
  }
  function textRects(el) {
    const rg = document.createRange(); rg.selectNodeContents(el);
    return Array.prototype.filter.call(rg.getClientRects(), (r) => r.width > 2);
  }
  let hop = 0, hopNext = 0, hopsDone = false, procP = 0;
  function anchorFor(k) {
    const small = isSmall();
    if (k === 'hero') {
      const f = q('.stack .frame:nth-child(2)'); if (!f) return null;
      const r = f.getBoundingClientRect(); if (r.width < 20) return null;
      return { key: 'hero', x: r.left + r.width / 2, y: r.top + r.height * 0.015, s: clamp(r.width * 0.27, 26, 58) };
    }
    if (k === 'stats') {
      const card = q('.stat-card'); if (!card) return null;
      const r = card.getBoundingClientRect(); const s = clamp(r.width * 0.032, 28, 50);
      if (small) return { key: 'stats', x: r.right - s * 1.7, y: r.top + 2, s };
      const sts = card.querySelectorAll('.stat'); const i = Math.min(hop, sts.length - 1);
      const sr = sts[i].getBoundingClientRect();
      return { key: 'stats:' + i, x: sr.left + Math.min(sr.width * 0.5, s * 1.8), y: r.top + 2, s, stat: sts[i] };
    }
    if (k === 'about') {
      const h = q('#about-title'); if (!h) return null;
      const rs = textRects(h); const last = rs[rs.length - 1]; if (!last) return null;
      const s = clamp(last.height * 0.3, 24, 50);
      return { key: 'about', x: last.right + s * 1.3, y: last.bottom - last.height * 0.14, s, wave: true };
    }
    if (k === 'work') {
      const chips = document.querySelectorAll('#filters .chip'); const last = chips[chips.length - 1]; if (!last) return null;
      const r = last.getBoundingClientRect(); const s = clamp(r.height * 0.8, 26, 34);
      if (r.right + s * 2.2 < W) return { key: 'work', x: r.right + s * 1.3, y: r.bottom, s, tint: filterTint };
      return null;
    }
    if (k === 'brands') {
      const m = q('.brands .marquee'); if (!m) return null;
      const r = m.getBoundingClientRect(); const s = clamp(r.height * 0.32, 24, 46);
      return { key: 'brands', x: W * 0.5 + Math.sin(clock * 0.45) * Math.min(W * 0.3, 420), y: r.top + 4, s, wave: true, tint: 'butter', surf: true };
    }
    if (k === 'services') {
      const c = q('.svc'); if (!c) return null;
      const r = c.getBoundingClientRect(); const s = clamp(r.width * 0.1, 26, 44);
      return { key: 'services', x: r.right - s * 1.9, y: r.top + 2, s };
    }
    if (k === 'process') {
      const tl = q('.timeline'); if (!tl) return null;
      const r = tl.getBoundingClientRect();
      procP = clamp((H * 0.78 - r.top) / (H * 0.5), 0, 1);
      if (small || W < 820) return null;
      const s = clamp(r.width * 0.026, 24, 40);
      return { key: 'process', x: r.left + 12 + procP * (r.width - 24), y: r.top + 11, s, walk: true };
    }
    if (k === 'contact') {
      if (small) {
        const h = q('#contact-title'); const rs = h ? textRects(h) : []; const last = rs[rs.length - 1];
        if (!last) return null; const s = clamp(last.height * 0.34, 26, 40);
        if (last.right + s * 2.4 > W) return null;
        return { key: 'contact', x: last.right + s * 1.3, y: last.bottom - last.height * 0.12, s, wave: true };
      }
      const l = q('#contact .links'); if (!l) return null;
      const r = l.getBoundingClientRect(); const s = clamp(r.width * 0.04, 28, 52);
      return { key: 'contact', x: r.right - s * 1.7, y: r.top + 2, s, wave: true };
    }
    return null;
  }
  const dockA = () => { const s = isSmall() ? 21 : 27; return { key: 'dock', x: W - s * 2.3, y: H - 8, s }; };
  const ok = (a) => a && a.y > 86 && a.y < H + 2 && a.x > 10 && a.x < W - 10;

  /* ---------------- loop ---------------- */
  let W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    cam.left = 0; cam.right = W; cam.top = 0; cam.bottom = -H; cam.updateProjectionMatrix();
  }
  resize();
  let small0 = isSmall();
  addEventListener('resize', () => { resize(); if (isSmall() !== small0) { small0 = isSmall(); buildProds(); } wake(); });

  let clock = 0, prev = performance.now(), cur = null, jump = null, lastKey = '', prevX = 0, appear = 0, greeted = false;
  const entered = {};
  function onEnter(key) {
    const base = key.split(':')[0];
    if (entered[base]) return; entered[base] = true;
    if (base === 'about') say('Kenalan sama Vero yuk!', 'Say hi to Vero!');
    if (base === 'work') say(isSmall() ? 'Ketuk video buat suara' : 'Klik video buat nyalain suara', isSmall() ? 'Tap a video for sound' : 'Click a video for sound');
    if (base === 'brands') say('Wiii!', 'Wheee!', 1600);
    if (base === 'contact') say('DM aku ya!', 'DM me!');
  }
  let running = false;
  function wake() { if (!running) { running = true; prev = performance.now(); requestAnimationFrame(frame); } }
  function frame() {
    const now = performance.now();
    const dt = clamp((now - prev) / 1000, 0, 0.05); prev = now; clock += dt;
    const sec = activeSec(); lastSec = sec;
    if (sec === 'stats' && !isSmall() && !hopsDone) {
      if (clock > hopNext) { if (hopNext) hop++; hopNext = clock + 0.62; if (hop >= 4) hopsDone = true; }
    }
    let a = anchorFor(sec); if (!ok(a)) a = dockA();
    if (!cur) cur = { x: a.x, y: a.y, s: a.s };
    if (a.key !== lastKey) {
      if (lastKey && !REDUCE) {
        const d = Math.hypot(a.x - cur.x, a.y - cur.y);
        jump = { fx: cur.x, fy: cur.y, fs: cur.s, t0: clock, dur: 0.5 + Math.min(0.4, d / 2400), arc: clamp(d * 0.35, 50, 200) };
        K.kick(2.2);
      }
      lastKey = a.key; onEnter(a.key);
    }
    let air = false;
    if (jump) {
      const p = Math.min(1, (clock - jump.t0) / jump.dur), e = ease(p);
      cur.x = lerp(jump.fx, a.x, e); cur.y = lerp(jump.fy, a.y, e) - Math.sin(Math.PI * p) * jump.arc; cur.s = lerp(jump.fs, a.s, e);
      air = p < 1;
      if (p >= 1) {
        jump = null; K.kick(-4.5);
        if (a.stat) { a.stat.classList.remove('boing'); void a.stat.offsetWidth; a.stat.classList.add('boing'); }
      }
    } else { cur.x = a.x; cur.y = a.y; cur.s = lerp(cur.s, a.s, Math.min(1, dt * 8)); }

    const nowMs = performance.now();
    const fresh = nowMs - ptr.at < (ptr.touch ? 2600 : 9000);
    const sleepy = !REDUCE && !ptr.touch && nowMs - ptr.at > 9000 && clock > 12;
    const hx = cur.x, hy = cur.y - cur.s * 1.25;
    let lx = 0, ly = 0.12;
    if (fresh && !sleepy) { lx = clamp((ptr.x - hx) / 320, -1, 1); ly = clamp((ptr.y - hy) / 280, -1, 1); }
    let mood = 'happy';
    if (sleepy) mood = 'sleepy';
    if (fresh && hoverEl) mood = 'wow';
    if (lastKey === 'contact' && fresh && hoverEl && hoverEl.closest && hoverEl.closest('.link-card,[data-ratecard]')) mood = 'love';
    if (clock < loveUntil) mood = 'love';
    K.setTint(a.tint || (lastKey === 'work' ? filterTint : 'pink'));

    appear = Math.min(1, appear + dt * 1.4);
    const pop = appear < 1 ? 1 - Math.pow(1 - appear, 3) * Math.cos(appear * 9) : 1;
    if (!greeted && appear > 0.6) { greeted = true; say('Hai, aku Kerto!', 'Hi, I’m Kerto!'); }
    K.root.position.set(cur.x, -cur.y + cur.s * 1.0, 400);
    K.root.scale.setScalar(Math.max(0.001, cur.s * pop));
    const vx = (cur.x - prevX) / Math.max(dt, 0.001); prevX = cur.x;
    K.root.rotation.z = a.surf ? lerp(K.root.rotation.z, clamp(-vx / 900, -0.3, 0.3), Math.min(1, dt * 6)) : lerp(K.root.rotation.z, 0, Math.min(1, dt * 6));
    K.update(dt, clock, { lx, ly, mood, wave: !!a.wave || clock < waveUntil, air, walk: !!a.walk, still: REDUCE });

    // produk di hero
    const hv = q('.hero-visual'), fr = q('.stack .frame:nth-child(2)');
    if (hv && fr) {
      const r = hv.getBoundingClientRect(), fw = fr.getBoundingClientRect().width;
      const show = r.bottom > -60 && r.top < H + 60;
      const nx = fresh ? (ptr.x / W - 0.5) * 2 : 0, ny = fresh ? (ptr.y / H - 0.5) * 2 : 0;
      for (const p of prods) {
        p.obj.visible = show; if (!show) continue;
        const k = Math.min(1, Math.max(0, (appear - 0.15 - p.i * 0.07) * 2.2));
        const sz = p.h * fw * (k < 1 ? 1 - Math.pow(1 - k, 3) : 1);
        const x = r.left + p.fx * r.width - nx * p.depth;
        const y = r.top + p.fy * r.height - ny * p.depth + (REDUCE ? 0 : Math.sin(clock * 1.1 + p.i) * 6);
        p.obj.position.set(x, -y, 120 + p.i * 20);
        p.obj.scale.setScalar(Math.max(0.001, sz));
        if (p.spin > 0) { p.obj.rotation.y += dt * 14 * p.spin; p.spin = Math.max(0, p.spin - dt * 1.2); }
        if (!REDUCE) p.obj.rotation.y += dt * 0.45 * p.dir;
        p.obj.rotation.z = p.rz + (REDUCE ? 0 : Math.sin(clock * 0.6 + p.i) * 0.08);
        p.obj.rotation.x = 0.18 + ny * 0.18;
      }
    }

    // bubble
    if (bubble.classList.contains('show')) {
      if (nowMs > bubbleUntil) bubble.classList.remove('show');
      const bw = bubble.offsetWidth || 120;
      let bx = cur.x + cur.s * 0.8, by = cur.y - cur.s * 2.55;
      if (bx + bw > W - 8) bx = cur.x - cur.s * 0.8 - bw;
      bubble.style.transform = 'translate(' + Math.round(bx) + 'px,' + Math.round(Math.max(70, by)) + 'px)';
    }

    renderer.render(scene, cam);
    if (REDUCE && !jump && appear >= 1) { running = false; return; }
    requestAnimationFrame(frame);
  }
  addEventListener('scroll', wake, { passive: true });
  if (/[?&]debug/.test(location.search)) window.__k3d = { prods, scene, K, get cur() { return cur; }, get key() { return lastKey; }, get appear() { return appear; }, get clock() { return clock; }, get running() { return running; } };
  wake();
}
