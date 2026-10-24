// 用 subset-font (HarfBuzz wasm) 把 Fusion Pixel TTF 子集化为游戏实际用字 woff2
const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');
const { renameSubset } = require('./rename-subset');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'index.html'), 'utf8');
const room = fs.readFileSync(path.join(__dirname, '..', '..', 'server', 'Room.js'), 'utf8');
const readme = ''; // Documentation is not rendered inside the game.

// 收集唯一字符（保留常用 ASCII 与标点）
const text = html + '\n' + room + '\n' + readme + '\n' +
  '0123456789+-×%万海岛争霸领地战争时停领域非暴坚守强力平定闪电突袭钢铁意志革命动员工业强国前线驰援雷霆攻势孤岛奇兵';
const chars = [...new Set([...text])].join('');

(async () => {
  const ttf = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'assets', 'pxfont.ttf'));
  console.log('unique chars:', chars.length);
  const out = await renameSubset(await subsetFont(ttf, chars, { targetFormat: 'woff2' }));
  const dst = path.join(__dirname, '..', '..', 'public', 'assets', 'pxfont.woff2');
  fs.writeFileSync(dst, out);
  console.log('pxfont.woff2 written:', out.length, 'bytes (full ttf:', ttf.length, ')');
})().catch(e => { console.error('SUBSET-FAIL:', e && e.message || e); process.exit(1); });
