// 五地图 + 七地形系统测试：每图开局验证尺寸/地形/命名
const { Client } = require('../server/node_modules/colyseus.js');

async function testMap(mapId, expectCols, expectRows) {
  const client = new Client('ws://localhost:8080');
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const room = await client.create('battle_code', { name: '地图测试', color: '#3498db', leader: 'sun', code });
  let state = null;
  room.onStateChange((s) => { state = s; });
  await new Promise(r => setTimeout(r, 500));
  room.send('addAI', { difficulty: 'easy' });
  await new Promise(r => setTimeout(r, 400));
  room.send('start', { map: mapId });
  await new Promise(r => setTimeout(r, 1800));
  const ok = state.phase === 'playing' && state.mapCols === expectCols && state.mapRows === expectRows && state.mapId === mapId;
  const terrainCnt = {};
  const names = [];
  for (const r of state.regions) {
    terrainCnt[r.terrain] = (terrainCnt[r.terrain] || 0) + 1;
    names.push(r.name);
  }
  console.log('[' + mapId + ']', state.phase, state.mapCols + 'x' + state.mapRows, 'id=' + state.mapId, '| regions=' + state.regions.length);
  console.log('        地形:', Object.entries(terrainCnt).map(([k, v]) => k + ':' + v).join(' '));
  console.log('        命名示例:', names.slice(0, 10).join('、'), ok ? '-> OK' : '-> FAIL');
  room.leave();
  return ok;
}
(async () => {
  const rs = [];
  rs.push(await testMap('island', 64, 36));
  rs.push(await testMap('jungle', 64, 36));
  rs.push(await testMap('snow', 64, 36));
  rs.push(await testMap('desert', 64, 36));
  rs.push(await testMap('mega', 96, 96));
  console.log(rs.every(Boolean) ? 'MAPS7-ALL-OK' : 'MAPS7-FAIL');
  process.exit(rs.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
