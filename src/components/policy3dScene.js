import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// יחידות: מטרים. החזית של המשאית (חלון השירות) פונה אל Z חיובי.
// צבעי הסצנה נלקחים מערכת הנושא של האפליקציה (כהה או בהיר), כך שההמחשה תואמת את המסך.
let C = {};
function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fb) => new THREE.Color((cs.getPropertyValue(name).trim()) || fb).getHex();
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  C = {
    light,
    bg: v('--bg', '#101214'),
    paving: light ? 0xcfd4da : 0x2a3036,
    tile: light ? 0xaab1b9 : 0x3b434b,
    ground: light ? 0xb9c9b4 : 0x1d2a22,
    truck: light ? 0xffffff : 0xdfe3e8,
    dark: light ? 0x2a3138 : 0x0d0f11,
    accent: v('--blue', '#8ab8ff'),
    green: v('--green', '#63d18f'),
    red: v('--red', '#ff8077'),
    amber: v('--orange', '#f2b64c'),
  };
}

const VIEWS = {
  overview: { pos: [9, 6.5, 11], target: [0, 1.2, 0] },
  place: { pos: [10, 8, 12], target: [0, 0, -1] },
  design: { pos: [7, 4.5, 8], target: [0, 1.6, 0] },
  access: { pos: [4.5, 2.8, 9.5], target: [0.6, 0.9, 1.6] },
  ops: { pos: [13, 14, 19], target: [0, 0.5, 0] },
  bans: { pos: [8, 5, 9.5], target: [0, 1.2, 0.8] },
  permit: { pos: [22, 9, 14], target: [13, 1.2, 0] },
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...opts });
}
function box(w, h, d, color, opts) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
}
function ghost(w, h, d, color, opacity = 0.35) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
  m.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(m.geometry),
    new THREE.LineBasicMaterial({ color }),
  ));
  return m;
}
function line(points, color) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color }));
}
function label(text, tone, pos) {
  const el = document.createElement('div');
  el.className = `p3d-label ${tone || ''}`;
  el.innerHTML = text;
  const o = new CSS2DObject(el);
  o.position.set(...pos);
  return o;
}
function cross(size, color) {
  const g = new THREE.Group();
  [Math.PI / 4, -Math.PI / 4].forEach(r => {
    const b = box(size, size * 0.12, size * 0.12, color, { emissive: color, emissiveIntensity: 0.6 });
    b.rotation.z = r;
    g.add(b);
  });
  return g;
}
function flatRect(w, d, color, opacity = 0.4) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}
function ring(r, color, w = 0.12) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(r - w / 2, r + w / 2, 128),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.03;
  return m;
}

function buildTruck() {
  const g = new THREE.Group();
  const body = box(5.4, 2.0, 2.3, C.truck);
  body.position.y = 1.55;
  g.add(body);
  // תא נהג
  const cab = box(1.5, 1.5, 2.2, C.light ? 0xb4bbc2 : 0x8b929a);
  cab.position.set(-3.4, 1.3, 0);
  g.add(cab);
  // חלון שירות בחזית
  const win = box(2.6, 0.9, 0.06, C.dark);
  win.position.set(0.3, 1.9, 1.16);
  g.add(win);
  // דלפק, גובה פני העבודה 1.10 מ׳
  const counter = box(2.8, 0.06, 0.45, C.accent);
  counter.position.set(0.3, 1.1, 1.38);
  g.add(counter);
  // שילוט בחזית
  const sign = box(2.6, 0.45, 0.06, C.green, { emissive: C.green, emissiveIntensity: 0.25 });
  sign.position.set(0.3, 2.85 - 0.05, 1.16);
  sign.scale.set(1, 1, 1);
  sign.position.y = 2.75;
  g.add(sign);
  // גלגלים
  [[-3.4, 1.0], [-3.4, -1.0], [1.2, 1.0], [1.2, -1.0], [2.1, 1.0], [2.1, -1.0]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 24), mat(0x111111));
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.45, z * 1.1);
    g.add(w);
  });
  return g;
}

