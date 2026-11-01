# 未完成的世界 · 绘桥之章

使用 Vite、TypeScript、Three.js 与 Rapier 构建的单关卡可玩原型。

## 运行

需要 Node.js 22.12+（已验证 Node 24）。

```sh
npm ci
npm run dev -- --port 5173
```

构建：`npm run build`。生产预览：`npm run preview`。

## Windows 本地运行（PowerShell / Windows Terminal）

1. 从 https://nodejs.org/ 安装 **Node.js 24 LTS**（包含 npm）。安装后重新打开终端。
2. 将 ZIP **完整解压**到本地目录，例如 `C:\Games\unfinished-world`。不要在压缩包内直接运行文件。
3. 打开 PowerShell，进入包含 `package.json` 的项目文件夹：

   ```powershell
   cd "C:\Games\unfinished-world"
   node --version
   npm.cmd --version
   npm.cmd ci
   npm.cmd run dev -- --port 5173
   ```

   如果解压后多了一层 `unfinished-world` 文件夹，先进入该层再执行命令。
4. 保持终端运行，用 Chrome 或 Edge 打开 **http://localhost:5173/**。如果端口被占用，Vite 会打印实际使用的地址，请以终端为准。
5. 停止服务器：在终端按 `Ctrl+C`。下次运行只需进入项目目录，再执行 `npm.cmd run dev -- --port 5173`，不必重复安装依赖。

这里使用 `npm.cmd`，避免 PowerShell 的脚本执行策略阻止 `npm.ps1`，不需要降低系统执行策略。安装依赖需要联网访问 npm；运行无需 API 密钥、数据库或额外美术文件。请勿双击 `index.html` 直接启动，游戏需要 Vite 提供模块和 WebAssembly 加载服务。

### Windows 构建与生产预览

```powershell
npm.cmd run build
npm.cmd run preview -- --port 4173
```

然后打开终端打印的地址（通常为 http://localhost:4173/）。构建结果位于 `dist`。

### 常见问题

- 找不到 `node` 或 `npm.cmd`：重新安装 Node.js，确保添加到 PATH，关闭并重新打开终端。
- `npm ci` 失败：先检查网络及 Node 版本；保留 `package-lock.json`，不要为绕过安装错误关闭 TLS 验证。
- 画面空白或提示 WebGL 不可用：使用最新版 Chrome/Edge，启用浏览器图形加速并更新显卡驱动。
- 角色不动：先点击游戏场景让网页获得焦点，再使用 WASD；桥板高出地面，需要按空格跳上去。

Windows 步骤为本地操作说明；当前构建和浏览器测试在 Linux 云环境中执行，未在 Windows 实机验证。仓库中的 Playwright 配置使用 Linux 的 `/usr/bin/chromium`，仅运行游戏不需要配置测试浏览器；在 Windows 跑自动化测试时，应先执行 `npx.cmd playwright install chromium`，并将 `playwright.config.ts` 中的 `executablePath` 删除，让 Playwright 使用其安装的浏览器。

## ZIP 包内容

包含 `package.json`、`package-lock.json`、`index.html`、TypeScript 配置、`src/` 全部源码、Playwright 配置与 `tests/`。角色、场景、材质均由源码程序化生成；Rapier 的 WASM 随 npm 依赖安装，不存在遗漏的外部贴图、模型或音频资源。

不包含 `.git`、`node_modules`、`dist`、测试截图和临时输出。依赖通过 `npm ci` 按锁文件恢复。

## 操作与通关

- WASD / 方向键移动（沿场景世界轴），空格跳跃，E 进入绘画。
- 绘画时物理暂停，主画布旁保留缩小的场景。按住鼠标画一个不自交的封闭轮廓；末点需接近起点。
- 支持撤销当前轮廓、清空重画，或收回最近一件已生成作品修改。可创建多件作品，无墨水和件数限制。
- 点击完成后，拖动场景中的半透明作品，或用滑块/滚轮缩放。金色边框限定放置区域，越界作品显示红色并禁止确认。
- 确认后恢复物理。轮廓为物体正面截面，沿纵深挤出固定深度；轮廓的粗细决定实体厚薄。碰撞体由轮廓三角剖分后的凸棱柱组合构成，不使用包围盒替代轮廓。
- 建议先试示例桥板，将其放在深沟中央。两端需充分搭岸。桥板高出地面，需要空格跳上桥；向右侧青色门廊前进即可通关。
- 掉落后自动回到左岸，作品保留；右上角重新开始清除作品并复位。

## 验证

`npx playwright test`（配置默认使用 `/usr/bin/chromium`，先启动开发服务器）。测试覆盖未闭合拒绝、暂停、返回修改、缩放放置、跳跃过桥通关、重置和无桥坠落重生。截图位于忽略的 `test-results/`。

## 原型边界

角色为简化几何造型；不是最终角色资产。当前仅一个关卡，不含剧情模式或音效。绘画是单笔封闭轮廓，重新绘制替代当前笔画；收回修改按创建顺序进行。没有旋转放置或任意三维绘画。凹轮廓支持三角剖分，自交轮廓被拒绝；极细小或病态轮廓可能不适合物理结构。触屏可绘画和放置，角色移动目前需要键盘。
