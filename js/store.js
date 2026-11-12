/* ชั้นข้อมูล: ใช้ Supabase เมื่อกรอก config แล้ว ไม่เช่นนั้นใช้โหมดทดลอง (เก็บใน IndexedDB ของเครื่อง) */
const Store = (() => {
  const cfg = window.APP_CONFIG || {};
  const wantCloud = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const cloud = wantCloud && !!window.supabase;
  const DEFAULT_CATS = ['ไฟฟ้า', 'ประปา/ปั๊ม', 'แอร์', 'โครงสร้าง/พื้น/ถนน', 'หลังคา/รั่วซึม', 'สี/ผิวงาน', 'IT/CCTV/WiFi', 'เฟอร์นิเจอร์/ป้าย', 'อื่น ๆ'];

  const state = { mode: cloud ? 'cloud' : 'demo', places: [], cats: [], defects: [], settings: {}, loaded: false, error: null };
  const subs = [];
  const emit = () => subs.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  let be = null;

  /* ---------- Supabase ---------- */
  function cloudBackend() {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const ok = r => { if (r.error) throw new Error(r.error.message || 'เกิดข้อผิดพลาด'); return r.data; };
    const url = p => sb.storage.from('photos').getPublicUrl(p).data.publicUrl;
    return {
      async fetchAll() {
        // ดึงทีละหน้า เพราะ Supabase ส่งได้ไม่เกิน 1000 แถวต่อคำขอ
        const allDefects = async () => {
          const out = [], N = 500;
          for (let from = 0; ; from += N) {
            const page = ok(await sb.from('defects').select('*, photos(*), events(*)').order('id').range(from, from + N - 1));
            out.push(...page);
            if (page.length < N) return out;
          }
        };
        const [p, c, d, s] = await Promise.all([
          sb.from('places').select('*').eq('active', true).order('name'),
          sb.from('categories').select('*').eq('active', true).order('sort').order('id'),
          allDefects(),
          sb.from('app_public').select('*')
        ]);
        return {
          places: ok(p), cats: ok(c),
          defects: d.map(x => ({ ...x, photos: (x.photos || []).map(ph => ({ ...ph, url: url(ph.path) })), events: x.events || [] })),
          settings: Object.fromEntries(ok(s).map(r => [r.key, r.value]))
        };
      },
      async insertDefect(row) { return ok(await sb.from('defects').insert(row).select('id').single()).id; },
      async checkStatus(id, expect) {
        const r = ok(await sb.from('defects').select('status').eq('id', id).maybeSingle());
        if (!r || r.status !== expect) throw new Error('STALE_STATUS');
      },
      async patchDefect(id, patch, expect) {
        let q = sb.from('defects').update(patch).eq('id', id);
        if (expect) q = q.eq('status', expect);
        const r = ok(await q.select('id'));
        if (!r.length) throw new Error('STALE_STATUS');
      },
      async addPhoto(defectId, kind, blob) {
        const path = `${defectId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        ok(await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }));
        ok(await sb.from('photos').insert({ defect_id: defectId, kind, path }));
      },
      async addEvent(row) { ok(await sb.from('events').insert(row)); },
      async rpc(name, args) { return ok(await sb.rpc('admin_' + name, args)); },
      // ลบไฟล์รูปที่อยู่ในถังขยะออกจากที่เก็บรูปจริง แล้วคืนจำนวนไฟล์ที่ลบได้
      async purgeFiles(pin) {
        const paths = ok(await sb.rpc('admin_trash_list', { p_pin: pin })) || [];
        if (!paths.length) return 0;
        for (let i = 0; i < paths.length; i += 100) ok(await sb.storage.from('photos').remove(paths.slice(i, i + 100)));
        return ok(await sb.rpc('admin_trash_done', { p_pin: pin, p_paths: paths }));
      },
      listen(cb) { sb.channel('all-changes').on('postgres_changes', { event: '*', schema: 'public' }, cb).subscribe(); }
    };
  }

  /* ---------- โหมดทดลอง ---------- */
  function localBackend() {
    let db = null;
    const NAME = 'repair-demo';
    const open = () => new Promise((res, rej) => {
      const r = indexedDB.open(NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const idbGet = async () => { try { const d = await open(); return await new Promise(res => { const g = d.transaction('kv').objectStore('kv').get('db'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); }); } catch (e) { return null; } };
    const idbSet = async v => { try { const d = await open(); await new Promise(res => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, 'db'); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { /* ใช้ในหน่วยความจำต่อไป */ } };
    const seed = () => ({ seq: 100, pin: '1234', settings: {}, places: [], cats: DEFAULT_CATS.map((n, i) => ({ id: i + 1, name: n, sort: i, active: true })), defects: [], photos: [], events: [] });
    const load = async () => { if (!db) db = (await idbGet()) || seed(); return db; };
    const save = () => idbSet(db);
    const nid = () => ++db.seq;
    const toDataUrl = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    const pinOk = p => { if (p !== db.pin) throw new Error('INVALID_PIN'); };
    const now = () => new Date().toISOString();
    return {
      async fetchAll() {
        await load();
        return {
          places: db.places.filter(p => p.active).sort((a, b) => a.name.localeCompare(b.name, 'th')).map(p => ({ ...p })),
          cats: db.cats.filter(c => c.active).map(c => ({ ...c })),
          defects: db.defects.map(d => ({ ...d, photos: db.photos.filter(p => p.defect_id === d.id).map(p => ({ ...p })), events: db.events.filter(e => e.defect_id === d.id).map(e => ({ ...e })) })),
          settings: { ...db.settings }
        };
      },
      async insertDefect(row) {
        await load();
        const id = db.defects.reduce((m, d) => Math.max(m, d.id), 0) + 1;
        db.defects.push({ id, description: '', place_id: null, sub_location: '', category_id: null, urgency: 'normal', status: 'new', note: '', lat: null, lng: null, reporter_name: '', tech_name: '', created_at: now(), updated_at: now(), closed_at: null, ...row });
        await save(); return id;
      },
      async checkStatus(id, expect) { await load(); const d = db.defects.find(x => x.id === id); if (!d || d.status !== expect) throw new Error('STALE_STATUS'); },
      async patchDefect(id, patch, expect) {
        await load(); const d = db.defects.find(x => x.id === id);
        if (!d || (expect && d.status !== expect)) throw new Error('STALE_STATUS');
        Object.assign(d, patch); await save();
      },
      async addPhoto(defectId, kind, blob) { await load(); db.photos.push({ id: nid(), defect_id: defectId, kind, path: '', url: await toDataUrl(blob), created_at: now() }); await save(); },
      async addEvent(row) { await load(); db.events.push({ id: nid(), created_at: now(), ...row }); await save(); },
      async rpc(name, a) {
        await load();
        if (name === 'verify') return a.p_pin === db.pin;
        pinOk(a.p_pin);
        let out = null;
        if (name === 'set_pin') { if ((a.p_new || '').length < 4) throw new Error('PIN_TOO_SHORT'); db.pin = a.p_new; }
        else if (name === 'update_defect') {
          const d = db.defects.find(x => x.id === a.p_id);
          Object.assign(d, a.p_data, { updated_at: now() });
          if ('status' in a.p_data) d.closed_at = a.p_data.status === 'done' ? (d.closed_at || now()) : null;
        }
        else if (name === 'delete_defect') db.defects = db.defects.filter(x => x.id !== a.p_id);
        else if (name === 'delete_photo') db.photos = db.photos.filter(x => x.id !== a.p_id);
        else if (name === 'save_place') {
          if (a.p_id == null) { out = nid(); db.places.push({ id: out, name: a.p_name, lat: a.p_lat, lng: a.p_lng, sort: 0, active: true }); }
          else { out = a.p_id; Object.assign(db.places.find(x => x.id === a.p_id), { name: a.p_name, lat: a.p_lat, lng: a.p_lng }); }
        }
        else if (name === 'delete_place') db.places.find(x => x.id === a.p_id).active = false;
        else if (name === 'save_category') {
          if (a.p_id == null) { out = nid(); db.cats.push({ id: out, name: a.p_name, sort: db.cats.length, active: true }); }
          else { out = a.p_id; db.cats.find(x => x.id === a.p_id).name = a.p_name; }
        }
        else if (name === 'delete_category') db.cats.find(x => x.id === a.p_id).active = false;
        else if (name === 'set_public') db.settings[a.p_key] = a.p_value;
        await save(); return out;
      },
      async reset() { db = seed(); await save(); }
    };
  }

  /* ---------- ส่วนที่ใช้ร่วมกัน ---------- */
  let inflight = null;
  function reload() {
    const p = (async () => {
      const d = await be.fetchAll();
      d.defects.forEach(x => {
        x.photos.sort((a, b) => a.id - b.id);
        x.events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);
      });
      d.defects.sort((a, b) => b.id - a.id);
      Object.assign(state, d, { loaded: true, error: null });
      emit();
    })();
    inflight = p;
    p.then(() => {}, () => {}).then(() => { if (inflight === p) inflight = null; });
    return p;
  }

  // การเปลี่ยนแปลงที่เครื่องนี้มีข้อมูลอยู่แล้ว (เช่น เป็นคนบันทึกเอง) ไม่ต้องโหลดใหม่ซ้ำ
  const sameTime = (a, b) => a != null && b != null && new Date(a).getTime() === new Date(b).getTime();
  function isKnown(p) {
    const n = p.new || {}, ds = state.defects;
    if (p.eventType === 'INSERT' && p.table === 'events') return ds.some(d => d.events.some(e => e.id === n.id));
    if (p.eventType === 'INSERT' && p.table === 'photos') return ds.some(d => d.photos.some(x => x.id === n.id));
    if (p.eventType !== 'DELETE' && p.table === 'defects') {
      const d = ds.find(x => x.id === n.id);
      return !!d && !n.deleted_at && d.status === n.status && sameTime(d.updated_at, n.updated_at);
    }
    return false;
  }

  async function init() {
    if (wantCloud && !cloud) { state.error = 'โหลดตัวเชื่อมต่อฐานข้อมูลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'; state.loaded = true; emit(); return; }
    be = cloud ? cloudBackend() : localBackend();
    try { await reload(); } catch (e) { state.error = e.message; state.loaded = true; emit(); }
    if (be.listen) {
      let t, pend = [];
      be.listen(p => {
        pend.push(p); clearTimeout(t);
        t = setTimeout(async () => {
          if (inflight) await inflight.catch(() => {});
          const need = pend.some(x => !isKnown(x)); pend = [];
          if (need) reload().catch(() => {});
        }, 800);
      });
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && be) reload().catch(() => {}); });
  }

  /* photos: Blob หรือ { blob } — ถ้าเป็น object จะจำว่ารูปไหนอัปโหลดแล้ว
     prog: object ที่จำ id ของรายการที่สร้างแล้ว เพื่อให้กดส่งซ้ำหลังเน็ตหลุดโดยไม่เกิดรายการซ้ำ */
  async function createDefect(row, photos, actor, opt = {}) {
    const prog = opt.progress || {};
    if (!prog.id) prog.id = await be.insertDefect(row);
    for (const ph of photos) {
      if (ph.done) continue;
      await be.addPhoto(prog.id, 'before', ph.blob || ph);
      if (!(ph instanceof Blob)) ph.done = true;
    }
    if (!prog.evented) {
      await be.addEvent({ defect_id: prog.id, status: 'new', text: opt.eventText || 'แจ้งรายการ', actor, role: 'reporter' });
      prog.evented = true;
    }
    if (!opt.silent) await reload();
    return prog.id;
  }

  // expect = สถานะที่ผู้ใช้เห็นตอนกด ถ้าในฐานข้อมูลเปลี่ยนไปแล้วจะไม่บันทึกทับ
  async function transition(id, patch, ev, blobs = [], expect) {
    if (expect && blobs.length) await be.checkStatus(id, expect);
    for (const b of blobs) await be.addPhoto(id, 'after', b);
    await be.patchDefect(id, { ...patch, updated_at: new Date().toISOString() }, expect);
    await be.addEvent({ defect_id: id, ...ev });
    await reload();
  }

  async function addPhotos(id, kind, blobs, opt = {}) { for (const b of blobs) await be.addPhoto(id, kind, b); if (!opt.silent) await reload(); }
  async function addEvent(row, opt = {}) { await be.addEvent(row); if (!opt.silent) await reload(); }

  async function admin(name, args, opt = {}) {
    const r = await be.rpc(name, args);
    if (name !== 'verify' && !opt.silent) await reload();
    return r;
  }

  async function purgeFiles(pin) { return be && be.purgeFiles ? be.purgeFiles(pin) : 0; }

  async function resetDemo() { if (be.reset) { await be.reset(); await reload(); } }

  return { state, init, reload, subscribe: f => subs.push(f), createDefect, transition, addPhotos, addEvent, admin, purgeFiles, resetDemo };
})();
