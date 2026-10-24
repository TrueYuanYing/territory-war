'use strict';
require('./id-compat');
const { Room } = require('@colyseus/core');
const { Schema, type, ArraySchema, MapSchema } = require('@colyseus/schema');
const fs = require('fs');
const path = require('path');

/* ================= 常量 ================= */
const DIFF = {
  // tickMs：AI 决策间隔（拉长，人类手动点击更公平）；actChance：每次决策实际出手概率
  easy  : { label:'简单', tickMs:3200, aggression:1.8, actChance:0.5 },
  normal: { label:'普通', tickMs:2600, aggression:1.3, actChance:0.6 },
  hard  : { label:'困难', tickMs:2000, aggression:0.95, actChance:0.7 },
};
// 玩家配色：优先选择色相/亮度差距最大的颜色，避免相邻色混在一起难以分辨
// 红/黄/绿/蓝/紫/亮粉/青/白/棕/深蓝黑
const COLORS = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6','#ff4dd8','#00e5ff','#ecf0f1','#a0522d','#2c3e50'];
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const DOMINATION = 0.8;       // 占领 80% 领土
const DOMINATION_HOLD_S = 10; // 并坚持 10 秒 → 胜利
const TRUCE_CD = 15;   // 求和/停战冷却 15s（快节奏）
const PEACE_CD = 15;

const TERRAIN_MOD = {
  deep    : { attack:0.90, defend:1.05 },  // 深海：稍难攻
  sea     : { attack:1.00, defend:1.00 },
  plain   : { attack:1.00, defend:1.00 },
  coast   : { attack:1.30, defend:1.10 },  // 海岸：易攻难守
  island  : { attack:1.20, defend:0.95 },  // 岛屿：易攻（增援困难）
  desert  : { attack:1.15, defend:0.90 },  // 沙漠：开阔难守
  jungle  : { attack:0.80, defend:1.25 },  // 雨林：密林难攻易守
  mountain: { attack:0.75, defend:1.30 },
  plateau : { attack:0.85, defend:1.20 },  // 高原：难攻易守
};

const MARCH_MS = 600;
const RATE = 0.12;         // 战线推进速率（再放缓：多人大局拉锯感）
const LOSS_RATE = 0.018;   // 守方每秒兵力损耗比例
const BARRACK_MS = 20000;  // 驻扎 20 秒建设军营
const BARRACK_RATE = 1.5;  // 军营每秒产兵（放缓经济）
const FRONT_REINFORCE = 0.8; // 前线每秒增援（放缓）
const BATTLE_TIMEOUT_MS = 150000; // 单场战斗最长 150 秒，超时按战线位置判定胜负
const BATTLE_CAP_PER_REGION = 3;  // 单区域最多 3 路战线：盟军共享 1 路 + 允许 2 路第三方搅局
const MIN_ADV = 0.06;      // 战线推进下限（配合 150s 超时）
const ATTACK_LOSS_RATE = 0.01;  // 攻方相邻区域每秒损耗
const RESERVE_RATIO = 0.5;      // 后方总兵力参战比例
const ATTACK_COOLDOWN_MS = 3000; // 同一玩家两次发兵间隔 3 秒（防连点骚扰）
const SPAWN_PROTECT_MS = 45000;  // 出生区域 45 秒保护（防开局乱战）
const GAME_TIME_MS = 720000;     // 标准图全场倒计时 12 分钟
const MEGA_TIME_MS = 900000;     // 超大图 15 分钟

const LEADERS = {
  thatcher : { name:'撒切尔',  bonus:{ timePause:true },                          desc:'学生牛奶：友方含盟友血量+25%；主动「时停领域」：暂停其他玩家5s（CD60s）' },
  gandhi   : { name:'甘地',    bonus:{ defend:1.30 },                            desc:'非暴坚守：单兵防御+30%' },
  tiger    : { name:'高原虎',  bonus:{ recapture:1.5 },                           desc:'强力平定：收回失地时能力+50%' },
  hitler   : { name:'希特勒',  bonus:{ attack:1.3 },                             desc:'闪电突袭：单兵攻击+30%' },
  stalin   : { name:'斯大林',  bonus:{ hp:1.35 },                                desc:'钢铁意志：单兵生命+35%' },
  sun      : { name:'孙中山',  bonus:{ recruit:1.5 },                            desc:'革命动员：手动募兵+50%' },
  roosevelt: { name:'罗斯福',  bonus:{ barrackRate:1.5 },                        desc:'工业强国：军营产兵+50%' },
  churchill: { name:'丘吉尔',  bonus:{ frontReinforce:1.8 },                     desc:'前线驰援：前线增援+80%' },
  degaulle : { name:'戴高乐',  bonus:{ rate:1.4 },                               desc:'雷霆攻势：战线推进+40%' },
  chiang   : { name:'蒋介石',  bonus:{ dominationBlock:true },                 desc:'虎踞孤岛：蒋在世时无法以占领统一获胜，必须将其消灭' },
};
const LEADER_KEYS = Object.keys(LEADERS);

/* 全领袖主动技能（每人一个，独立 CD；命名采用网络梗/名场面） */
const ACTIVE_SKILLS = {
  thatcher : { name:'时停领域', cd:60 },
  gandhi   : { name:'核平时刻', cd:60 },
  tiger    : { name:'饿虎扑食', cd:60 },
  hitler   : { name:'巴巴罗萨', cd:60 },
  stalin   : { name:'钢铁洪流', cd:60 },
  sun      : { name:'天下为公', cd:60 },
  roosevelt: { name:'罗斯福新政', cd:60 },
  churchill: { name:'决不投降', cd:60 },
  degaulle : { name:'自由法国', cd:60 },
  chiang   : { name:'孤岛反击', cd:45 },
};
const SKILL_DESC = {
  thatcher : '暂停其他玩家5秒',
  gandhi   : '相邻交战敌区兵力-25%',
  tiger    : '自动向2块失地发起收复进攻',
  hitler   : '15秒内攻击+50%',
  stalin   : '所有领地兵营立即建成',
  sun      : '所有领地立即+40兵力',
  roosevelt: '20秒内军营产兵×3',
  churchill: '前线领地立即+100兵力',
  degaulle : '20秒内战线推进×2',
  chiang   : '唯一领地兵力翻倍',
};

const NAME_PREFIX = ['月亮','虎','蛇','龙','自动','边防','野兽','黄金','星辰','翡翠','风暴','古木','铁','白银','赤焰','冰霜','巨岩','飞鸟','暗影','曙光','苍狼','孤峰','游侠','海燕'];
const NAME_SUFFIX = {
  deep:['深海','海沟','深渊','洋盆'],
  sea:['海峡','海湾','海域','外海','航路','深沟'],
  coast:['滩','岸','港','浅湾','登陆点','岬角'],
  island:['小岛','礁屿','孤岛','列岛','沙洲'],
  plain:['平原','草原','沃野','旷野','牧场'],
  desert:['大漠','沙海','绿洲','戈壁','沙丘'],
  jungle:['雨林','密林','丛林','河洲','湿地'],
  mountain:['山','峰','岭','崖','高地','台地'],
  plateau:['高原','雪原','冰原','冻土','冰川'],
};

