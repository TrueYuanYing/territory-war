// 地图系统测试：四种地图各开一局，验证尺寸/地形/开局正常
const { Client } = require('../server/node_modules/colyseus.js');

async function testMap(mapId, expectCols, expectRows) {
  return new Promise(async (resolve) => {
    const client = new Client('ws://localhost:8080');
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const room = await client.create('battle_code', { name: '地图测试', color: '#3498db', leader: 'sun', code });
    let state = null, myId = -1;
    room.onStateChange((s) => { state = s; for (const p of s.players.values()) if (p.sessionId === room.sessionId) myId = p.id; });
    await new Promise(r => setTimeout(r, 500));
    room.send('addAI', { difficulty: 'easy' });
    await new Promise(r => setTimeout(r, 500));
    room.send('setMap', { map: mapId });
    await new Promise(r => setTimeout(r, 400));
    console.log('[' + mapId + '] lobby mapId =', state.mapId);
    room.send('start', { map: mapId });
    await new Promise(r => setTimeout(r, 1500));
    const ok = state.phase === 'playing' && state.mapCols === expectCols && state.mapRows === expectRows && state.mapId === mapId;
    // 统计地形分布
    let sea = 0, land = 0, mtn = 0;
    for (const r of state.regions) { if (r.terrain === 'sea') sea++; else if (r.terrain === 'mountain') mtn++; else land++; }
    console.log('[' + mapId + '] phase=' + state.phase, 'map=' + state.mapCols + 'x' + state.mapRows, 'id=' + state.mapId,
      '| regions=' + state.regions.length, '地形 海' + sea + '/陆' + land + '/山' + mtn, '->', ok ? 'OK' : 'FAIL');
    room.leave();
    resolve(ok);
  });
}
(async () => {
  const results = [];
  results.push(await testMap('island', 64, 36));
  results.push(await testMap('snow', 64, 36));
  results.push(await testMap('desert', 64, 36));
  results.push(await testMap('jungle', 64, 36));
  results.push(await testMap('mega', 96, 96));
  console.log(results.every(Boolean) ? 'MAP-TEST-ALL-OK' : 'MAP-TEST-FAIL');
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
