# Skill Registry

[English](./README.md)

一个运行在本机的技能目录页面，用来浏览、审计和后续管理当前机器上安装的 Codex / agent skills。

Skill Registry 会扫描一个或多个 skill 根目录，读取其中的 `SKILL.md`，并生成一个可搜索的本地 Web 页面，展示：

- skill 名称
- 描述和 `Use when ...` 触发提示
- skill 来源目录
- 重名 skill
- 启发式风险标签，例如 `gh issue create`、`git push`、`git worktree`、依赖安装、子代理依赖等

## 功能

- 本地优先：页面反映的是当前机器实际安装的 skill
- 支持多个根目录，例如 `~/.codex/skills`、`~/.agents/skills` 或自定义路径
- 支持搜索，且对 `ui`、`qa`、`pr` 这类短查询做更严格的匹配
- 基于 `SKILL.md` 文本做启发式风险标注
- 能识别不同目录中的重名 skill
- 默认脱敏路径，只显示 `~/...` 而不是绝对路径
- 无需构建，直接 `python3 server.py` 就能跑
- 可选 Docker Compose 运行方式，方便重复部署

## 工作原理

```mermaid
flowchart LR
    A[配置好的 skill 根目录] --> B[查找包含 SKILL.md 的目录]
    B --> C[解析 frontmatter 和标题]
    C --> D[从技能文本中推断风险标签]
    D --> E[生成 /api/catalog 数据]
    E --> F[渲染可搜索的本地网页目录]
```

## 这是什么

这个项目的定位是：你把仓库 clone 到自己的机器上，本地运行，然后查看**自己机器**上的 skill 目录。

它不会打包你的 skill 清单，而是读取运行机器本身的 skill 目录。

## 默认扫描目录

默认扫描：

- `~/.codex/skills`
- `~/.agents/skills`

只要某个目录里存在 `SKILL.md`，就会被识别成一个 skill。

## 快速开始

```bash
git clone <your-repo-url> skill-registry
cd skill-registry
python3 server.py
```

然后打开：

```text
http://127.0.0.1:4455
```

## Docker 运行

也可以用 Docker Compose：

```bash
docker compose up --build
```

这个方式会把你本机的 skill 目录以只读方式挂进容器：

- `${HOME}/.codex/skills`
- `${HOME}/.agents/skills`

然后打开：

```text
http://127.0.0.1:4455
```

## 配置项

可用环境变量：

- `HOST`
  默认：`0.0.0.0`
- `PORT`
  默认：`4455`
- `CATALOG_REFRESH_MS`
  默认：`15000`
- `SHOW_ABSOLUTE_PATHS`
  默认关闭  
  设为 `true` 后显示真实绝对路径，而不是 `~` 脱敏路径。
- `CODEX_SKILLS_ROOT`
  覆盖默认的 `~/.codex/skills`
- `AGENTS_SKILLS_ROOT`
  覆盖默认的 `~/.agents/skills`
- `SKILL_ROOTS`
  可选。设置后会完全替代前面两个默认目录。
  路径分隔符：
  - macOS/Linux：`:`
  - Windows：`;`

示例：

```bash
HOST=127.0.0.1 PORT=4455 CATALOG_REFRESH_MS=5000 python3 server.py
```

也可以先复制环境变量模板：

```bash
cp .env.example .env
```

自定义多个根目录示例：

```bash
SKILL_ROOTS="$HOME/.codex/skills:$HOME/.agents/skills:/some/extra/skills" python3 server.py
```

## 项目结构

```text
skill-registry/
├── server.py                  # 本地 HTTP 服务和目录 API
├── web/
│   ├── index.html             # 页面骨架
│   ├── app.js                 # 前端渲染和搜索逻辑
│   └── styles.css             # 页面样式
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── README.zh-CN.md
```

## 隐私说明

默认情况下，页面里显示的路径会被脱敏成 `~/...`。

这个项目适合本地 / 自托管使用。如果你把它暴露到外网，请记住：页面展示的是**当前运行机器**上的 skill 清单。

## 开发检查

本地检查命令：

```bash
python3 -m py_compile server.py
node --check web/app.js
```

## 说明

- 风险标签是启发式的，它们来自对 `SKILL.md` 文本的扫描，不是严格白名单。
- 搜索对短查询词（如 `ui`、`qa`、`pr`）采用更严格的前缀匹配，减少误伤。
- 页面会定时从 `/api/catalog` 自动刷新。
- 你把这个仓库公开后，任何下载并部署它的人看到的都是**自己机器**上的本地 skill 目录，不会自动带出你的技能清单。

## 许可证

MIT
