'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {BattleRoom}=require('../server/Room');
const group=[0,0,1,2,3,4,4],zone={deep:0,sea:0,plain:1,coast:1,island:1,desert:2,jungle:3,mountain:4,plateau:4};
for(const n of [2,6,10])for(const map of ['island','jungle','snow','desert','mega']){
  const r=new BattleRoom();for(const k of ['setSimulationInterval','onMessage','broadcast','lock','disconnect','setMetadata'])r[k]=()=>{};
  r.onCreate({code:'123456'});for(let i=0;i<n;i++)r.onJoin({sessionId:'s'+i},{clientId:'c'+i,name:'P'+i,leader:'sun'});r.handleStart({sessionId:'s0'},{map});
  const s=r.state,raw=JSON.parse(fs.readFileSync('terrain-'+map+'.json','utf8')),cells=Array.from(s.cellRegion),buckets=Array.from({length:s.regionCount},()=>[]);
  cells.forEach((ri,i)=>{assert(ri>=0&&ri<s.regionCount);buckets[ri].push(i);});let sum=0,min=1,matchedCells=0;
  for(let ri=0;ri<s.regionCount;ri++){
    const reg=s.regions[ri],bucket=buckets[ri],anchor=reg.anchorY*s.mapCols+reg.anchorX;
    assert(bucket.length);assert.equal(cells[anchor],ri,'anchor must be inside '+map+'/'+reg.name);
    const visited=new Set([bucket[0]]),queue=[bucket[0]];
    for(let j=0;j<queue.length;j++){const idx=queue[j],x=idx%s.mapCols,y=Math.floor(idx/s.mapCols);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*s.mapCols+nx;if(nx<0||nx>=s.mapCols||ny<0||ny>=s.mapRows||cells[k]!==ri||visited.has(k))continue;visited.add(k);queue.push(k);}}
    assert.equal(visited.size,bucket.length,'region must remain connected');
    const counts=[0,0,0,0,0];for(const idx of bucket)counts[group[raw[idx]]]++;
    assert.equal(counts[zone[reg.terrain]],Math.max(...counts),'label must describe the dominant visible terrain');
    const correct=counts[zone[reg.terrain]],purity=correct/bucket.length;sum+=purity;min=Math.min(min,purity);matchedCells+=correct;
  }
  const mean=sum/s.regionCount,weighted=matchedCells/cells.length;console.log(map+' players='+n+' mean='+Math.round(mean*100)+'% area='+Math.round(weighted*100)+'% min='+Math.round(min*100)+'% anchors=OK');
  // 超大原画的小绿洲/林缘包含三种景观，按面积与最大类校验，不把相对多数误当成绝对多数。
  assert(mean>=(map==='mega'?.85:.90),'region-weighted terrain accuracy');assert(weighted>=(map==='mega'?.85:.90),'area-weighted terrain accuracy');
}
console.log('MAP-ANCHOR-CONNECTIVITY-PURITY-OK');process.exit(0);