// 区域名称必须能从画面中读出来：先把实际可见的大地标分给最近、同地貌的区域，
// 其余区域再使用地图主题 + 方位 + 地貌词。这样不会再出现沙漠叫海湾、雪原叫雨林。
const MAP_LANDMARKS = {
  island: [
    {x:34,y:16, terrain:['mountain'], name:'王冠群峰', landmark:'crown_peak'},
    {x:24,y:23, terrain:['plain','coast','island'], name:'椰影浅滩', landmark:'palm_camp'},
    {x:12,y:7, terrain:['plain','coast'], name:'北岸河谷', landmark:'river_town'},
    {x:49,y:13, terrain:['sea','deep'], name:'琥珀珊瑚海', landmark:'reef'},
    {x:58,y:7, terrain:['sea','deep'], name:'东海远航线', landmark:'sloop'},
    {x:8,y:28, terrain:['mountain','plain','coast'], name:'西南赤岩岸', landmark:'cliff_fort'},
  ],
  jungle: [
    {x:32,y:18, terrain:['plain','jungle','coast'], name:'双瀑湖心', landmark:'waterfall'},
    {x:35,y:7, terrain:['jungle'], name:'云雾雨冠', landmark:'canopy_temple'},
    {x:17,y:18, terrain:['jungle','plain'], name:'古藤遗迹', landmark:'jungle_ruin'},
    {x:31,y:29, terrain:['jungle','plain','coast'], name:'南泽湿地', landmark:'stilt_hut'},
    {x:49,y:21, terrain:['coast','island'], name:'东岸雨林港', landmark:'harbor'},
  ],
  snow: [
    {x:32,y:18, terrain:['plateau','mountain'], name:'冰冠主峰', landmark:'ice_peak'},
    {x:49,y:18, terrain:['plateau','mountain'], name:'双刃雪岭', landmark:'ice_peak'},
    {x:15,y:23, terrain:['sea','deep','coast'], name:'西湾冻海', landmark:'ice_dock'},
    {x:49,y:7, terrain:['sea','deep','coast','island'], name:'北境浮冰湾', landmark:'iceberg'},
    {x:58,y:30, terrain:['plateau','mountain'], name:'东南霜崖', landmark:'ice_outpost'},
  ],
  desert: [
    {x:42,y:22, terrain:['desert','coast'], name:'金塔古城', landmark:'pyramid_city'},
    {x:29,y:22, terrain:['desert'], name:'月牙绿洲', landmark:'oasis'},
    {x:14,y:29, terrain:['desert','mountain'], name:'赤岩失落城', landmark:'desert_ruin'},
    {x:16,y:9, terrain:['desert','mountain'], name:'风蚀沙脊', landmark:'dune_fort'},
    {x:55,y:10, terrain:['sea','deep','coast'], name:'琥珀群礁', landmark:'reef'},
    {x:56,y:24, terrain:['coast','island'], name:'东岸商港', landmark:'harbor'},
  ],
  mega: [
    {x:15,y:7, terrain:['plateau'], name:'北境冰棚', landmark:'iceberg'},
    {x:35,y:8, terrain:['plateau','mountain'], name:'蓝湾冰川', landmark:'ice_peak'},
    {x:58,y:16, terrain:['desert','plain'], name:'日灼沙原', landmark:'dune_fort'},
    {x:35,y:31, terrain:['mountain','plateau','desert'], name:'天门山口', landmark:'cliff_fort'},
    {x:51,y:33, terrain:['plain','desert'], name:'绿洲河环', landmark:'oasis'},
    {x:25,y:65, terrain:['jungle','plain','coast'], name:'南洋雨林群岛', landmark:'jungle_ruin'},
    {x:79,y:76, terrain:['jungle','plain','coast'], name:'东南河口密林', landmark:'stilt_hut'},
    {x:48,y:60, terrain:['sea','deep','coast'], name:'中央航道', landmark:'sloop'},
  ],
};
const MAP_TERMS = {
  island:{ deep:['暗潮深渊','远海沟','蓝渊洋盆','沉船海'], sea:['潮汐海湾','珊瑚外海','环礁海','航路'], coast:['金砂海岸','贝壳浅湾','椰风港','潮线岬'], island:['孤礁','灯塔岛','月湾列岛','白沙洲'], plain:['海风草坡','椰林平原','河口沃野','湾畔牧场'], mountain:['玄武岩峰','环岛山脊','风化崖','鹰巢高地'], plateau:['云上高地','海岬台地','霜岩高原','岩冠台地'] },
  jungle:{ deep:['雾潮深渊','雨海沟','暗流洋盆','沉木海'], sea:['雨幕海湾','翡翠外海','瀑声海','航路'], coast:['藤蔓海岸','雨林浅湾','棕榈港','潮汐岬'], island:['鹦鹉岛','雨花礁','芭蕉洲','雾岛'], plain:['瀑布草甸','湖畔空地','河湾沃野','林间牧场'], jungle:['巨木雨林','藤冠密林','翡翠丛林','河洲湿地'], mountain:['云雾山脊','雨岩高地','瀑布崖','猿啸峰'], plateau:['雾冠台地','雨林高原','云上冻土','石脊台地'] },
  snow:{ deep:['极夜深渊','冰海沟','冻洋盆','暗潮海'], sea:['浮冰海湾','霜海航路','北境外海','碎冰海'], coast:['雪线海岸','冰港浅湾','霜潮岬','冻原码头'], island:['浮冰孤岛','雪礁','冰原列岛','白浪沙洲'], plain:['白桦雪原','风雪平原','冰湖草坡','冻土沃野'], mountain:['霜刃山脊','冰冠峰','雪崖高地','冰河台地'], plateau:['冰川高原','白夜雪原','霜原冻土','极光冰原'] },
  desert:{ deep:['盐海深渊','暗潮海沟','古井洋盆','沉船海'], sea:['金光海湾','香料外海','商路海','航路'], coast:['赤金沙岸','贝壳浅湾','商旅港','潮线岬'], island:['琥珀礁岛','黄金列岛','日落沙洲','灯塔礁'], plain:['风蚀平原','驼铃沃野','绿洲牧场','河湾旷野'], desert:['流沙大漠','月影沙海','风蚀戈壁','赤日沙丘'], mountain:['赤岩山脊','砂岩高地','风门崖','古道台地'], plateau:['日照高原','干河台地','砂砾冻土','荒原高地'] },
  mega:{ deep:['远洋深渊','暗潮海沟','蓝渊洋盆','沉船航道'], sea:['群岛外海','海峡航路','珊瑚海湾','远航海'], coast:['潮线海岸','贸易港','金砂浅湾','海风岬'], island:['航海孤岛','珊瑚列岛','灯塔礁','白沙洲'], plain:['河谷沃野','绿洲平原','草坡牧场','海湾旷野'], desert:['日灼沙原','流沙大漠','风蚀戈壁','月影沙丘'], jungle:['雨幕密林','翡翠雨林','河口湿地','藤冠丛林'], mountain:['天门山脊','岩冠高地','风化崖','云上峰'], plateau:['冰川高原','雪线冻土','霜原台地','白夜冰原'] },
};
const GENERIC_LANDMARKS = {
  deep:['whirlpool','frigate'], sea:['sloop','reef'], coast:['harbor','lighthouse'], island:['lighthouse','palm_camp'],
  plain:['camp','village'], desert:['oasis','desert_ruin'], jungle:['canopy_temple','watchtower'], mountain:['cliff_fort','peak'], plateau:['ice_outpost','peak'],
};

