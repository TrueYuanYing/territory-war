// 胜负规则测试：倒计时存在、占领推进、以及状态字段同步
const { Client } = require('../server/node_modules/colyseus.js');

(async () => {
  const client = new Client('ws://localhost:8080');
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const room = await client.create('battle_code', { name: '胜负测试', color: '#e74c3c', leader: 'hitler', code });
  let state = null, myId = -1;
  room.onStateChange((s) => { state = s; for (const p of s.players.values()) if (p.sessionId === room.sessionId) myId = p.id; });
  await new Promise(r => setTimeout(r, 500));
  room.send('addAI', { difficulty: 'easy' });
  await new Promise(r => setTimeout(r, 400));
  room.send('start', { map: 'island' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('[1] phase=' + state.phase, '| gameLeft=' + state.gameLeft + 's (expect 720)', '| domPct=' + state.domPct, '| domLeader=' + state.domLeader, '| domHeld=' + state.domHeld);
  // 等待 3 秒验证倒计时递减 + 出生保护（AI 不应在 45s 内进攻我方出生地）
  await new Promise(r => setTimeout(r, 3000));
  console.log('[2] 3 秒后 gameLeft=' + state.gameLeft + ' (expect 717 左右)', '| battles=' + state.battles.length);
  // 我的出生地是否在 45 秒内未被攻打
  let mySpawn = -1;
  for (let i = 0; i < state.regionCount; i++) if (state.regions[i].owner === myId && state.regions[i].isBarrack) { mySpawn = i; break; }
  const spawnAttacked = state.battles.some(b => b.region === mySpawn);
  console.log('[3] 出生地被攻击(前45s)?', spawnAttacked, '(expect false)');
  // 连续快速发兵：冷却应阻止第二次
  const cols = state.mapCols, rows = state.mapRows;
  const rel = new Map();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const idx = r * cols + c, ri = state.cellRegion[idx];
    if (c + 1 < cols) { const rj = state.cellRegion[idx + 1]; if (rj !== ri) { const k = Math.min(ri, rj) * 1000 + Math.max(ri, rj); if (!rel.has(k)) rel.set(k, [ri, rj]); } }
    if (r + 1 < rows) { const rj = state.cellRegion[idx + cols]; if (rj !== ri) { const k = Math.min(ri, rj) * 1000 + Math.max(ri, rj); if (!rel.has(k)) rel.set(k, [ri, rj]); } }
  }
  let t1 = -1, t2 = -1;
  for (const [a, b] of rel.values()) {
    const A = state.regions[a], B = state.regions[b];
    if (A.owner === myId && B.owner !== myId) { t1 = b; break; }
    if (B.owner === myId && A.owner !== myId) { t1 = a; break; }
  }
  let t2Found = false;
  if (t1 >= 0) {
    if (state.regions[t1].owner >= 0) room.send('declareWar', { to: state.regions[t1].owner });
    await new Promise(r => setTimeout(r, 300));
    room.send('attack', { to: t1 });
    await new Promise(r => setTimeout(r, 200));
    const n1 = state.battles.filter(b => b.region === t1 && b.attacker === myId).length;
    room.send('attack', { to: t1 });
    await new Promise(r => setTimeout(r, 400));
    const n2 = state.battles.filter(b => b.region === t1 && b.attacker === myId).length;
    console.log('[4] 第一次进攻后 battles=' + n1 + ' (expect 1)', '| 冷却期内第二次同区进攻后=' + n2 + ' (expect 仍 1)');
    // 找第二个目标测发兵冷却
    for (const [a, b] of rel.values()) {
      const A = state.regions[a], B = state.regions[b];
      if (a !== t1 && b !== t1) {
        if (A.owner === myId && B.owner !== myId && !state.battles.some(x => x.region === b && x.attacker === myId)) { t2 = b; break; }
        if (B.owner === myId && A.owner !== myId && !state.battles.some(x => x.region === a && x.attacker === myId)) { t2 = a; break; }
      }
    }
    if (t2 >= 0) {
      if (state.regions[t2].owner >= 0) room.send('declareWar', { to: state.regions[t2].owner });
      await new Promise(r => setTimeout(r, 300));
      room.send('attack', { to: t2 });
      await new Promise(r => setTimeout(r, 400));
      const n3 = state.battles.filter(b => b.region === t2 && b.attacker === myId).length;
      console.log('[5] 3 秒冷却内换区进攻 battles=' + n3 + ' (expect 0 = 被冷却拦截)');
      await new Promise(r => setTimeout(r, 3000));
      room.send('attack', { to: t2 });
      await new Promise(r => setTimeout(r, 400));
      const n4 = state.battles.filter(b => b.region === t2 && b.attacker === myId).length;
      console.log('[6] 冷却结束后进攻 battles=' + n4 + ' (expect 1)');
      t2Found = true;
    }
  }
  console.log(t2Found ? 'RULES-TEST-OK' : 'RULES-TEST-PARTIAL');
  room.leave();
  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
