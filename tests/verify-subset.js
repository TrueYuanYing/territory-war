// 校验子集 woff2 的 cmap 覆盖游戏全部用字
const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const room = fs.readFileSync(path.join(__dirname, '..', 'server', 'Room.js'), 'utf8');
// README is documentation, not game text; only runtime glyphs require coverage.
const readme = '';
const extra = '0123456789+-×%万海岛争霸领地战争时停领域非暴坚守强力平定闪电突袭钢铁意志革命动员工业强国前线驰援雷霆攻势孤岛奇兵';
const chars = [...new Set([...html + room + readme + extra])];

const woff2 = fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'pxfont.woff2'));
const font = fontkit.create(woff2);
const original = fontkit.create(fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'pxfont.ttf')));
const cmap = font.characterSet; // CharacterSet 对象
const missing = [];
for (const ch of chars) {
  if (ch.charCodeAt(0) > 0xFFFF) {
    // 代理对（emoji 等）— 像素字体不可能有，跳过（浏览器回退系统 emoji 字体）
    continue;
  }
  if (!cmap.includes(ch.codePointAt(0))) missing.push(ch);
}
console.log('checked chars:', chars.length, '| missing in subset:', missing.length);
if (missing.length) console.log('missing sample:', missing.slice(0, 60).join(''));
const lostGlyphs = missing.filter(ch => original.characterSet.includes(ch.codePointAt(0)));
assert.deepEqual(lostGlyphs, [], 'Subset must retain every required glyph available in the original font');
console.log('required original glyphs lost:', lostGlyphs.length, '| unavailable symbols use browser fallback');
console.log('font family:', font.familyName, '| postscript:', font.postscriptName);
