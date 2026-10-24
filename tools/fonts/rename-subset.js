'use strict';
// Change only SFNT naming/author metadata, preserving font outlines and metrics.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const fontverter=require('fontverter'),fontkit=require('fontkit');
const FAMILY='Territory War Pixel';
function tables(buffer){const result=[];for(let i=0;i<buffer.readUInt16BE(4);i++){const pos=12+i*16,start=buffer.readUInt32BE(pos+8),length=buffer.readUInt32BE(pos+12);result.push({tag:buffer.toString('ascii',pos,pos+4),data:Buffer.from(buffer.subarray(start,start+length))});}return result;}
function checksum(buffer){let sum=0;for(let i=0;i<buffer.length;i+=4){let word=0;for(let j=0;j<4;j++)word=(word*256+(buffer[i+j]||0))>>>0;sum=(sum+word)>>>0;}return sum;}
function naming(data){
  assert.equal(data.readUInt16BE(0),0,'Only format-0 name tables are supported');
  const count=data.readUInt16BE(2),base=data.readUInt16BE(4),records=[];
  const values={1:FAMILY,2:'Regular',3:'TerritoryWarPixelSubset-Regular;1.0',4:FAMILY,6:'TerritoryWarPixelSubset-Regular',16:FAMILY,17:'Regular',21:FAMILY,22:'Regular'};
  for(let i=0;i<count;i++){
    const p=6+i*12,platform=data.readUInt16BE(p),length=data.readUInt16BE(p+8),offset=data.readUInt16BE(p+10),id=data.readUInt16BE(p+6);
    const record=Buffer.from(data.subarray(p,p+12));
    const text=values[id];
    const bytes=text===undefined?Buffer.from(data.subarray(base+offset,base+offset+length)):
      platform===0||platform===3?Buffer.from(text,'utf16le').swap16():Buffer.from(text,'latin1');
    records.push({record,bytes});
  }
  const additions={0:'Copyright (c) 2022 TakWolf. Subset naming by TrueYuanYing, 2026.',13:'SIL Open Font License 1.1. Derived from Fusion Pixel; original Reserved Font Name: Fusion Pixel. See the accompanying FONT-LICENSE-OFL.txt.',14:'https://openfontlicense.org'};
  for(const [id,text]of Object.entries(additions)){
    const record=Buffer.alloc(12);record.writeUInt16BE(3,0);record.writeUInt16BE(1,2);record.writeUInt16BE(0x409,4);record.writeUInt16BE(Number(id),6);
    records.push({record,bytes:Buffer.from(text,'utf16le').swap16()});
  }
  const header=Buffer.alloc(6);header.writeUInt16BE(records.length,2);header.writeUInt16BE(6+records.length*12,4);
  let offset=0;for(const item of records){item.record.writeUInt16BE(item.bytes.length,8);item.record.writeUInt16BE(offset,10);offset+=item.bytes.length;}
  assert(offset<65536,'Name table string storage limit');
  return Buffer.concat([header,...records.map(item=>item.record),...records.map(item=>item.bytes)]);
}
async function renameSubset(input){
  const original=fontkit.create(input),sfnt=await fontverter.convert(input,'sfnt'),entries=tables(sfnt);
  for(const item of entries)if(item.tag==='name')item.data=naming(item.data);else if(item.tag==='head')item.data.writeUInt32BE(0,8);
  const headerSize=12+entries.length*16,total=entries.reduce((sum,item)=>sum+((item.data.length+3)&~3),headerSize),out=Buffer.alloc(total);
  sfnt.copy(out,0,0,12);let cursor=headerSize,head=0;
  entries.forEach((item,i)=>{const p=12+i*16;out.write(item.tag,p,4,'ascii');out.writeUInt32BE(checksum(item.data),p+4);out.writeUInt32BE(cursor,p+8);out.writeUInt32BE(item.data.length,p+12);item.data.copy(out,cursor);if(item.tag==='head')head=cursor;cursor+=(item.data.length+3)&~3;});
  assert(head);out.writeUInt32BE((0xB1B0AFBA-checksum(out))>>>0,head+8);
  const result=await fontverter.convert(out,'woff2'),renamed=fontkit.create(result);
  assert.equal(renamed.familyName,FAMILY);assert.deepEqual(renamed.characterSet,original.characterSet);
  for(const code of original.characterSet){const a=original.glyphForCodePoint(code),b=renamed.glyphForCodePoint(code);assert.equal(a.advanceWidth,b.advanceWidth);assert.equal(a.path.toSVG(),b.path.toSVG());}
  return result;
}
module.exports={renameSubset};
if(require.main===module){const file=path.resolve(__dirname,'../../public/assets/pxfont.woff2');renameSubset(fs.readFileSync(file)).then(result=>{fs.writeFileSync(file,result);console.log('FONT-RENAMED: '+FAMILY+'; outlines and advances unchanged');}).catch(error=>{console.error(error.message);process.exitCode=1;});}