/* ================= 地图集（大厅可选） ================= */
const MAPS = {
  island : { label:'海洋群岛', terrain:'terrain-island.json', cols:64, rows:36, image:'/assets/maps/island.png' },
  jungle : { label:'热带雨林', terrain:'terrain-jungle.json', cols:64, rows:36, image:'/assets/maps/jungle.png' },
  snow   : { label:'雪地高原', terrain:'terrain-snow.json',   cols:64, rows:36, image:'/assets/maps/snow.png' },
  desert : { label:'黄金沙漠', terrain:'terrain-desert.json', cols:64, rows:36, image:'/assets/maps/desert.png' },
  mega   : { label:'芸芸众生·超大', terrain:'terrain-mega.json', cols:96, rows:96, image:'/assets/maps/mega.png' },
};
const terrainCache = {};
function loadTerrain(id){
  const m = MAPS[id] || MAPS.island;
  if(!terrainCache[id]) terrainCache[id] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', m.terrain), 'utf8'));
  return terrainCache[id];
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function genCode(){ return String(100000 + Math.floor(Math.random()*900000)); }
function intOr(v,fallback=-1){ const n=Number(v); return Number.isInteger(n)?n:fallback; }
function safeName(v,fallback){ const s=String(v??'').trim().slice(0,12); return s||fallback; }
function sendClient(client,type,msg){ if(client&&typeof client.send==='function') client.send(type,msg); }

/* ================= Schema ================= */
class RegionState extends Schema {
  constructor(){ super(); this.owner=-1; this.terrain='land'; this.garrison=0; this.isBarrack=false; this.name=''; this.landmark=''; this.anchorX=0; this.anchorY=0; }
}
type('int8')(RegionState.prototype,'owner');
type('string')(RegionState.prototype,'terrain');
type('uint32')(RegionState.prototype,'garrison');
type('boolean')(RegionState.prototype,'isBarrack');
type('string')(RegionState.prototype,'name');
type('string')(RegionState.prototype,'landmark'); // 地图原图对应的预渲染/伪3D地标类型
type('uint8')(RegionState.prototype,'anchorX');
type('uint8')(RegionState.prototype,'anchorY');

class PlayerState extends Schema {
  constructor(){ super(); this.id=0; this.name=''; this.color='#fff'; this.isHuman=true; this.connected=false; this.difficulty='normal'; this.alive=true; this.sessionId=''; this.cid=''; this.leader='hitler'; this.kills=0; this.battles=0; this.skillCd=0; }
}
type('int8')(PlayerState.prototype,'id');
type('string')(PlayerState.prototype,'name');
type('string')(PlayerState.prototype,'color');
type('boolean')(PlayerState.prototype,'isHuman');
type('boolean')(PlayerState.prototype,'connected');
type('string')(PlayerState.prototype,'difficulty');
type('boolean')(PlayerState.prototype,'alive');
type('string')(PlayerState.prototype,'sessionId');
type('string')(PlayerState.prototype,'cid');   // 客户端持久设备 ID：同设备重连复用席位
type('string')(PlayerState.prototype,'leader');
type('uint32')(PlayerState.prototype,'kills');
type('uint16')(PlayerState.prototype,'battles');
type('uint16')(PlayerState.prototype,'skillCd');  // 主动技能独立冷却（每玩家）

class Battle extends Schema {
  constructor(){ super(); this.attacker=-1; this.defender=-1; this.region=0; this.progress=0; this.phase='march'; }
}
type('int8')(Battle.prototype,'attacker');
type('int8')(Battle.prototype,'defender');
type('uint8')(Battle.prototype,'region');
type('int16')(Battle.prototype,'progress');
type('string')(Battle.prototype,'phase');

class Relation extends Schema {
  constructor(){ super(); this.state='peace'; this.pending=''; this.pendingFrom=-1; this.adjacent=false; this.cooldownSecs=0; }
}
type('string')(Relation.prototype,'state');
type('string')(Relation.prototype,'pending');
type('int8')(Relation.prototype,'pendingFrom');
type('boolean')(Relation.prototype,'adjacent');
type('uint8')(Relation.prototype,'cooldownSecs');

class State extends Schema {
  constructor(){
    super();
    this.phase='lobby'; this.code=''; this.mapCols=0; this.mapRows=0; this.regionCount=0;
    this.mapId='island';
    this.hostId=-1; this.winnerId=-1; this.timePause=0; this.skillCd=0;
    this.gameLeft=720; this.domPct=0; this.domLeader=-1; this.domHeld=0;
    this.winReason='';
    this.players=new MapSchema(); this.regions=new ArraySchema(); this.cellRegion=new ArraySchema();
    this.relations=new MapSchema(); this.battles=new ArraySchema();
  }
}
type('string')(State.prototype,'phase');
type('string')(State.prototype,'code');
type('string')(State.prototype,'mapId');
type('int8')(State.prototype,'mapCols');
type('int8')(State.prototype,'mapRows');
type('int8')(State.prototype,'regionCount');
type('int8')(State.prototype,'hostId');
type('int8')(State.prototype,'winnerId');
type('uint8')(State.prototype,'timePause');
type('uint8')(State.prototype,'skillCd');
type('uint16')(State.prototype,'gameLeft');
type('uint8')(State.prototype,'domPct');
type('int8')(State.prototype,'domLeader');
type('uint8')(State.prototype,'domHeld');
type('string')(State.prototype,'winReason');
type({ map: PlayerState })(State.prototype,'players');
type([ RegionState ])(State.prototype,'regions');
type(['uint16'])(State.prototype,'cellRegion');
type({ map: Relation })(State.prototype,'relations');
type([ Battle ])(State.prototype,'battles');

/* ================= 房间 ================= */
class BattleRoom extends Room {
  onCreate(options){
    this.maxClients=10;
    const code=options.code||genCode();
    this.setMetadata({code,phase:'lobby',mapId:'island'}); this.setState(new State());
    this.state.code=code; this.state.phase='lobby';
    this.nextPlayerId=0; this.secAcc=0; this.aiAcc=new Map();
    this.battleAge=new Map(); this.regionSettle=new Map(); this.regionNeighbors=[]; this.regionHistory=new Map();
    this.lastAttack=new Map(); this.spawnRegions=[]; this.gameStartAt=0; this.domLeader=-1; this.domHeld=0;
    this.allyJoiners=new Map(); // 区域_攻方 -> Set(已加入该战线的盟友id)，加入者全额参战

    this.onMessage('recruit',(c,m)=>this.handleRecruit(c,m));
    this.onMessage('attack',(c,m)=>this.handleAttack(c,m));
    this.onMessage('setLeader',(c,m)=>this.handleSetLeader(c,m));
    this.onMessage('setLoadout',(c,m)=>this.handleSetLoadout(c,m));
    this.onMessage('setMap',(c,m)=>this.handleSetMap(c,m));
    this.onMessage('declareWar',(c,m)=>this.handleDiplomacy(c,'war',m));
    this.onMessage('propose',(c,m)=>this.handlePropose(c,m));
    this.onMessage('respond',(c,m)=>this.handleRespond(c,m));
    this.onMessage('rebel',(c,m)=>this.handleDiplomacy(c,'rebel',m));
    this.onMessage('addAI',(c,m)=>this.handleAddAI(c,m));
    this.onMessage('removeAI',(c,m)=>this.handleRemoveAI(c,m));
    this.onMessage('start',(c,m)=>this.handleStart(c,m));
    this.onMessage('rematch',(c)=>this.handleRematch(c));
    this.onMessage('activate',(c)=>this.handleActivate(c));
    this.onMessage('ping',(c,m)=>{const at=Number(m&&m.at);if(Number.isSafeInteger(at)&&at>0)c.send('pong',{at:String(at)});});
    this.setSimulationInterval((dt)=>this.tick(dt),100);
  }
  onJoin(client,options){
    // 同设备重连/刷新（页面刷新会换 sessionId）：按持久设备 ID 复用原席位，杜绝"同名重复加入"
    if(options&&options.clientId){
      const same=[...this.state.players.values()].find(p=>p.cid===options.clientId);
        if(same){ same.sessionId=client.sessionId; same.isHuman=true; same.connected=true; if(this.state.hostId===-1)this.state.hostId=same.id; return; }
    }
    const ex=this.findBySession(client.sessionId); if(ex){ ex.isHuman=true; ex.connected=true; return; }
    // 不让“快速开始”误占用已开局房间的空席位；同设备席位复用在上面已提前放行。
    if(this.state.phase!=='lobby') throw new Error('战局已开始，暂不能加入');
    const id=this.nextPlayerId++;
    const p=new PlayerState(); p.id=id;
    p.name=safeName(options&&options.name,'玩家'+id);
    p.color=COLORS.includes(options&&options.color)?options.color:COLORS[id%COLORS.length];
    p.isHuman=true; p.connected=true; p.difficulty='normal'; p.alive=true; p.sessionId=client.sessionId;
    p.cid=(options&&options.clientId)||'';
    p.leader=LEADERS[options&&options.leader]?options.leader:LEADER_KEYS[id%LEADER_KEYS.length];
    // 不同设备却同名（真·重名）：自动加 ·2/·3 后缀，便于区分
    const humans=[...this.state.players.values()].filter(x=>x.isHuman&&x.id!==id);
    const base=p.name; let k=2;
    while(humans.some(x=>x.name===p.name)){ p.name=base+'·'+k; k++; }
    this.state.players.set(String(id),p);
    if(this.state.hostId===-1) this.state.hostId=id;
  }
  async onLeave(client,consented){
    const p=this.findBySession(client.sessionId); if(!p) return;
    p.connected=false;
    // 原来用布尔值覆盖了框架的 allowReconnection 方法，最后一人断网会立即销毁房间。
    // 使用框架保留原席位，刷新/网络切换时同一 reconnectionToken 可在 3 分钟内回来。
    if(!consented){
      try{
        await this.allowReconnection(client,180);
        p.connected=true; p.isHuman=true; this.ghostMs=0; return;
      }catch(_){ /* 预留过期才移除大厅席位/交给弱人机 */ }
    }
    if(p.connected||p.sessionId!==client.sessionId)return;
    if(this.state.phase==='lobby'){
      this.state.players.delete(String(p.id));
    } else { p.isHuman=false; p.difficulty='easy'; }
    if(this.state.hostId===p.id){const next=[...this.state.players.values()].find(x=>x.id!==p.id&&x.isHuman&&x.connected);this.state.hostId=next?next.id:-1;}
  }

  /* ---------- 工具 ---------- */
  findBySession(s){ for(const p of this.state.players.values()) if(p.sessionId===s) return p; return null; }
  getPlayer(id){ return this.state.players.get(String(id)); }
  relKey(a,b){ return Math.min(a,b)+'_'+Math.max(a,b); }
  getRelation(a,b){ const k=this.relKey(a,b); let r=this.state.relations.get(k); if(!r){ r=new Relation(); this.state.relations.set(k,r); } return r; }
  countOwned(id){ let n=0; for(const r of this.state.regions) if(r.owner===id) n++; return n; }
  totalGarrison(id){ let n=0; for(const r of this.state.regions) if(r.owner===id) n+=r.garrison; return n; }
  leaderBonus(p){ return LEADERS[p.leader] ? LEADERS[p.leader].bonus : {}; }
  playerAdjacent(a,b){
    for(let i=0;i<this.state.regionCount;i++){ if(this.state.regions[i].owner!==a) continue; for(const nb of this.regionNeighbors[i]) if(this.state.regions[nb].owner===b) return true; }
    return false;
  }
  regionAdjacentToPlayer(ri,pid){ return this.regionNeighbors[ri].some(nb=>this.state.regions[nb].owner===pid); }
  updateAdjacency(){ for(const a of this.state.players.values()) for(const b of this.state.players.values()){ if(a.id>=b.id) continue; this.getRelation(a.id,b.id).adjacent=this.playerAdjacent(a.id,b.id); } }

  /* ---------- 大厅 ---------- */
  handleAddAI(client,msg){
    const p=this.findBySession(client.sessionId); if(!p||p.id!==this.state.hostId||this.state.phase!=='lobby') return;
    if(this.state.players.size>=10) return;
    const id=this.nextPlayerId++;
    const ai=new PlayerState(); ai.id=id; ai.name=safeName(msg&&msg.name,'人机·'+(id+1)); ai.color=COLORS[id%COLORS.length];
    ai.isHuman=false; ai.difficulty=DIFF[msg&&msg.difficulty]?msg.difficulty:'normal'; ai.alive=true;
    ai.leader=LEADERS[msg&&msg.leader]?msg.leader:pick(LEADER_KEYS);
    this.state.players.set(String(id),ai);
  }
  handleRemoveAI(client,msg){
    const p=this.findBySession(client.sessionId); if(!p||p.id!==this.state.hostId||this.state.phase!=='lobby') return;
    const t=this.getPlayer(intOr(msg&&msg.id)); if(t&&!t.isHuman) this.state.players.delete(String(t.id));
  }
  handleStart(client,msg){
    const p=this.findBySession(client.sessionId); if(!p||p.id!==this.state.hostId||this.state.phase!=='lobby') return;
    const humans=[...this.state.players.values()].filter(x=>x.isHuman).length;
    if(this.state.players.size<2||humans<1) return;
    // 房主选图
    this.mapId=(msg&&msg.map&&MAPS[msg.map])?msg.map:'island';
    this.state.mapId=this.mapId;
    this.setMetadata({code:this.state.code,phase:'playing',mapId:this.mapId});
    this.gameStartAt=Date.now(); this.lastAttack.clear(); this.allyJoiners.clear(); this.domLeader=-1; this.domHeld=0;
    if(this.activeUntil) this.activeUntil.clear();
    this.state.gameLeft=Math.round((this.mapId==='mega'?MEGA_TIME_MS:GAME_TIME_MS)/1000);
    this.state.domPct=0; this.state.domLeader=-1; this.state.domHeld=0; this.state.winReason='';
    this.buildMap();
    this.state.relations.clear(); this.updateAdjacency();
    this.state.phase='playing'; this.secAcc=0; this.aiAcc.clear(); this.battleAge.clear(); this.regionSettle.clear();
    for(const pl of this.state.players.values()) this.aiAcc.set(pl.id,0);
    this.lock();
  }
  handleSetLeader(client,msg){
    const p=this.findBySession(client.sessionId); if(!p) return;
    if(this.state.phase==='lobby' && msg&&LEADERS[msg.leader]) p.leader=msg.leader;
  }
  handleSetLoadout(client,msg){
    // 大厅战前准备：可改领袖与旗帜颜色（开局后锁定）
    const p=this.findBySession(client.sessionId); if(!p||this.state.phase!=='lobby') return;
    if(msg&&LEADERS[msg.leader]) p.leader=msg.leader;
    if(msg&&typeof msg.color==='string'&&COLORS.includes(msg.color)) p.color=msg.color;
  }
  handleSetMap(client,msg){
    const p=this.findBySession(client.sessionId);
    if(!p||p.id!==this.state.hostId||this.state.phase!=='lobby') return;
    if(msg&&MAPS[msg.map]) this.state.mapId=msg.map;
  }

  /* ---------- 地图 ---------- */
  buildMap(){
    this.regionHistory.clear();
    const map=MAPS[this.mapId]||MAPS.island;
    const TERRAIN_MAP=loadTerrain(this.mapId);
    const n=this.state.players.size;
    const cols=map.cols, rows=map.rows;
    // 区域数随人数上调（人多更宽松），并受地图面积限制
    // 超大图包含冰原、沙漠、雨林和群岛；40 块是保持每种大景观独立成区的下限。
    const minRegions=this.mapId==='mega'?40:32;
    const regionCount=clamp(24+n*4,minRegions,Math.min(96,Math.floor(cols*rows/36)));
    this.state.mapCols=cols; this.state.mapRows=rows; this.state.regionCount=regionCount;
    // 原实现随机播种后直接泛洪，区域会横跨沙丘、海面、雪峰，因而名称和背景对不上。
    // 现在先消除低分辨率色簇的孤立噪点，再按每种可见地貌的面积配额播种；
    // 多源带地貌过界成本的泛洪会优先在同一地貌内扩张，边界自然贴着海岸、山脚和林线。
    const total=cols*rows;
    const layout=buildTerrainLayout(TERRAIN_MAP,cols,rows,regionCount);
    const {cellRegion,visualTerrain}=layout;
    this.state.cellRegion=new ArraySchema(); for(let i=0;i<total;i++) this.state.cellRegion.push(cellRegion[i]);
    this.regionNeighbors=Array.from({length:regionCount},()=>[]);
    { const seen=new Set(); for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const idx=r*cols+c,ri=cellRegion[idx]; if(c+1<cols){const rj=cellRegion[idx+1];if(rj!==ri){const k=Math.min(ri,rj)*1000+Math.max(ri,rj);if(!seen.has(k)){seen.add(k);this.regionNeighbors[ri].push(rj);this.regionNeighbors[rj].push(ri);}}} if(r+1<rows){const rj=cellRegion[idx+cols];if(rj!==ri){const k=Math.min(ri,rj)*1000+Math.max(ri,rj);if(!seen.has(k)){seen.add(k);this.regionNeighbors[ri].push(rj);this.regionNeighbors[rj].push(ri);}}} } }
    // 七类地形统计（0深海 1海洋 2平原 3沙漠 4雨林 5山地 6高原）
    const CELL_T=['deep','sea','plain','desert','jungle','mountain','plateau'];
    const isWater=t=>t==='deep'||t==='sea';
    const clsCnt=[]; for(let i=0;i<regionCount;i++) clsCnt.push(new Array(7).fill(0));
    const totCnt=new Array(regionCount).fill(0);
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const idx=r*cols+c,ri=cellRegion[idx],t=TERRAIN_MAP[idx]; totCnt[ri]++; clsCnt[ri][t]++; }
    const centers=regionCenters(cellRegion,cols,rows,regionCount);
    const terrain=new Array(regionCount).fill('plain');
    for(let i=0;i<regionCount;i++){
      const score=clsCnt[i].slice();
      // 新分区已遵循地貌连通性，最终标签以区域里的实际可见像素多数为准。
      // 不再让一个小种子色块反过来覆盖整片海湾/绿洲/雪原的名称和属性。
      const groups=[score[0]+score[1],score[2],score[3],score[4],score[5]+score[6]];
      let major=0;for(let k=1;k<5;k++)if(groups[k]>groups[major])major=k;
      const candidates=[[0,1],[2],[3],[4],[5,6]][major];
      let best=candidates[0];for(const k of candidates)if(score[k]>score[best])best=k;
      terrain[i]=CELL_T[best];
    }
    // 海岸/岛屿只覆盖无特征平原。沙漠、雨林、山地和雪原本身就是地图主题，
    // 即使临水也必须保留原地貌，不能被统一的“海岸”标签吞掉。
    for(let i=0;i<regionCount;i++){
      if(terrain[i]!=='plain') continue;
      const nbs=this.regionNeighbors[i];
      if(nbs.length>0&&nbs.every(nb=>isWater(terrain[nb]))) terrain[i]='island';
      else if(nbs.some(nb=>isWater(terrain[nb]))) terrain[i]='coast';
    }
    const landList=[]; for(let i=0;i<regionCount;i++) if(!isWater(terrain[i])) landList.push(i);
    let tmp=0; while(landList.length<n){ const ri=tmp++; if(isWater(terrain[ri])){ terrain[ri]='plain'; landList.push(ri); } }
    const spawns=pickSpread(0,n,centers,new Set(landList));
    const anchors=regionAnchors(cellRegion,visualTerrain,cols,rows,regionCount,terrain);
    const identities=buildRegionIdentities(this.mapId,terrain,anchors,cols,rows);
    this.state.regions=new ArraySchema();
    for(let i=0;i<regionCount;i++){
      const rs=new RegionState(); rs.owner=-1; rs.terrain=terrain[i];
      rs.name=identities[i].name; rs.landmark=identities[i].landmark;
      rs.anchorX=anchors[i][0]; rs.anchorY=anchors[i][1];
      rs.garrison=randInt(8,20); rs.isBarrack=false;
      this.state.regions.push(rs);
    }
    let pi=0;
    this.spawnRegions=[];
    for(const pl of this.state.players.values()){
      const ri=spawns[pi++]; const rs=this.state.regions[ri];
      rs.owner=pl.id; rs.isBarrack=true; rs.garrison=randInt(40,60);
      this.spawnRegions.push(ri);
      if(!this.regionHistory.has(ri)) this.regionHistory.set(ri,new Set());
      this.regionHistory.get(ri).add(pl.id);
    }
  }

  /* ---------- 玩家操作 ---------- */
  handleRecruit(client,msg){
    if(this.state.phase!=='playing') return;
    const p=this.findBySession(client.sessionId); if(!p||!p.alive) return;
    if(this.isPaused(p)) return; // 时停期间暂停征兵
    const ri=intOr(msg&&msg.index); const region=this.state.regions[ri]; if(!region||region.owner!==p.id) return;
    const owned=this.countOwned(p.id);
    const recruit=(this.leaderBonus(p).recruit)||1;
    const gain=Math.round(randInt(1,10+Math.min(owned,12))*recruit);
    region.garrison += gain;
    // 最近军营也响应（手动募兵从军营出）
    const barrack=this.nearestBarrack(p.id);
    if(barrack&&barrack!==region) barrack.garrison += 1;
    this.broadcast('fx',{kind:'recruit', region:ri, amount:gain, color:p.color});
  }
  isPaused(p){ return this.state.timePause>0 && p.leader!=='thatcher'; }
  setActive(pid,key,ms){ if(!this.activeUntil) this.activeUntil=new Map(); this.activeUntil.set(pid,{end:Date.now()+ms,key}); }
  isActive(pid,key){ const a=this.activeUntil&&this.activeUntil.get(pid); return !!(a&&a.end>Date.now()&&a.key===key); }
  handleActivate(client){
    const p=client&&client.__player?client.__player:this.findBySession(client&&client.sessionId);
    return this.activatePlayer(p,client);
  }
  activatePlayer(p,client){
    if(this.state.phase!=='playing') return;
    if(!p||!p.alive) return;
    const sk=ACTIVE_SKILLS[p.leader]; if(!sk) return;
    if(p.skillCd>0) return;
    if(p.leader==='chiang'&&this.countOwned(p.id)!==1){
      sendClient(client,'attackBlock',{reason:'孤岛反击需要仅剩一块领地'});
      return;
    }
    p.skillCd=sk.cd;
    if(p.leader==='thatcher'){ this.state.timePause=5; this.state.skillCd=60; }
    else if(p.leader==='gandhi'){
      // 核平时刻：相邻交战敌区兵力 -25%
      for(let i=0;i<this.state.regionCount;i++){
        const r=this.state.regions[i];
        if(r.owner<0||r.owner===p.id) continue;
        if(!this.regionAdjacentToPlayer(i,p.id)) continue;
        if(this.getRelation(p.id,r.owner).state!=='war') continue;
        r.garrison=Math.max(1,Math.round(r.garrison*0.75));
      }
    }
    else if(p.leader==='tiger'){
      // 饿虎扑食：立即向最多 2 块失地（曾属于我、现属敌且交战）发起收复进攻
      let launched=0;
      for(let i=0;i<this.state.regionCount&&launched<2;i++){
        const r=this.state.regions[i];
        if(r.owner<0||r.owner===p.id) continue;
        if(!this.wasOwnedBy(i,p.id)) continue;
        if(this.getRelation(p.id,r.owner).state!=='war') continue;
        if(!this.regionAdjacentToPlayer(i,p.id)) continue;
        if(this.state.battles.some(b=>b.region===i&&b.attacker===p.id)) continue;
        if(this.state.battles.filter(b=>b.region===i).length>=BATTLE_CAP_PER_REGION) continue;
        if(this.spawnRegions.includes(i)&&Date.now()-this.gameStartAt<SPAWN_PROTECT_MS) continue;
        this.launchBattle(p.id,i);
        launched++;
      }
    }
    else if(p.leader==='hitler') this.setActive(p.id,'atk',15000);
    else if(p.leader==='degaulle') this.setActive(p.id,'rate',20000);
    else if(p.leader==='roosevelt') this.setActive(p.id,'brk',20000);
    else if(p.leader==='stalin'){ for(const r of this.state.regions) if(r.owner===p.id) r.isBarrack=true; }  // 钢铁洪流：全兵营立即建成
    else if(p.leader==='sun'){ for(const r of this.state.regions) if(r.owner===p.id) r.garrison+=40; }
    else if(p.leader==='churchill'){ for(let i=0;i<this.state.regionCount;i++){ const r=this.state.regions[i]; if(r.owner===p.id&&this.regionNeighbors[i].some(nb=>this.state.regions[nb].owner!==p.id)) r.garrison+=100; } }
    else if(p.leader==='chiang'){ for(const r of this.state.regions) if(r.owner===p.id) r.garrison=Math.round(r.garrison*2); }
    this.broadcast('fx',{kind:'skill',text:p.name+' 发动「'+sk.name+'」！',color:p.color});
  }
  nearestBarrack(pid){
    for(let i=0;i<this.state.regionCount;i++){ const r=this.state.regions[i]; if(r.owner===pid&&r.isBarrack) return r; }
    return null;
  }
  handleAttack(client,msg){
    if(this.state.phase!=='playing') return;
    const p=this.findBySession(client.sessionId); if(!p||!p.alive) return;
    const ri=intOr(msg&&msg.to); if(ri<0||ri>=this.state.regionCount) return;
    if(this.isPaused(p)){ sendClient(client,'attackBlock',{reason:'时停领域中，稍后再试'}); return; }
    const region=this.state.regions[ri]; if(!region||region.owner===p.id) return;
    if(!this.regionAdjacentToPlayer(ri,p.id)){ sendClient(client,'attackBlock',{reason:'需与目标相邻才能进攻'}); return; }
    if(region.owner>=0){ const rel=this.getRelation(p.id,region.owner); if(rel.state!=='war'){ sendClient(client,'attackBlock',{reason:'需先宣战才能进攻'}); return; } }
    // 发兵冷却：同一玩家两次进攻间隔至少 3 秒（防连点骚扰）
    const now=Date.now();
    if(this.lastAttack.has(p.id)&&now-this.lastAttack.get(p.id)<ATTACK_COOLDOWN_MS){ sendClient(client,'attackBlock',{reason:'发兵冷却中（3秒）'}); return; }
    // 出生保护：开局 45 秒内不可进攻任何人的出生地
    if(this.spawnRegions.includes(ri)&&now-this.gameStartAt<SPAWN_PROTECT_MS){ sendClient(client,'attackBlock',{reason:'出生保护期内，暂不可进攻'}); return; }
    // 战线限流：盟军共享战线（不新开），同玩家不重复，第三方最多把战线凑到 3 路
    const here=this.state.battles.filter(b=>b.region===ri);
    const allyLine=here.find(b=>this.getRelation(p.id,b.attacker).state==='ally');
    if(allyLine){
      const key=ri+'_'+allyLine.attacker;
      if(!this.allyJoiners.has(key)) this.allyJoiners.set(key,new Set());
      this.allyJoiners.get(key).add(p.id);
      this.broadcast('fx',{kind:'allyJoin',region:ri,text:p.name+' 加入盟军战线！'});
      return;
    }
    if(here.some(b=>b.attacker===p.id)){ sendClient(client,'attackBlock',{reason:'你已在该区域交战中'}); return; }
    if(here.length>=BATTLE_CAP_PER_REGION){ sendClient(client,'attackBlock',{reason:'战线已满（最多3路）'}); return; }
    this.lastAttack.set(p.id,now);
    this.launchBattle(p.id,ri);
  }
  launchBattle(attacker,ri){
    const atkP=this.getPlayer(attacker); if(atkP) atkP.battles++;
    const region=this.state.regions[ri];
    const b=new Battle(); b.attacker=attacker; b.defender=region.owner; b.region=ri; b.progress=0; b.phase='march';
    this.state.battles.push(b); this.battleAge.set(ri+'_'+attacker,0);
    this.broadcast('fx',{kind:'battleStart', region:ri, attacker, color:this.getPlayer(attacker).color});
  }

  /* ---------- 外交 ---------- */
  handleDiplomacy(client,action,msg){
    if(this.state.phase!=='playing') return;
    const p=this.findBySession(client.sessionId); if(!p||!p.alive) return;
    const t=this.getPlayer(intOr(msg&&msg.to)); if(!t||!t.alive) return;
    const rel=this.getRelation(p.id,t.id);
    if(!this.playerAdjacent(p.id,t.id)) return;
    if(action==='war'){ if(rel.state!=='peace'||rel.cooldownSecs>0) return; rel.state='war'; rel.pending=''; rel.pendingFrom=-1; this.broadcast('fx',{kind:'diplomacy',a:p.id,b:t.id,text:p.name+' 向 '+t.name+' 宣战！',color:p.color}); }
    else if(action==='rebel'){ if(rel.state!=='ally') return; rel.state='war'; rel.pending=''; rel.pendingFrom=-1; this.broadcast('fx',{kind:'diplomacy',a:p.id,b:t.id,text:p.name+' 撕毁同盟，偷袭 '+t.name+'！',color:p.color}); }
  }
  handlePropose(client,msg){
    if(this.state.phase!=='playing') return;
    const p=this.findBySession(client.sessionId); if(!p||!p.alive) return;
    const t=this.getPlayer(intOr(msg&&msg.to)); if(!t||!t.alive) return;
    const rel=this.getRelation(p.id,t.id);
    const requestType=msg&&msg.type;
    if(!['ally','truce','peace'].includes(requestType)) return;
    const type=requestType;
    if(type==='ally'){
      // 结盟不需相邻
      if(rel.pending!=='') return;
      if(rel.state!=='peace') return;
    } else {
      // 停战/求和需相邻
      if(!this.playerAdjacent(p.id,t.id)||rel.pending!=='') return;
      if(rel.state!=='war') return;
    }
    rel.pending=type; rel.pendingFrom=p.id;
    this.broadcast('fx',{kind:'propose',a:p.id,b:t.id,type,text:p.name+' 请求'+LABEL[type]});
  }
  handleRespond(client,msg){
    if(this.state.phase!=='playing') return;
    const p=this.findBySession(client.sessionId); if(!p||!p.alive) return;
    const t=this.getPlayer(intOr(msg&&msg.to)); if(!t) return;
    const rel=this.getRelation(p.id,t.id);
    if(rel.pending===''||rel.pendingFrom!==t.id) return;
    const type=rel.pending;
    if(msg.accept){
      if(type==='truce'){ rel.state='peace'; rel.cooldownSecs=TRUCE_CD; }
      else if(type==='peace'){ rel.state='peace'; rel.cooldownSecs=PEACE_CD; this.cedeRegions(t.id,p.id); } // 求和：割让被攻占区域
      else if(type==='ally'){ rel.state='ally'; }
      this.broadcast('fx',{kind:'diplomacy',a:p.id,b:t.id,text:p.name+' 与 '+t.name+' 达成'+LABEL[type]});
    } else {
      // 拒绝求和/停战：加冷却，防止对方频繁骚扰
      if(type==='truce'||type==='peace') rel.cooldownSecs=10;
    }
    rel.pending=''; rel.pendingFrom=-1;
  }
  cedeRegions(from,to){
    // 求和方（from=发起求和者）割让正在被对方攻占的区域给对方
    const toCede=[];
    for(const b of this.state.battles){
      if(b.attacker===to && this.state.regions[b.region].owner===from && b.progress>0) toCede.push(b);
    }
    for(const b of toCede){
      this.finishBattle(b,true);
    }
  }

  /* ---------- 战斗 ---------- */
  battlePower(b){
    const ri=b.region, region=this.state.regions[ri], mod=TERRAIN_MOD[region.terrain]||TERRAIN_MOD.plain;
    let ownAdj=0, allyAdj=0;
    const joined=this.allyJoiners.get(ri+'_'+b.attacker);
    // 己方相邻区域全额参战；盟友相邻区域助战（已加入战线的盟友全额，其余 35%）
    for(const nb of this.regionNeighbors[ri]){
      const o=this.state.regions[nb].owner;
      if(o===b.attacker) ownAdj+=this.state.regions[nb].garrison;
      else if(o>=0&&this.getRelation(b.attacker,o).state==='ally'){
        const full=joined&&joined.has(o);
        allyAdj+=this.state.regions[nb].garrison*(full?1:0.35);
      }
    }
    // 后方总兵力按比例参战：不再只看相邻区域，大部队也能压上
    const total=this.totalGarrison(b.attacker);
    const reserve=Math.max(0,total-ownAdj)*RESERVE_RATIO;
    let atkGarrison=ownAdj+allyAdj+reserve;
    if(atkGarrison<1) atkGarrison=1;
    const atk=this.getPlayer(b.attacker);
    let atkMult=1, recaptureMult=1;
    if(atk){ const lb=this.leaderBonus(atk); atkMult=lb.attack||1; if(lb.recapture&&this.wasOwnedBy(ri,b.attacker)) recaptureMult=lb.recapture; }
    if(this.isActive(b.attacker,'atk')) atkMult*=1.5;   // 希特勒主动：巴巴罗萨
    const powerA=atkGarrison*mod.attack*atkMult*recaptureMult;
    let defMult=1;
    if(b.defender>=0){
      const def=this.getPlayer(b.defender);
      if(def){ const lb=this.leaderBonus(def); defMult=lb.defend||1; if(lb.hp) defMult*=lb.hp; }
      // 撒切尔被动「学生牛奶」：防守方阵营（含盟友）有撒切尔 → 全体血量+25%
      const teamHasMilk=[...this.state.players.values()].some(x=>x.alive&&x.leader==='thatcher'&&(x.id===b.defender||this.getRelation(b.defender,x.id).state==='ally'));
      if(teamHasMilk) defMult*=1.25;
    }
    const powerB=region.garrison*mod.defend*defMult;
    return {powerA,powerB,atkGarrison};
  }
  finishBattle(b,win){
    const region=this.state.regions[b.region];
    const attacker=this.getPlayer(b.attacker);
    // 同一 tick 可能有多路战线同时到达终点；只有仍控制原目标且仍存活的攻方才能夺取。
    if(win&&(!attacker||!attacker.alive||this.countOwned(attacker.id)<1||region.owner!==b.defender)) win=false;
    if(win){
      region.owner=b.attacker; region.isBarrack=false;
      // 记录历史占领者（高原虎"强力平定"用）
      if(!this.regionHistory.has(b.region)) this.regionHistory.set(b.region,new Set());
      this.regionHistory.get(b.region).add(b.attacker);
      this.broadcast('fx',{kind:'conquer',region:b.region,color:attacker.color});
    }
    else {
      const ap=this.getPlayer(b.attacker);
      this.broadcast('fx',{kind:'battleLost',region:b.region,color:ap?ap.color:'#fff',text:(ap?ap.name:'攻方')+' 占领 '+region.name+' 失败，部队撤回'});
    }
    const idx=this.state.battles.indexOf(b); if(idx>=0) this.state.battles.splice(idx,1);
    this.battleAge.delete(b.region+'_'+b.attacker);
    this.allyJoiners.delete(b.region+'_'+b.attacker);
    this.updateAdjacency();
  }
  wasOwnedBy(ri,pid){
    const hist=this.regionHistory.get(ri);
    return hist?hist.has(pid):false;
  }

  /* ---------- AI ---------- */
  aiTick(p){
    const d=DIFF[p.difficulty]||DIFF.normal;
    // AI 低概率使用主动技能，仍保留决策间隔与随机出手率，避免超过手动玩家。
    if(p.skillCd===0&&Math.random()<0.12*d.actChance) this.activatePlayer(p);
    // 军营自动产兵在 tick 里统一处理；这里 AI 手动募兵（模拟点击，按概率出手）
    if(Math.random()<0.7 && !this.isPaused(p) && this.countOwned(p.id)>0){
      const owned=[]; for(let i=0;i<this.state.regionCount;i++) if(this.state.regions[i].owner===p.id) owned.push(i);
      const recruit=(this.leaderBonus(p).recruit)||1;
      this.state.regions[pick(owned)].garrison += Math.round(randInt(1,6)*recruit);
    }
    // 回应外交
    for(const key of this.state.relations.keys()){
      const rel=this.state.relations.get(key);
      if(rel.pending===''||rel.pendingFrom===-1) continue;
      const [x,y]=key.split('_').map(Number);
      if(x!==p.id&&y!==p.id) continue;
      if(rel.pendingFrom===p.id) continue;
      const from=this.getPlayer(rel.pendingFrom); if(!from) continue;
      const accept=rel.pending==='ally' ? (this.totalGarrison(rel.pendingFrom)>this.totalGarrison(p.id)*0.5) : (this.totalGarrison(p.id)<this.totalGarrison(rel.pendingFrom));
      if(accept){ if(rel.pending==='truce'){rel.state='peace';rel.cooldownSecs=TRUCE_CD;} else if(rel.pending==='peace'){rel.state='peace';rel.cooldownSecs=PEACE_CD;this.cedeRegions(rel.pendingFrom,p.id);} else if(rel.pending==='ally'){rel.state='ally';} }
      rel.pending=''; rel.pendingFrom=-1;
    }
    this.aiDiplomacy(p);
    // 进攻（按难度概率出手；同一区域不重复发兵、不超过区域战斗上限）
    const target=(Math.random()>d.actChance||this.isPaused(p))?null:this.findBestAttackRegion(p,d.aggression);
    if(target){ const ri=this.state.regions.indexOf(target);
      const now=Date.now();
      if(this.lastAttack.has(p.id)&&now-this.lastAttack.get(p.id)<ATTACK_COOLDOWN_MS) return;
      if(target.owner>=0){ const rel=this.getRelation(p.id,target.owner); if(rel.state==='peace'&&rel.cooldownSecs===0&&this.playerAdjacent(p.id,target.owner)){rel.state='war';rel.pending='';rel.pendingFrom=-1;} else if(rel.state!=='war') return; }
      const here=this.state.battles.filter(b=>b.region===ri);
      if(here.some(b=>b.attacker===p.id)||here.length>=BATTLE_CAP_PER_REGION) return;
      const allyLine=here.find(b=>this.getRelation(p.id,b.attacker).state==='ally');
      if(allyLine){
        const key=ri+'_'+allyLine.attacker;
        if(!this.allyJoiners.has(key)) this.allyJoiners.set(key,new Set());
        this.allyJoiners.get(key).add(p.id);
        return; // 盟军战线已存在：加入而非新开
      }
      this.lastAttack.set(p.id,now);
      this.launchBattle(p.id,ri);
    }
  }
  aiDiplomacy(p){
    if(Math.random()>0.2) return;
    const pg=this.totalGarrison(p.id);
    for(const other of this.state.players.values()){
      if(other.id===p.id||!other.alive) continue;
      const rel=this.getRelation(p.id,other.id);
      if(rel.pending!=='') continue;
      const og=this.totalGarrison(other.id);
      if(rel.state==='peace'&&rel.cooldownSecs===0){
        if(rel.adjacent&&pg>og*1.3){ rel.state='war'; this.broadcast('fx',{kind:'diplomacy',a:p.id,b:other.id,text:p.name+' 向 '+other.name+' 宣战！',color:p.color}); }
        else if(pg<og*0.7){ rel.pending='ally'; rel.pendingFrom=p.id; this.broadcast('fx',{kind:'propose',a:p.id,b:other.id,type:'ally',text:p.name+' 请求结盟'}); }
      } else if(rel.state==='war'){
        if(rel.adjacent&&rel.cooldownSecs===0&&pg<og*0.5){ rel.pending='peace'; rel.pendingFrom=p.id; this.broadcast('fx',{kind:'propose',a:p.id,b:other.id,type:'peace',text:p.name+' 请求求和'}); }
      } else if(rel.state==='ally'){
        if(rel.adjacent&&pg>og*2.5){ rel.state='war'; this.broadcast('fx',{kind:'diplomacy',a:p.id,b:other.id,text:p.name+' 撕毁同盟，偷袭 '+other.name+'！',color:p.color}); }
      }
    }
  }
  findBestAttackRegion(p,aggression){
    let best=null,bestScore=Infinity;
    for(let i=0;i<this.state.regionCount;i++){
      const r=this.state.regions[i];
      if(r.owner===p.id) continue;
      if(r.owner>=0){ const rel=this.getRelation(p.id,r.owner); if(rel.state!=='war') continue; }
      if(!this.regionNeighbors[i].some(nb=>this.state.regions[nb].owner===p.id)) continue;
      // 出生保护期内不进攻出生地
      if(this.spawnRegions.includes(i)&&Date.now()-this.gameStartAt<SPAWN_PROTECT_MS) continue;
      // 已在攻打或区域战斗已满：跳过，避免战线堆积；盟军战线已存在则兵力自动并入
      if(this.state.battles.some(b=>b.region===i&&b.attacker===p.id)) continue;
      if(this.state.battles.filter(b=>b.region===i).length>=BATTLE_CAP_PER_REGION) continue;
      const score=r.garrison;
      if(score*aggression<bestScore){ bestScore=score*aggression; best=r; }
    }
    return best;
  }

  /* ---------- 主循环 ---------- */
  tick(dt){
    if(this.state.phase!=='playing') return;
    dt=Math.min(dt,250);

    // 战斗结算（多方混战：每个 battle 独立推进，带僵局推进/超时/易主清理）
    const done=[];
    const damagedDefense=new Set();
    const damagedAttackers=new Set();
    for(const b of this.state.battles){
      const key=b.region+'_'+b.attacker;
      const age=(this.battleAge.get(key)||0)+dt; this.battleAge.set(key,age);
      const region=this.state.regions[b.region];
      const atkP=this.getPlayer(b.attacker);
      // 攻方失去最后一块领地后，旧战线立即失效，不能凭残余请求“复活”。
      if(!atkP||!atkP.alive||this.countOwned(b.attacker)===0){ done.push({b,win:false}); continue; }
      // 守方已易主（被第三方攻占等）：此路进攻失效，立即结束
      if(b.defender>=0 && region.owner!==b.defender){ done.push({b,win:false}); continue; }
      if(b.phase==='march'&&age>=MARCH_MS) b.phase='fight';
      if(b.phase==='fight'){
        const {powerA,powerB}=this.battlePower(b);
        let adv=(powerA-powerB)/Math.max(powerA+powerB,1);
        // 战况胶着也强制缓慢推进，避免永不结束的僵局
        if(Math.abs(adv)<MIN_ADV) adv=adv<0?-MIN_ADV:MIN_ADV;
        let rate=(atkP&&this.leaderBonus(atkP).rate)||1;
        if(this.isActive(b.attacker,'rate')) rate*=2;  // 戴高乐主动：雷霆总攻
        b.progress=clamp(b.progress+Math.round(adv*RATE*rate*dt/1000*100),-100,100);
        // 损耗（局部兵力）
        // 同一区域多路战线只对守军结算一次损耗；同一攻方的相邻支援也不因多线重复扣血。
        if(!damagedDefense.has(b.region)){
          const beforeDef=region.garrison;
          region.garrison=Math.max(1,Math.round(region.garrison*(1-LOSS_RATE*dt/1000)));
          atkP.kills+=beforeDef-region.garrison;
          damagedDefense.add(b.region);
        }
        for(const nb of this.regionNeighbors[b.region]) if(this.state.regions[nb].owner===b.attacker){
          const damageKey=b.attacker+'_'+nb;
          if(damagedAttackers.has(damageKey)) continue;
          const r=this.state.regions[nb]; r.garrison=Math.max(1,Math.round(r.garrison*(1-ATTACK_LOSS_RATE*dt/1000)));
          damagedAttackers.add(damageKey);
        }
        if(b.progress>=100) done.push({b,win:true});
        else if(b.progress<=-100) done.push({b,win:false});
        else if(age>=BATTLE_TIMEOUT_MS) done.push({b,win:b.progress>=0}); // 超时按战线位置判定胜负
      } else if(age>=BATTLE_TIMEOUT_MS){
        done.push({b,win:false}); // 行军超时视作失败
      }
    }
    for(const d of done) this.finishBattle(d.b,d.win);

    // 每秒：冷却、邻接、军营产兵、前线增援、驻扎、同盟互助
    this.secAcc+=dt;
    while(this.secAcc>=1000){
      this.secAcc-=1000;
      for(const rel of this.state.relations.values()) if(rel.cooldownSecs>0) rel.cooldownSecs--;
      if(this.state.timePause>0) this.state.timePause--;
      if(this.state.skillCd>0) this.state.skillCd--;
      for(const pl of this.state.players.values()) if(pl.skillCd>0) pl.skillCd--;  // 各领袖技能独立冷却
      if(this.activeUntil){ const now2=Date.now(); for(const [k,v] of this.activeUntil) if(v.end<now2) this.activeUntil.delete(k); }
      // 全场倒计时 + 占领 80% 坚持 10 秒判定
      if(this.state.gameLeft>0){
        this.state.gameLeft--;
        if(this.state.gameLeft<=0){ this.endGameByTime(); return; }
      }
      let leader=-1,bestPct=0;
      for(const pl of this.state.players.values()){
        if(!pl.alive) continue;
        const pct=Math.floor(this.countOwned(pl.id)*100/Math.max(1,this.state.regionCount));
        if(pct>bestPct){ bestPct=pct; leader=pl.id; }
      }
      // 蒋介石被动「虎踞孤岛」：蒋在世时无法以占领统一获胜，必须将其消灭
      const chiangAlive=[...this.state.players.values()].some(x=>x.alive&&x.leader==='chiang');
      if(bestPct>=DOMINATION*100 && !chiangAlive){
        if(this.domLeader===leader){ this.domHeld++; }
        else { this.domLeader=leader; this.domHeld=1; }
        if(this.domHeld>=DOMINATION_HOLD_S){ this.endGame(this.getPlayer(leader),'dominate'); return; }
      } else { this.domLeader=-1; this.domHeld=0; }
      this.state.domPct=bestPct; this.state.domLeader=leader; this.state.domHeld=this.domHeld;
      // 驻扎时长 & 军营建设（撒切尔加速）
      for(let i=0;i<this.state.regionCount;i++){
        const r=this.state.regions[i];
        if(r.owner<0){ this.regionSettle.delete(i); continue; }
        const op=this.getPlayer(r.owner);
        const fast=(op&&this.leaderBonus(op).barrackFast)||1;
        const st=(this.regionSettle.get(i)||0)+1000; this.regionSettle.set(i,st);
        if(!r.isBarrack&&st>=BARRACK_MS*fast) r.isBarrack=true;
      }
      // 军营产兵 + 前线增援 + 同盟互助
      for(let i=0;i<this.state.regionCount;i++){
        const r=this.state.regions[i];
        if(r.owner<0) continue;
        const p=this.getPlayer(r.owner); if(!p) continue;
        let rate=(this.leaderBonus(p).barrackRate)||1;
        if(this.isActive(r.owner,'brk')) rate*=3;  // 罗斯福主动：工业总动员
        if(r.isBarrack) r.garrison+=Math.round(BARRACK_RATE*rate);
        const isFront=this.regionNeighbors[i].some(nb=>this.state.regions[nb].owner!==r.owner);
        if(isFront) r.garrison+=FRONT_REINFORCE*((this.leaderBonus(p).frontReinforce)||1);
        // 同盟互助：战斗中防守方的盟友增援（每个相邻盟友 +2/秒，帮守）
        if(this.isUnderAttack(i,r.owner)){
          for(const ally of this.state.players.values()){
            if(ally.id===r.owner||!ally.alive) continue;
            const rel=this.getRelation(r.owner,ally.id);
            if(rel.state==='ally'&&this.playerAdjacent(ally.id,r.owner)) r.garrison+=2;
          }
        }
      }
    }

    // AI
    for(const pl of this.state.players.values()){
      if(pl.isHuman||!pl.alive) continue;
      const interval=(DIFF[pl.difficulty]||DIFF.normal).tickMs;
      let acc=(this.aiAcc.get(pl.id)||0)+dt;
      while(acc>=interval){ acc-=interval; this.aiTick(pl); }
      this.aiAcc.set(pl.id,acc);
    }
    this.checkEnd();
    // 无真人连接的对局 5 分钟后回收，晚于 3 分钟席位预留期限。
    // （宽限拉长到 2 分钟，给断线自动重连留足时间）
    if(this.state.phase!=='lobby'){
      const hasHuman=[...this.state.players.values()].some(x=>x.isHuman&&x.connected);
      if(!hasHuman){
        this.ghostMs=(this.ghostMs||0)+dt;
        if(this.ghostMs>=300000){ try{ this.disconnect(); }catch(e){} return; }
      } else this.ghostMs=0;
    }
  }
  isUnderAttack(ri,pid){
    for(const b of this.state.battles) if(b.region===ri&&b.defender===pid) return true;
    return false;
  }
  checkEnd(){
    for(const p of this.state.players.values()) if(p.alive&&this.countOwned(p.id)===0){ p.alive=false; this.broadcast('fx',{kind:'elim',name:p.name,color:p.color}); }
    const alive=[...this.state.players.values()].filter(p=>p.alive);
    if(alive.length===1) this.endGame(alive[0],'eliminate');
    else if(alive.length===2){
      // 最后对决：剩余两人自动全面开战，无需手动宣战
      const [a,b]=alive;
      const rel=this.getRelation(a.id,b.id);
      if(rel.state!=='war'){
        rel.state='war'; rel.pending=''; rel.pendingFrom=-1;
        this.broadcast('fx',{kind:'diplomacy',a:a.id,b:b.id,text:'⚔️ 最后对决：'+a.name+' 与 '+b.name+' 自动全面开战！',color:'#fff'});
      }
    }
  }
  endGame(w,reason){
    this.state.phase='over'; this.state.winnerId=w.id; this.state.winReason=reason||'';
    this.broadcast('fx',{kind:'win',name:w.name,isHuman:w.isHuman,color:w.color,reason:this.state.winReason});
  }
  endGameByTime(){
    const alive=[...this.state.players.values()].filter(p=>p.alive);
    if(!alive.length) return;
    let best=alive[0];
    for(const p of alive){
      const a=this.countOwned(p.id), b=this.countOwned(best.id);
      if(a>b||(a===b&&this.totalGarrison(p.id)>this.totalGarrison(best.id))) best=p;
    }
    this.endGame(best,'time');
  }
  handleRematch(client){
    const p=this.findBySession(client.sessionId);
    if(!p||!p.isHuman||this.state.phase!=='over') return;
    for(const pl of this.state.players.values()) pl.alive=true;
    this.gameStartAt=Date.now();
    this.lastAttack.clear();
    this.allyJoiners.clear();
    this.battleAge.clear();
    this.regionSettle.clear();
    this.domLeader=-1;
    this.domHeld=0;
    this.ghostMs=0;
    if(this.activeUntil) this.activeUntil.clear();
    this.state.battles=new ArraySchema();
    this.state.gameLeft=Math.round((this.mapId==='mega'?MEGA_TIME_MS:GAME_TIME_MS)/1000);
    this.state.timePause=0;
    this.state.skillCd=0;
    this.state.domPct=0;
    this.state.domLeader=-1;
    this.state.domHeld=0;
    this.state.winReason='';
    for(const pl of this.state.players.values()) pl.skillCd=0;
    this.buildMap(); this.state.relations.clear(); this.updateAdjacency();
    this.state.winnerId=-1; this.state.phase='playing'; this.secAcc=0; this.aiAcc.clear();
    this.setMetadata({code:this.state.code,phase:'playing',mapId:this.mapId});
    for(const pl of this.state.players.values()) this.aiAcc.set(pl.id,0);
  }
}

