'use strict';
const assert=require('node:assert/strict'),http=require('node:http');
const {accessUrls,inspectService}=require('../local-launcher');
assert.deepEqual(accessUrls({WLAN:[{family:'IPv4',internal:false,address:'10.1.2.3'}],'vEthernet (Default Switch)':[ {family:'IPv4',internal:false,address:'172.27.32.1'}],loopback:[{family:'IPv4',internal:true,address:'127.0.0.1'}]},8080),{computer:'http://localhost:8080',phones:['http://10.1.2.3:8080']});
assert.equal(accessUrls({},8080).phones.length,0);
(async()=>{
 const server=http.createServer((req,res)=>{res.end(req.url==='/version'?JSON.stringify({release:'0123456789abcdef'}):req.url==='/healthz'?'ok':'海岛争霸 <button id="btn-create">');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 try{assert.equal(await inspectService(port),'game');server.removeAllListeners('request');server.on('request',(req,res)=>{res.end('different app');});assert.equal(await inspectService(port),'other');}
 finally{await new Promise(r=>server.close(r));}assert.equal(await inspectService(port),'absent');console.log('LOCAL-LAUNCHER-OK localhost / physical LAN / existing game / occupied port / stopped service');
})().catch(e=>{console.error(e);process.exit(1);});
