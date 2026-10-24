// 地形边界/命名回归：区域应主要覆盖同一种原图地貌，且名称不能与所属地貌相冲突。
const fs = require('fs');
const { Client } = require('../server/node_modules/colyseus.js');

// 对玩家而言深海/海洋、山地/高原是同一个连续景观；测试边界时按这五个可见大类判断，
// 不把水色渐变或同一雪山的岩面/积雪交界误报为“跨地形”。
const CODE = { deep:'water', sea:'water', plain:'plain', coast:'plain', island:'plain', desert:'desert', jungle:'jungle', mountain:'highland', plateau:'highland' };
const GROUP = ['water','water','plain','desert','jungle','highland','highland'];
const FORBIDDEN = {
  deep: /山|林|漠|沙丘|平原|沃野|牧场/,
  sea: /山|林|漠|沙丘|平原|沃野|牧场/,
  desert: /海湾|外海|商港|航路|海沟|深渊|洋盆/,
  jungle: /海湾|外海|商港|航路|海沟|深渊|洋盆/,
  mountain: /海湾|外海|商港|航路|海沟|深渊|洋盆/,
};
const wait = ms => new Promise(r => setTimeout(r, ms));

async function test(mapId, cols, rows) {
  const raw = JSON.parse(fs.readFileSync(`terrain-${mapId}.json`, 'utf8'));
  const client = new Client('ws://localhost:8080');
  const room = await client.create('battle_code', { name:'边界测试', clientId:`layout-${mapId}-${Date.now()}`, leader:'sun', color:'#3498db', code:String(100000 + Math.floor(Math.random()*900000)) });
  let state = null;
  room.onStateChange(s => { state = s; });
  await wait(350); room.send('addAI', { difficulty:'easy' }); await wait(250);
  room.send('start', { map:mapId }); await wait(1300);
  const cells = Array.from(state.cellRegion), buckets = Array.from({ length:state.regionCount }, () => []);
  cells.forEach((ri, idx) => buckets[ri].push(idx));
  let matched = 0, totalPurity = 0, namesOK = true, low = [], badNames = [];
  for(let i=0;i<state.regionCount;i++){
    const reg = state.regions[i], expected = CODE[reg.terrain], counts = {};
    for(const idx of buckets[i]) counts[GROUP[raw[idx]]] = (counts[GROUP[raw[idx]]] || 0) + 1;
    const purity = (counts[expected] || 0) / Math.max(1, buckets[i].length);
    totalPurity += purity;
    if(purity >= 0.56) matched++;
    else low.push(`${reg.name}:${Math.round(purity*100)}%`);
    if(!reg.name || !reg.landmark || (FORBIDDEN[reg.terrain] && FORBIDDEN[reg.terrain].test(reg.name))){ namesOK = false; badNames.push(`${reg.terrain}:${reg.name}/${reg.landmark||'-'}`); }
  }
  const mean = totalPurity / state.regionCount;
  const ok = state.phase === 'playing' && state.mapCols === cols && state.mapRows === rows && mean >= 0.82 && matched >= Math.ceil(state.regionCount * 0.88) && namesOK;
  console.log(`[${mapId}] purity=${Math.round(mean*100)}% matched=${matched}/${state.regionCount} names=${namesOK ? 'OK':'FAIL'}${low.length ? ' low='+low.slice(0,4).join('、') : ''}${badNames.length ? ' badName='+badNames.slice(0,3).join('、') : ''} -> ${ok?'OK':'FAIL'}`);
  room.leave();
  return ok;
}

(async () => {
  const result = [];
  result.push(await test('island',64,36));
  result.push(await test('jungle',64,36));
  result.push(await test('snow',64,36));
  result.push(await test('desert',64,36));
  result.push(await test('mega',96,96));
  const ok = result.every(Boolean);
  console.log(ok ? 'REGION-LAYOUT-OK' : 'REGION-LAYOUT-FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('LAYOUT FAIL:', e && e.message || e); process.exit(1); });
