import { test, expect } from '@playwright/test';

// Supabase is mocked: every request is answered here and every write is recorded.
const SB = 'https://cbhexpybdggwzyakgagd.supabase.co';

function position(i, extra = {}) {
  return {
    id: `00000000-0000-4000-8000-00000000000${i}`,
    number: String(i),
    position_name: `עמדה בדיקה ${i}`,
    complex_name: i % 2 ? 'טיילת המרינה' : 'נחל לכיש',
    business_name: i === 1 ? 'אסאי' : '',
    owner_name: '',
    water: i === 2 ? 'לא טוב' : 'טוב',
    electricity: 'טוב',
    sewage: 'טוב',
    business_license: 'יש',
    traffic: 'טוב', waste: 'טוב', accessibility: 'טוב', lighting: 'טוב',
    building_quality: 'יש מבנה',
    environment_quality: 'טעון שיפור',
    approval: ['מיקום מקובל', 'בבדיקה', 'מיקום לא מקובל', 'מקובלת'][i % 4],
    status: 'בבדיקה',
    notes: 'הערה',
    map_pin_x: 34.6415 + i * 0.002,
    map_pin_y: 31.8014 + i * 0.001,
    food_truck_image_url: '',
    food_truck_image_alt: '',
    developer_name: i === 1 ? 'דנה יזמית' : '',
    developer_email: i === 1 ? 'dana@example.com' : '',
    developer_phone: '',
    harmonica_status: i === 1 ? 'הוגשה' : 'לא הוגשה',
    harmonica_approved_at: null,
    harmonica_approved_by: '',
    created_at: '2026-06-22T01:20:24Z',
    updated_at: '2026-06-22T01:20:24Z',
    deleted_at: null,
  };
}

async function mockSupabase(page, { editor = true } = {}) {
  const writes = [];
  const uploads = [];
  const positions = [1, 2, 3, 4].map(i => position(i));
  const tables = {
    foode_positions: positions,
    foode_documents: [{ id: 'd1', position_id: positions[0].id, kind: 'harmonica', title: 'הרמוניקה.pdf', file_url: 'https://example.com/h.pdf', file_path: 'x', mime: 'application/pdf', size: 120000, uploaded_by: 'ענת', created_at: '2026-10-01T10:00:00Z' }],
    foode_position_events: [{ id: 'e1', position_id: positions[0].id, kind: 'correction', body: 'להגדיל את הצללה', author: 'ענת', resolved: false, meta: {}, created_at: '2026-10-02T10:00:00Z' }],
    foode_links: [{ id: 'l1', title: 'מצגת', url: 'https://example.com', created_at: '2026-06-22T00:00:00Z' }],
    foode_examples: [{ id: 'x1', type: 'good', title: 'ספסל מובנה', description: 'תיאור', imageUrl: null, created_at: '2026-06-22T00:00:00Z' }],
  };

  if (editor) await page.addInitScript(() => localStorage.setItem('foode3-editor-key', 'test-key'));
  // The A&I logo button comes from the portfolio app; AI_MENU_JS can point to a local copy.
  if (process.env.AI_MENU_JS) await page.route('https://appofapp-gh.vercel.app/ai-menu.js', r => r.fulfill({ path: process.env.AI_MENU_JS, contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com|arcgisonline\.com/, r => r.abort());
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.pathname.startsWith('/rest/v1/rpc/foode_editor')) return json(editor ? 'ענת' : null);
    if (url.pathname.startsWith('/rest/v1/rpc/foode_write')) {
      const body = req.postDataJSON();
      writes.push(body);
      if (!editor) return json({ message: 'not_authorized', code: '42501' }, 403);
      // Like foode_write: upsert merges into the stored row and returns all of it
      const list = tables[`foode_${body.p_table}`] || (tables[`foode_${body.p_table}`] = []);
      let row = list.find(r => r.id === body.p_id);
      if (!row) { row = { id: body.p_id, created_at: new Date().toISOString() }; list.push(row); }
      if (body.p_op === 'remove') row.deleted_at = new Date().toISOString();
      else Object.assign(row, body.p_data);
      return json(row);
    }
    if (url.pathname.startsWith('/functions/v1/foode-upload')) {
      const body = req.postDataJSON();
      uploads.push(body);
      return json({ path: `${body.folder}/f.${body.ext}`, token: 't', publicUrl: `${SB}/storage/v1/object/public/${body.bucket}/${body.folder}/f.${body.ext}`, editor: 'ענת' });
    }
    if (url.pathname.startsWith('/storage/v1/object/upload/sign/')) {
      uploads.push({ storage: url.pathname });
      return json({ Key: url.pathname });
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (tables[table]) return json(tables[table]);
    return json([]);
  });
  return { writes, uploads };
}

