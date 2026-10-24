'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),fontkit=require('fontkit');
const root=path.resolve(__dirname,'..');
const subset=fontkit.openSync(path.join(root,'public/assets/pxfont.woff2'));
assert.equal(subset.familyName,'Territory War Pixel','A redistributed subset must not use the upstream reserved font name');
const full=fontkit.openSync(path.join(root,'public/assets/pxfont.ttf'));
for(const code of subset.characterSet){
  if(code===0xFFFE||code===0xFFFF)continue; // Unicode noncharacters are cmap sentinels, not text glyphs.
  const before=full.glyphForCodePoint(code),after=subset.glyphForCodePoint(code);
  assert.equal(after.advanceWidth,before.advanceWidth,'advance '+code);
  assert.equal(after.path.toSVG(),before.path.toSVG(),'outline '+code);
}
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert(html.includes("font-family:'Territory War Pixel'"));
console.log('FONT-NAME-OK renamed subset, original glyph outlines and metrics retained');
