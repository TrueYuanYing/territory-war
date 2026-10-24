'use strict';
// Colyseus 0.15 使用 nanoid 2 的 callable default export；3.x 改为 named export。
// 只桥接 CJS 导出形状，保留上游修补版算法和所有 named exports；不改第三方文件。
const path=require.resolve('nanoid'),modern=require(path);
if(typeof modern!=='function'){
  const compatible=Object.assign(modern.nanoid,modern);
  require.cache[path].exports=compatible;
}