/* ================= 工具 ================= */
const LABEL={truce:'停战',peace:'求和',ally:'结盟'};
// 地标/军旗使用区域内部的同地貌锚点，凹形海岸的均值中心可能落在别人的领地里。
function regionAnchors(cells,visual,cols,rows,n,terrain){
  const centers=regionCenters(cells,cols,rows,n), dist=new Int16Array(cells.length).fill(-1), queue=[];
  const counts=new Uint16Array(n), out=centers.map(c=>[Math.round(c[0]),Math.round(c[1])]), scores=new Array(n).fill(-Infinity);
  for(let idx=0;idx<cells.length;idx++){
    counts[cells[idx]]++; const x=idx%cols,y=Math.floor(idx/cols);
    if(x===0||y===0||x===cols-1||y===rows-1||DIRS.some(([dx,dy])=>cells[(y+dy)*cols+x+dx]!==cells[idx])){dist[idx]=0;queue.push(idx);}
  }
  for(let head=0;head<queue.length;head++){
    const idx=queue[head],x=idx%cols,y=Math.floor(idx/cols);
    for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy,ni=ny*cols+nx;if(nx>=0&&ny>=0&&nx<cols&&ny<rows&&cells[ni]===cells[idx]&&dist[ni]<0){dist[ni]=dist[idx]+1;queue.push(ni);}}
  }
  const zone={deep:0,sea:0,plain:1,coast:1,island:1,desert:2,jungle:3,mountain:4,plateau:4};
  for(let idx=0;idx<cells.length;idx++){
    const ri=cells[idx],x=idx%cols,y=Math.floor(idx/cols),c=centers[ri];
    const match=terrainZone(visual[idx])===zone[terrain[ri]];
    const score=(match?10000:0)+dist[idx]*4-Math.hypot(x-c[0],y-c[1])/Math.sqrt(counts[ri]);
    if(score>scores[ri]){scores[ri]=score;out[ri]=[x,y];}
  }
  return out;
}
function regionCenters(cellRegion,cols,rows,n){ const cnt=new Array(n).fill(0),sx=new Array(n).fill(0),sy=new Array(n).fill(0); for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const ri=cellRegion[r*cols+c]; cnt[ri]++; sx[ri]+=c; sy[ri]+=r; } const out=[]; for(let i=0;i<n;i++) out.push([sx[i]/cnt[i],sy[i]/cnt[i]]); return out; }
function terrainModeAround(grid,cols,rows,idx,radius=2){
  const cx=idx%cols,cy=Math.floor(idx/cols),count=new Array(7).fill(0);
  for(let y=Math.max(0,cy-radius);y<=Math.min(rows-1,cy+radius);y++) for(let x=Math.max(0,cx-radius);x<=Math.min(cols-1,cx+radius);x++){
    const t=grid[y*cols+x]; if(t>=0&&t<7) count[t]++;
  }
  let best=0; for(let k=1;k<7;k++) if(count[k]>count[best]) best=k;
  return best;
}
// 地图原图会先被压缩到玩法网格，压缩时偶尔出现 1 格色簇噪点；一轮 3×3 众数滤波
// 只处理单格噪点，最大限度保留原图中的雪峰、礁石、绿洲等可见轮廓。
function smoothTerrainGrid(source,cols,rows){
  let grid=source.slice();
  for(let pass=0;pass<1;pass++){
    const next=grid.slice();
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const idx=y*cols+x, count=new Array(7).fill(0);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;
        if(nx>=0&&nx<cols&&ny>=0&&ny<rows) count[grid[ny*cols+nx]]++;
      }
      count[grid[idx]]+=2; // 保留细河、礁石等可见特征，只有明确被周围包住才消噪。
      let best=0; for(let t=1;t<7;t++) if(count[t]>count[best]) best=t;
      // 河道与海岸即使只有 1–2 格宽也有玩法意义；仅消除四周明确包围的单格噪点。
      next[idx]=count[grid[idx]]===3&&count[best]>=6?best:grid[idx];
    }
    grid=next;
  }
  return grid;
}

