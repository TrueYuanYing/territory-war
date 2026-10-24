// 原创 CC0 像素兵种：统一 24×24、大头比例、墨色描边、奶油帆和阵营色。
// 所有武器默认向右；浏览器只镜像整帧，不混用另一套舰船/炮车素材。
'use strict';
function frame(type,anim,i){
  const a=Array.from({length:24},()=>Array(24).fill('.'));
  const dot=(x,y,c)=>{if(x>=0&&y>=0&&x<24&&y<24)a[y][x]=c;};
  const rect=(x,y,w,h,c)=>{for(let r=y;r<y+h;r++)for(let k=x;k<x+w;k++)dot(k,r,c);};
  const line=(x,y,xx,yy,c)=>{const n=Math.max(Math.abs(xx-x),Math.abs(yy-y));for(let j=0;j<=n;j++)dot(Math.round(x+(xx-x)*j/(n||1)),Math.round(y+(yy-y)*j/(n||1)),c);};
  const bob=anim==='idle'?i:anim==='walk'?(i%2?-1:0):0;
  const thrust=anim==='attack'?[0,1,2,0][i]:anim==='hit'?-1:0;
  const head=(x,y,small=false)=>{
    const w=small?8:10;rect(x,y,w,8,'k');rect(x+1,y+2,w-2,5,'s');rect(x+1,y+6,w-2,1,'f');
    rect(x,y,w,3,'a');rect(x+1,y,w-2,1,'c');dot(x+w-2,y+4,'p');dot(x+w-4,y+4,'p');dot(x+w-2,y+6,'f');
  };
  if(type==='ship'){
    rect(12,2+bob,1,13,'k');rect(13,2+bob,6,3,'a');rect(13,2+bob,4,1,'c');
    rect(13,6+bob,7,7,'k');rect(14,6+bob,5,6,'e');rect(14,11+bob,5,1,'g');
    rect(2,13+bob,19,3,'k');rect(3,14+bob,17,4,'a');rect(3,14+bob,17,1,'c');
    rect(5,18+bob,14,2,'k');rect(5,17+bob,14,1,'b');rect(7,16+bob,2,1,'y');rect(13,16+bob,2,1,'y');
    head(3,5+bob,true);rect(5,12+bob,5,2,'a');rect(17+thrust,12+bob,5,2,'k');
    line(2,21,7+i%2,21,'g');line(12-i%2,22,20,22,'g');
  }else if(type==='cannon'){
    head(2,3+bob,true);rect(4,11+bob,5,5,'k');rect(5,11+bob,3,4,'a');rect(8,12+bob,3,2,'s');
    rect(9+thrust,10,12,5,'k');rect(10+thrust,11,9,2,'G');rect(10+thrust,11,9,1,'g');
    rect(8,15,12,3,'W');rect(9,15,10,1,'w');
    for(const x of [9,17]){rect(x,17,4,4,'k');rect(x+1,18,2,2,'y');dot(x+2,19,'W');}
    rect(4+(anim==='walk'?i%2:0),17,3,4,'k');
  }else{
    const x=6+thrust,y=3+bob;
    head(x,y);
    if(type==='infantry'){rect(x-2,y+1,2,3,'a');rect(x+2,y+4,3,1,'k');dot(x+6,y+4,'e');}
    if(type==='archer'){line(x+1,y,x-1,y-2,'e');dot(x-2,y-2,'y');rect(x+1,y-1,7,2,'b');}
    if(type==='shield'){rect(x-1,y-1,12,3,'k');rect(x,y-1,10,1,'a');rect(x+4,y-2,2,3,'y');}
    rect(x+1,y+8,8,6,'k');rect(x+2,y+8,6,4,'a');rect(x+2,y+8,2,3,'c');rect(x+2,y+12,6,1,'m');dot(x+5,y+12,'y');
    rect(x-1,y+9,2,3,'k');rect(x,y+9,1,2,'s');rect(x+9,y+9,2,3,'s');
    const step=anim==='walk'?[0,1,0,-1][i]:0;
    rect(x+2-step,17+bob,3,4,'k');rect(x+6+step,17+bob,3,4,'k');rect(x+2-step,17+bob,2,2,'b');rect(x+6+step,17+bob,2,2,'b');
    if(type==='infantry'){
      const swing=anim==='attack'&&i===1;
      line(x+10,y+11,x+14,y+(swing?6:0),'k');line(x+11,y+10,x+14,y+(swing?7:1),'g');
      dot(x+14,y+(swing?6:0),'e');rect(x+9,y+10,3,1,'y');
      if(anim==='attack'&&i===2){line(17,9,22,13,'e');dot(22,11,'y');}
    }else if(type==='archer'){
      line(20,8+bob,22,12+bob,'k');line(22,12+bob,20,17+bob,'k');line(19,8+bob,21,12+bob,'w');line(21,12+bob,19,17+bob,'w');line(19,9+bob,19,16+bob,'y');
      if(anim==='attack'&&(i===1||i===2)){line(14,12+bob,23,12+bob,'g');dot(22,11+bob,'e');dot(22,13+bob,'e');}
    }else{
      rect(14+thrust,11+bob,8,8,'k');rect(15+thrust,12+bob,6,6,'g');rect(16+thrust,13+bob,4,4,'a');rect(17+thrust,13+bob,2,4,'y');rect(16+thrust,14+bob,4,1,'y');rect(16+thrust,19+bob,4,1,'k');
    }
  }
  if(anim==='attack'&&(type==='cannon'||type==='ship')){if(i===1){rect(21,10,2,6,'y');rect(20,12,4,2,'e');}else if(i===2){rect(21,9,2,2,'g');dot(23,7,'e');}}
  if(anim==='hit'&&i===0){for(let y=0;y<24;y++)for(let x=0;x<24;x++)if('sfgG'.includes(a[y][x]))a[y][x]='e';}
  return a.map(r=>r.join(''));
}
function fallen(base,i){
  const a=Array.from({length:24},()=>Array(24).fill('.')),angle=[.3,.8,Math.PI/2][i];
  for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(base[y][x]!=='.'){
    const xx=Math.round(12+(x-12)*Math.cos(angle)-(y-12)*Math.sin(angle));
    const yy=Math.round(15+((x-12)*Math.sin(angle)+(y-12)*Math.cos(angle))*.55);
    if(xx>=0&&xx<24&&yy>=0&&yy<24)a[yy][xx]=base[y][x];
  }
  return a.map(r=>r.join(''));
}
const SPRITES={};
for(const type of ['infantry','archer','shield','cannon','ship']){
  SPRITES[type]={};for(const [anim,n] of Object.entries({idle:2,walk:4,attack:4,hit:2}))SPRITES[type][anim]=Array.from({length:n},(_,i)=>frame(type,anim,i));
  SPRITES[type].death=Array.from({length:3},(_,i)=>fallen(SPRITES[type].idle[0],i));
}
module.exports={SPRITES};