export function createPolicyScene(container, onReady) {
  const w = () => container.clientWidth;
  const h = () => container.clientHeight;

  readPalette();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 70, 160);

  const camera = new THREE.PerspectiveCamera(45, w() / h(), 0.1, 400);
  camera.position.set(...VIEWS.overview.pos);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w(), h());
  container.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.setSize(w(), h());
  labels.domElement.className = 'p3d-labels';
  container.appendChild(labels.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 2;
  controls.maxDistance = 90;
  controls.target.set(...VIEWS.overview.target);

  scene.add(new THREE.HemisphereLight(0xffffff, C.light ? 0x9aa4ad : 0x1b2430, C.light ? 1.5 : 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(12, 20, 10);
  scene.add(sun);

  // קרקע: ריצוף, ומסביב צמחייה
  const ground = box(160, 0.1, 160, C.ground);
  ground.position.y = -0.06;
  scene.add(ground);
  const plaza = box(26, 0.1, 18, C.paving);
  plaza.position.set(6, -0.01, 0);
  scene.add(plaza);
  const grid = new THREE.GridHelper(26, 26, C.tile, C.tile);
  grid.scale.z = 18 / 26;
  grid.position.set(6, 0.05, 0);
  scene.add(grid);

  const truck = buildTruck();
  scene.add(truck);

  const groups = {};
  const mk = id => { groups[id] = new THREE.Group(); scene.add(groups[id]); return groups[id]; };

  // 1. מיקום
  {
    const g = mk('place');
    const veg = ghost(26, 0.3, 3, C.red, 0.25);
    veg.position.set(6, 0.15, -7.5);
    g.add(veg);
    const x = cross(1.2, C.red); x.position.set(6, 1.1, -7.5); g.add(x);
    g.add(label('<b>אסור</b> על צמחייה או אדמה', 'bad', [6, 2.0, -7.5]));
    g.add(label('<b>ריצוף קיים</b> בלבד', 'good', [-1.5, 0.4, 3.8]));
    const axis = flatRect(26, 1.6, C.red, 0.3);
    axis.position.set(6, 0.06, 6.4);
    g.add(axis);
    g.add(label('<b>אסור</b> על ציר הליכה ראשי או שער כניסה', 'bad', [10, 0.6, 6.4]));
    [[-1.2, 0xfbbc04, 'מים'], [0, 0x4285f4, 'ביוב'], [1.2, 0xea4335, 'חשמל']].forEach(([px, col, name]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16), mat(col, { emissive: col, emissiveIntensity: 0.4 }));
      post.position.set(px + 0.3, 0.25, -1.9);
      g.add(post);
      g.add(label(name, '', [px + 0.3, 0.8, -1.9]));
    });
    g.add(label('חיבור <b>לנקודות קיימות</b> בלבד', 'good', [0.3, 1.6, -2.6]));
  }

  // 2. עיצוב
  {
    const g = mk('design');
    const roofSign = ghost(2.6, 0.5, 0.1, C.red, 0.5);
    roofSign.position.set(0.3, 3.3, 0);
    g.add(roofSign);
    const x = cross(0.7, C.red); x.position.set(0.3, 3.3, 0.1); g.add(x);
    g.add(label('<b>אסור</b> שלט על הגג', 'bad', [0.3, 4.0, 0]));
    g.add(label('שילוט <b>בחזית</b> בלבד', 'good', [0.3, 3.15, 1.4]));
    g.add(label('<b>נייד</b> על גלגלים, ללא יסודות. פינוי תוך 24 שעות', 'good', [-1.2, 0.2, 2.2]));
    g.add(label('מיזוג <b>מוסתר</b> בתוך המבנה', 'good', [-2.2, 2.9, -1.2]));
    g.add(label('חומרים: <b>עץ ומתכת</b> בלבד', 'good', [3.4, 2.7, 1.2]));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3, 12), new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.55 }));
    pole.position.set(4.6, 1.5, 1.6);
    g.add(pole);
    g.add(label('<b>אין</b> עמודי תאורה חיצוניים', 'bad', [4.6, 3.3, 1.6]));
    g.add(label('אחסון <b>פנימי</b> בלבד', 'good', [-0.6, 2.9, -1.2]));
  }

  // 3. נגישות
  {
    const g = mk('access');
    g.add(line([[2.2, 0, 2.0], [2.2, 1.1, 2.0]], C.amber));
    g.add(line([[2.1, 1.1, 2.0], [2.3, 1.1, 2.0]], C.amber));
    g.add(label('דלפק <b>110 ס״מ</b>', 'warn', [2.2, 0.55, 2.0]));
    const zone = ghost(2.8, 0.6, 0.5, C.green, 0.28);
    zone.position.set(0.3, 0.8, 1.4);
    g.add(zone);
    g.add(label('מזון עד <b>110 ס״מ</b>, עד 50 מהדופן', 'good', [-1.8, 0.8, 1.7]));
    const turn = flatRect(1.5, 1.5, C.accent, 0.45);
    turn.position.set(0.3, 0.06, 2.9);
    g.add(turn);
    g.add(label('תמרון כיסא גלגלים <b>150×150</b>', 'good', [0.3, 0.5, 2.9]));
    const lane = flatRect(0.9, 3.2, C.green, 0.35);
    lane.position.set(2.2, 0.07, 3.1);
    g.add(lane);
    g.add(label('מעבר <b>90 ס״מ</b>', 'good', [2.2, 0.4, 4.4]));
  }

  // 4. תפעול
  {
    const g = mk('ops');
    g.add(ring(10, C.green, 0.12));
    g.add(label('ניקיון ברדיוס <b>10 מ׳</b> מקצה השטח', 'good', [10, 1, 0]));
    const gen = box(0.8, 0.6, 0.5, 0x555d66);
    gen.position.set(-2.2, 0.3, -2.6);
    g.add(gen);
    [1.5, 3, 5].forEach(r => {
      const rg = ring(r, C.amber, 0.06);
      rg.position.set(-2.2, 0.04, -2.6);
      g.add(rg);
    });
    g.add(label('גנרטור שקט <b>53–57 dB</b> ב-5 מ׳', 'warn', [-4.2, 1.4, 2.2]));
    g.add(label('<b>אסור</b> רמקול. מוזיקה ותאורה רק מתוך הפודטראק', 'bad', [0.3, 4.2, 0]));
    g.add(label('שעות לפי <b>חוק העזר</b>', '', [5.2, 2.2, -2.4]));
    const bin = box(0.5, 0.7, 0.5, C.green);
    bin.position.set(2.6, 0.35, 1.7);
    g.add(bin);
    g.add(label('פסולת <b>בשקיות סגורות</b>', 'good', [2.6, 1.1, 1.7]));
  }

  // 5. איסורים
  {
    const g = mk('bans');
    const rug = ghost(2.6, 0.04, 1.4, C.red, 0.5);
    rug.position.set(0.3, 0.05, 2.6);
    g.add(rug);
    g.add(label('<b>שטיחון / דשא מלאכותי</b>', 'bad', [0.3, 0.6, 2.6]));
    const fridge = ghost(0.8, 1.7, 0.7, C.red, 0.4);
    fridge.position.set(4.4, 0.85, 0.8);
    g.add(fridge);
    const x1 = cross(0.8, C.red); x1.position.set(4.4, 1.0, 1.2); g.add(x1);
    g.add(label('<b>מקרר / כספומט</b> חיצוני', 'bad', [4.4, 2.1, 0.8]));
    const awning = ghost(3.4, 0.08, 1.6, C.red, 0.4);
    awning.position.set(0.3, 2.9, 2.0);
    g.add(awning);
    g.add(label('<b>גגון / סככה</b>', 'bad', [0.3, 3.3, 2.0]));
    const ac = ghost(0.9, 0.6, 0.5, C.red, 0.5);
    ac.position.set(-3.0, 2.3, 1.35);
    g.add(ac);
    g.add(label('<b>מנוע מיזוג</b> תלוי', 'bad', [-3.0, 2.9, 1.35]));
    const gas = ghost(0.3, 0.9, 0.3, C.red, 0.5);
    gas.position.set(-1.6, 0.45, -2.6);
    g.add(gas);
    g.add(label('<b>גלילי גז</b> ובלוני לחץ', 'bad', [-1.6, 1.3, -2.6]));
    const sprinkler = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), mat(C.red, { emissive: C.red }));
    sprinkler.position.set(-4.5, 0.15, 2.5);
    g.add(sprinkler);
    g.add(label('<b>השקיה</b>', 'bad', [-4.5, 0.7, 2.5]));
  }

  // 6. רישוי: חמישה שלבים עולים
  {
    const g = mk('permit');
    const names = ['א׳ קונספט', 'ב׳ ביקורת', 'ג׳ תיקון', 'ד׳ אישור', 'ה׳ רישיון'];
    names.forEach((n, i) => {
      const last = i === names.length - 1;
      const step = box(2.2, 0.6 * (i + 1), 3, last ? C.green : C.accent, { transparent: true, opacity: 0.92 });
      step.position.set(8 + i * 2.2, 0.3 * (i + 1), 0);
      g.add(step);
      g.add(label(n, last ? 'good' : '', [8 + i * 2.2, 0.6 * (i + 1) + 0.5, 0]));
    });
    g.add(label('רישיון <b>עד סוף השנה</b>. חידוש עד 60 ימים לפני', 'good', [16.8, 4.4, 0]));
  }

  Object.values(groups).forEach(g => { g.visible = false; });

  // אנימציית מצלמה
  let goal = null;
  const setView = (id) => {
    Object.entries(groups).forEach(([k, g]) => { g.visible = k === id; });
    const v = VIEWS[id] || VIEWS.overview;
    goal = { pos: new THREE.Vector3(...v.pos), target: new THREE.Vector3(...v.target) };
  };

  let raf = 0;
  let autoRotate = false;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (goal) {
      camera.position.lerp(goal.pos, 0.07);
      controls.target.lerp(goal.target, 0.07);
      if (camera.position.distanceTo(goal.pos) < 0.05) goal = null;
    }
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  };
  tick();

  const onResize = () => {
    camera.aspect = w() / h();
    camera.updateProjectionMatrix();
    renderer.setSize(w(), h());
    labels.setSize(w(), h());
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(container);
  controls.addEventListener('start', () => { goal = null; });

  onReady?.();

  return {
    setView,
    setAutoRotate: (v) => { autoRotate = v; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    },
  };
}
