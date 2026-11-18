"""jiajia accessories：商品照去背 + 產生網站用圖。
用法：
  pip install --break-system-packages rembg onnxruntime scipy opencv-python-headless pillow
  python3 cut.py <照片> <商品id> [--box x0 y0 x1 y1] [--kind earring|necklace|set] [--out 輸出資料夾]
--box：只取照片中飾品所在的範圍（避開白卡上的字），強烈建議先看照片再給。
輸出：p-<id>-1.jpg（網站/賣貨便用，1200 方圖，粉色背景）、c-<id>.png（透明全圖）、
      t-<id>-l.png / t-<id>-r.png（試戴用左右耳環）、套組另有 t-<id>-n.png（項鍊墜子）。
做完一定要打開 p-<id>-1.jpg 檢查：卡片、字、陰影都不能留下。
"""
import sys, argparse, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
ap=argparse.ArgumentParser(); ap.add_argument('photo'); ap.add_argument('id')
ap.add_argument('--box',nargs=4,type=int); ap.add_argument('--kind',default='earring'); ap.add_argument('--out',default='.')
ap.add_argument('--keep',type=int,default=0,help='保留最大的幾塊（預設耳環2、套組3）')
a=ap.parse_args()
from rembg import new_session, remove
S=new_session('isnet-general-use')
im=Image.open(a.photo).convert('RGB')
if a.box: im=im.crop(tuple(a.box))
m=np.asarray(remove(im,session=S,only_mask=True)).astype(float)/255
keep_n=a.keep or (3 if a.kind=='set' else (1 if a.kind=='necklace' else 2))
hard=m>.5; lab,n=ndi.label(hard); sz=ndi.sum(hard,lab,range(1,n+1))
keep=np.isin(lab,[i+1 for i in np.argsort(sz)[::-1][:keep_n] if sz[i]>sz.max()*.04])
keep=ndi.binary_dilation(keep,iterations=3)
rgba=np.dstack([np.asarray(im),(m*keep*255).astype(np.uint8)])
c=rgba[...,:3].astype(float); rgba[...,:3]=np.clip((c-128)*1.08+134,0,255).astype(np.uint8)
def trim(x,pad=6):
    ys,xs=np.nonzero(x[...,3]>10); return x[max(ys.min()-pad,0):ys.max()+pad,max(xs.min()-pad,0):xs.max()+pad]
def save(x,p,mx):
    I=Image.fromarray(x); k=min(1,mx/max(I.size)); I.resize((int(I.width*k),int(I.height*k)),Image.LANCZOS).save(p,optimize=True)
def display(x,p):
    SZ=1200; piece=Image.fromarray(trim(x,2)); W,H=piece.size; k=min(SZ*.78/W,SZ*.70/H)
    piece=piece.resize((int(W*k),int(H*k)),Image.LANCZOS)
    yy,xx=np.mgrid[0:SZ,0:SZ]/SZ
    bg=np.array([255,249,245])*(1-yy[...,None])+np.array([249,229,232])*yy[...,None]
    glow=np.exp(-(((xx-.28)**2+(yy-.22)**2)/.09))[...,None]; bg=bg*(1-glow*.35)+255*glow*.35
    cv=Image.fromarray(bg.astype(np.uint8)).convert('RGBA'); px,py=(SZ-piece.width)//2,(SZ-piece.height)//2-10
    sh=Image.new('L',(SZ,SZ),0); sh.paste(piece.split()[3],(px+14,py+22)); sh=sh.filter(ImageFilter.GaussianBlur(18)).point(lambda v:int(v*.24))
    shadow=Image.new('RGBA',(SZ,SZ),(120,70,80,0)); shadow.putalpha(sh); cv=Image.alpha_composite(cv,shadow); cv.alpha_composite(piece,(px,py))
    cv.convert('RGB').save(p,quality=90,optimize=True)
def pieces(x):
    A=x[...,3]>60; lab,n=ndi.label(ndi.binary_dilation(A,iterations=4)); sz=ndi.sum(A,lab,range(1,n+1))
    out=[]
    for i in [j+1 for j in np.argsort(sz)[::-1] if sz[j]>sz.max()*.05]:
        b=x.copy(); b[...,3]=b[...,3]*(lab==i); ys,xs=np.nonzero(lab==i); out.append((sz[i-1],xs.mean(),trim(b)))
    return out
o=a.out; os.makedirs(o,exist_ok=True)
display(rgba,f'{o}/p-{a.id}-1.jpg'); save(trim(rgba),f'{o}/c-{a.id}.png',900)
ps=pieces(rgba)
if a.kind=='necklace':
    save(ps[0][2],f'{o}/t-{a.id}-n.png',500)
elif a.kind=='set':
    save(ps[0][2],f'{o}/t-{a.id}-n.png',500); e=sorted(ps[1:3],key=lambda t:t[1])
    if len(e)==1: e=[e[0],e[0]]
    save(e[0][2],f'{o}/t-{a.id}-l.png',260); save(e[1][2],f'{o}/t-{a.id}-r.png',260)
else:
    e=sorted(ps[:2],key=lambda t:t[1])
    if len(e)==1: e=[e[0],(0,0,np.ascontiguousarray(e[0][2][:,::-1]))]
    save(e[0][2],f'{o}/t-{a.id}-l.png',260); save(e[1][2],f'{o}/t-{a.id}-r.png',260)
print('pieces:',[int(p[0]) for p in ps],'->',o)
