/* ระบบแจ้งซ่อมบำรุง — ส่วนหน้าจอ */
const CFG = Object.assign({ APP_NAME: 'ระบบแจ้งซ่อมบำรุง', REPORT_TITLE: 'แบบรายงานรายการชำรุดบกพร่อง' }, window.APP_CONFIG || {});
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = { get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const SS = { get(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }, set(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) {} } };

const ST = { new: { t: 'รอซ่อม', c: '#EF4444' }, doing: { t: 'กำลังซ่อม', c: '#E8920B' }, review: { t: 'รอตรวจรับ', c: '#3B82F6' }, done: { t: 'เสร็จแล้ว', c: '#10A572' } };
const ORDER = ['new', 'doing', 'review', 'done'];
const URG = { normal: 'ปกติ', soon: 'ภายในสัปดาห์', urgent: 'ด่วน' };

const S = {
  role: LS.get('role'), pin: SS.get('pin'),
  filter: { status: 'all', place: '', cat: '', q: '' },
  mapF: 'all', mapSel: null, draft: null, actPhotos: [],
  exp: { title: CFG.REPORT_TITLE, from: '', to: '', status: [...ORDER], place: '', after: true }
};
const isAdmin = () => !!S.pin;
const roleName = () => isAdmin() ? 'ผู้ดูแล' : S.role === 'tech' ? 'ช่าง' : 'ผู้แจ้ง';

/* ---------- icons ---------- */
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  plus: 'M12 5v14M5 12h14',
  pin: 'M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  doc: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
  cam: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  back: 'm15 18-6-6 6-6', chev: 'm9 18 6-6-6-6',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.6-.6-.6-2.6z',
  mega: 'M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11',
  lock: 'M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  gps: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v3M12 19v3M2 12h3M19 12h3',
  dl: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  img: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM21 16l-5-5-9 9',
  check: 'm5 12.5 4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6 6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  nav: 'M3 11 21 3l-8 18-2-8z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  upload: 'M12 20V9m0 0-4 4m4-4 4 4M5 4h14',
  tagi: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01'
};
const ic = (n, s = 22, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATHS[n]}"/></svg>`;

