// 甘地核平 + 高原虎饿虎扑食 单元测试
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
room.onJoin(mk('sA'), { name: '甲', clientId: 'A', leader: 'gandhi', color: '#e74c3c' });
room.onJoin(mk('sB'), { name: '乙', clientId: 'B', leader: 'tiger', color: '#f1c40f' });
room.onJoin(mk('sC'), { name: '丙', clientId: 'C', leader: 'sun', color: '#2ecc71' });
room.handleStart(mk('sA'), { map: 'island' });
room.spawnRegions = []; room.gameStartAt = 0;

const idA = 0, idB = 1, idC = 2;
// 甲乙丙互相交战
room.getRelation(idA, idB).state = 'war';
room.getRelation(idA, idC).state = 'war';
room.getRelation(idB, idC).state = 'war';

// 甘地核平：让丙的区域相邻于甲（伪造），丙区域兵力1000
let cRegion = -1;
for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === idC) { cRegion = i; break; }
const aRegion = (() => { for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === idA) return i; return -1; })();
room.regionNeighbors[cRegion].push(aRegion);
room.state.regions[cRegion].garrison = 1000;
room.handleActivate(mk('sA'));
console.log('[1] 甘地核平时刻: 邻敌丙区域 1000 ->', room.state.regions[cRegion].garrison, '(expect 750)');

// 高原虎饿虎扑食：乙曾占领过某区域（现属丙），自动发起收复
let lost = -1;
for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === -1) { room.state.regions[i].owner = idC; lost = i; break; }
if (lost < 0) { console.log('无中立区可分配'); process.exit(1); }
if (!room.regionHistory.has(lost)) room.regionHistory.set(lost, new Set());
room.regionHistory.get(lost).add(idB);   // 乙曾占领
const bRegion = (() => { for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === idB) return i; return -1; })();
room.regionNeighbors[lost].push(bRegion); // 伪造乙相邻
room.handleActivate(mk('sB'));
const launched = room.state.battles.filter(b => b.region === lost && b.attacker === idB).length;
console.log('[2] 高原虎饿虎扑食: 失地', lost, '战线数 =', launched, '(expect 1)');

const ok = room.state.regions[cRegion].garrison === 750 && launched === 1;
console.log(ok ? 'GANDHI-TIGER-TEST-OK' : 'GANDHI-TIGER-TEST-FAIL');
process.exit(ok ? 0 : 1);
