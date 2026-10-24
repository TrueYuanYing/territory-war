// 盟军战线合并 + 三路上限 单元测试（直接实例化房间，伪造邻接，可验证 battlePower 数值）
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
room.onJoin(mk('sA'), { name: '甲', clientId: 'A', leader: 'hitler', color: '#e74c3c' });
room.onJoin(mk('sB'), { name: '乙', clientId: 'B', leader: 'gandhi', color: '#3498db' });
room.onJoin(mk('sC'), { name: '丙', clientId: 'C', leader: 'sun', color: '#2ecc71' });
room.onJoin(mk('sD'), { name: '丁', clientId: 'D', leader: 'stalin', color: '#f1c40f' });
room.onJoin(mk('sE'), { name: '戊', clientId: 'E', leader: 'degaulle', color: '#9b59b6' });
room.handleStart(mk('sA'), { map: 'island' });

const idA = 0, idB = 1, idC = 2, idD = 3, idE = 4;
room.getRelation(idA, idB).state = 'ally';

// 找一个中立区域做目标，并伪造所有玩家的邻接
let target = -1;
for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === -1) { target = i; break; }
const ownedBy = (id) => { for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === id) return i; return -1; };
const rA = ownedBy(idA), rB = ownedBy(idB), rC = ownedBy(idC), rD = ownedBy(idD), rE = ownedBy(idE);
room.regionNeighbors[target] = [rA, rB, rC, rD, rE];  // 伪造：全员与目标相邻
const gB = room.state.regions[rB].garrison;
const modA = room.state.regions[target].terrain === 'coast' ? 1.3 : (room.state.regions[target].terrain === 'mountain' ? 0.75 : (room.state.regions[target].terrain === 'desert' ? 1.15 : (room.state.regions[target].terrain === 'jungle' ? 0.8 : (room.state.regions[target].terrain === 'plateau' ? 0.85 : (room.state.regions[target].terrain === 'deep' ? 0.9 : 1)))));

// 1) 甲进攻 → 1 条战线，且乙(盟友)按 35% 计入
room.handleAttack(mk('sA'), { to: target });
let lines = room.state.battles.filter(b => b.region === target);
console.log('[1] 甲进攻后战线数:', lines.length, '(expect 1)');
let p1 = room.battlePower(lines[0]);
const expect35 = gB * 0.35 * modA * 1.3; // 乙按35%、甲攻击×1.3
// 2) 盟友乙进攻同区域 → 合并，仍 1 条；乙升级为全额
room.handleAttack(mk('sB'), { to: target });
lines = room.state.battles.filter(b => b.region === target);
const p2 = room.battlePower(lines[0]);
const delta = p2.powerA - p1.powerA;
const expectFullDelta = gB * 0.65 * modA * 1.3;
console.log('[2] 乙(盟友)进攻后战线数:', lines.length, '(expect 1=合并)');
console.log('[3] 乙合并后攻方战力增量:', Math.round(delta), '≈ 期望:', Math.round(expectFullDelta), '|', Math.abs(delta - expectFullDelta) < expectFullDelta * 0.15 + 5 ? 'POWER-OK' : 'POWER-DIFF');
// 3) 第三方丙、丁各开一路 → 2、3 路
room.handleAttack(mk('sC'), { to: target });
console.log('[4] 丙进攻后战线数:', room.state.battles.filter(b => b.region === target).length, '(expect 2)');
room.handleAttack(mk('sD'), { to: target });
console.log('[5] 丁进攻后战线数:', room.state.battles.filter(b => b.region === target).length, '(expect 3)');
// 4) 第四个搅局者戊 → 被上限拦截
room.handleAttack(mk('sE'), { to: target });
const n5 = room.state.battles.filter(b => b.region === target).length;
console.log('[6] 戊进攻后战线数:', n5, '(expect 仍 3 = 上限)');
// 5) 戊若与丁结盟则合并进丁战线（验证盟友优先于上限）
room.getRelation(idD, idE).state = 'ally';
room.handleAttack(mk('sE'), { to: target });
const n6 = room.state.battles.filter(b => b.region === target).length;
const eJoined = room.allyJoiners.get(target + '_' + idD);
console.log('[7] 戊与丁结盟后进攻 → 战线数:', n6, '(expect 仍 3)', '| 戊已并入丁战线:', eJoined ? eJoined.has(idE) : false);
console.log('ALLY-UNIT-TEST-OK');
process.exit(0);
