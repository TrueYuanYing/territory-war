# 项目维护约定

## 项目与入口

- `server/Room.js`：权威房间状态、地图、战斗、AI、外交与胜负。
- `public/index.html`：Canvas 客户端、交互与重连。
- `public/assets/`：像素帧、图标、地图与字体；许可见根目录说明。
- `terrain-*.json`：五图地形蒙版。`local-launcher.js` 提供 Windows 本地入口。

## 常用命令

```bash
npm ci --prefix server
npm ci
npm start
npm test
```

测试须在仓库根目录执行。依赖只从正常 npm registry 安装，不复制开发者私有工具目录。

## 不变约束

- Room.js 的 schema 与前端字段同步。新增地图须同时更新服务端 `MAPS`、客户端 `GAME_MAPS` 和地形导入工具的注册项；当前公开包不含旧临时导图流水线。
- 己方/敌方区域内任意位置都可点选，不要求点中心。求和请求不阻断正常进攻。
- 保留领地玩法、服务端校验、人机决策节奏以及墨黑/奶油纸/琥珀金配色。
- 前端强刷生效，服务端修改需重启；内存房间不能跨进程重启恢复。
- 禁止提交密钥、`.env`、CLI 授权缓存、SSH 文件、私人申请材料、日志及 `node_modules`。
- 不因修改代码而擅自部署、扩缩云实例、改收费或变更公开范围。

## 素材维护

`tools/art/combat-sprites.js` 是当前兵种源，执行 `npm run sprites:build` 同步浏览器帧。原浏览器文件头保留历史 `tmp/` 路径作来源记录，维护时使用本目录的公开工具。

若新增局内文字，运行 `npm run font:build` 和 `npm run font:check`，保持原字体可用字形不丢失。README 文案不是局内文字，不必为文档单独扩大字体子集。

## 验证与记录

修改后执行 `npm test`；网络行为改动另跑 `tests/README.md` 中对应集成测试。修改界面还需实际浏览器及手机验证。记录测量条件与限制，不把绘制调用下降说成 FPS 同比例提升，也不承诺永不断线或绝不卡。