async function noHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

// WCAG contrast of an element's text against its composited background.
async function contrastOf(locator) {
  return locator.evaluate((el) => {
    const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgba = (css) => {
      const m = css.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
      if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : Number(m[4])];
      c.clearRect(0, 0, 1, 1); c.fillStyle = 'rgba(0,0,0,0)'; c.fillStyle = css; c.fillRect(0, 0, 1, 1);
      const d = c.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
    };
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const bg = rgba(getComputedStyle(n).backgroundColor);
      if (bg[3] > 0) layers.push(bg);
      if (bg[3] >= 1) break;
    }
    layers.push(rgba(getComputedStyle(document.body).backgroundColor));
    let base = [0, 0, 0];
    let started = false;
    for (const l of layers.reverse()) {
      if (!started) { base = l.slice(0, 3); started = true; continue; }
      base = base.map((v, i) => v * (1 - l[3]) + l[i] * l[3]);
    }
    const fg = rgba(getComputedStyle(el).color);
    const fgc = base.map((v, i) => v * (1 - fg[3]) + fg[i] * fg[3]);
    const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const [a, b] = [lum(fgc), lum(base)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
}

test('home page maps the content and every top bar tab works', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'עמדות הפודטראק של אשדוד' })).toBeVisible();
  await expect(page.locator('.stat-tile').first()).toContainText('4');
  await expect(page.locator('.brand')).toBeVisible();
  await expect(page.locator('.city-logo')).toBeVisible();
  await expect(page.locator('.topbar').getByRole('button', { name: 'העתקת קישור' })).toHaveCount(0);

  for (const name of ['רשימת עמדות', 'מפת עמדות', 'דוח לטיפול', 'דוגמאות', 'קישורים', 'מדיניות', 'הגדרות']) {
    await page.locator('.tabs').getByRole('button', { name }).click();
    await expect(page.locator('.tabs button.active')).toHaveText(name);
    await expect(page.locator('.topbar')).toBeVisible();
  }
  await page.locator('.brand').click();
  await expect(page.getByRole('heading', { name: 'עמדות הפודטראק של אשדוד' })).toBeVisible();

  await expect(page.locator('.topbar ai-menu .logo')).toBeVisible();
  await page.locator('ai-menu .logo').click();
  await expect(page.locator('ai-menu a.item', { hasText: 'שיחת הפיתוח' })).toHaveAttribute('href', /claude\.ai\/code\/session_/);
  await expect(page.locator('ai-menu a.item', { hasText: 'פרויקט המחקר' })).toHaveAttribute('href', /claude\.ai\/project\/019e3627/);
  await expect(page.locator('ai-menu .item', { hasText: 'ניתוק המכשיר מהעריכה' })).toBeVisible();
  await page.locator('ai-menu .item', { hasText: 'העתקת קישור' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('localhost');
});

test('row, image and location open the card; card is linkable', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/?p=list');
  const row = page.locator('tbody tr').first();
  await row.locator('td').nth(2).click();
  await expect(page.locator('.position-card')).toBeVisible();
  await expect(page).toHaveURL(/pos=00000000-0000-4000-8000-000000000001/);
  for (const tab of ['תשתיות ואיכות', 'הרמוניקה', 'מסמכים', 'היסטוריה', 'פרטים']) {
    await page.locator('.card-tabs').getByRole('tab', { name: new RegExp(tab) }).click();
    await expect(page.locator('.card-tabs [aria-selected="true"]')).toContainText(tab);
  }
  await page.locator('.card-head-actions').getByRole('button', { name: 'סגירה' }).click();
  await expect(page.locator('.position-card')).toHaveCount(0);

  await row.locator('.thumb').click();
  await expect(page.locator('.position-card')).toBeVisible();
  await page.locator('.card-scrim').click({ position: { x: 5, y: 300 } });
  await row.locator('td').nth(2).click();
  await expect(page.locator('.position-card')).toBeVisible();

  // Deep link straight into a tab
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001&tab=harmonica');
  await expect(page.locator('.harmonica-status')).toContainText('הוגשה');
  await expect(page.locator('.correction-list')).toContainText('להגדיל את הצללה');
});