function terrainSeedQuota(grid,regionCount){
  const cells=new Array(7).fill(0), quota=new Array(7).fill(0), total=grid.length;
  for(const t of grid) cells[t]++;
  let used=0;
  for(let t=0;t<7;t++){
    if(!cells[t]) continue;
    quota[t]=Math.floor(cells[t]/total*regionCount);
    // 面积足以在底图上辨认的地貌至少有一个独立区域。
    if(quota[t]===0&&cells[t]>=Math.max(12,Math.floor(total*0.012))) quota[t]=1;
    used+=quota[t];
  }
  while(used>regionCount){
    let remove=-1,score=Infinity;
    for(let t=0;t<7;t++) if(quota[t]>1){ const s=cells[t]/total*regionCount-quota[t]; if(s<score){score=s;remove=t;} }
    if(remove<0) break; quota[remove]--; used--;
  }
  while(used<regionCount){
    let add=0,best=-Infinity;
    for(let t=0;t<7;t++) if(cells[t]){ const score=cells[t]/total*regionCount-quota[t]; if(score>best){best=score;add=t;} }
    quota[add]++; used++;
  }
  return quota;
}

// 分区边界看玩家能一眼辨认出的五类大景观：水域、普通陆地、沙漠、雨林、山地/雪原。
// 深浅水色和雪峰的岩面/积雪会在同一景观内自然连通，绝不会因为色阶变化被切成错误区域。
function terrainZone(t){ return t<=1?0:t===2?1:t===3?2:t===4?3:4; }

