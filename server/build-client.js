'use strict';
// 把 colyseus.js 打包成浏览器可直接 <script> 引入的 IIFE（零 CDN）
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['client-entry.js'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'Colyseus',
  outfile: '../public/vendor/colyseus.js',
  minify: false,
  logLevel: 'info',
}).catch(() => process.exit(1));
