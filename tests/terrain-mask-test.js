// 地图原图与 terrain 掩码一致性回归：防止雪原再被标成雨林/海洋，混合图雪区再被标成丛林。
const fs = require('fs');
const { PNG } = require('pngjs');

const MAPS = { snow:[64,36], desert:[64,36], mega:[96,96] };
function fail(msg){ console.error('TERRAIN-MASK-FAIL:',msg); process.exitCode=1; }
function averageByCode(id, cols, rows){
  const png=PNG.sync.read(fs.readFileSync(`public/assets/maps/${id}.png`));
  const grid=JSON.parse(fs.readFileSync(`terrain-${id}.json`,'utf8'));
  if(grid.length!==cols*rows) fail(`${id} grid length ${grid.length}`);
  const sum=Array.from({length:7},()=>[0,0,0,0]);
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const code=grid[r*cols+c],x0=Math.floor(c*png.width/cols),x1=Math.max(x0+1,Math.floor((c+1)*png.width/cols)),y0=Math.floor(r*png.height/rows),y1=Math.max(y0+1,Math.floor((r+1)*png.height/rows));
    for(let y=y0;y<y1;y+=2) for(let x=x0;x<x1;x+=2){ const p=(y*png.width+x)*4,a=sum[code]; a[0]+=png.data[p];a[1]+=png.data[p+1];a[2]+=png.data[p+2];a[3]++; }
  }
  return { grid, avg:sum.map(a=>a[3]?[Math.round(a[0]/a[3]),Math.round(a[1]/a[3]),Math.round(a[2]/a[3])]:null) };
}
const snow=averageByCode('snow',...MAPS.snow);
const mega=averageByCode('mega',...MAPS.mega);
const desert=averageByCode('desert',...MAPS.desert);
const count=(g,k)=>g.filter(v=>v===k).length;
if(count(snow.grid,4)!==0) fail('snow contains jungle cells');
if(!(count(snow.grid,6)>1200 && snow.avg[6][0]>170 && snow.avg[6][1]>170)) fail('snow plateau does not cover the bright snow pixels');
if(!(snow.avg[1] && snow.avg[1][2]<190)) fail('snow sea does not map to the blue-gray water pixels');
if(count(mega.grid,1)!==0) fail('mega retains the old dark-olive-as-sea mapping');
if(!(count(mega.grid,6)>700 && mega.avg[6][0]>190 && mega.avg[6][1]>200 && mega.avg[6][2]>200)) fail('mega bright snow is not plateau');
if(!(count(mega.grid,4)>800 && mega.avg[4][0]<150 && mega.avg[4][1]<140)) fail('mega dark olive is not jungle');
if(!(count(mega.grid,3)>3000 && desert.avg[3][0]>180 && desert.avg[3][1]>130)) fail('desert tones are not retained as desert');
console.log('TERRAIN-MASK-OK',JSON.stringify({snow:{sea:count(snow.grid,1),plateau:count(snow.grid,6)},mega:{deep:count(mega.grid,0),plain:count(mega.grid,2),desert:count(mega.grid,3),jungle:count(mega.grid,4),plateau:count(mega.grid,6)},desert:{deep:count(desert.grid,0),sea:count(desert.grid,1),desert:count(desert.grid,3)}}));