// 小于一个典型区域四分之一的孤立水塘、碎岩、色带不值得让一个领地跨越整片大陆去认领。
// 它们仍按原样显示在底图上，只在“区域边界寻路”时并入相邻大景观。
function absorbSmallZoneComponents(source,cols,rows,minSize){
  const out=source.slice(), seen=new Uint8Array(source.length), components=[],owner=new Int32Array(source.length);
  for(let start=0;start<source.length;start++){
    if(seen[start]) continue;
    const zone=source[start], cells=[start], border=new Array(5).fill(0); seen[start]=1;
    for(let head=0;head<cells.length;head++){
      const idx=cells[head],x=idx%cols,y=Math.floor(idx/cols);
      for(const [dx,dy] of DIRS){
        const nx=x+dx,ny=y+dy; if(nx<0||nx>=cols||ny<0||ny>=rows) continue;
        const ni=ny*cols+nx;
        if(source[ni]===zone){ if(!seen[ni]){seen[ni]=1;cells.push(ni);} }
        else border[source[ni]]++;
      }
    }
    const id=components.length;for(const idx of cells)owner[idx]=id;
    components.push({zone,cells});
  }
  for(const comp of components){
    if(comp.cells.length>=minSize)continue;
    const borders=new Map();for(const idx of comp.cells){const x=idx%cols,y=Math.floor(idx/cols);for(const [dx,dy]of DIRS){const nx=x+dx,ny=y+dy,ni=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows)continue;const neighbor=components[owner[ni]];if(neighbor.zone!==comp.zone&&neighbor.cells.length>comp.cells.length)borders.set(owner[ni],(borders.get(owner[ni])||0)+1);}}
    let into=-1,best=0;for(const [id,length]of borders)if(length>best){best=length;into=id;}
    if(into>=0)for(const idx of comp.cells)out[idx]=components[into].zone;
  }
  return out;
}

