// 雅琦飾品：在賣貨便「開立一般賣場」頁（https://myship.7-11.com.tw/general/maintain）用 javascript_tool 執行。
// 圖片從 GitHub raw 讀（https://raw.githubusercontent.com/onlyhandrubbing/manfen-nvzhu/main/<檔名>），所以要先把 p-<id>-1.jpg 推上 repo。
// 注意：Chrome 分頁要在前景、視窗不能縮小（innerWidth 為 0 時圖片框會卡住），不行就 tabs_create_mcp 開新分頁。
// 注意：賣貨便有違規字過濾（菸類相關）。踩過的字：糖果、糖霜、皇冠、黃色、琺瑯、膚色、圓框。出現「違規字」或菸害警告就改字，不要按同意。
// 步驟 1（賣場設定）：STORE({...}) → 出現「儲存成功」後點「確認」
// 步驟 2（商品上架）：PRODUCT({...}) → 出現「商品新增成功」→ 點「完成賣場設定」→ 到 /myship/list1 讀新的 GM 編號
window.YQ = {
  S: ms => new Promise(r => setTimeout(r, ms)),
  RAW: 'https://raw.githubusercontent.com/onlyhandrubbing/manfen-nvzhu/main/',
  async putSlim(sl, bl, name) { const S = this.S; const inp = sl.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([bl], name, { type: 'image/jpeg' })); inp.value = ''; inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); for (let i = 0; i < 20 && !document.querySelector('.slim-popover .slim-btn-confirm'); i++) await S(300); await S(800); document.querySelector('.slim-popover .slim-btn-confirm')?.click(); for (let i = 0; i < 20; i++) { await S(400); if (!/busy/.test(sl.getAttribute('data-state'))) break; } return sl.getAttribute('data-state'); },
  async banner(url) { const b = await fetch(url).then(r => r.blob()); const im = await createImageBitmap(b); const W = 1440, H = 400; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fdf3f1'); g.addColorStop(1, '#f9e6e9'); x.fillStyle = g; x.fillRect(0, 0, W, H); const t = document.createElement('canvas'); t.width = 600; t.height = 400; const tx = t.getContext('2d'); tx.drawImage(im, 60, 200, 1080, 720, 0, 0, 600, 400); tx.globalCompositeOperation = 'destination-in'; const rg = tx.createRadialGradient(300, 200, 250, 300, 200, 330); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); tx.fillStyle = rg; tx.fillRect(0, 0, 600, 400); x.drawImage(t, 690, 0); x.fillStyle = '#d9607a'; x.font = 'italic 600 52px Georgia, serif'; x.fillText('雅琦飾品', 150, 185); x.font = '26px sans-serif'; x.fillStyle = '#8a6d72'; x.fillText('每款只有一件，賣完就沒了', 152, 240); return await new Promise(r => c.toBlob(r, 'image/jpeg', .9)); },
  // o = {id, name:'雅琦飾品｜XXX', kw:'關鍵字,逗號分隔', md:'一句話描述', html:'<p>…</p>'}
  async STORE(o) { const S = this.S; const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('Cgdm_Name', o.name); set('MetaKeyword', o.kw); set('MetaDescription', o.md); $('#tabs-1 .note-editor').prev().summernote('code', o.html);
    ['conveyance_1', 'payment_1'].forEach(id => { const e = document.getElementById(id); if (!e.checked) e.click(); });
    await this.putSlim(document.querySelector('#tabs-1 .slim'), await this.banner(this.RAW + 'p-' + o.id + '-1.jpg'), 'banner-' + o.id + '.jpg');
    document.getElementById('btnMainTainCgdm').click(); await S(3000); [...document.querySelectorAll('button')].find(b => b.innerText.trim() === '我知道了' && b.offsetParent)?.click(); await S(3500);
    return [...document.querySelectorAll('.modal.show,.swal2-popup,.modal[style*=block]')].map(m => m.innerText.replace(/\s+/g, ' ').slice(0, 120)).join(' || ') + ' | GM:' + document.getElementById('Cgdm_Id').value; },
  // p = {id, name:'商品名', html:'<p>…</p>', spec:'規格名', qty:1, price:450}
  async PRODUCT(p) { const S = this.S; await S(800); const setN = (name, v) => { const e = document.querySelector(`#tabs-2 [name="${name}"]`); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    setN('product.Cgdd_Product_Name[1]', p.name); $('#tabs-2 .note-editor').first().prev().summernote('code', p.html);
    await this.putSlim(document.getElementById('newCropper-1_2001').closest('.slim'), await fetch(this.RAW + 'p-' + p.id + '-1.jpg').then(r => r.blob()), 'p-' + p.id + '-1.jpg');
    [...document.querySelectorAll('#tabs-2 button')].find(b => b.innerText.trim() === '新增單規格').click(); await S(800);
    setN('specification.Cgds_Spec[1]', p.spec); setN('specification.Cgds_Inventory[1]', String(p.qty)); setN('specification.Cgds_Price[1]', String(p.price));
    [...document.querySelectorAll('#tabs-2 button')].find(b => b.innerText.trim() === '儲存並上架' && b.offsetParent).click();
    let t = ''; for (let i = 0; i < 20 && !t; i++) { await S(700); t = [...document.querySelectorAll('.modal.show,.swal2-popup,.modal[style*=block]')].map(m => m.innerText.replace(/\s+/g, ' ').slice(0, 100)).join(' || '); } return t; }
};
'YQ ready';
