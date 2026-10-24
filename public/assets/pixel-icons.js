/* 原创程序化像素 UI 图标，图形内容以 CC0 提供。16x16，硬边有限调色板。 */
(function(){
  'use strict';
  const cache={};
  function url(kind){
    if(cache[kind]) return cache[kind];
    const c=document.createElement('canvas');c.width=c.height=16;
    const g=c.getContext('2d'),ink='#211b19',paper='#fff5da',gold='#e5ad3c',sea='#5ea7aa';
    const p=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
    if(kind==='sword'){p(3,11,2,4,gold);p(1,10,6,2,ink);p(4,7,3,4,paper);p(7,4,3,4,paper);p(10,1,3,4,paper);p(5,10,2,2,gold);}
    else if(kind==='ship'){p(2,10,12,2,gold);p(4,12,8,2,ink);p(8,1,1,10,ink);p(3,3,5,6,paper);p(10,4,3,5,paper);p(1,14,5,1,sea);p(9,14,6,1,sea);}
    else if(kind==='flag'){p(3,1,2,14,ink);p(5,2,9,6,gold);p(11,8,3,2,gold);p(1,14,6,2,ink);}
    else if(kind==='compass'||kind==='fit'){p(4,1,8,2,gold);p(1,4,2,8,gold);p(13,4,2,8,gold);p(4,13,8,2,gold);p(7,3,2,9,ink);p(4,7,8,2,ink);p(7,3,2,4,paper);}
    else if(kind==='home'){p(7,1,2,2,gold);p(4,3,8,2,gold);p(2,5,12,3,gold);p(4,8,8,7,paper);p(7,10,3,5,ink);}
    else if(kind==='trophy'||kind==='crown'){p(3,2,3,7,gold);p(7,1,3,9,gold);p(11,2,3,7,gold);p(4,7,9,3,gold);p(6,10,4,3,ink);p(3,13,10,2,gold);}
    else if(kind==='shield'){p(2,2,12,9,ink);p(4,3,8,9,sea);p(6,12,4,3,sea);p(7,4,2,7,paper);p(5,7,6,2,paper);}
    else if(kind==='peace'){p(7,1,2,14,ink);p(9,2,5,6,paper);p(9,7,4,2,paper);p(4,14,7,1,gold);}
    else if(kind==='ally'){p(1,7,5,5,gold);p(10,7,5,5,sea);p(5,5,6,7,paper);p(7,7,3,2,ink);}
    else if(kind==='eye'){p(4,4,8,2,paper);p(1,6,14,4,paper);p(4,10,8,2,paper);p(6,5,4,6,sea);p(7,6,2,4,ink);}
    else if(kind==='accept'){p(2,8,3,3,sea);p(5,10,3,3,sea);p(8,7,3,4,sea);p(11,3,3,5,sea);}
    else if(kind==='reject'){p(3,3,3,3,gold);p(6,6,4,4,gold);p(10,10,3,3,gold);p(10,3,3,3,gold);p(3,10,3,3,gold);}
    else if(kind==='key'){p(2,2,7,7,gold);p(4,4,3,3,ink);p(8,7,2,5,gold);p(10,10,4,2,gold);p(12,12,2,2,gold);}
    else if(kind==='scroll'){p(2,2,11,12,paper);p(1,1,3,3,gold);p(12,12,3,3,gold);p(5,5,6,1,ink);p(5,8,5,1,ink);p(5,11,3,1,ink);}
    else if(kind==='sound'){p(1,6,4,5,ink);p(5,4,2,9,gold);p(7,2,2,13,gold);p(11,4,1,9,sea);p(13,6,1,5,sea);}
    else if(kind==='music'){p(5,2,9,2,ink);p(6,4,2,9,ink);p(12,4,2,7,ink);p(3,11,5,3,gold);p(9,9,5,3,gold);}
    else if(kind==='spark'){p(7,1,2,14,gold);p(1,7,14,2,gold);p(5,5,6,6,paper);p(7,6,2,4,gold);}
    else if(kind==='exit'){p(2,1,7,14,ink);p(4,3,5,10,paper);p(7,7,8,2,gold);p(12,5,2,6,gold);}
    else if(kind==='play'){p(4,2,2,12,ink);p(6,4,2,8,gold);p(8,6,2,4,gold);p(10,7,2,2,gold);}
    else{p(3,3,10,10,gold);p(5,5,6,6,paper);}
    const pixels=g.getImageData(0,0,16,16),outline=document.createElement('canvas');outline.width=outline.height=16;
    const og=outline.getContext('2d');og.fillStyle=ink;
    for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(pixels.data[(y*16+x)*4+3])og.fillRect(x-1,y-1,3,3);
    og.drawImage(c,0,0);
    return cache[kind]=outline.toDataURL('image/png');
  }
  window.PixelIcons={url,html:kind=>'<img class="pix-icon" alt="" aria-hidden="true" src="'+url(kind)+'">'};
})();
