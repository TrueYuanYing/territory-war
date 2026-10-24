# 测试说明

从仓库根目录执行。需要 Node.js 18+，先安装两组依赖：

```bash
npm ci --prefix server
npm ci
npm test
```

## 默认 16 项

`scripts/test.js` 先检查服务端、客户端内联脚本、测试与维护脚本语法，再依次运行：

- 13 项 `unit-*`：盟友、蒋介石、战斗表现、字体子集名称及原字形、甘地/高原虎、房主转移、ID 兼容、载入配置、本地启动器、地形分区、求和割让、技能与像素兵种。
- `static-assets-test.js`：页面引用素材存在。
- `terrain-mask-test.js`：地形蒙版与原图颜色关系。
- `verify-subset.js`：局内文本在原字体中可用的字形不能在 WOFF2 子集中丢失；系统 emoji 回退不是丢字失败。

默认测试不需要先启动游戏服务器。本地启动器测试会临时绑定回环随机端口；严格禁止本机网络的沙箱需授予测试所需权限。

原开发用 `tmp/` 测试已精选迁移。字体测试仅使用运行时文字，不把 README 当成游戏待显示文案；图像测试使用明确开发依赖，不依赖开发者本机临时工具目录。

## 需要本机服务的联机测试

先在一个终端运行 `npm start`，另一个终端从仓库根目录运行所需脚本：

```bash
node tests/reconnect-test.js
node tests/smoke-test.js
node tests/battle-test.js
node tests/rules-test.js
node tests/map7-test.js
node tests/map-test.js
node tests/region-layout-test.js
node tests/dedup-test.js
```

这些脚本针对 `localhost:8080`。大部分创建独立房间，不应直接拿去对公网生产服务施压。不要把多条需要服务、定时等待或随机对局的脚本输出混作一次可复现性能基准。

## 浏览器与实机

本包不附开发者私人 Playwright 环境或固定 Edge 安装路径。修改页面仍应实际验证五图单人开局、双人、非中心点选、战况定位、手机窄屏、刷新/断网重连和退出。

已有展示截图来自 2026-10-10 网页版 QA；GitHub 整理不代表完成低端手机长局实测，不等于微信/抖音 SDK 验收。