/* ---------- helpers ---------- */
const byId = id => Store.state.defects.find(d => d.id === id);
const place = id => Store.state.places.find(p => p.id == id);
const cat = id => Store.state.cats.find(c => c.id == id);
const placeLabel = d => { const p = place(d.place_id); return [p ? p.name : '', d.sub_location].filter(Boolean).join(' · ') || 'ไม่ระบุสถานที่'; };
const no = id => '#' + String(id).padStart(3, '0');
const before = d => d.photos.filter(p => p.kind === 'before');
const after = d => d.photos.filter(p => p.kind === 'after');
const fmtDate = v => v ? new Date(v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-';
const fmtTime = v => new Date(v).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
const pill = s => `<span class="pill s-${s}">${ST[s].t}</span>`;
const urgentPill = d => d.urgency === 'urgent' && d.status !== 'done' ? '<span class="pill urgent">ด่วน</span>' : '';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(text, bad) {
  const el = document.createElement('div');
  el.className = 'toast' + (bad ? ' bad' : '');
  el.innerHTML = (bad ? '' : ic('check', 18, 2.6)) + `<span>${esc(text)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), bad ? 4200 : 2600);
}
function errText(e) {
  const m = (e && e.message) || String(e);
  if (/INVALID_PIN/.test(m)) return 'รหัสผู้ดูแลไม่ถูกต้อง';
  if (/PIN_TOO_SHORT/.test(m)) return 'รหัสใหม่ต้องมีอย่างน้อย 4 ตัว';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้ง';
  return 'ไม่สำเร็จ: ' + m;
}
async function busy(btn, fn) {
  if (btn && btn.disabled) return;
  const old = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…'; }
  try { await fn(); }
  catch (e) {
    console.error(e);
    if (/INVALID_PIN/.test(e.message || '')) { S.pin = ''; SS.set('pin', ''); }
    toast(errText(e), true);
  }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = old; } }
}
async function compress(file, max = 1600, q = 0.82) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
  const w0 = bmp.width, h0 = bmp.height, k = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', q));
}
async function filesToPhotos(files) {
  const out = [];
  for (const f of files) {
    if (!/^image\//.test(f.type)) continue;
    try { const blob = await compress(f); out.push({ blob, url: URL.createObjectURL(blob) }); }
    catch (e) { toast('อ่านรูป ' + f.name + ' ไม่ได้', true); }
  }
  return out;
}
function confetti() {
  if (reduced()) return;
  const c = document.createElement('canvas'); c.className = 'confetti';
  c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext('2d'), cols = ['#12B886', '#15AABF', '#FFB627', '#FF8A5B', '#3B82F6'];
  const P = Array.from({ length: 130 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4, s: Math.random() * 7 + 4, r: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  (function tick(t) {
    const k = (t - t0) / 1900; x.clearRect(0, 0, c.width, c.height);
    P.forEach(p => { p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.r += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - k); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); });
    k < 1 ? requestAnimationFrame(tick) : c.remove();
  })(t0);
}
function countUp() {
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count; if (reduced() || !to) { el.textContent = to; return; }
    const t0 = performance.now();
    (function tick(t) { const k = Math.min(1, (t - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
  });
  $$('.ring .fg').forEach(el => requestAnimationFrame(() => { el.style.strokeDashoffset = el.dataset.off; }));
}

/* ---------- maps ---------- */
let maps = [], mapCtx = null, formCtx = null, sheetMap = null;
function pinIcon(color, cls = '') {
  return L.divIcon({ className: 'pin ' + cls, iconSize: [32, 42], iconAnchor: [16, 41],
    html: `<svg width="32" height="42" viewBox="0 0 32 42"><path d="M16 41C7 29 2 23 2 16a14 14 0 0 1 28 0c0 7-5 13-14 25z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="16" cy="16" r="5.5" fill="#fff"/></svg>` });
}
function mkMap(el, opt = {}) {
  const lock = !!opt.lock;
  const map = L.map(el, { zoomControl: false, attributionControl: !lock, dragging: !lock, scrollWheelZoom: !lock, doubleClickZoom: !lock, touchZoom: !lock, boxZoom: !lock, keyboard: !lock });
  const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 21, maxNativeZoom: 18, attribution: 'ภาพ: Esri' }).addTo(map);
  if (!lock) {
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 21, maxNativeZoom: 19, attribution: '© OpenStreetMap' });
    L.control.layers({ 'ดาวเทียม': sat, 'แผนที่ถนน': osm }, null, { position: 'topright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
  }
  if (!opt.sheet) maps.push(map);
  return map;
}
function defaultView() {
  const s = Store.state.settings.map_center;
  if (s && s.lat != null) return { c: [s.lat, s.lng], z: s.zoom || 17 };
  const pts = [...Store.state.defects, ...Store.state.places].filter(p => p.lat != null).map(p => [p.lat, p.lng]);
  if (pts.length) return { b: pts };
  return { c: [13.3, 101.0], z: 6, none: true };
}
function applyView(map, v) {
  if (v.b) { v.b.length > 1 ? map.fitBounds(v.b, { padding: [40, 40], maxZoom: 19 }) : map.setView(v.b[0], 18); }
  else map.setView(v.c, v.z);
}
function locate(cb, quiet) {
  if (!navigator.geolocation) { if (!quiet) toast('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง', true); return; }
  navigator.geolocation.getCurrentPosition(p => cb(p.coords.latitude, p.coords.longitude),
    () => { if (!quiet) toast('ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง แตะบนแผนที่เพื่อปักหมุดแทนได้', true); },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

/* ---------- shared pieces ---------- */
function head(title, sub, back) {
  return `<header class="top">${back ? `<button class="iconbtn" data-act="back" aria-label="ย้อนกลับ">${ic('back', 20, 2.4)}</button>` : ''}
    <div class="ttl"><small>${esc(sub || CFG.APP_NAME)}</small><h1>${esc(title)}</h1></div>
    <button class="rolechip ${isAdmin() ? 'adm' : ''}" data-act="rolesheet">${ic(isAdmin() ? 'lock' : S.role === 'tech' ? 'wrench' : 'mega', 15)}${roleName()}</button></header>`;
}
function demoBanner() {
  return Store.state.mode === 'demo' ? `<div class="demo">${ic('bolt', 16)}<span><b>โหมดทดลอง</b> — ข้อมูลเก็บเฉพาะในเครื่องนี้ ยังไม่ได้เชื่อมต่อฐานข้อมูลกลาง</span></div>` : '';
}
function itemRow(d) {
  const b = before(d);
  return `<button class="item" data-act="open" data-id="${d.id}">
    <span class="ph">${b[0] ? `<img src="${esc(b[0].url)}" alt="" loading="lazy">` : ic('img', 26, 1.6)}${d.photos.length > 1 ? `<span class="cnt">${d.photos.length} รูป</span>` : ''}</span>
    <span class="bd"><span class="row"><span class="no">${no(d.id)}</span>${pill(d.status)}${urgentPill(d)}</span>
      <span class="ds">${esc(d.description)}</span>
      <span class="row loc">${ic('pin', 14)}<span>${esc(placeLabel(d))}</span></span></span></button>`;
}
function navHtml(r) {
  const b = (to, icn, t) => `<button data-act="go" data-to="${to}" ${r.name === to ? 'aria-current="page"' : ''}>${ic(icn, 23)}<span>${t}</span></button>`;
  return `<nav class="bottom" aria-label="เมนูหลัก"><div class="brandrow"><span class="logo">${ic('wrench', 24)}</span>${esc(CFG.APP_NAME)}</div>
    ${b('home', 'home', 'หน้าแรก')}${b('list', 'list', 'รายการ')}
    <button class="fabbtn" data-act="go" data-to="new"><span class="fab">${ic('plus', 27, 2.6)}</span><span>แจ้งซ่อม</span></button>
    ${b('map', 'pin', 'แผนที่')}${b('export', 'doc', 'ส่งออก')}</nav>`;
}

/* ---------- views ---------- */
const VIEWS = {};

VIEWS.landing = {
  html() {
    return `<div class="landing screen">
      <div><div class="brand"><span class="logo">${ic('wrench', 25)}</span>${esc(CFG.APP_NAME)}</div>
      <h1>เจอจุดชำรุด<br><em>แจ้งได้ทันที</em></h1></div>
      <p class="lead">ถ่ายรูป ปักหมุด ส่งถึงช่าง และติดตามได้จนงานเสร็จ</p>
      ${demoBanner()}
      <div class="roles">
        <button class="rolecard" data-act="role" data-role="reporter"><span class="ic rep">${ic('mega', 30)}</span><span><h3>ผู้แจ้ง</h3><p>แจ้งจุดชำรุด และตรวจรับงานที่ช่างแก้แล้ว</p></span>${ic('chev', 22, 2.4)}</button>
        <button class="rolecard" data-act="role" data-role="tech"><span class="ic tech">${ic('wrench', 30)}</span><span><h3>ช่าง</h3><p>ดูงานที่ต้องซ่อม อัปเดตสถานะ แนบรูปหลังแก้ไข</p></span>${ic('chev', 22, 2.4)}</button>
      </div>
      <button class="adminlink" data-act="pin">${ic('lock', 16)} เข้าสู่ระบบผู้ดูแล</button>
    </div>`;
  }
};

VIEWS.home = {
  html() {
    const all = Store.state.defects, cnt = s => all.filter(d => d.status === s).length;
    const total = all.length, pct = total ? Math.round(cnt('done') / total * 100) : 0, C = 2 * Math.PI * 38;
    const tech = S.role === 'tech';
    const urgent = all.filter(d => d.urgency === 'urgent' && d.status !== 'done');
    const mine = all.filter(d => tech ? (d.status === 'new' || d.status === 'doing') : d.status === 'review');
    const open = cnt('new') + cnt('doing');
    return head('ภาพรวม',new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })) + `<main class="screen">
      ${demoBanner()}
      <div class="hero"><div>
        ${tech ? `<h2>${open ? `มีงานรอซ่อม ${open} รายการ` : 'ไม่มีงานค้าง เยี่ยมมาก'}</h2><p>${urgent.length ? `เร่งด่วน ${urgent.length} รายการ` : 'ไม่มีงานเร่งด่วน'} · รอตรวจรับ ${cnt('review')} รายการ</p><button class="cta" data-act="go" data-to="list" data-f="new">${ic('wrench', 18)} ดูงานที่ต้องทำ</button>`
          : `<h2>เจอจุดชำรุด? แจ้งได้ในไม่ถึงนาที</h2><p>ถ่ายรูป เลือกสถานที่ ปักหมุด แล้วส่งให้ช่าง</p><button class="cta" data-act="go" data-to="new">${ic('cam', 18)} แจ้งรายการใหม่</button>`}
        </div>
        <div class="ring" title="งานที่เสร็จแล้ว"><svg viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="38"/><circle class="fg" cx="46" cy="46" r="38" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - pct / 100)).toFixed(1)}"/></svg><div><b><span data-count="${pct}">0</span>%</b><small>เสร็จแล้ว</small></div></div>
      </div>
      <div class="stats">${ORDER.map(k => `<button class="stat s-${k}" data-act="go" data-to="list" data-f="${k}"><b data-count="${cnt(k)}">0</b><span>${ST[k].t}</span></button>`).join('')}</div>
      ${urgent.length ? `<div class="sec-h"><h2>เร่งด่วน</h2><span class="muted">${urgent.length} รายการ</span></div>
        <div class="hscroll">${urgent.map(d => `<button class="hcard" data-act="open" data-id="${d.id}">${before(d)[0] ? `<img src="${esc(before(d)[0].url)}" alt="" loading="lazy">` : ''}<span class="in">${pill(d.status)}<b>${esc(d.description)}</b><small>${esc(placeLabel(d))}</small></span></button>`).join('')}</div>` : ''}
      <div class="sec-h"><h2>${tech ? 'งานที่ต้องทำ' : 'รอตรวจรับ'}</h2>${mine.length > 3 ? `<button class="link" data-act="go" data-to="list" data-f="${tech ? 'new' : 'review'}">ดูทั้งหมด ${ic('chev', 15, 2.4)}</button>` : ''}</div>
      ${mine.length ? `<div class="items">${mine.slice(0, 3).map(itemRow).join('')}</div>` : `<div class="empty">${ic('check', 28, 2.4)}<b>${tech ? 'ไม่มีงานค้าง' : 'ไม่มีงานรอตรวจรับ'}</b><span>${tech ? 'เมื่อมีการแจ้งรายการใหม่จะแสดงที่นี่' : 'เมื่อช่างแก้ไขเสร็จ รายการจะแสดงที่นี่ให้ตรวจรับ'}</span></div>`}
      <div class="sec-h"><h2>แจ้งล่าสุด</h2>${total > 4 ? `<button class="link" data-act="go" data-to="list" data-f="all">ดูทั้งหมด ${ic('chev', 15, 2.4)}</button>` : ''}</div>
      ${total ? `<div class="items">${all.slice(0, 4).map(itemRow).join('')}</div>` : `<div class="empty">${ic('cam', 28)}<b>ยังไม่มีรายการ</b><span>กดปุ่ม "แจ้งซ่อม" เพื่อเริ่มแจ้งรายการแรก</span></div>`}
    </main>`;
  }
};