test('editing in the card saves through the guarded write', async ({ page }) => {
  const { writes } = await mockSupabase(page);
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001');
  await page.locator('.card-title-input').fill('עמדה מעודכנת');
  await page.locator('.card-field', { hasText: 'שם היזם' }).locator('input').fill('יוסי');
  await expect.poll(() => writes.find(w => w.p_table === 'positions' && w.p_data.position_name === 'עמדה מעודכנת')).toBeTruthy();
  const w = writes.find(x => x.p_data.position_name === 'עמדה מעודכנת');
  expect(w.p_data.developer_name).toBe('יוסי');
  expect(w.p_op).toBe('upsert');
  await expect(page.locator('.card-title-input')).toHaveValue('עמדה מעודכנת');
  await expect(page.getByRole('button', { name: 'העתקת קישור לכרטיס' })).toHaveCount(0);

  await page.locator('.card-field', { hasText: 'סטטוס מיקום' }).locator('select').selectOption('מיקום לא מקובל');
  await expect.poll(() => writes.find(w2 => w2.p_table === 'position_events' && w2.p_data.kind === 'status')).toBeTruthy();

  await page.locator('.card-tabs').getByRole('tab', { name: /תשתיות/ }).click();
  await page.locator('.card-field', { hasText: 'ביוב' }).getByRole('button', { name: 'לא תקין' }).click();
  await expect.poll(() => writes.find(w2 => w2.p_data.sewage === 'לא טוב')).toBeTruthy();
});

