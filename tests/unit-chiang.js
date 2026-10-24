// 虎踞孤岛 + 斯大林钢铁洪流 单元测试
const { BattleRoom } = require('../server/Room.js');

const room = new BattleRoom();
room.setSimulationInterval = () => {};
room.onMessage = () => {};
room.broadcast = () => {};
room.lock = () => {};
room.disconnect = () => {};
room.setMetadata = () => {};
room.onCreate({ code: '123456' });

const mk = (sid) => ({ sessionId: sid });
// 甲=蒋介石 乙=孙中山 丙=斯大林 丁=甘地（全人类，无AI）
room.onJoin(mk('sA'), { name: '甲', clientId: 'A', leader: 'chiang', color: '#e74c3c' });
room.onJoin(mk('sB'), { name: '乙', clientId: 'B', leader: 'sun', color: '#f1c40f' });
room.onJoin(mk('sC'), { name: '丙', clientId: 'C', leader: 'stalin', color: '#2ecc71' });
room.onJoin(mk('sD'), { name: '丁', clientId: 'D', leader: 'gandhi', color: '#3498db' });
room.handleStart(mk('sA'), { map: 'island' });

const idA = 0, idB = 1, idC = 2, idD = 3;
// 斯大林主动：所有领地兵营立即建成
room.handleActivate(mk('sC'));
let allBarrack = true, hasOwn = false;
for (const r of room.state.regions) if (r.owner === idC) { hasOwn = true; if (!r.isBarrack) allBarrack = false; }
console.log('[1] 斯大林钢铁洪流: 丙所有领地兵营建成 =', hasOwn && allBarrack, '(expect true)');

// 虎踞孤岛：让乙占 80% 领土
const n = room.state.regionCount;
const need = Math.ceil(n * 0.8);
let assigned = 0;
for (let i = 0; i < n && assigned < need; i++) { room.state.regions[i].owner = idB; assigned++; }
for (let i = assigned; i < n; i++) { room.state.regions[i].owner = (i % 3 === 0) ? idA : idD; }
// 甲(蒋)存活 → 倒计时判定不应统一获胜（80 次调用 = 20 秒游戏时间）
for (let i = 0; i < 80; i++) room.tick(1000);
console.log('[2] 蒋在世且乙占' + assigned + '/' + n + ': phase =', room.state.phase, '(expect playing, 无法统一)');
// 消灭蒋 → 乙坚持 10 秒后统一获胜
const pa = room.getPlayer(idA);
pa.alive = false;
for (let i = 0; i < 80; i++) room.tick(1000);
console.log('[3] 蒋被消灭后: phase =', room.state.phase, '| winner =', room.state.winnerId, '(expect over / 1=乙)', '| reason =', room.state.winReason, '(expect dominate)');

const ok = room.state.phase === 'over' && room.state.winnerId === idB;
console.log(ok ? 'CHIANG-STALIN-TEST-OK' : 'CHIANG-STALIN-TEST-FAIL');
process.exit(ok ? 0 : 1);
