'use strict';
const assert=require('node:assert/strict');
require('../server/id-compat');
const {generateId}=require('../server/node_modules/@colyseus/core');
const ids=new Set();for(let i=0;i<2000;i++){const id=generateId(9);assert.match(id,/^[A-Za-z0-9_-]{9}$/);ids.add(id);}
assert.equal(ids.size,2000);
const nanoid=require('../server/node_modules/nanoid');assert.equal(typeof nanoid,'function');assert.equal(nanoid(16).length,16);assert.equal(nanoid.nanoid(16).length,16);
console.log('ID-COMPAT-OK: default and named exports, unique room IDs');
