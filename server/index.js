'use strict';
require('./id-compat');
const http = require('http');
const path = require('path');
const os = require('os');
const express = require('express');
const { Server } = require('@colyseus/core');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const zlib = require('zlib');
const fs = require('fs');
const crypto = require('crypto');
const { BattleRoom } = require('./Room');

const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());
// 健康检查（供 Render 等托管平台探活）
app.get('/healthz', (req, res) => res.status(200).send('ok'));
// 页面可更新、静态版本资源可缓存；小型文本预压缩一次，避免每次请求重复占用 CPU。
const publicDir=path.join(__dirname,'..','public');
const serverSource=['Room.js','index.js','id-compat.js'].map(p=>fs.readFileSync(path.join(__dirname,p)));
const textAssets=new Map(['/index.html','/vendor/colyseus.js','/assets/sprites.js','/assets/pixel-icons.js','/assets/archipelago.css'].filter(p=>fs.existsSync(path.join(publicDir,p))).map(p=>{
  const file=path.join(publicDir,p),body=fs.readFileSync(file); return [p,{body,gzip:zlib.gzipSync(body),mtime:fs.statSync(file).mtimeMs,etag:'"'+crypto.createHash('sha256').update(body).digest('hex').slice(0,20)+'"'}];
}));
function textAsset(key){const asset=textAssets.get(key);if(!asset)return null;const file=path.join(publicDir,key),mtime=fs.statSync(file).mtimeMs;if(mtime!==asset.mtime){asset.body=fs.readFileSync(file);asset.gzip=zlib.gzipSync(asset.body);asset.mtime=mtime;asset.etag='"'+crypto.createHash('sha256').update(asset.body).digest('hex').slice(0,20)+'"';}return asset;}
app.get('/version',(req,res)=>{const hash=crypto.createHash('sha256');for(const body of serverSource)hash.update(body);for(const key of textAssets.keys())hash.update(textAsset(key).body);res.set('Cache-Control','no-store').json({release:hash.digest('hex').slice(0,16)});});
app.use((req,res,next)=>{
  if(req.method!=='GET'&&req.method!=='HEAD') return next();
  const key=req.path==='/'?'/index.html':req.path,asset=textAsset(key);
  if(!asset) return next();
  res.set('Cache-Control',key==='/index.html'?'no-cache':'public, max-age=86400').set('ETag',asset.etag).set('Vary','Accept-Encoding');
  res.type(key.endsWith('.html')?'html':key.endsWith('.css')?'css':'js');
  if(req.headers['if-none-match']===asset.etag) return res.status(304).end();
  if(/\bgzip\b/.test(req.headers['accept-encoding']||'')){res.set('Content-Encoding','gzip');return res.send(asset.gzip);}
  res.send(asset.body);
});
// 前端静态页面（含 public/vendor/colyseus.js 本地打包的客户端，零外部 CDN）
app.use(express.static(publicDir,{maxAge:'1d'}));

const server = http.createServer(app);
const gameServer = new Server({ transport:new WebSocketTransport({server,pingInterval:10000,pingMaxRetries:3}),greet:false });

// 自动加入（局域网同一 WiFi 下打开即自动进同一局）
gameServer.define('battle', BattleRoom);
// 房间码加入（公网精确匹配：创建房间得 6 位码，朋友输码加入）
gameServer.define('battle_code', BattleRoom).filterBy(['code']);

gameServer.listen(PORT).then(() => {
  const ips = [];
  for(const name in os.networkInterfaces()){
    for(const a of os.networkInterfaces()[name]){
      if(a.family === 'IPv4' && !a.internal) ips.push(a.address);
    }
  }
  console.log('');
  console.log('  ✅ 海岛争霸服务器已启动');
  console.log('  ────────────────────────────────────');
  console.log(`  本机访问:  http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  手机访问:  http://${ip}:${PORT}   (需与电脑同一 WiFi)`));
  console.log('  ────────────────────────────────────');
  console.log('  手机连同一 WiFi，浏览器打开上面的「手机访问」网址即可对战。');
  console.log('  关闭本窗口即停止服务器。');
  console.log('');
}).catch((err) => {
  console.error('❌ 服务器启动失败：', err);
  process.exit(1);
});