test('harmonica: corrections, approval, email and documents', async ({ page }) => {
  const { writes, uploads } = await mockSupabase(page);
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001&tab=harmonica');

  await page.getByPlaceholder('הערה חדשה לתיקון ההרמוניקה').fill('להוסיף פרט הצללה');
  await page.getByRole('button', { name: 'הוספת הערה' }).click();
  await expect.poll(() => writes.find(w => w.p_data.kind === 'correction' && w.p_data.body === 'להוסיף פרט הצללה')).toBeTruthy();
  await expect(page.locator('.correction-list li')).toHaveCount(2);

  const original = page.locator('.correction-list li').last();
  await original.getByRole('button', { name: 'הושלם', exact: true }).click();
  await expect.poll(() => writes.find(w => w.p_id === 'e1' && w.p_data.resolved === true)).toBeTruthy();
  await expect(original).toHaveClass(/resolved/);
  expect(await original.locator('textarea').evaluate(el => getComputedStyle(el).textDecorationLine)).toContain('line-through');
  await original.screenshot({ path: 'test-results/resolved-item.png' });

  await page.getByRole('button', { name: 'מייל ליזם' }).click();
  await expect.poll(() => writes.find(w => w.p_data.kind === 'email')).toBeTruthy();
  expect(writes.find(w => w.p_data.kind === 'email').p_data.meta.to).toBe('dana@example.com');

  await page.getByRole('button', { name: 'כן, מאושרת' }).click();
  await expect(page.locator('.harmonica-status')).toContainText('מאושרת');
  await expect.poll(() => writes.find(w => w.p_table === 'positions' && w.p_data.harmonica_status === 'מאושרת')).toBeTruthy();
  expect(writes.find(w => w.p_data.harmonica_status === 'מאושרת').p_data.harmonica_approved_by).toBe('ענת');
  await expect.poll(() => writes.find(w => w.p_data.kind === 'approval')).toBeTruthy();

  await page.locator('.card-section input[type=file]').first().setInputFiles({ name: 'הרמוניקה-2.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect.poll(() => writes.find(w => w.p_table === 'documents' && w.p_data.kind === 'harmonica' && w.p_data.title === 'הרמוניקה-2.pdf')).toBeTruthy();
  expect(uploads.find(u => u.bucket === 'foode-docs')).toBeTruthy();
  expect(uploads.find(u => u.storage)).toBeTruthy();

  await page.locator('.card-tabs').getByRole('tab', { name: /מסמכים/ }).click();
  await expect(page.locator('.card-subtitle', { hasText: 'מסמכים כלליים' })).toBeVisible();
  await expect(page.locator('.card-section')).toHaveCount(1);
  await page.locator('.card-section input[type=file]').setInputFiles([
    { name: 'חוזה.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('x') },
    { name: 'תכנית.pdf', mimeType: 'application/pdf', buffer: Buffer.from('y') },
  ]);
  await expect.poll(() => writes.filter(w => w.p_table === 'documents' && w.p_data.kind === 'general').length).toBe(2);
  await expect(page.locator('.doc-row')).toHaveCount(2);

  await page.locator('.card-tabs').getByRole('tab', { name: /היסטוריה/ }).click();
  await expect(page.locator('.timeline li').first()).toBeVisible();
  await page.locator('.note-composer.dated input[type=date]').fill('2026-09-01');
  await page.getByPlaceholder('רישום חדש ביומן העמדה').fill('שיחה עם היזם');
  await page.getByRole('button', { name: 'הוספה ליומן' }).click();
  await expect.poll(() => writes.find(w => w.p_data.body === 'שיחה עם היזם')?.p_data.created_at || '').toMatch(/^2026-09-0[12]/);
  await expect(page.locator('.timeline')).toContainText('שיחה עם היזם');
  const entry = page.locator('.timeline li', { hasText: 'שיחה עם היזם' });
  await entry.getByRole('button', { name: 'הסרה' }).click();
  await expect.poll(() => writes.find(w => w.p_table === 'position_events' && w.p_op === 'remove')).toBeTruthy();
  await expect(page.locator('.timeline')).not.toContainText('שיחה עם היזם');

  // Link instead of a file
  await page.locator('.card-tabs').getByRole('tab', { name: /מסמכים/ }).click();
  await page.getByPlaceholder('https://').fill('https://drive.example.com/plan');
  await page.getByPlaceholder('שם הקישור (לא חובה)').fill('תכנית בדרייב');
  await page.getByRole('button', { name: 'הוספת קישור' }).click();
  await expect.poll(() => writes.find(w => w.p_table === 'documents' && w.p_data.file_url === 'https://drive.example.com/plan' && w.p_data.title === 'תכנית בדרייב')).toBeTruthy();
});

test('view-only visitors see the card but cannot edit', async ({ page }) => {
  const { writes } = await mockSupabase(page, { editor: false });
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001&tab=harmonica');
  await expect(page.locator('.position-card')).toBeVisible();
  await expect(page.locator('.card-title-input')).toHaveCount(0);
  await expect(page.locator('.position-card .inline-field')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'כן, מאושרת' })).toHaveCount(0);
  await expect(page.locator('.dropzone')).toHaveCount(0);
  await expect(page.locator('.icon-btn')).toHaveCount(0);
  await expect(page.locator('.position-card').getByText('תצוגה בלבד')).toBeVisible();
  expect(writes).toHaveLength(0);
});

test('table edit mode, legacy values stay visible and readable', async ({ page }) => {
  const { writes } = await mockSupabase(page);
  await page.goto('/?p=list');
  await expect(page.locator('.table-search-input')).toBeVisible();
  await page.locator('.table-search-input').fill('לכיש');
  await expect(page.locator('tbody tr:not(.group-head)')).toHaveCount(2);
  await page.locator('.table-search-input').fill('');
  const select = page.locator('tbody tr').nth(2).locator('select.pill-select').last();
  await expect(select).toHaveValue('מקובלת');
  await select.selectOption('מיקום מקובל');
  await expect.poll(() => writes.find(w => w.p_data.approval === 'מיקום מקובל')).toBeTruthy();

  // Option lists and status pills keep at least 4.5:1 contrast in both themes
  for (const theme of ['dark', 'light']) {
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(450);
    const optionBg = await page.locator('select.pill-select option').first().evaluate(o => [getComputedStyle(o).backgroundColor, getComputedStyle(o).color]);
    expect(optionBg[0]).not.toBe(optionBg[1]);
    for (const loc of [page.locator('select.pill-select').first(), page.locator('.pill.button').first(), page.locator('.sort-button').nth(2)]) {
      const ratio = await contrastOf(loc);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  }

  // Sorting by a category frames rows into groups; the sorted column shows an arrow
  await page.locator('.sort-button', { hasText: 'שם מתחם' }).click();
  await expect(page.locator('tbody.row-group')).toHaveCount(2);
  await expect(page.locator('tr.group-head').first()).toContainText('טיילת המרינה');
  await expect(page.locator('th.sorted .sort-arrow')).toHaveText('↑');
  await page.locator('.sort-button', { hasText: 'שם מתחם' }).click();
  await expect(page.locator('th.sorted .sort-arrow')).toHaveText('↓');
  await expect(page.locator('tr.group-head').first()).toContainText('נחל לכיש');
  await page.locator('.sort-button', { hasText: 'מספר' }).click();
  await expect(page.locator('tbody.row-group')).toHaveCount(0);
  await page.locator('tbody tr').first().locator('.pill.button.toggle').first().click();
  await expect.poll(() => writes.find(w => w.p_data.water)).toBeTruthy();

  // Text fields edit in place in the table without opening the card
  const nameCell = page.locator('tbody tr').first().locator('.cell-input.strong');
  await nameCell.fill('שם מהטבלה');
  await expect(page.locator('.position-card')).toHaveCount(0);
  await expect.poll(() => writes.find(w => w.p_data.position_name === 'שם מהטבלה')).toBeTruthy();
  await page.locator('tbody tr').first().locator('.cell-input.notes-text').fill('הערה מהטבלה');
  await expect.poll(() => writes.find(w => w.p_data.notes === 'הערה מהטבלה')).toBeTruthy();
  for (const theme of ['dark', 'light']) {
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(450);
    for (const tone of ['green', 'orange', 'red']) {
      const pill = page.locator(`td .pill.${tone}, td .pill-select.tone-${tone}`).first();
      if (await pill.count()) expect(await contrastOf(pill)).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('map markers open the card', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/?p=map');
  const marker = page.locator('.map-marker-pin').first();
  await expect(marker).toBeVisible({ timeout: 15000 });
  await marker.click({ force: true });
  await expect(page.locator('.position-card')).toBeVisible();
  await page.locator('.card-head-actions').getByRole('button', { name: 'סגירה' }).click();
  await expect(page.locator('.position-card')).toHaveCount(0);
  await page.locator('.map-marker-label').nth(1).click({ force: true });
  await expect(page.locator('.position-card')).toBeVisible();
});

test('examples and links pages load from the new tables', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/?p=examples');
  await expect(page.locator('.example-title-input').first()).toHaveValue('ספסל מובנה');
  await page.goto('/?p=links');
  await expect(page.locator('.links-list')).toContainText('מצגת');
});

test('mobile: no horizontal scroll on home, list and card', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL' });
  const page = await ctx.newPage();
  await mockSupabase(page);
  await page.goto('/');
  await noHorizontalScroll(page);
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true });
  await page.goto('/?p=list');
  await noHorizontalScroll(page);
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001&tab=harmonica');
  await expect(page.locator('.position-card')).toBeVisible();
  await page.waitForTimeout(800);
  await noHorizontalScroll(page);
  await page.screenshot({ path: 'test-results/mobile-card.png' });
  await page.goto('/?p=list');
  await page.screenshot({ path: 'test-results/mobile-list.png' });
  await ctx.close();
});

test('installable: manifest, service worker, no installability errors', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 15000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
});

test('screenshots for review', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockSupabase(page);
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/home.png', fullPage: true });
  await page.goto('/?p=list');
  await page.locator('.sort-button', { hasText: 'סטטוס מיקום' }).click();
  await page.screenshot({ path: 'test-results/list.png' });
  await page.evaluate(() => { localStorage.setItem('foode3-theme', 'light'); document.documentElement.setAttribute('data-theme', 'light'); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/list-light.png' });
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001&tab=history');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/card-history-light.png' });
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/home-light.png' });
  await page.goto('/?p=list&pos=00000000-0000-4000-8000-000000000001&tab=harmonica');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/card-harmonica.png' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({ path: 'test-results/card-light.png' });
});
