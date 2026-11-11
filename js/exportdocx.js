/* ส่งออกรายงานเป็นไฟล์ Word (.docx) ตามแบบรายงานรายการชำรุดบกพร่อง */
const DOCX_LIB = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('โหลดตัวสร้างไฟล์ Word ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต'));
    document.head.appendChild(s);
  });
}

// โหลดรูปแล้วย่อให้พอดีกับเอกสาร คืนค่า {buf, w, h}
async function fetchBlob(url) {
  let err;
  for (let n = 0; n < 2; n++) {   // ลองซ้ำ 1 ครั้งถ้าเน็ตสะดุด
    try { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.blob(); }
    catch (e) { err = e; }
  }
  throw err;
}
async function docxImage(url, max = 720) {
  const bmp = await decodeImage(await fetchBlob(url));
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  if (bmp.close) bmp.close();
  const out = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.8));
  const res = { buf: await out.arrayBuffer(), w: c.width, h: c.height };
  c.width = c.height = 0;
  return res;
}

async function exportDocx(rows, opt, onProgress) {
  if (!window.docx) await loadScript(DOCX_LIB);
  const D = window.docx, FONT = 'TH Sarabun New', SIZE = 32; // 16pt
  const CENTER = D.AlignmentType.CENTER, LEFT = D.AlignmentType.LEFT;
  const run = (text, bold) => new D.TextRun({ text, font: FONT, size: SIZE, bold: !!bold });
  const para = (text, align, bold) => new D.Paragraph({ alignment: align || CENTER, children: [run(text, bold)] });

  const landscape = !!opt.after;
  // ความกว้างคอลัมน์เป็น % : ลำดับ | รูปภาพ | อาการ | (รูปหลังแก้ไข) | หมายเหตุ
  const widths = landscape ? [7, 29, 23, 29, 12] : [9, 40, 34, 17];
  const pageW = landscape ? 1010 : 690;            // ความกว้างพื้นที่พิมพ์โดยประมาณ (px)
  const imgW = Math.round(pageW * (landscape ? 0.29 : 0.40)) - 24;
  const imgMaxH = 230;

  const cell = (children, i, shade) => new D.TableCell({
    width: { size: widths[i], type: D.WidthType.PERCENTAGE },
    verticalAlign: D.VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    shading: shade ? { fill: 'EDEDED' } : undefined,
    children
  });

  const stats = { failed: 0 };
  // ใส่รูปครบทุกรูป: 1–2 รูปเรียงลงล่าง, 3 รูปขึ้นไปจัดเป็นตาราง 2 คอลัมน์ให้ไม่สูงเกิน
  async function imageParas(urls) {
    const ims = [];
    for (const u of urls) {
      try { ims.push(await docxImage(u)); }
      catch (e) { stats.failed++; console.warn('รูปโหลดไม่ได้', u, e); }
    }
    const grid = ims.length > 2, maxW = grid ? Math.floor((imgW - 8) / 2) : imgW, maxH = grid ? 150 : imgMaxH;
    const runs = ims.map(im => {
      let w = maxW, h = Math.round(im.h / im.w * w);
      if (h > maxH) { h = maxH; w = Math.round(im.w / im.h * h); }
      return new D.ImageRun({ data: im.buf, transformation: { width: w, height: h } });
    });
    const out = [], step = grid ? 2 : 1;
    for (let i = 0; i < runs.length; i += step) {
      const kids = runs.slice(i, i + step).flatMap((r, j) => j ? [new D.TextRun({ text: ' ' }), r] : [r]);
      out.push(new D.Paragraph({ alignment: CENTER, spacing: { before: 40, after: 40 }, children: kids }));
    }
    return out;
  }

  const heads = landscape ? ['ลำดับ', 'รูปภาพ', 'อาการ', 'รูปหลังแก้ไข', 'หมายเหตุ'] : ['ลำดับ', 'รูปภาพ', 'อาการ', 'หมายเหตุ'];
  const tRows = [new D.TableRow({ tableHeader: true, children: heads.map((h, i) => cell([para(h, CENTER, true)], i, true)) })];

  for (let n = 0; n < rows.length; n++) {
    const r = rows[n];
    if (onProgress) onProgress(n + 1, rows.length);
    const bef = await imageParas(r.before);
    const cells = [
      cell([para(String(n + 1))], 0),
      cell(bef.length ? bef : [para('-')], 1),
      cell([para(r.desc, LEFT)], 2)
    ];
    if (landscape) { const aft = await imageParas(r.after); cells.push(cell(aft.length ? aft : [para('')], 3)); }
    cells.push(cell(r.remark.length ? r.remark.map(t => para(t)) : [para('')], landscape ? 4 : 3));
    tRows.push(new D.TableRow({ cantSplit: true, children: cells }));
  }

  const doc = new D.Document({
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [{
      properties: { page: { size: { orientation: landscape ? D.PageOrientation.LANDSCAPE : D.PageOrientation.PORTRAIT }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
      children: [
        new D.Paragraph({ alignment: CENTER, spacing: { after: 200 }, children: [new D.TextRun({ text: opt.title || 'แบบรายงานรายการชำรุดบกพร่อง', font: FONT, size: 36, bold: true })] }),
        new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: tRows })
      ]
    }]
  });

  const blob = await D.Packer.toBlob(doc);
  const d = new Date(), stamp = `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(opt.title || 'รายงานรายการชำรุด').replace(/[\\/:*?"<>|]/g, ' ').trim()} ${stamp}.docx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return stats;
}
