'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'public/index.html'),'utf8'),paths=new Set();
for(const m of html.matchAll(/['"](\/assets\/[^'"\s]*\.(?:png|webp|woff2|ttf|css|js))(?:\?[^'"\s]*)?['"]/g))paths.add(m[1]);
const loop=/for\(let i=1;i<=3;i\+\+\)\{ const im=new Image\(\); im.src='([^']*)'\+i\+'([^']*)'/g;for(const m of html.matchAll(loop))for(let i=1;i<=3;i++)paths.add(m[1]+i+m[2]);
for(const p of paths)assert(fs.existsSync(path.join(root,'public',p)),p+' must exist');
console.log('STATIC-ASSETS-OK: '+paths.size+' referenced files exist');
