// 大厅战备单元测试：setLoadout 在 lobby 可改领袖/颜色，开局后锁定
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

const pa = room.getPlayer(0);
console.log('[1] 初始: 甲 leader=' + pa.leader + ' color=' + pa.color);
room.handleSetLoadout(mk('sA'), { leader: 'sun', color: '#f1c40f' });
console.log('[2] 大厅改后: 甲 leader=' + pa.leader + ' color=' + pa.color, '(expect sun/#f1c40f)');
room.handleSetLoadout(mk('sA'), { leader: 'notExist' });
console.log('[3] 非法领袖被拒: leader=' + pa.leader, '(expect 仍 sun)');
room.handleSetLoadout(mk('sA'), { color: '#123456' });
console.log('[4] 非调色板颜色被拒: color=' + pa.color, '(expect 仍 #f1c40f)');

room.handleStart(mk('sA'), { map: 'island' });
room.handleSetLoadout(mk('sA'), { leader: 'hitler', color: '#2c3e50' });
console.log('[5] 开局后锁定: leader=' + pa.leader + ' color=' + pa.color, '(expect 不变 sun/#f1c40f)');
const ok = pa.leader === 'sun' && pa.color === '#f1c40f';
console.log(ok ? 'LOADOUT-TEST-OK' : 'LOADOUT-TEST-FAIL');
process.exit(ok ? 0 : 1);
