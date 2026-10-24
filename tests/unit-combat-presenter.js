'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(require.resolve('../public/index.html'),'utf8');
function section(start,end){return src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));}
let now=1000;
const c={performance:{now:()=>now},state:{regions:[{owner:1,garrison:100}]},troopSnapshots:[],hitRegions:new Map(),battlePoses:new Map(),fallenUnits:[],clamp:(n,a,b)=>Math.max(a,Math.min(n,b)),view:{zoom:.3}};
vm.createContext(c);vm.runInContext(section('function recordCombatHits(){','function updateCombatStatus(){'),c);
c.recordCombatHits();assert.equal(c.hitRegions.size,0,'first snapshot is not a hit');
c.state.regions[0].garrison=90;c.recordCombatHits();assert.equal(c.hitRegions.get(0),1130,'authoritative loss flashes');
c.hitRegions.clear();c.state.regions[0].garrison=105;c.recordCombatHits();assert.equal(c.hitRegions.size,0,'recruitment is not a hit');
c.state.regions[0]={owner:2,garrison:2};c.recordCombatHits();assert.equal(c.hitRegions.size,0,'ownership change is not fake damage');
const pose={region:0,progress:100,atkColor:'#f00',defColor:'#00f',defType:'shield',dx:1,dy:2,flip:false};
c.battlePoses.set('0|1',pose);c.settleCombatPose({kind:'battleLost',region:0,color:'#f00'});assert.equal(c.fallenUnits.length,0,'retreat is not death');
c.battlePoses.set('0|1',pose);c.settleCombatPose({kind:'conquer',region:0,color:'#f00'});assert.equal(c.fallenUnits.length,1);assert.equal(c.fallenUnits[0].color,'#00f','only defeated defender');
c.battlePoses.set('0|1',{...pose,progress:0});c.settleCombatPose({kind:'conquer',region:0,color:'#f00'});assert.equal(c.fallenUnits.length,1,'peace cession is not a battlefield death');
vm.runInContext(section('function unitSize(','function drawUnit('),c);assert(c.unitSize('infantry')*c.view.zoom>=18);assert(c.unitSize('ship',true)*c.view.zoom>=32);
console.log('COMBAT-PRESENTER-OK state loss / no recruitment flash / retreat / defeat / screen-readable units');
