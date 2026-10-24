// 席位去重测试：同设备重连不重复加入；不同设备同名自动加后缀
const { Client } = require('../server/node_modules/colyseus.js');

(async () => {
  const c1 = new Client('ws://localhost:8080');
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const r1 = await c1.create('battle_code', { name: '123', clientId: 'device-A', leader: 'hitler', color: '#e74c3c', code });
  let s1 = null;
  r1.onStateChange(s => { s1 = s; });
  await new Promise(q => setTimeout(q, 600));
  console.log('[1] first join: players =', s1.players.size, '| names =', [...s1.players.values()].map(p => p.name).join(','));

  // 同设备第二次连接（模拟页面刷新，新 sessionId 同 clientId）
  const c2 = new Client('ws://localhost:8080');
  const r2 = await c2.joinById(r1.roomId, { name: '123', clientId: 'device-A', leader: 'hitler', color: '#e74c3c' });
  await new Promise(q => setTimeout(q, 800));
  console.log('[2] same-device rejoin: players =', s1.players.size, '(expect 1) | names =', [...s1.players.values()].map(p => p.name).join(','));
  const seat = [...s1.players.values()][0];
  console.log('    seat sessionId === new session:', seat.sessionId === r2.sessionId, '| isHuman:', seat.isHuman);

  // 不同设备同名（真·两个玩家）
  const c3 = new Client('ws://localhost:8080');
  const r3 = await c3.joinById(r1.roomId, { name: '123', clientId: 'device-B', leader: 'gandhi', color: '#f1c40f' });
  await new Promise(q => setTimeout(q, 800));
  const names = [...s1.players.values()].map(p => p.name);
  console.log('[3] different-device same name: players =', s1.players.size, '(expect 2) | names =', names.join(','), '| suffixed:', names.includes('123·2'));

  r1.leave(); r2.leave(); r3.leave();
  const ok = s1.players.size === 2 && names.includes('123') && names.includes('123·2');
  console.log(ok ? 'DEDUP-TEST-OK' : 'DEDUP-TEST-FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FAIL:', e && e.message || e); process.exit(1); });