function farthestSeeds(grid,cols,rows,terrain,count){
  const cells=[];
  let sx=0,sy=0;
  for(let i=0;i<grid.length;i++) if(grid[i]===terrain){ cells.push(i); sx+=i%cols; sy+=Math.floor(i/cols); }
  if(!cells.length||!count) return [];
  const cx=sx/cells.length,cy=sy/cells.length, out=[];
  let first=cells[0],d0=Infinity;
  for(const idx of cells){ const dx=idx%cols-cx,dy=Math.floor(idx/cols)-cy,d=dx*dx+dy*dy; if(d<d0){d0=d;first=idx;} }
  // 每片可见岛屿、河段、雪峰优先有自己的种子，避免面积配额把小片地貌全部吞掉。
  const visited=new Uint8Array(grid.length),components=[];
  for(const start of cells){if(visited[start])continue;const q=[start];visited[start]=1;let sx2=0,sy2=0;
    for(let h=0;h<q.length;h++){const idx=q[h],x=idx%cols,y=Math.floor(idx/cols);sx2+=x;sy2+=y;for(const [dx,dy]of DIRS){const nx=x+dx,ny=y+dy,ni=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||grid[ni]!==terrain||visited[ni])continue;visited[ni]=1;q.push(ni);}}
    const cx2=sx2/q.length,cy2=sy2/q.length;let seed=q[0],dist=Infinity;for(const idx of q){const d=(idx%cols-cx2)**2+(Math.floor(idx/cols)-cy2)**2;if(d<dist){dist=d;seed=idx;}}
    components.push({size:q.length,seed});
  }
  components.sort((a,b)=>b.size-a.size);
  for(const c of components)if(out.length<count)out.push(c.seed);
  if(!out.length)out.push(first);
  while(out.length<count&&out.length<cells.length){
    let pickIdx=-1,best=-1;
    for(const idx of cells){
      if(out.includes(idx)) continue;
      let nearest=Infinity;
      for(const seed of out) nearest=Math.min(nearest,Math.abs(idx%cols-seed%cols)+Math.abs(Math.floor(idx/cols)-Math.floor(seed/cols)));
      if(nearest>best){best=nearest;pickIdx=idx;}
    }
    if(pickIdx<0) break;
    out.push(pickIdx);
  }
  return out;
}