function filtered() {
  const f = S.filter, q = f.q.trim().toLowerCase();
  return Store.state.defects.filter(d => (f.status === 'all' || d.status === f.status) && (!f.place || d.place_id == f.place) && (!f.cat || d.category_id == f.cat) &&
    (!q || (d.description + ' ' + placeLabel(d) + ' ' + no(d.id)).toLowerCase().includes(q)))
    .sort((a, b) => (b.urgency === 'urgent' && b.status !== 'done') - (a.urgency === 'urgent' && a.status !== 'done') || b.id - a.id);
}
function drawList() {
  const arr = filtered(), el = $('#results'); if (!el) return;
  el.innerHTML = arr.length ? `<div class="items">${arr.map(itemRow).join('')}</div>` : `<div class="empty">${ic('search', 28)}<b>ไม่พบรายการ</b><span>ลองเปลี่ยนตัวกรองหรือคำค้นหา</span></div>`;
  const c = $('#listcount'); if (c) c.textContent = `${arr.length} จาก ${Store.state.defects.length} รายการ`;
}
VIEWS.list = {
  html() {
    const all = Store.state.defects, f = S.filter;
    return head('รายการทั้งหมด', '') + `<main class="screen">
      <label class="search">${ic('search', 19)}<input id="q" type="search" placeholder="ค้นหาอาการ สถานที่ หรือเลขที่" value="${esc(f.q)}" aria-label="ค้นหา"></label>
      <div class="chips" role="group" aria-label="กรองตามสถานะ">${['all', ...ORDER].map(k => `<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${f.status === k}">${k === 'all' ? 'ทั้งหมด' : ST[k].t} <span class="n">${k === 'all' ? all.length : all.filter(d => d.status === k).length}</span></button>`).join('')}</div>
      <div class="row2">
        <select class="input" id="fl-place" aria-label="สถานที่"><option value="">ทุกสถานที่</option>${Store.state.places.map(p => `<option value="${p.id}" ${f.place == p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
        <select class="input" id="fl-cat" aria-label="หมวดหมู่"><option value="">ทุกหมวดหมู่</option>${Store.state.cats.map(c => `<option value="${c.id}" ${f.cat == c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      </div>
      <p class="muted" id="listcount" style="font-size:13.5px"></p>
      <div id="results"></div></main>`;
  },
  mount() { drawList(); },
  soft() { drawList(); }
};

/* ----- map ----- */
function drawPins() {
  if (!mapCtx) return;
  mapCtx.layer.clearLayers();
  const arr = Store.state.defects.filter(d => d.lat != null && (S.mapF === 'all' || d.status === S.mapF));
  arr.forEach(d => {
    const cls = (S.mapSel === d.id ? 'sel ' : '') + (d.urgency === 'urgent' && d.status !== 'done' ? 'pulse' : '');
    L.marker([d.lat, d.lng], { icon: pinIcon(ST[d.status].c, cls), zIndexOffset: S.mapSel === d.id ? 1000 : 0 })
      .on('click', () => { S.mapSel = d.id; drawPins(); }).addTo(mapCtx.layer);
  });
  const sel = S.mapSel ? byId(S.mapSel) : null, box = $('#mapcard'), nopin = Store.state.defects.filter(d => d.lat == null).length;
  if (!box) return;
  box.innerHTML = (sel ? `<button class="mapcard" data-act="open" data-id="${sel.id}">${before(sel)[0] ? `<img src="${esc(before(sel)[0].url)}" alt="">` : `<span class="noimg">${ic('img', 24, 1.6)}</span>`}
      <span style="min-width:0;display:flex;flex-direction:column;gap:4px"><span style="display:flex;gap:6px;align-items:center;font-size:12.5px" class="muted">${no(sel.id)} ${pill(sel.status)}${urgentPill(sel)}</span><b>${esc(sel.description)}</b><small class="muted">${esc(placeLabel(sel))}</small></span>${ic('chev', 20, 2.4)}</button>`
    : `<span class="mapnote">${arr.length ? `แตะหมุดเพื่อดูรายละเอียด · ${arr.length} หมุด` : 'ยังไม่มีหมุดบนแผนที่'}${nopin ? ` · ยังไม่ปักหมุด ${nopin} รายการ` : ''}</span>`)
    + (isAdmin() ? `<button class="btn ghost" style="align-self:flex-start;padding:8px 12px;font-size:13.5px;border-radius:12px" data-act="savecenter">${ic('pin', 16)} ตั้งมุมมองนี้เป็นค่าเริ่มต้น</button>` : '');
}
VIEWS.map = {
  html() {
    return head('แผนที่จุดชำรุด', '') + `<main class="screen still"><div class="mapwrap"><div id="map"></div>
      <div class="mapover topo">${['all', ...ORDER].map(k => `<button class="chip" data-act="mapfilter" data-f="${k}" aria-pressed="${S.mapF === k}">${k === 'all' ? 'ทั้งหมด' : `<span style="width:9px;height:9px;border-radius:50%;background:${ST[k].c}"></span>${ST[k].t}`}</button>`).join('')}</div>
      <div class="mapover boto" id="mapcard"></div></div></main>`;
  },
  mount(r) {
    const map = mkMap($('#map')), v = defaultView();
    applyView(map, v);
    mapCtx = { map, layer: L.layerGroup().addTo(map) };
    if (r.id) { S.mapSel = r.id; const d = byId(r.id); if (d && d.lat != null) map.setView([d.lat, d.lng], 19); }
    drawPins();
    if (v.none) locate((la, ln) => map.setView([la, ln], 17), true);
  },
  soft() { drawPins(); }
};

/* ----- form (new / edit) ----- */
function newDraft(d) {
  return d ? { editId: d.id, photos: [], place_id: d.place_id ?? '', sub: d.sub_location, cat_id: d.category_id ?? '', urgency: d.urgency, desc: d.description, name: d.reporter_name, lat: d.lat, lng: d.lng, pinned: d.lat != null, status: d.status, note: d.note }
    : { editId: null, photos: [], place_id: '', sub: '', cat_id: '', urgency: 'normal', desc: '', name: LS.get('name_reporter'), lat: null, lng: null, pinned: false };
}
function drawFormPhotos() {
  const d = S.draft, el = $('#f-photos'); if (!el) return;
  const ex = d.editId ? before(byId(d.editId) || { photos: [] }) : [];
  el.innerHTML = ex.map(p => `<div class="t"><img src="${esc(p.url)}" alt=""><button type="button" data-act="delphoto" data-id="${p.id}" aria-label="ลบรูป">${ic('x', 15, 2.6)}</button></div>`).join('')
    + d.photos.map((p, i) => `<div class="t"><img src="${p.url}" alt=""><button type="button" data-act="rmphoto" data-i="${i}" aria-label="เอารูปออก">${ic('x', 15, 2.6)}</button></div>`).join('')
    + `<label class="addph">${ic('cam', 26)}ถ่ายรูป / เลือกรูป<input id="f-file" type="file" accept="image/*" multiple hidden></label>`;
}
function setFormPin(lat, lng, user, pan) {
  const d = S.draft; d.lat = lat; d.lng = lng; if (user) d.pinned = true;
  if (!formCtx) return;
  if (!formCtx.marker) {
    formCtx.marker = L.marker([lat, lng], { icon: pinIcon('#0FA77F'), draggable: true }).addTo(formCtx.map);
    formCtx.marker.on('dragend', () => { const p = formCtx.marker.getLatLng(); d.lat = p.lat; d.lng = p.lng; d.pinned = true; });
  } else formCtx.marker.setLatLng([lat, lng]);
  if (pan) formCtx.map.setView([lat, lng], Math.max(formCtx.map.getZoom(), 18));
  const h = $('#f-pinhint'); if (h) h.textContent = 'ปักหมุดแล้ว ลากหมุดเพื่อปรับตำแหน่งได้';
}
function formView(edit) {
  return {
    keep: true,
    html(r) {
      if (edit && !isAdmin()) return head('แก้ไขรายการ', '', true) + `<main class="screen"><div class="empty">${ic('lock', 28)}<b>สำหรับผู้ดูแลเท่านั้น</b><button class="btn primary" data-act="pin">เข้าสู่ระบบผู้ดูแล</button></div></main>`;
      const src = edit ? byId(r.id) : null;
      if (edit && !src) return head('แก้ไขรายการ', '', true) + `<main class="screen"><div class="empty"><b>ไม่พบรายการนี้</b></div></main>`;
      if (edit ? (!S.draft || S.draft.editId !== r.id) : (!S.draft || S.draft.editId)) S.draft = newDraft(src);
      const d = S.draft;
      return head(edit ? `แก้ไข ${no(r.id)}` : 'แจ้งรายการชำรุด', edit ? 'ผู้ดูแลระบบ' : 'กรอก 4 ขั้นตอน', true) + `<main class="screen narrow"><form id="form" class="form" novalidate>
        <section class="fsec"><h3><b>1</b>รูปภาพ</h3><div class="thumbs" id="f-photos"></div><p class="hint">เพิ่มได้หลายรูป ระบบย่อขนาดรูปให้อัตโนมัติ</p></section>
        <section class="fsec"><h3><b>2</b>สถานที่</h3>
          <select class="input" id="f-place" data-k="place_id" aria-label="อาคารหรือสถานที่"><option value="">เลือกอาคาร / สถานที่</option>${Store.state.places.map(p => `<option value="${p.id}" ${d.place_id == p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
          ${Store.state.places.length ? '' : '<p class="hint">ยังไม่มีรายชื่อสถานที่ ให้ผู้ดูแลเพิ่มในหน้าตั้งค่าระบบ หรือพิมพ์ในช่องด้านล่างแทนได้</p>'}
          <input class="input" data-k="sub" value="${esc(d.sub)}" placeholder="จุดย่อย เช่น ชั้น 2, ห้องควบคุม (ไม่บังคับ)" aria-label="จุดย่อย">
          <div class="maptools"><button type="button" class="chip" data-act="gps">${ic('gps', 16)} ใช้ตำแหน่งปัจจุบัน</button><span class="hint" id="f-pinhint">${d.lat != null ? 'ปักหมุดแล้ว ลากหมุดเพื่อปรับตำแหน่งได้' : 'หรือแตะบนแผนที่เพื่อปักหมุด'}</span></div>
          <div class="fmap" id="f-map"></div></section>
        <section class="fsec"><h3><b>3</b>หมวดหมู่และความเร่งด่วน</h3>
          <div class="chipwrap">${Store.state.cats.map(c => `<button type="button" class="chip" data-act="fcat" data-c="${c.id}" aria-pressed="${d.cat_id == c.id}">${esc(c.name)}</button>`).join('')}</div>
          <div class="seg" role="group" aria-label="ความเร่งด่วน">${Object.entries(URG).map(([k, t]) => `<button type="button" data-act="furg" data-u="${k}" aria-pressed="${d.urgency === k}">${t}</button>`).join('')}</div></section>
        <section class="fsec"><h3><b>4</b>อาการที่พบ</h3>
          <textarea class="input" data-k="desc" placeholder="เช่น น้ำรั่วออกจากปั๊ม มีน้ำนองพื้น" aria-label="อาการที่พบ">${esc(d.desc)}</textarea>
          <div class="field"><label for="f-name">ชื่อผู้แจ้ง</label><input class="input" id="f-name" data-k="name" value="${esc(d.name)}" placeholder="ชื่อ-นามสกุล หรือชื่อเล่น" autocomplete="name"><span class="hint">จำไว้ในเครื่องนี้ ครั้งต่อไปไม่ต้องพิมพ์ใหม่</span></div>
          ${edit ? `<div class="field"><label for="f-status">สถานะ</label><select class="input" id="f-status" data-k="status">${ORDER.map(k => `<option value="${k}" ${d.status === k ? 'selected' : ''}>${ST[k].t}</option>`).join('')}</select></div>
          <div class="field"><label for="f-note">หมายเหตุ</label><input class="input" id="f-note" data-k="note" value="${esc(d.note)}" placeholder="เช่น แก้ไขแล้วบางส่วน"></div>` : ''}</section>
        <button class="btn primary block lg" type="submit" id="f-submit">${edit ? 'บันทึกการแก้ไข' : `${ic('check', 20, 2.6)} ส่งรายการแจ้งซ่อม`}</button>
      </form></main>`;
    },
    mount() {
      if (!$('#form')) return;
      drawFormPhotos();
      const d = S.draft, map = mkMap($('#f-map'));
      formCtx = { map, marker: null };
      const p = place(d.place_id);
      if (d.lat != null) { map.setView([d.lat, d.lng], 19); setFormPin(d.lat, d.lng, false); }
      else if (p && p.lat != null) map.setView([p.lat, p.lng], 18);
      else { const v = defaultView(); applyView(map, v); if (v.none) locate((la, ln) => map.setView([la, ln], 17), true); }
      map.on('click', e => setFormPin(e.latlng.lat, e.latlng.lng, true));
    }
  };
}
VIEWS.new = formView(false);
VIEWS.edit = formView(true);

async function submitForm(btn) {
  const d = S.draft;
  if (!d.desc.trim()) { toast('กรุณากรอกอาการที่พบ', true); return; }
  if (!d.place_id && !d.sub.trim()) { toast('กรุณาเลือกสถานที่ หรือพิมพ์จุดที่พบ', true); return; }
  if (!d.editId && !d.photos.length) { toast('กรุณาใส่รูปอย่างน้อย 1 รูป', true); return; }
  const p = place(d.place_id);
  let lat = d.lat, lng = d.lng;
  if (lat == null && p && p.lat != null) { lat = p.lat; lng = p.lng; }
  const row = { description: d.desc.trim(), place_id: d.place_id ? +d.place_id : null, sub_location: d.sub.trim(), category_id: d.cat_id ? +d.cat_id : null, urgency: d.urgency, lat, lng, reporter_name: d.name.trim() };
  await busy(btn, async () => {
    if (d.editId) {
      await Store.admin('update_defect', { p_pin: S.pin, p_id: d.editId, p_data: { ...row, status: d.status, note: d.note || '' } }, { silent: true });
      if (d.photos.length) await Store.addPhotos(d.editId, 'before', d.photos.map(x => x.blob));
      await Store.addEvent({ defect_id: d.editId, status: d.status, text: 'ผู้ดูแลแก้ไขข้อมูลรายการ', actor: 'ผู้ดูแลระบบ', role: 'admin' });
      const id = d.editId; S.draft = null; toast('บันทึกแล้ว'); go('d/' + id, true);
    } else {
      if (row.reporter_name) LS.set('name_reporter', row.reporter_name);
      const id = await Store.createDefect(row, d.photos.map(x => x.blob), row.reporter_name || 'ไม่ระบุชื่อ');
      S.draft = null; toast('ส่งรายการแล้ว ช่างเห็นได้ทันที'); go('d/' + id, true);
    }
  });
}

/* ----- detail ----- */
VIEWS.detail = {
  html(r) {
    const d = byId(r.id);
    if (!d) return head('ไม่พบรายการ', '', true) + `<main class="screen"><div class="empty"><b>ไม่พบรายการนี้</b><span>อาจถูกลบไปแล้ว</span><button class="btn ghost" data-act="go" data-to="list">กลับไปหน้ารายการ</button></div></main>`;
    const b = before(d), a = after(d), idx = ORDER.indexOf(d.status), c = cat(d.category_id);
    const tech = S.role === 'tech' || isAdmin(), rep = S.role === 'reporter' || isAdmin();
    let acts = '';
    if (d.status === 'new' && tech) acts += `<button class="btn primary block lg" data-act="act" data-kind="accept">${ic('wrench', 20)} รับงานนี้</button>`;
    if (d.status === 'doing' && tech) acts += `<button class="btn primary block lg" data-act="act" data-kind="fixed">${ic('cam', 20)} แจ้งแก้ไขเสร็จ + แนบรูป</button><button class="btn ghost block" data-act="act" data-kind="partial">บันทึกความคืบหน้า</button>`;
    if (d.status === 'review' && rep) acts += `<div class="row2"><button class="btn warn" data-act="act" data-kind="reject">ตีกลับ</button><button class="btn primary" data-act="act" data-kind="approve">${ic('check', 20, 2.6)} ตรวจรับ</button></div>`;
    if (isAdmin()) acts += `<div class="row2"><button class="btn ghost" data-act="go" data-to="edit/${d.id}">${ic('edit', 18)} แก้ไข</button><button class="btn warn" data-act="askdelete">${ic('trash', 18)} ลบ</button></div>`;
    const wait = d.status === 'new' && !tech ? 'รอช่างรับงาน' : d.status === 'doing' && !tech ? 'ช่างกำลังดำเนินการ' : d.status === 'review' && !rep ? 'รอผู้แจ้งตรวจรับงาน' : '';
    return head(`รายการ ${no(d.id)}`, 'แจ้งเมื่อ ' + fmtDate(d.created_at), true) + `<main class="screen narrow">
      <div class="gallery ${b.length > 1 ? 'multi' : ''}">${b.length ? b.map(p => `<button data-act="zoom" data-src="${esc(p.url)}" aria-label="ขยายรูป"><img src="${esc(p.url)}" alt="รูปจุดชำรุด"></button>`).join('') : `<div class="none">${ic('img', 40, 1.4)}</div>`}</div>
      <div class="stepper" aria-label="สถานะ ${ST[d.status].t}">${ORDER.map((s, i) => `<div class="step ${i <= idx ? 'on' : ''} ${i === idx ? 'cur' : ''}"><i>${i <= idx ? ic('check', 14, 3.2) : ''}</i>${ST[s].t}</div>`).join('')}</div>
      <div class="dtitle"><div style="display:flex;gap:6px;flex-wrap:wrap">${pill(d.status)}${urgentPill(d)}${c ? `<span class="tag">${esc(c.name)}</span>` : ''}${d.urgency === 'soon' ? '<span class="tag">ภายในสัปดาห์</span>' : ''}</div>
        <h2>${esc(d.description)}</h2>${d.note ? `<div class="dnote">${esc(d.note)}</div>` : ''}</div>
      ${acts ? `<div class="actions">${acts}</div>` : ''}${wait ? `<div class="wait">${ic('clock', 20)}${wait}</div>` : ''}
      <dl class="kv card"><dt>${ic('pin', 16)}สถานที่</dt><dd>${esc(placeLabel(d))}</dd><dt>${ic('user', 16)}ผู้แจ้ง</dt><dd>${esc(d.reporter_name || 'ไม่ระบุชื่อ')}</dd><dt>${ic('wrench', 16)}ช่าง</dt><dd>${d.tech_name ? esc(d.tech_name) : '<span class="muted">ยังไม่มีผู้รับงาน</span>'}</dd>${d.closed_at ? `<dt>${ic('check', 16)}ปิดงาน</dt><dd>${fmtDate(d.closed_at)}</dd>` : ''}</dl>
      <div class="sec-h"><h2>ก่อน / หลังแก้ไข</h2></div>
      ${a.length && b.length ? `<div class="cmp"><img src="${esc(a[0].url)}" alt="หลังแก้ไข"><img class="topimg" src="${esc(b[0].url)}" alt="ก่อนแก้ไข"><span class="l">ก่อน</span><span class="r">หลัง</span><div class="bar"></div><input type="range" min="0" max="100" value="50" aria-label="เลื่อนเพื่อเทียบก่อนและหลังแก้ไข"></div>` : ''}
      ${a.length ? `<div class="ba">${a.map(p => `<button data-act="zoom" data-src="${esc(p.url)}" aria-label="ขยายรูปหลังแก้ไข"><img src="${esc(p.url)}" alt="รูปหลังแก้ไข" loading="lazy"></button>`).join('')}</div>` : `<div class="wait">${ic('cam', 20)}ยังไม่มีรูปหลังแก้ไข ช่างจะแนบเมื่อแก้เสร็จ</div>`}
      <div class="sec-h"><h2>ตำแหน่ง</h2>${d.lat != null ? `<a class="link" href="https://www.google.com/maps?q=${d.lat},${d.lng}" target="_blank" rel="noopener">${ic('nav', 15)} นำทาง</a>` : ''}</div>
      ${d.lat != null ? `<button class="minimap" id="d-map" data-act="go" data-to="map/${d.id}" aria-label="เปิดแผนที่" style="border:0;padding:0;width:100%"></button>` : `<div class="wait">${ic('pin', 20)}รายการนี้ยังไม่ได้ปักหมุดบนแผนที่</div>`}
      <div class="sec-h"><h2>ประวัติ</h2></div>
      <ol class="timeline card">${[...d.events].reverse().map(e => `<li><span class="d s-${ST[e.status] ? e.status : 'new'}"></span><div><b>${esc(e.text)}</b><small>${esc(e.actor || '-')} · ${fmtDate(e.created_at)} ${fmtTime(e.created_at)}</small></div></li>`).join('') || '<li><span class="d s-new"></span><div><b>แจ้งรายการ</b></div></li>'}</ol>
    </main>`;
  },
  mount(r) {
    const d = byId(r.id), el = $('#d-map');
    if (!d || !el) return;
    const map = mkMap(el, { lock: true });
    map.setView([d.lat, d.lng], 18);
    L.marker([d.lat, d.lng], { icon: pinIcon(ST[d.status].c), interactive: false }).addTo(map);
  }
};

/* ----- export ----- */
function expList() {
  const e = S.exp;
  const from = e.from ? new Date(e.from + 'T00:00:00') : null, to = e.to ? new Date(e.to + 'T23:59:59') : null;
  return Store.state.defects.filter(d => e.status.includes(d.status) && (!e.place || d.place_id == e.place) && (!from || new Date(d.created_at) >= from) && (!to || new Date(d.created_at) <= to)).sort((a, b) => a.id - b.id);
}
function expRemark(d) {
  const s = d.status === 'done' ? 'แก้ไขแล้ว' : d.status === 'review' ? 'แก้ไขแล้ว รอตรวจรับ' : d.status === 'doing' ? 'กำลังดำเนินการ' : '';
  return [s, d.note].filter(Boolean);
}
function expDesc(d) { const l = placeLabel(d); return d.description + (l && l !== 'ไม่ระบุสถานที่' ? `(${l})` : ''); }
function drawExport() {
  const arr = expList(), e = S.exp, el = $('#exp-prev'); if (!el) return;
  const btn = $('#exp-btn'); btn.innerHTML = `${ic('dl', 20, 2.4)} ดาวน์โหลดไฟล์ Word (${arr.length} รายการ)`; btn.disabled = !arr.length;
  el.innerHTML = `<h4>${esc(e.title)}</h4><div class="tblwrap"><table><thead><tr><th>ลำดับ</th><th>รูปภาพ</th><th>อาการ</th>${e.after ? '<th>รูปหลังแก้ไข</th>' : ''}<th>หมายเหตุ</th></tr></thead><tbody>
    ${arr.slice(0, 5).map((d, i) => `<tr><td>${i + 1}</td><td>${before(d).slice(0, 2).map(p => `<img src="${esc(p.url)}" alt="">`).join('') || '-'}</td><td class="l">${esc(expDesc(d))}</td>${e.after ? `<td>${after(d).slice(0, 2).map(p => `<img src="${esc(p.url)}" alt="">`).join('') || ''}</td>` : ''}<td>${expRemark(d).map(esc).join('<br>')}</td></tr>`).join('')}
    ${arr.length > 5 ? `<tr><td class="more" colspan="${e.after ? 5 : 4}">… และอีก ${arr.length - 5} รายการ</td></tr>` : ''}
    ${arr.length ? '' : `<tr><td class="more" colspan="${e.after ? 5 : 4}">ไม่มีรายการตามเงื่อนไขที่เลือก</td></tr>`}</tbody></table></div>`;
}
VIEWS.export = {
  html() {
    const e = S.exp;
    return head('ส่งออกรายงาน', 'ไฟล์ Word ตามแบบรายงานเดิม') + `<main class="screen narrow">
      <section class="fsec">
        <div class="field"><label for="e-title">หัวเรื่องรายงาน</label><input class="input" id="e-title" value="${esc(e.title)}"></div>
        <div class="row2"><div class="field"><label for="e-from">แจ้งตั้งแต่วันที่</label><input class="input" type="date" id="e-from" value="${e.from}"></div><div class="field"><label for="e-to">ถึงวันที่</label><input class="input" type="date" id="e-to" value="${e.to}"></div></div>
        <div class="field"><label for="e-place">สถานที่</label><select class="input" id="e-place"><option value="">ทุกสถานที่</option>${Store.state.places.map(p => `<option value="${p.id}" ${e.place == p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
        <div class="field"><span class="flabel">สถานะที่รวมในรายงาน</span><div class="chipwrap">${ORDER.map(k => `<button class="chip" data-act="expst" data-s="${k}" aria-pressed="${e.status.includes(k)}">${ST[k].t}</button>`).join('')}</div></div>
        <div class="field"><span class="flabel">คอลัมน์เพิ่มเติม</span><div class="chipwrap"><button class="chip" data-act="expafter" aria-pressed="${e.after}">${ic('img', 16)} รูปหลังแก้ไข</button></div><span class="hint">${e.after ? 'กระดาษแนวนอน มีคอลัมน์รูปหลังแก้ไข' : 'กระดาษแนวตั้ง เหมือนแบบรายงานเดิม'}</span></div>
      </section>
      <button class="btn primary block lg" id="exp-btn" data-act="docx"></button>
      <div class="sec-h"><h2>ตัวอย่างเอกสาร</h2><span class="muted" style="font-size:13px">ฟอนต์ TH Sarabun New</span></div>
      <div class="paper" id="exp-prev"></div></main>`;
  },
  mount() { drawExport(); },
  soft() { drawExport(); }
};

/* ----- admin ----- */
VIEWS.admin = {
  html() {
    if (!isAdmin()) return head('ตั้งค่าระบบ', '', true) + `<main class="screen"><div class="empty">${ic('lock', 28)}<b>สำหรับผู้ดูแลเท่านั้น</b><button class="btn primary" data-act="pin">เข้าสู่ระบบผู้ดูแล</button></div></main>`;
    const P = Store.state.places, C = Store.state.cats, cnt = id => Store.state.defects.filter(d => d.place_id == id).length;
    return head('ตั้งค่าระบบ', 'ผู้ดูแลระบบ', true) + `<main class="screen narrow">
      ${demoBanner()}
      <div class="sec-h"><h2>อาคาร / สถานที่</h2><button class="link" data-act="placesheet">${ic('plus', 16, 2.6)} เพิ่ม</button></div>
      ${P.length ? `<div class="card">${P.map(p => `<button class="listrow" data-act="placesheet" data-id="${p.id}"><span class="ico ${p.lat == null ? 'off' : ''}">${ic('pin', 19)}</span><span class="grow"><b>${esc(p.name)}</b><small>${cnt(p.id)} รายการ · ${p.lat == null ? 'ยังไม่ได้ปักพิกัด' : 'ปักพิกัดแล้ว'}</small></span>${ic('chev', 18, 2.4)}</button>`).join('')}</div>` : `<div class="empty">${ic('pin', 28)}<b>ยังไม่มีสถานที่</b><span>เพิ่มอาคารหรือจุดต่าง ๆ และปักพิกัดไว้ ผู้แจ้งจะเลือกได้จากรายการ</span></div>`}
      <div class="sec-h"><h2>หมวดหมู่</h2><button class="link" data-act="catsheet">${ic('plus', 16, 2.6)} เพิ่ม</button></div>
      <div class="chipwrap">${C.map(c => `<button class="chip" data-act="catsheet" data-id="${c.id}">${esc(c.name)} ${ic('edit', 14)}</button>`).join('')}</div>
      <div class="sec-h"><h2>ระบบ</h2></div>
      <div class="card">
        <button class="listrow" data-act="pinsheet"><span class="ico">${ic('lock', 19)}</span><span class="grow"><b>เปลี่ยนรหัสผู้ดูแล</b><small>ตัวเลขหรือตัวอักษร 4 ตัวขึ้นไป</small></span>${ic('chev', 18, 2.4)}</button>
        <label class="listrow" style="cursor:pointer"><span class="ico">${ic('upload', 19)}</span><span class="grow"><b>นำเข้ารายการจากรายงานเดิม</b><small>เลือกโฟลเดอร์ legacy-import (data.json และรูป)</small></span>${ic('chev', 18, 2.4)}<input id="imp" type="file" webkitdirectory multiple hidden></label>
        <button class="listrow" data-act="go" data-to="map"><span class="ico">${ic('pin', 19)}</span><span class="grow"><b>มุมมองแผนที่เริ่มต้น</b><small>เปิดแผนที่ เลื่อนไปยังพื้นที่ แล้วกด "ตั้งมุมมองนี้เป็นค่าเริ่มต้น"</small></span>${ic('chev', 18, 2.4)}</button>
        ${Store.state.mode === 'demo' ? `<button class="listrow" data-act="resetdemo"><span class="ico off">${ic('trash', 19)}</span><span class="grow"><b>ล้างข้อมูลทดลองทั้งหมด</b><small>ลบข้อมูลที่เก็บในเครื่องนี้</small></span></button>` : ''}
      </div>
      <button class="btn ghost block" data-act="adminout">ออกจากโหมดผู้ดูแล</button></main>`;
  }
};

/* ---------- router / render ---------- */
let cur = { r: { name: 'home' }, v: VIEWS.home, shown: false };
function route() { const [name, arg] = location.hash.replace(/^#\/?/, '').split('/'); return { name: name === 'd' ? 'detail' : (name || 'home'), id: arg ? +arg : null }; }
function go(to, replace) {
  if (location.hash === '#' + to) { render(true); return; }
  if (replace) { history.replaceState(null, '', '#' + to); render(true); } else location.hash = to;
}
function render(nav) {
  maps.forEach(m => { try { m.remove(); } catch (e) {} }); maps = []; mapCtx = null; formCtx = null;
  const st = Store.state, r = route(), v = S.role ? (VIEWS[r.name] || VIEWS.home) : VIEWS.landing;
  cur = { r, v, shown: st.loaded && !st.error };
  document.body.classList.toggle('norole', !S.role);
  const app = $('#app');
  const paint = () => {
    if (!st.loaded) app.innerHTML = '<div class="boot"><div class="spinner"></div><p>กำลังโหลด…</p></div>';
    else if (st.error) app.innerHTML = `<div class="boot"><div class="empty" style="max-width:420px">${ic('bolt', 30)}<b>เชื่อมต่อฐานข้อมูลไม่ได้</b><span>${esc(st.error)}</span><button class="btn primary" data-act="retry">ลองใหม่</button></div></div>`;
    else {
      app.innerHTML = v.html(r) + (S.role ? navHtml(r) : '');
      if (!nav) { const s = $('.screen'); if (s) s.classList.add('still'); }
      if (v.mount) v.mount(r);
      countUp();
    }
    if (nav) scrollTo(0, 0);
  };
  if (nav && document.startViewTransition && !reduced()) document.startViewTransition(paint); else paint();
}
window.addEventListener('hashchange', () => { closeSheet(); render(true); });
Store.subscribe(() => {
  if (cur.shown && cur.v.soft) { cur.v.soft(cur.r); return; }
  if (cur.shown && cur.v.keep) return;
  const y = scrollY; render(false); scrollTo(0, y);
});

/* ---------- sheets ---------- */
function sheet(html, opt = {}) {
  closeSheet();
  $('#layer').innerHTML = `<div class="scrim" ${opt.lock ? 'data-lock="1"' : ''}><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
  const f = $('#layer [autofocus]'); if (f) setTimeout(() => f.focus(), 60);
}
function closeSheet() { if (sheetMap) { try { sheetMap.remove(); } catch (e) {} sheetMap = null; } $('#layer').innerHTML = ''; S.actPhotos = []; }
function nameField(role) { return `<div class="field"><label for="a-name">ชื่อของคุณ</label><input class="input" id="a-name" value="${esc(LS.get('name_' + role))}" placeholder="ชื่อ-นามสกุล หรือชื่อเล่น" autocomplete="name"></div>`; }
function drawActPhotos() {
  const el = $('#a-photos'); if (!el) return;
  el.innerHTML = S.actPhotos.map((p, i) => `<div class="t"><img src="${p.url}" alt=""><button type="button" data-act="rmact" data-i="${i}" aria-label="เอารูปออก">${ic('x', 15, 2.6)}</button></div>`).join('')
    + `<label class="addph">${ic('cam', 26)}ถ่ายรูป / เลือกรูป<input id="a-file" type="file" accept="image/*" multiple hidden></label>`;
}
const ACTS = {
  accept: { title: 'รับงานนี้', btn: 'รับงาน เริ่มดำเนินการ', role: 'tech' },
  partial: { title: 'บันทึกความคืบหน้า', btn: 'บันทึก', role: 'tech', text: 'ความคืบหน้า', ph: 'เช่น แก้ไขแล้วบางส่วน รออะไหล่', req: true },
  fixed: { title: 'แจ้งแก้ไขเสร็จ', btn: 'ส่งให้ผู้แจ้งตรวจรับ', role: 'tech', text: 'รายละเอียดการแก้ไข (ไม่บังคับ)', ph: 'เช่น เปลี่ยนซีลปั๊มใหม่', photos: true },
  approve: { title: 'ตรวจรับงาน', btn: 'ตรวจรับ ปิดงาน', role: 'reporter', info: 'ยืนยันว่าช่างแก้ไขเรียบร้อยแล้ว รายการนี้จะถูกปิด' },
  reject: { title: 'ตีกลับให้ช่างแก้ไขใหม่', btn: 'ตีกลับ', role: 'reporter', text: 'เหตุผล', ph: 'เช่น ยังมีน้ำซึมที่มุมห้อง', req: true, warn: true }
};
function actSheet(kind) {
  const a = ACTS[kind];
  sheet(`<h2>${a.title}</h2>${a.info ? `<p class="muted">${a.info}</p>` : ''}
    ${a.photos ? `<div class="field"><span class="flabel">รูปหลังแก้ไข</span><div class="thumbs" id="a-photos"></div></div>` : ''}
    ${a.text ? `<div class="field"><label for="a-text">${a.text}</label><textarea class="input" id="a-text" placeholder="${a.ph}"></textarea></div>` : ''}
    ${nameField(a.role)}
    <button class="btn ${a.warn ? 'danger' : 'primary'} block lg" data-act="doact" data-kind="${kind}">${a.btn}</button>`);
  drawActPhotos();
}
async function doAct(kind, btn) {
  const a = ACTS[kind], id = cur.r.id, d = byId(id); if (!d) return;
  const name = ($('#a-name').value || '').trim(), text = ($('#a-text') ? $('#a-text').value : '').trim();
  if (!name) { toast('กรุณากรอกชื่อของคุณ', true); return; }
  if (a.req && !text) { toast('กรุณากรอก' + a.text, true); return; }
  if (kind === 'fixed' && !S.actPhotos.length) { toast('กรุณาแนบรูปหลังแก้ไขอย่างน้อย 1 รูป', true); return; }
  LS.set('name_' + a.role, name);
  const ev = (status, t) => ({ status, text: t, actor: name, role: a.role });
  const blobs = S.actPhotos.map(p => p.blob);
  await busy(btn, async () => {
    if (kind === 'accept') await Store.transition(id, { status: 'doing', tech_name: name }, ev('doing', 'รับงาน เริ่มดำเนินการ'));
    if (kind === 'partial') await Store.transition(id, { note: text }, ev('doing', 'ความคืบหน้า: ' + text));
    if (kind === 'fixed') await Store.transition(id, { status: 'review', tech_name: name, note: '' }, ev('review', 'แจ้งแก้ไขเสร็จ' + (text ? ': ' + text : '')), blobs);
    if (kind === 'approve') await Store.transition(id, { status: 'done', closed_at: new Date().toISOString() }, ev('done', 'ตรวจรับงาน ปิดรายการ'));
    if (kind === 'reject') await Store.transition(id, { status: 'doing', note: 'ตีกลับ: ' + text }, ev('new', 'ตีกลับ: ' + text));
    closeSheet();
    toast({ accept: 'รับงานแล้ว', partial: 'บันทึกแล้ว', fixed: 'ส่งให้ผู้แจ้งตรวจรับแล้ว', approve: 'ปิดงานเรียบร้อย', reject: 'ตีกลับให้ช่างแล้ว' }[kind]);
    if (kind === 'approve') confetti();
  });
}
function pinSheet() {
  sheet(`<h2>เข้าสู่ระบบผู้ดูแล</h2><p class="muted">ใส่รหัสผู้ดูแลเพื่อแก้ไข ลบรายการ และตั้งค่าระบบ</p>
    <form id="pinform" style="display:flex;flex-direction:column;gap:14px"><input class="input pininput" id="pinval" type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="รหัสผู้ดูแล" autofocus>
    <p class="err" id="pinerr" hidden>รหัสไม่ถูกต้อง ลองอีกครั้ง</p><button class="btn primary block lg" type="submit">เข้าสู่ระบบ</button></form>`);
}
function roleSheet() {
  const o = (role, icn, t, s) => `<button class="opt" data-act="role" data-role="${role}" aria-current="${!isAdmin() && S.role === role}"><span class="ico">${ic(icn, 22)}</span><span><b>${t}</b><small>${s}</small></span>${!isAdmin() && S.role === role ? ic('check', 20, 2.6) : ''}</button>`;
  sheet(`<h2>เปลี่ยนบทบาท</h2>${o('reporter', 'mega', 'ผู้แจ้ง', 'แจ้งจุดชำรุด และตรวจรับงาน')}${o('tech', 'wrench', 'ช่าง', 'รับงาน อัปเดตสถานะ แนบรูปหลังแก้ไข')}
    ${isAdmin() ? `<button class="opt" data-act="go" data-to="admin" aria-current="true"><span class="ico">${ic('gear', 22)}</span><span><b>ตั้งค่าระบบ</b><small>กำลังใช้งานในโหมดผู้ดูแล</small></span>${ic('chev', 20, 2.4)}</button><button class="btn ghost block" data-act="adminout">ออกจากโหมดผู้ดูแล</button>`
      : `<button class="opt" data-act="pin"><span class="ico">${ic('lock', 22)}</span><span><b>ผู้ดูแลระบบ</b><small>ใช้รหัสเพื่อแก้ไข ลบ และตั้งค่า</small></span>${ic('chev', 20, 2.4)}</button>`}`);
}
function placeSheet(id) {
  const p = id ? place(id) : null;
  S.placeEdit = { id: p ? p.id : null, lat: p ? p.lat : null, lng: p ? p.lng : null };
  sheet(`<h2>${p ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}</h2>
    <div class="field"><label for="p-name">ชื่ออาคาร / สถานที่</label><input class="input" id="p-name" value="${esc(p ? p.name : '')}" placeholder="เช่น อาคารหอประชุม"></div>
    <div class="field"><span class="flabel">พิกัดบนแผนที่</span><div class="maptools"><button type="button" class="chip" data-act="pgps">${ic('gps', 16)} ใช้ตำแหน่งปัจจุบัน</button><span class="hint">หรือแตะบนแผนที่</span></div><div class="smap" id="p-map"></div></div>
    <button class="btn primary block lg" data-act="saveplace">บันทึก</button>
    ${p ? `<button class="btn warn block" data-act="delplace">ลบสถานที่นี้</button>` : ''}`);
  const map = sheetMap = mkMap($('#p-map'), { sheet: true });
  const e = S.placeEdit; let mk = null;
  const set = (la, ln, pan) => { e.lat = la; e.lng = ln; if (!mk) { mk = L.marker([la, ln], { icon: pinIcon('#0FA77F'), draggable: true }).addTo(map); mk.on('dragend', () => { const q = mk.getLatLng(); e.lat = q.lat; e.lng = q.lng; }); } else mk.setLatLng([la, ln]); if (pan) map.setView([la, ln], Math.max(map.getZoom(), 18)); };
  S.placeEdit.set = set;
  if (e.lat != null) { map.setView([e.lat, e.lng], 18); set(e.lat, e.lng); } else applyView(map, defaultView());
  map.on('click', ev => set(ev.latlng.lat, ev.latlng.lng));
  setTimeout(() => map.invalidateSize(), 300);
}
function catSheet(id) {
  const c = id ? cat(id) : null;
  sheet(`<h2>${c ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2><div class="field"><label for="c-name">ชื่อหมวดหมู่</label><input class="input" id="c-name" value="${esc(c ? c.name : '')}" autofocus></div>
    <button class="btn primary block lg" data-act="savecat" data-id="${c ? c.id : ''}">บันทึก</button>${c ? `<button class="btn warn block" data-act="delcat" data-id="${c.id}">ลบหมวดหมู่นี้</button>` : ''}`);
}

/* ---------- import ---------- */
async function runImport(files) {
  const jf = files.find(f => f.name === 'data.json');
  if (!jf) { toast('ไม่พบไฟล์ data.json ในโฟลเดอร์ที่เลือก', true); return; }
  let rows; try { rows = JSON.parse(await jf.text()); } catch (e) { toast('ไฟล์ data.json ไม่ถูกต้อง', true); return; }
  const fileBy = Object.fromEntries(files.map(f => [f.name, f]));
  const pid = Object.fromEntries(Store.state.places.map(p => [p.name, p.id])), cid = Object.fromEntries(Store.state.cats.map(c => [c.name, c.id]));
  sheet(`<h2>กำลังนำเข้ารายการเดิม</h2><p class="muted" id="imp-txt">เตรียมข้อมูล…</p><div class="progress"><i id="imp-bar"></i></div><p class="hint">กรุณาอย่าปิดหน้านี้จนกว่าจะเสร็จ</p>`, { lock: true });
  let done = 0;
  try {
    for (const r of rows) {
      $('#imp-txt').textContent = `รายการที่ ${done + 1} จาก ${rows.length}: ${r.description}`;
      if (r.place && !pid[r.place]) pid[r.place] = await Store.admin('save_place', { p_pin: S.pin, p_id: null, p_name: r.place, p_lat: null, p_lng: null }, { silent: true });
      if (r.category && !cid[r.category]) cid[r.category] = await Store.admin('save_category', { p_pin: S.pin, p_id: null, p_name: r.category }, { silent: true });
      const blobs = [];
      for (const n of r.photos || []) if (fileBy[n]) blobs.push(await compress(fileBy[n]));
      await Store.createDefect({ description: r.description, place_id: pid[r.place] || null, sub_location: r.sub || '', category_id: cid[r.category] || null, status: r.status || 'new', note: r.note || '', reporter_name: 'รายงานเดิม' },
        blobs, 'นำเข้าข้อมูล', { silent: true, eventText: `นำเข้าจากแบบรายงานเดิม (ลำดับที่ ${r.no})` });
      done++; $('#imp-bar').style.width = (done / rows.length * 100) + '%';
    }
    await Store.reload(); closeSheet(); toast(`นำเข้าแล้ว ${done} รายการ`);
  } catch (e) {
    console.error(e); await Store.reload().catch(() => {}); closeSheet(); toast(`นำเข้าได้ ${done} รายการ แล้วหยุด — ${errText(e)}`, true);
  }
}

/* ---------- actions ---------- */
const ACT = {
  role(t) { S.role = t.dataset.role; LS.set('role', S.role); if (isAdmin()) { S.pin = ''; SS.set('pin', ''); } closeSheet(); const h = route().name; (h === 'home' || !location.hash) ? render(true) : render(true); },
  pin() { pinSheet(); },
  rolesheet() { roleSheet(); },
  adminout() { S.pin = ''; SS.set('pin', ''); closeSheet(); toast('ออกจากโหมดผู้ดูแลแล้ว'); route().name === 'admin' || route().name === 'edit' ? go('home') : render(false); },
  retry() { Store.state.loaded = false; render(false); Store.reload().catch(e => { Store.state.error = e.message; Store.state.loaded = true; render(false); }); },
  go(t) { if (t.dataset.f) S.filter.status = t.dataset.f; closeSheet(); go(t.dataset.to); },
  back() { history.length > 1 ? history.back() : go('home'); },
  open(t) { go('d/' + t.dataset.id); },
  filter(t) { S.filter.status = t.dataset.f; $$('[data-act="filter"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === S.filter.status)); drawList(); },
  mapfilter(t) { S.mapF = t.dataset.f; S.mapSel = null; $$('[data-act="mapfilter"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === S.mapF)); drawPins(); },
  async savecenter(t) {
    const c = mapCtx.map.getCenter();
    await busy(t, async () => { await Store.admin('set_public', { p_pin: S.pin, p_key: 'map_center', p_value: { lat: c.lat, lng: c.lng, zoom: mapCtx.map.getZoom() } }); toast('ตั้งเป็นมุมมองเริ่มต้นแล้ว'); });
  },
  zoom(t) { const el = document.createElement('div'); el.className = 'lightbox'; el.innerHTML = `<img src="${esc(t.dataset.src)}" alt="รูปขยาย">`; el.onclick = () => el.remove(); document.body.appendChild(el); },
  /* form */
  fcat(t) { S.draft.cat_id = S.draft.cat_id == t.dataset.c ? '' : t.dataset.c; $$('[data-act="fcat"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c == S.draft.cat_id)); },
  furg(t) { S.draft.urgency = t.dataset.u; $$('[data-act="furg"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.u === S.draft.urgency)); },
  gps() { locate((la, ln) => { setFormPin(la, ln, true, true); toast('ปักหมุดตามตำแหน่งปัจจุบันแล้ว'); }); },
  rmphoto(t) { S.draft.photos.splice(+t.dataset.i, 1); drawFormPhotos(); },
  async delphoto(t) { await busy(null, async () => { await Store.admin('delete_photo', { p_pin: S.pin, p_id: +t.dataset.id }); drawFormPhotos(); toast('ลบรูปแล้ว'); }); },
  /* detail */
  act(t) { actSheet(t.dataset.kind); },
  doact(t) { doAct(t.dataset.kind, t); },
  rmact(t) { S.actPhotos.splice(+t.dataset.i, 1); drawActPhotos(); },
  askdelete() { sheet(`<h2>ลบรายการนี้?</h2><p class="muted">รายการจะหายจากหน้าเว็บและรายงานทั้งหมด</p><button class="btn danger block lg" data-act="dodelete">ลบรายการ</button><button class="btn ghost block" data-act="closesheet">ยกเลิก</button>`); },
  async dodelete(t) { const id = cur.r.id; await busy(t, async () => { await Store.admin('delete_defect', { p_pin: S.pin, p_id: id }); closeSheet(); toast('ลบรายการแล้ว'); go('list', true); }); },
  closesheet() { closeSheet(); },
  /* export */
  expst(t) { const s = t.dataset.s, L = S.exp.status; S.exp.status = L.includes(s) ? L.filter(x => x !== s) : ORDER.filter(x => L.includes(x) || x === s); t.setAttribute('aria-pressed', S.exp.status.includes(s)); drawExport(); },
  expafter() { S.exp.after = !S.exp.after; render(false); },
  async docx(t) {
    const arr = expList(); if (!arr.length) return;
    sheet(`<h2>กำลังสร้างไฟล์ Word</h2><p class="muted" id="imp-txt">เตรียมรูปภาพ…</p><div class="progress"><i id="imp-bar"></i></div>`, { lock: true });
    try {
      await exportDocx(arr.map(d => ({ desc: expDesc(d), before: before(d).map(p => p.url), after: after(d).map(p => p.url), remark: expRemark(d) })),
        { title: S.exp.title, after: S.exp.after }, (i, n) => { const b = $('#imp-bar'); if (b) { b.style.width = (i / n * 100) + '%'; $('#imp-txt').textContent = `เตรียมรูปภาพ ${i} จาก ${n} รายการ`; } });
      closeSheet(); toast('ดาวน์โหลดไฟล์ Word แล้ว');
    } catch (e) { console.error(e); closeSheet(); toast(errText(e), true); }
  },
  /* admin */
  placesheet(t) { placeSheet(t.dataset.id ? +t.dataset.id : null); },
  pgps() { locate((la, ln) => S.placeEdit.set(la, ln, true)); },
  async saveplace(t) {
    const name = $('#p-name').value.trim(), e = S.placeEdit; if (!name) { toast('กรุณากรอกชื่อสถานที่', true); return; }
    await busy(t, async () => { await Store.admin('save_place', { p_pin: S.pin, p_id: e.id, p_name: name, p_lat: e.lat, p_lng: e.lng }); closeSheet(); toast('บันทึกสถานที่แล้ว'); });
  },
  async delplace(t) { await busy(t, async () => { await Store.admin('delete_place', { p_pin: S.pin, p_id: S.placeEdit.id }); closeSheet(); toast('ลบสถานที่แล้ว'); }); },
  catsheet(t) { catSheet(t.dataset.id ? +t.dataset.id : null); },
  async savecat(t) {
    const name = $('#c-name').value.trim(); if (!name) { toast('กรุณากรอกชื่อหมวดหมู่', true); return; }
    await busy(t, async () => { await Store.admin('save_category', { p_pin: S.pin, p_id: t.dataset.id ? +t.dataset.id : null, p_name: name }); closeSheet(); toast('บันทึกหมวดหมู่แล้ว'); });
  },
  async delcat(t) { await busy(t, async () => { await Store.admin('delete_category', { p_pin: S.pin, p_id: +t.dataset.id }); closeSheet(); toast('ลบหมวดหมู่แล้ว'); }); },
  pinsheet() { sheet(`<h2>เปลี่ยนรหัสผู้ดูแล</h2><div class="field"><label for="np1">รหัสใหม่</label><input class="input" id="np1" type="password" autocomplete="new-password" maxlength="12" autofocus></div><div class="field"><label for="np2">พิมพ์รหัสใหม่อีกครั้ง</label><input class="input" id="np2" type="password" autocomplete="new-password" maxlength="12"></div><button class="btn primary block lg" data-act="savepin">บันทึกรหัสใหม่</button>`); },
  async savepin(t) {
    const a = $('#np1').value, b = $('#np2').value;
    if (a.length < 4) { toast('รหัสใหม่ต้องมีอย่างน้อย 4 ตัว', true); return; }
    if (a !== b) { toast('รหัสทั้งสองช่องไม่ตรงกัน', true); return; }
    await busy(t, async () => { await Store.admin('set_pin', { p_pin: S.pin, p_new: a }); S.pin = a; SS.set('pin', a); closeSheet(); toast('เปลี่ยนรหัสแล้ว'); });
  },
  resetdemo() { sheet(`<h2>ล้างข้อมูลทดลองทั้งหมด?</h2><p class="muted">ข้อมูลทดลองในเครื่องนี้จะถูกลบและกู้คืนไม่ได้</p><button class="btn danger block lg" data-act="doreset">ล้างข้อมูล</button><button class="btn ghost block" data-act="closesheet">ยกเลิก</button>`); },
  async doreset(t) { await busy(t, async () => { await Store.resetDemo(); closeSheet(); toast('ล้างข้อมูลแล้ว'); }); }
};

document.addEventListener('click', e => {
  const scrim = e.target.closest('.scrim');
  if (scrim && e.target === scrim) { if (!scrim.dataset.lock) closeSheet(); return; }
  const t = e.target.closest('[data-act]'); if (!t) return;
  const fn = ACT[t.dataset.act]; if (fn) fn(t, e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { S.filter.q = t.value; drawList(); return; }
  if (t.matches('.cmp input')) { t.parentElement.style.setProperty('--pos', t.value + '%'); return; }
  if (t.id === 'e-title') { S.exp.title = t.value; const h = $('#exp-prev h4'); if (h) h.textContent = t.value; return; }
  if (t.dataset.k && S.draft && t.closest('#form')) S.draft[t.dataset.k] = t.value;
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'fl-place') { S.filter.place = t.value; drawList(); }
  else if (t.id === 'fl-cat') { S.filter.cat = t.value; drawList(); }
  else if (t.id === 'e-from' || t.id === 'e-to' || t.id === 'e-place') { S.exp[t.id.slice(2)] = t.value; drawExport(); }
  else if (t.id === 'f-place') {
    const p = place(t.value), d = S.draft;
    if (p && p.lat != null && !d.pinned) setFormPin(p.lat, p.lng, false, true);
  }
  else if (t.id === 'f-file') { const ph = await filesToPhotos([...t.files]); S.draft.photos.push(...ph); drawFormPhotos(); }
  else if (t.id === 'a-file') { const ph = await filesToPhotos([...t.files]); S.actPhotos.push(...ph); drawActPhotos(); }
  else if (t.id === 'imp') { const files = [...t.files]; t.value = ''; if (files.length) runImport(files); }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'form') submitForm($('#f-submit'));
  if (e.target.id === 'pinform') {
    const v = $('#pinval').value, btn = e.target.querySelector('button');
    if (!v) return;
    await busy(btn, async () => {
      const ok = await Store.admin('verify', { p_pin: v });
      if (!ok) { $('#pinerr').hidden = false; $('#pinval').value = ''; $('#pinval').focus(); return; }
      S.pin = v; SS.set('pin', v); if (!S.role) { S.role = 'reporter'; LS.set('role', S.role); }
      closeSheet(); toast('เข้าสู่โหมดผู้ดูแลแล้ว'); render(false);
    });
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const lb = $('.lightbox'); if (lb) lb.remove(); else { const s = $('.scrim'); if (s && !s.dataset.lock) closeSheet(); } } });

render(false);
Store.init();
