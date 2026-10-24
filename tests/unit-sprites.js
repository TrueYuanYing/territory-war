'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {SPRITES}=require('../tools/art/combat-sprites');
const names=['infantry','archer','shield','cannon','ship'];
assert.deepEqual(Object.keys(SPRITES),names,'five unit types share one atlas');
for(const name of names){
  for(const [anim,count] of Object.entries({idle:2,walk:4,attack:4,hit:2,death:3})){
    const frames=SPRITES[name][anim];assert.equal(frames?.length,count,name+' '+anim);
    for(const f of frames){assert.equal(f.length,24);assert(f.every(r=>r.length===24&&/^[.ksfepabcgGwWym]+$/.test(r)));assert(f.join('').includes('a'),name+' retains team color');}
    assert(new Set(frames.map(f=>f.join(''))).size>=2,name+' '+anim+' must animate');
  }
}
const browser={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../public/assets/sprites.js'),'utf8'),browser);
assert.equal(JSON.stringify(browser.window.SPRITES),JSON.stringify(SPRITES),'generated public atlas is synchronized');
const html=fs.readFileSync(require.resolve('../public/index.html'),'utf8');
for(const asset of ['sprites.js','pixel-icons.js','archipelago.css'])assert(html.includes('/assets/'+asset+'?v=20261010-combat'),'changed assets invalidate old daily cache: '+asset);
assert(html.includes('/assets/pxfont.woff2?v=20261010-start'),'start-entry copy uses the latest font subset');
console.log('UNIT-SPRITES-OK five original 24px types / five states / synchronized browser asset');
