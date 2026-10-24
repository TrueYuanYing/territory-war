'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const cases=['unit-ally','unit-chiang','unit-combat-presenter','unit-font-name','unit-gandhi-tiger','unit-host-transfer','unit-id-compat','unit-loadout','unit-local-launcher','unit-map-layout','unit-peace-cession','unit-skills','unit-sprites','static-assets-test','terrain-mask-test','verify-subset'];
function run(args,timeout=30000){const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout});if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);if(result.error)throw result.error;if(result.status!==0)throw new Error('Command failed: '+args.join(' '));}
function syntax(dir){for(const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const relative=path.join(dir,item.name);if(item.isDirectory()){if(item.name!=='node_modules')syntax(relative);}else if(item.name.endsWith('.js'))run(['--check',relative]);}}
try {
  for(const dir of ['server','scripts','tests','tools'])syntax(dir);
  for(const file of ['local-launcher.js','public/assets/sprites.js','public/assets/pixel-icons.js'])run(['--check',file]);
  const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(script=>script.trim());
  if(!scripts.length)throw new Error('No frontend inline script found');
  for(const script of scripts)new vm.Script(script,{filename:'public/index.html:inline'});
  console.log('SYNTAX-OK: server, client, tests and maintenance scripts');
  for(const name of cases){run(['tests/'+name+'.js'],60000);console.log('PASS '+name);}
  console.log('TESTS '+cases.length+'/'+cases.length+' passed');
} catch(error) {console.error(error.message);process.exitCode=1;}
