// 无头冒烟测试：验证权威服务器核心逻辑（不改动游戏代码）
const { Client } = require('../server/node_modules/colyseus.js');

(async () => {
  const client = new Client('ws://localhost:8080');
  let state = null, myId = -1;
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const room = await client.create('battle_code', { name: '冒烟测试', color: '#e74c3c', leader: 'hitler', code });
  room.onStateChange((s) => { state = s; for (const p of s.players.values()) if (p.sessionId === room.sessionId) myId = p.id; });
  await new Promise(r => setTimeout(r, 300));
  console.log('[1] joined isolated lobby, players=' + state.players.size);

  // 房主添加一个 AI 并开始
  room.send('addAI', { difficulty: 'easy', name: 'AI冒烟' });
  await new Promise(r => setTimeout(r, 600));
  console.log('[2] after addAI players=' + state.players.size + ' (expect 2)');
  room.send('start');
  await new Promise(r => setTimeout(r, 1200));
  console.log('[3] phase=' + state.phase + ' (expect playing), regions=' + state.regions.length + ', map ' + state.mapCols + 'x' + state.mapRows);

  // 统计我的领地，找相邻中立地
  const mine = [];
  for (let i = 0; i < state.regionCount; i++) if (state.regions[i].owner === myId) mine.push(i);
  let adjNeutral = -1, adjEnemy = -1;
  for (let i = 0; i < state.regionCount; i++) {
    const r = state.regions[i];
    if (r.owner === myId || r.owner < 0 || r.owner >= 0) {
      if (r.owner !== myId) {
        const isAdj = mine.some(m => {
          // 用服务端同款邻接近似：直接由 cellRegion 边界判断比较麻烦，这里直接找 owner!==myId 的任意区域尝试进攻，服务端会校验
          return true;
        });
      }
    }
  }
  // 简单起见：对我任一领地下征兵指令，并尝试进攻一个随机非我区域（服务端会拒绝不相邻的，但至少验证消息链路）
  if (mine.length) {
    const before = state.regions[mine[0]].garrison;
    room.send('recruit', { index: mine[0] });
    await new Promise(r => setTimeout(r, 500));
    console.log('[4] recruit: garrison ' + before + ' -> ' + state.regions[mine[0]].garrison + ' (expect increase)');
  }
  // 找真正相邻的非我区域来进攻
  const rel = new Map();
  const cols = state.mapCols;
  for (let r = 0; r < state.mapRows; r++) for (let c = 0; c < cols; c++) {
    const idx = r * cols + c, ri = state.cellRegion[idx];
    if (c + 1 < cols) { const rj = state.cellRegion[idx + 1]; if (rj !== ri) { const k = Math.min(ri, rj) * 1000 + Math.max(ri, rj); if (!rel.has(k)) rel.set(k, [ri, rj]); } }
    if (r + 1 < state.mapRows) { const rj = state.cellRegion[idx + cols]; if (rj !== ri) { const k = Math.min(ri, rj) * 1000 + Math.max(ri, rj); if (!rel.has(k)) rel.set(k, [ri, rj]); } }
  }
  let target = -1;
  for (const [a, b] of rel.values()) {
    if (state.regions[a].owner === myId && state.regions[b].owner !== myId) { target = b; break; }
    if (state.regions[b].owner === myId && state.regions[a].owner !== myId) { target = a; break; }
  }
  if (target >= 0) {
    const tOwner = state.regions[target].owner;
    if (tOwner >= 0) room.send('declareWar', { to: tOwner }); // 若为敌方先宣战
    await new Promise(r => setTimeout(r, 400));
    room.send('attack', { to: target });
    await new Promise(r => setTimeout(r, 1800));
    console.log('[5] attack on region ' + target + ': battles=' + state.battles.length + ' (expect >=1), battle phase=' + (state.battles[0] ? state.battles[0].phase : '-'));
  } else {
    throw new Error('[5] no adjacent non-mine region found');
  }
  room.leave();
  console.log('[done] smoke test finished');
  process.exit(0);
})().catch(e => { console.error('SMOKE FAIL:', e && e.message || e); process.exit(1); });
