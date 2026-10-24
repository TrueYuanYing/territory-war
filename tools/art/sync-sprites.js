// 把 tmp/combat-sprites.js 的原创帧定义同步为 public/assets/sprites.js（浏览器 IIFE 全局）
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'combat-sprites.js'), 'utf8');
// 去掉 module.exports 行，包进 IIFE
const body = src.replace(/module\.exports\s*=\s*\{[^]*?\};\s*$/, '');
const wrapped =
  '// 原创 CC0 兵种 24x24 像素帧 —— 由 tmp/combat-sprites.js 生成，改动请改源文件后运行 tmp/sync-sprites.js\n' +
  '(function(global){\n' + body + '\nglobal.SPRITES = SPRITES;\n})(window);\n';
fs.writeFileSync(path.join(__dirname, '..', '..', 'public', 'assets', 'sprites.js'), wrapped);
console.log('public/assets/sprites.js written,', wrapped.length, 'bytes');
