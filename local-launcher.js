'use strict';
const http=require('node:http'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
function accessUrls(interfaces,port){
  const entries=Object.entries(interfaces).sort(([a],[b])=>Number(/WLAN|Wi-Fi|无线/i.test(b))-Number(/WLAN|Wi-Fi|无线/i.test(a)));
  const phones=[];
  for(const [name,addresses]of entries){
    if(/vEthernet|virtual|loopback|vmware|wsl|docker|bluetooth|tun|tap|vpn/i.test(name))continue;
    for(const a of addresses||[])if(a.family==='IPv4'&&!a.internal&&!phones.includes('http://'+a.address+':'+port))phones.push('http://'+a.address+':'+port);
  }
  return {computer:'http://localhost:'+port,phones};
}
function get(port,url){return new Promise((resolve,reject)=>{const req=http.get({hostname:'127.0.0.1',port,path:url,timeout:2000,agent:false},res=>{let body='';res.on('data',d=>{body+=d;if(body.length>250000)req.destroy(new Error('response too large'));});res.on('error',reject);res.on('end',()=>resolve({status:res.statusCode,body}));});req.on('timeout',()=>req.destroy(new Error('timeout')));req.on('error',reject);});}
async function inspectService(port){
  try{const v=await get(port,'/version');let json;try{json=JSON.parse(v.body);}catch{return 'other';}
    if(v.status!==200||!/^[a-f0-9]{16}$/.test(json.release||''))return 'other';
    const h=await get(port,'/healthz'),page=await get(port,'/');
    return h.status===200&&h.body==='ok'&&page.status===200&&page.body.includes('海岛争霸')&&page.body.includes('id="btn-create"')?'game':'other';
  }catch(e){return e.code==='ECONNREFUSED'?'absent':'other';}
}
function printUrls(urls){
  console.log('\n电脑（本机）请打开： '+urls.computer);
  console.log('电脑请用 localhost；不要用手机 IP，以免被本机代理转发。');
  if(urls.phones.length)for(const url of urls.phones)console.log('手机（同一 Wi-Fi）入口： '+url);
  else console.log('没有检测到物理局域网 IPv4，请先连接 Wi-Fi。');
  console.log('手机打不开时检查同网、访客网络隔离和 TCP 端口；不要关闭防火墙。');
}
function openComputer(url){if(process.platform==='win32'){const child=spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'});child.on('error',()=>console.log('请手动打开上面的电脑入口。'));}}
async function main(){
  const port=Number(process.env.PORT||8080);if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT 必须是 1–65535 的整数');
  const urls=accessUrls(os.networkInterfaces(),port),status=await inspectService(port);printUrls(urls);
  if(process.argv.includes('--probe')){console.log('服务检查： '+status);return;}
  if(status==='other')throw Error('端口 '+port+' 已被其他服务占用或健康检查异常；未终止任何进程。');
  if(status==='game'){console.log('游戏已经运行，无需重复启动。请保留原服务器窗口。');if(process.argv.includes('--open'))openComputer(urls.computer);return;}
  const child=spawn(process.execPath,[path.join(__dirname,'server/index.js')],{cwd:path.join(__dirname,'server'),env:{...process.env,PORT:String(port)},stdio:'inherit',windowsHide:true});
  child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code||0;});
  for(let i=0;i<40;i++){if(child.exitCode!==null)return;await new Promise(r=>setTimeout(r,250));if(await inspectService(port)==='game'){console.log('游戏已就绪。关闭服务器窗口会停止本地对局。');if(process.argv.includes('--open'))openComputer(urls.computer);return;}}
  console.error('等待启动超时，请查看上面的服务器错误；没有更改代理或防火墙。');
}
module.exports={accessUrls,inspectService};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
