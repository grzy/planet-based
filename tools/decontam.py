"""Clean a cutout made from an image shot on a plain light backdrop.
Removes only pixels that are BOTH close to the backdrop colour AND unsaturated (pockets of sky
between leaves, pale halos), keeps saturated detail (orange peel dimples), then colours every
soft edge pixel from its nearest fully opaque neighbour so no light fringe is left.
usage: python3 tools/decontam.py <source.png> <lift.png> <out.png>"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
src=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)/255
a=np.asarray(Image.open(sys.argv[2]).convert('RGBA'))[...,3].astype(float)/255
border=np.concatenate([src[:12].reshape(-1,3),src[:,:12].reshape(-1,3),src[:,-12:].reshape(-1,3)])
bg=np.median(border,0)
d=np.sqrt(((src-bg)**2).sum(2))
mx=src.max(2); mn=src.min(2); sat=(mx-mn)/np.maximum(mx,1e-3)
bgish=np.clip(1-(d-0.06)/0.10,0,1)*np.clip(1-(sat-0.12)/0.10,0,1)
a=a*(1-bgish)
a=ndimage.grey_erosion(a,size=(2,2)); a=ndimage.gaussian_filter(a,0.45)
solid=a>0.92
idx=ndimage.distance_transform_edt(~solid,return_distances=False,return_indices=True)
fg=src.copy(); edge=~solid
fg[edge]=src[idx[0][edge],idx[1][edge]]
out=np.dstack([fg*255,np.clip(a,0,1)*255]).astype('uint8')
im=Image.fromarray(out,'RGBA'); ys,xs=np.where(a>0.16)
im.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)).save(sys.argv[3])
