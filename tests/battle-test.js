// 战斗系统专项测试：发兵去重 + 战斗必然结算（不卡死）
const { Client } = require('../server/node_modules/colyseus.js');

(async () => {
  const client = new Client('ws://localhost:8080');
  let state = null, myId = -1;
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const room = await client.create('battle_code', { name: '战斗测试', color: '#e74c3c', leader: 'hitler', code });
  room.onStateChange((s) => { state = s; for (const p of s.players.values()) if (p.sessionId === room.sessionId) myId = p.id; });
  room.send('addAI', { difficulty: 'easy', name: 'AI测试' });
  await new Promise(r => setTimeout(r, 500));
  room.send('start');
  await new Promise(r => setTimeout(r, 1200));
  console.log('[1] phase=' + state.phase + ', regions=' + state.regions.length);

  // 找与我相邻的目标区域
  const cols = state.mapCols, rows = state.mapRows;
  const rel = new Map();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const idx = r * cols + c, ri = state.cellRegion[idx];
    if (c + 1 < cols) { const rj = state.cellRegion[idx + 1]; if (rj !== ri) { const k = Math.min(ri, rj) * 1000 + Math.max(ri, rj); if (!rel.has(k)) rel.set(k, [ri, rj]); } }
    if (r + 1 < rows) { const rj = state.cellRegion[idx + cols]; if (rj !== ri) { const k = Math.min(ri, rj) * 1000 + Math.max(ri, rj); if (!rel.has(k)) rel.set(k, [ri, rj]); } }
  }
  let target = -1;
  for (const [a, b] of rel.values()) {
    if (state.regions[a].owner === myId && state.regions[b].owner !== myId) { target = b; break; }
    if (state.regions[b].owner === myId && state.regions[a].owner !== myId) { target = a; break; }
  }
  if (target < 0) { console.log('NO TARGET'); process.exit(1); }
  const tOwner = state.regions[target].owner;
  if (tOwner >= 0) room.send('declareWar', { to: tOwner });
  await new Promise(r => setTimeout(r, 400));

  // 连续发 5 次进攻：应只产生 1 场战斗（去重）
  for (let i = 0; i < 5; i++) { room.send('attack', { to: target }); await new Promise(r => setTimeout(r, 150)); }
  const mine = state.battles.filter(b => b.region === target && b.attacker === myId);
  console.log('[2] dedup: my battles on region ' + target + ' = ' + mine.length + ' (expect 1), total on region = ' + state.battles.filter(b => b.region === target).length);

  // 等待战斗结束：区域易主（我赢）或战斗消失（超时判定），最长等 70 秒
  const t0 = Date.now();
  let resolved = false, outcome = '?';
  while (Date.now() - t0 < 70000) {
    await new Promise(r => setTimeout(r, 1000));
    const bs = state.battles.filter(b => b.region === target);
    if (bs.length === 0) { resolved = true; outcome = 'no-battle'; break; }
    if (state.regions[target].owner === myId) { resolved = true; outcome = 'conquered'; break; }
  }
  console.log('[3] battle resolved within ' + Math.round((Date.now() - t0) / 1000) + 's: ' + resolved + ' outcome=' + outcome);
  console.log('    final owner=' + state.regions[target].owner + ', remaining battles=' + state.battles.length);
  if (!resolved) { console.log('FAIL: battle stuck'); process.exit(1); }
  console.log('BATTLE-TEST-OK');
  room.leave();
  process.exit(0);
})().catch(e => { console.error('TEST FAIL:', e && e.message || e); process.exit(1); });
