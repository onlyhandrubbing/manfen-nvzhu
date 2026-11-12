// 每幾小時由 GitHub Actions 執行：讀每件商品的賣貨便頁面，更新庫存、價格、是否下架。
// 只有數字有變才會寫回 products.json，避免一直產生沒意義的更新。
import fs from "node:fs";

const FILE = "products.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
let changed = false;

async function check(link) {
  const res = await fetch(link, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      "Accept-Language": "zh-TW,zh;q=0.9"
    }
  });
  const html = (await res.text()).replace(/&quot;/g, '"');
  const offShelf = /已由賣家自行下架|目前無法販售|賣場不存在|查無此賣場/.test(html);
  // 每個規格會出現兩次，用規格編號去重
  const specs = new Map();
  for (const m of html.matchAll(/"Cgds_Id":"(\d+)","Cgds_Spec":"[^"]*","Cgds_Inventory":(-?\d+)/g)) specs.set(m[1], Math.max(0, +m[2]));
  const prices = [...html.matchAll(/"Cgds_Price":(\d+)/g)].map(m => +m[1]).filter(n => n > 0);
  if (!offShelf && specs.size === 0) throw new Error("讀不到庫存，頁面格式可能改了 (HTTP " + res.status + ")");
  return {
    stock: offShelf ? 0 : [...specs.values()].reduce((a, b) => a + b, 0),
    price: prices.length ? Math.min(...prices) : null,
    offShelf
  };
}

for (const p of data.products) {
  if (!p.link) continue;
  const old = p.sync || {};
  try {
    const s = await check(p.link);
    if (s.price == null) s.price = old.price ?? p.price;
    const same = old.ok && old.stock === s.stock && old.price === s.price && old.offShelf === s.offShelf;
    console.log(`${p.name}: 庫存 ${s.stock}，價格 ${s.price}，${s.offShelf ? "已下架" : "上架中"}${same ? "（沒變）" : "（更新）"}`);
    if (!same) { p.sync = { ...s, checkedAt: new Date().toISOString(), ok: true }; changed = true; }
  } catch (e) {
    console.log(`${p.name}: 檢查失敗 ${e.message}`);
    if (old.ok !== false) { p.sync = { ...old, ok: false, error: e.message, checkedAt: new Date().toISOString() }; changed = true; }
  }
}

if (changed) fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
console.log(changed ? "已更新 products.json" : "沒有變動");