// 具有跨地貌成本的多源 Dijkstra。区域始终连续，但会先填满自己的山体/海湾/沙丘，
// 只有没有同地貌格可扩张时才跨过明显边界。
function buildTerrainLayout(source,cols,rows,regionCount){
  const visualTerrain=smoothTerrainGrid(source,cols,rows);
  const zones=visualTerrain.map(terrainZone);
  let layoutZones=zones;
  let componentMin;
  for(let pass=0;pass<8;pass++){
    layoutZones=absorbSmallZoneComponents(layoutZones,cols,rows,Math.max(6,Math.floor(zones.length/regionCount*0.06))*2**pass);
    componentMin=countZoneComponents(layoutZones,cols,rows);
    if(componentMin.reduce((a,b)=>a+b,0)<=regionCount)break;
  }
  const quota=terrainSeedQuota(layoutZones,regionCount), seeds=[];
  // 配额先覆盖独立地貌，再把余量给面积更大的景观。河网多的图不能只有少数水域种子。
  for(let z=0;z<5;z++)while(quota[z]<componentMin[z]){
    let donor=-1;for(let k=0;k<5;k++)if(quota[k]>Math.max(1,componentMin[k])&&(donor<0||quota[k]-componentMin[k]>quota[donor]-componentMin[donor]))donor=k;
    if(donor<0)break;quota[donor]--;quota[z]++;
  }
  for(let terrain=0;terrain<5;terrain++) seeds.push(...farthestSeeds(layoutZones,cols,rows,terrain,quota[terrain]));
  // 容错：极小地图或极端掩码下补足种子，正常地图不会走到这里。
  for(let i=0;seeds.length<regionCount&&i<visualTerrain.length;i++) if(!seeds.includes(i)) seeds.push(i);
  const total=cols*rows, cellRegion=new Array(total).fill(-1), cost=new Float64Array(total); cost.fill(Infinity);
  const heap=[];
  const push=(item)=>{ heap.push(item); let i=heap.length-1; while(i){ const p=(i-1)>>1; if(heap[p][0]<=item[0]) break; heap[i]=heap[p]; i=p; } heap[i]=item; };
  const pop=()=>{ const top=heap[0],tail=heap.pop(); if(heap.length){ let i=0; while(i*2+1<heap.length){ let c=i*2+1; if(c+1<heap.length&&heap[c+1][0]<heap[c][0]) c++; if(heap[c][0]>=tail[0]) break; heap[i]=heap[c]; i=c; } heap[i]=tail; } return top; };
  for(let ri=0;ri<seeds.length;ri++){ const idx=seeds[ri]; cost[idx]=0; cellRegion[idx]=ri; push([0,idx,ri]); }
  while(heap.length){
    const [cur,idx,ri]=pop(); if(cur!==cost[idx]||cellRegion[idx]!==ri) continue;
    const x=idx%cols,y=Math.floor(idx/cols);
    for(const [dx,dy] of DIRS){
      const nx=x+dx,ny=y+dy; if(nx<0||nx>=cols||ny<0||ny>=rows) continue;
      const ni=ny*cols+nx;
      // 同一大景观内每格 10；跨过海岸、山脚、林线的成本为 1000。
      // 因此区域会遵循可见的地貌轮廓，而不是把水面与沙丘、林地拼在一起。
      const step=10+(layoutZones[ni]===layoutZones[idx]?0:1000);
      const next=cur+step;
      if(next<cost[ni]||(next===cost[ni]&&ri<cellRegion[ni])){ cost[ni]=next;cellRegion[ni]=ri;push([next,ni,ri]); }
    }
  }
  return {cellRegion,seeds,visualTerrain};
}

function countZoneComponents(grid,cols,rows){
  const counts=new Array(7).fill(0),seen=new Uint8Array(grid.length);
  for(let start=0;start<grid.length;start++){if(seen[start])continue;counts[grid[start]]++;const q=[start];seen[start]=1;for(let h=0;h<q.length;h++){const idx=q[h],x=idx%cols,y=Math.floor(idx/cols);for(const [dx,dy]of DIRS){const nx=x+dx,ny=y+dy,ni=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||seen[ni]||grid[ni]!==grid[start])continue;seen[ni]=1;q.push(ni);}}}
  return counts;
}

function directionName(center,cols,rows){
  const x=center[0]<cols/3?'西':center[0]>cols*2/3?'东':'';
  const y=center[1]<rows/3?'北':center[1]>rows*2/3?'南':'';
  return (y+x)||'中央';
}
function uniqueRegionName(base,used){
  if(!used.has(base)){ used.add(base); return base; }
  let n=2; while(used.has(base+'·'+n)) n++;
  const name=base+'·'+n; used.add(name); return name;
}
function buildRegionIdentities(mapId,terrain,centers,cols,rows){
  const out=new Array(terrain.length), free=new Set(terrain.map((_,i)=>i));
  const maxD=Math.max(6,Math.min(cols,rows)*0.30), maxD2=maxD*maxD;
  for(const landmark of MAP_LANDMARKS[mapId]||[]){
    let best=-1,bestD=Infinity;
    for(const i of free){
      if(!landmark.terrain.includes(terrain[i])) continue;
      const dx=centers[i][0]-landmark.x,dy=centers[i][1]-landmark.y,d=dx*dx+dy*dy;
      if(d<bestD){bestD=d;best=i;}
    }
    if(best>=0&&bestD<=maxD2){ out[best]={name:landmark.name,landmark:landmark.landmark}; free.delete(best); }
  }
  const used=new Set(out.filter(Boolean).map(x=>x.name));
  for(let i=0;i<terrain.length;i++) if(!out[i]){
    const terms=((MAP_TERMS[mapId]||MAP_TERMS.mega)[terrain[i]]||NAME_SUFFIX[terrain[i]]||NAME_SUFFIX.plain);
    const c=centers[i], term=terms[(i*5+Math.floor(c[0])*3+Math.floor(c[1])*7)%terms.length];
    const name=uniqueRegionName(directionName(c,cols,rows)+term,used);
    const marks=GENERIC_LANDMARKS[terrain[i]]||GENERIC_LANDMARKS.plain;
    out[i]={name,landmark:marks[(i+Math.floor(c[0])+Math.floor(c[1]))%marks.length]};
  }
  return out;
}

function pickSpread(n,k,centers,restrict){ const cand=restrict.size?[...restrict]:Array.from({length:n},(_,i)=>i); if(!cand.length) return []; const picked=[cand[Math.floor(Math.random()*cand.length)]]; while(picked.length<k&&picked.length<cand.length){ let best=-1,bestD=-1; for(const i of cand){ if(picked.includes(i)) continue; let d=Infinity; for(const j of picked){ const dx=centers[i][0]-centers[j][0],dy=centers[i][1]-centers[j][1]; d=Math.min(d,dx*dx+dy*dy); } if(d>bestD){ bestD=d; best=i; } } if(best<0) break; picked.push(best); } return picked; }

module.exports = { BattleRoom };
