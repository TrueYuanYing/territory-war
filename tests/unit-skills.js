// 领袖技能单元测试 v2：用比值断言（避免重复计入牛奶被动）
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
// 甲=希特勒 乙=甘地 丙=撒切尔 丁=斯大林（全部开局前加入）
room.onJoin(mk('sA'), { name: '甲', clientId: 'A', leader: 'hitler', color: '#e74c3c' });
room.onJoin(mk('sB'), { name: '乙', clientId: 'B', leader: 'gandhi', color: '#3498db' });
room.onJoin(mk('sC'), { name: '丙', clientId: 'C', leader: 'thatcher', color: '#2ecc71' });
room.onJoin(mk('sD'), { name: '丁', clientId: 'D', leader: 'stalin', color: '#f1c40f' });
room.handleStart(mk('sA'), { map: 'island' });

const idA = 0, idB = 1, idC = 2, idD = 3;
room.getRelation(idB, idC).state = 'ally';  // 丙(撒切尔)与乙结盟
room.getRelation(idA, idB).state = 'war';

let target = -1;
for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === idB) { target = i; break; }
const ownedBy = (id) => { for (let i = 0; i < room.state.regionCount; i++) if (room.state.regions[i].owner === id) return i; return -1; };
const rA = ownedBy(idA);
room.regionNeighbors[target].push(rA);
room.regionNeighbors[rA].push(target);
room.spawnRegions = []; room.gameStartAt = 0;
room.state.regions[target].garrison = 1000;
room.state.regions[rA].garrison = 1000;

room.handleAttack(mk('sA'), { to: target });
const b = room.state.battles.find(x => x.region === target);
const baseA = room.battlePower(b).powerA;
const baseB = room.battlePower(b).powerB;  // 已含牛奶(×1.25)与甘地被动(×1.3)
console.log('[1] 基础战力(含被动): 攻', Math.round(baseA), '防', Math.round(baseB));

// 牛奶验证：撤销丙的盟友关系 → 防应 ÷1.25
room.getRelation(idB, idC).state = 'peace';
const noMilk = room.battlePower(b).powerB;
room.getRelation(idB, idC).state = 'ally';
const milkRatio = baseB / noMilk;
console.log('[2] 牛奶被动比值: 有盟友撒切尔/无 =', milkRatio.toFixed(3), '(expect 1.25)', '|', Math.abs(milkRatio - 1.25) < 0.01 ? 'MILK-OK' : 'MILK-FAIL');

// 甘地主动：相邻交战敌区兵力 ×0.75（核平时刻）
room.handleActivate(mk('sB'));
const afterGandhiAtk = room.battlePower(b).powerA;
const gRatio = afterGandhiAtk / baseA;
console.log('[3] 甘地核平时刻比值:', gRatio.toFixed(3), '(expect 0.75)', '|', Math.abs(gRatio - 0.75) < 0.01 ? 'GANDHI-OK' : 'GANDHI-FAIL');

// 希特勒主动：攻 ×1.5
const beforeHitler = room.battlePower(b).powerA;
room.handleActivate(mk('sA'));
const afterHitler = room.battlePower(b).powerA;
const hRatio = afterHitler / beforeHitler;
console.log('[4] 希特勒闪电突击比值:', hRatio.toFixed(3), '(expect 1.5)', '|', Math.abs(hRatio - 1.5) < 0.01 ? 'HITLER-OK' : 'HITLER-FAIL');

// CD 独立 + CD 期间拦截
const pa = room.getPlayer(idA), pb = room.getPlayer(idB);
console.log('[5] 独立CD: 甲', pa.skillCd, '乙', pb.skillCd, '(expect 60/60)', '|', pa.skillCd === 60 && pb.skillCd === 60 ? 'CD-OK' : 'CD-FAIL');
const before = room.battlePower(b).powerA;
room.handleActivate(mk('sA'));
console.log('[6] CD中重复发动被拒:', Math.abs(room.battlePower(b).powerA - before) < 1 ? 'CDBLOCK-OK' : 'CDBLOCK-FAIL');

// 斯大林主动：所有领地兵营立即建成
const dRegion = ownedBy(idD);
room.state.regions[dRegion].isBarrack = false;
room.handleActivate(mk('sD'));
let stBarracks = true, stOwn = false;
for (const r of room.state.regions) if (r.owner === idD) { stOwn = true; if (!r.isBarrack) stBarracks = false; }
console.log('[7] 斯大林钢铁洪流: 所有领地兵营建成 =', stOwn && stBarracks, '(expect true)', '|', stOwn && stBarracks ? 'STALIN-OK' : 'STALIN-FAIL');

console.log('SKILLS-TEST-DONE');
process.exit(0);
