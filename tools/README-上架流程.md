# jiajia accessories：新商品上架流程（給 Claude 排程用）

店主在 admin.html 上傳新商品 → 存進 `inbox.json`（status: "waiting"）＋ `inbox/<id>-N.jpg`。
每天檢查一次，有 waiting 的就照下面做完，最後把 status 改成 "done" 並填 pid。

1. **讀資料**：`gh api repos/onlyhandrubbing/manfen-nvzhu/contents/inbox.json`（公開 repo，可直接讀）。照片從 raw.githubusercontent.com 下載，用 Read 看照片。
2. **定名稱、價格、文案**：店主有填就用店主的。沒填價格：耳環 390–450、項鍊 490–590、套組 590–690，看做工決定，不要太低。**文案要很簡單**：desc 只寫一句看得到的外觀（例如「小貓抱著一顆珍珠，可愛又耐看。」）。**不要寫材質**（鈦鋼、925 銀、琺瑯等都不要，店主說你分不出來，除非店主在備註寫了）；**不要說左右顏色不一樣**（照片常是同一款的正反面）。specs 固定用「耳環 1 對／僅此一對」或「項鍊 1 條（約 X 公分）＋耳環 1 對／僅此一組」。賣貨便說明也同樣簡單：一句外觀＋【內容】【數量】【出貨】三行，最後一行寫 jiajia accessories。賣場名稱格式：jiajia accessories｜商品名。名稱避免賣貨便違規字（見 myship.js 註解）。
3. **去背**：`python3 tools/cut.py <照片> <id> --box ... --kind earring|necklace|set`。先看照片給 --box 避開卡片上的字。輸出後一定要看 p-<id>-1.jpg，卡片、字、陰影、白邊都要清乾淨；鏤空的地方（圓框中間）透出卡片要另外處理。id 用英文小寫。
4. **推上 GitHub**：沙盒不能 git push。用 Claude in Chrome 開 https://github.com/onlyhandrubbing/manfen-nvzhu/upload/main ，read_page 找 "Choose your files" 的 ref，用 file_upload 上傳 p-/t- 圖，等上傳完再用 javascript_tool 點 Commit changes。用 gh api 確認 commit 有進去。
5. **開賣貨便賣場**：開新分頁到 https://myship.7-11.com.tw/general/maintain ，把 tools/myship.js 的內容貼進 javascript_tool 執行，再 `await YQ.STORE({...})`，出現「儲存成功」點「確認」，再 `await YQ.PRODUCT({...})`，成功後點「完成賣場設定」，到 /myship/list1 讀新的 GM 編號。
6. **加到網站**：products.json 加一筆（照既有格式：id, name, category, price, status:"on", link, images:["p-<id>-1.jpg"], desc, specs, metal, addedAt, sync, fit{shape,size,line,metal}, tryon{l,r[,n]}）。fit.shape 耳環用 stud/hoop/drop/long/geo/pearl，項鍊（fit.nshape）用 choker/short/long_n/pendant。新的放最前面。inbox.json 對應項目改 status:"done", pid:<id>。兩個檔一起用步驟 4 的方法上傳。
7. **IG（@yachi6505，名稱 jiajia accessories，Chrome 已登入）**：發一則新品貼文：照片用 p-<id>-1.jpg，文案含名稱、價格、「每款只有一件」、「連結在個人檔案」與 hashtag。
8. **回報**：用一兩句話說新上架了什麼、價格、賣貨便連結。遇到卡住（Chrome 沒開、視窗縮小、違規字改不過）就停下來說明，不要硬試。
