'use strict';
const assert=require('node:assert/strict'),{BattleRoom}=require('../server/Room');
function create(){const r=new BattleRoom();for(const k of ['setSimulationInterval','onMessage','broadcast','lock','unlock','disconnect','setMetadata'])r[k]=()=>{};r.onCreate({code:'123456'});r.onJoin({sessionId:'A'},{clientId:'A',name:'甲',leader:'sun'});return r;}
(async()=>{
 const r=create();r.onJoin({sessionId:'B'},{clientId:'B',name:'乙',leader:'sun'});r.handleAddAI({sessionId:'A'},{difficulty:'easy'});r.handleStart({sessionId:'A'},{map:'island'});await r.onLeave({sessionId:'A'},true);assert.equal(r.state.hostId,1,'remaining human must inherit host');r.state.phase='over';r.handleRematch({sessionId:'B'});assert.equal(r.state.phase,'playing','remaining host can rematch');
 const lobby=create();lobby.handleAddAI({sessionId:'A'},{difficulty:'easy'});lobby.onJoin({sessionId:'B'},{clientId:'B',name:'乙',leader:'sun'});await lobby.onLeave({sessionId:'A'},true);assert.equal(lobby.state.hostId,2,'lobby host must skip earlier AI');lobby.handleStart({sessionId:'B'},{map:'island'});assert.equal(lobby.state.phase,'playing');
 const returning=create();returning.handleAddAI({sessionId:'A'},{difficulty:'easy'});returning.handleStart({sessionId:'A'},{map:'island'});await returning.onLeave({sessionId:'A'},true);assert.equal(returning.state.hostId,-1);returning.onJoin({sessionId:'A2'},{clientId:'A'});assert.equal(returning.state.hostId,0,'returning human must claim vacant host');
 console.log('HOST-TRANSFER-OK: playing, lobby and returning seat');process.exit(0);
})().catch(e=>{console.error(e.stack);process.exit(1);});
