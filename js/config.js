// ตั้งค่าระบบ — แก้ไขไฟล์นี้ไฟล์เดียวเมื่อเชื่อมต่อ Supabase
// ถ้าปล่อย SUPABASE_URL ว่างไว้ เว็บจะทำงานใน "โหมดทดลอง" (ข้อมูลเก็บเฉพาะในเครื่องนั้น)
window.APP_CONFIG = {
  SUPABASE_URL: 'https://yqtvybevdyjwitjqhmzo.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_i1WdSrKTQF16i1qu9JtWLw_pLwtNT8y',

  APP_NAME: 'ระบบแจ้งซ่อมบำรุง',
  ORG_NAME: 'สวนพฤกษศาสตร์ป่าชายเลนนานาชาติ รัชกาลที่ ๙',
  REPORT_TITLE: 'แบบรายงานรายการชำรุดบกพร่อง',

  // LINE ID ของบัญชีแจ้งเตือน (ขึ้นต้นด้วย @) — หน้าช่างจะแสดง QR ให้เพิ่มเพื่อน ถ้าว่างไว้จะไม่แสดง
  LINE_ID: '@561gcsdb'
};
