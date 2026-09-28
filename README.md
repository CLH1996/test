# LUMIBRICKS 第三个页面 · Cloudflare Pages 静态版

`public/` 是可直接部署的静态网站目录，首页为 `public/index.html`。`cloudflare-pages-upload.zip` 的压缩包根目录也是 `index.html` 和 `assets/`，可直接用于 Cloudflare Pages 的拖放上传。

## 部署

在 Cloudflare 的 **Workers & Pages → Create application → Drag and drop your files** 中上传 `public/` 文件夹或 `cloudflare-pages-upload.zip`。也可以用 Wrangler 上传 `public/` 文件夹。Cloudflare Pages 会把根目录的 `index.html` 作为首页。

## 修改内容

- **图片**：`public/assets/` 中每个文件只对应页面中的一个图片位置。用同名、同格式的 1:1 图片覆盖即可；品牌 Logo 保持原比例。若更换格式，请同步修改 `content.json` 中对应 `media` 项的 `src`。
- **文案、图片说明、裁切位置、购买链接**：修改 `content.json`，在此目录运行 `node build.cjs`，再重新部署 `public/`。`snapshot` 字段只记录此次打包来源，不参与网页显示。
- **浏览器编辑**：部署后打开 `?edit=1`，可修改内容、保存本机草稿或导出完整 HTML。静态托管没有在线发布后台；要让访客看到浏览器里改好的版本，请把导出的文件改名为 `index.html`，重新上传。

这套文件包含打包时公开页面的已保存内容和图片。静态页面不调用原站的内容或图片接口。第一个和第二个页面不在此包内。

## Meta Pixel

页面使用像素 ID `585106496384924` 打开页面时记录 `PageView` 和 `ViewContent`；访客点击 5 个 Amazon 购买按钮时记录 Meta 标准事件 `Lead`。日夜切换、页内导航和编辑器操作不会记录为 `Lead`。可在 Meta Events Manager 的“测试事件”中验证；浏览器拦截追踪脚本时事件可能不会发送。

Cloudflare 官方说明：[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
