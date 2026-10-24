# 来源与第三方许可

## 许可分层

项目自有代码和文字文档使用 [MIT](LICENSE)。自有地图、角色肖像设计及展示截图的范围见 [美术使用说明](ARTWORK_LICENSE.md)。用户于 2026-10-24 确认自有素材权属并授权公开；第三方字体、SDK 与已明确 CC0 的素材保留原许可。

本项目使用 AI 辅助编写、调试代码及制作部分程序化视觉内容，不作「全部完全人工编写」声明，也不将第三方作品称为本项目独家原创。

## 浏览器客户端 SDK

`public/vendor/colyseus.js` 是通过 esbuild 打包的本地客户端，不依赖外部 CDN。除 bundle 内的原有注释外，本仓库补存这些组件的许可证与版权声明：

| 组件 | 许可 | 随附文本 |
| --- | --- | --- |
| colyseus.js | MIT | [Colyseus client](licenses/colyseus-client-MIT.txt) |
| @colyseus/schema | MIT | [Colyseus schema](licenses/colyseus-schema-MIT.txt) |
| httpie | MIT | [httpie](licenses/httpie-MIT.txt) |
| ws | MIT | [ws](licenses/ws-MIT.txt) |

依赖版本以 `server/package-lock.json` 为准。其他通过 npm 安装的服务端、构建与测试依赖继续适用其包中各自的许可证，不因本仓库的 MIT 发生变更。

## 像素字体

字体为 TakWolf 的 [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)，现有源包标识为 `@fontpkg/fusion-pixel` 20220405.0.0；`public/assets/pxfont.ttf` 与现有项目源字体逐字节一致，`pxfont.woff2` 是游戏用字子集。历史许可保留了字体名 `Fusion Pixel`，因此公开的子集重命名为 `Territory War Pixel`；CSS 引用同步调整，原始 TTF 不改名、不改字形。

字体遵循 SIL Open Font License 1.1，随附 [许可全文](public/assets/FONT-LICENSE-OFL.txt)。本次从上游截至 2022-04-06 的历史许可提交取回文本；固定提交与来源记录在 [provenance](licenses/font-license-provenance.json)。未将字体改为 MIT。重命名前后对所有子集字形逐一比较轮廓和 advance，保持一致；不改变显示字形和玩法。维护工具在以后重新子集化时也会保留衍生名称与许可说明。

## Kenney 与程序化素材

Kenney 的 Pirate Pack 用于爆炸等图片，许可证为 CC0，见 [原始许可说明](public/assets/kenney-license.txt)。保留的旧舰船与炮车 PNG 也来自该素材包；当前兵种阵列主要使用程序化 24×24 像素帧。

`public/assets/sprites.js`、`tools/art/combat-sprites.js` 以及 `public/assets/pixel-icons.js` 内明确标为原创 CC0 的内容继续按 CC0 提供。本项目没有使用开罗游戏公司的原作素材；风格参考不代表与其存在合作或背书。

## 截图

`docs/screenshots/` 来自本项目 2026-10-10 已有网页版 QA：首页、大厅、桌面交战和手机战况定位。未将本地渲染或网页截图冒充微信/抖音上线证明，截图内容未重画，README 只调整显示尺寸。
