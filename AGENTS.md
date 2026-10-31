# AGENTS.md — Zcode-Terra-Plugin 开发规范

本仓库是 [ZCode](https://zcode.ai) 插件 **terra-wiki** 的源码：把对话蒸馏为通用 Skill 文档、把 Agent 规则文件蒸馏为 Skill 规范、把对话与图片整理为笔记/日记，并上传到 Terra 平台。插件内置 Terra 的 MCP 服务器配置。

上游 MCP：**https://github.com/JeffreyZhu0201/Terra-Wiki**（自托管博客平台，MCP 集成）。

## 目录结构

按 [ZCode 官方插件文档](https://zcode.z.ai/cn/docs/plugin)「开发自己的插件」章节组织：**仓库根即插件根**，同时根级 `marketplace.json` 使整个仓库可直接作为插件市场添加。

```
Zcode-Terra-Plugin/         # 仓库根 = 插件根 = 市场根
├── .zcode-plugin/
│   └── plugin.json         # 插件清单（唯一必需）：skills/commands/userConfig + 元数据
├── .mcp.json               # MCP 服务声明（标准位置）：terra-wiki HTTP 服务器
├── skills/
│   ├── wiki-ops/           # 平台操作手册（其他技能共享的约定，改平台行为先改这里）
│   ├── distill-skill/      # 对话 → 通用 SKILL.md 文档
│   ├── distill-rules/      # Agent 规则文件 → 通用 Skill 规范
│   └── conversation-notes/ # 对话+图片 → 笔记/日记
├── commands/               # 3 个斜杠命令，每个引用一个技能
├── marketplace.json        # 市场清单：source "." 指向仓库根的插件
├── scripts/
│   └── validate-plugin-files.mjs  # 文件级校验（本地与 CI 共用）
├── AGENTS.md               # 本文件
└── .github/workflows/ci.yml # CI：推送/PR 时跑校验脚本
```

MCP 声明在根级 `.mcp.json`（官方文档的标准位置），清单 `plugin.json` 不再内联 `mcpServers`；`${user_config.*}` 模板变量在 `.mcp.json` 中同样生效。

## 常用命令

```bash
# 校验插件（JSON 语法、frontmatter、市场条目同步、密钥泄漏、占位符）
node scripts/validate-plugin-files.mjs
```

无构建步骤、无依赖安装；插件为纯声明式（Markdown + JSON）。CI 即上述校验，推送前请在本地先跑通。

## 硬性约束（违反会导致加载失败或校验不通过）

1. `plugin.json` 的 `name` 必须匹配 `^[a-z0-9][a-z0-9._-]{0,127}$`（仓库根即插件根，无目录名一致性约束）。
2. 每个 `skills/<name>/SKILL.md` 的 YAML frontmatter 必须含 `name` + `description`；每个 `commands/*.md` 必须含 `description`。
3. **版本同步**：根目录的 `plugin.json` 与 `marketplace.json` 条目的 `version`/`description` 必须一致，改版本时两处同时改。
4. **禁止把密钥写进源码**。Token 通过 `userConfig.api_token` 注入（用户在 ZCode 插件设置里填）。校验脚本会扫描常见 token 格式。
5. `.mcp.json` 里的 `${user_config.server_url}` / `${user_config.api_token}` 是**有意的模板占位符**，由 ZCode 加载时展开，不要替换成字面量。插件提供的 MCP 服务器支持该展开，用户自己写在 `~/.zcode/cli/config.json` 里的 MCP 不支持。
6. 校验不通过（`node scripts/validate-plugin-files.mjs` 退出码非零）不要提交。

## 上游 Terra-Wiki 同步规则（重要）

插件封装的上游仓库会活跃迭代（工具定义在 `src/mcp/tools.ts`，工具说明在 `src/mcp/instructions.ts`，默认分支 `develop`，MCP 端点 `src/app/api/mcp/route.ts`）。**上游工具变更时必须同步本仓库**：

1. `gh api repos/JeffreyZhu0201/Terra-Wiki/commits?sha=develop` 查看上游最新提交；关注 `src/mcp/` 的改动。
2. 对比 `skills/wiki-ops/SKILL.md` 及各技能文档中引用的工具名、参数、行为（如叶子分类约束、乐观锁、`can_publish` 权限）。
3. 上游新增/改名/删除工具时：更新 `skills/wiki-ops/SKILL.md`（操作手册是唯一事实来源），其余技能文档只引用 wiki-ops 的约定，一般不需要动。
4. 行为变更即使是文档更新也要按语义化版本 bump：改文档措辞 → patch；新增工具的支持说明 → minor；调整约定导致旧行为不兼容 → major。清单与市场清单同步 bump（见硬性约束 3）。

## 插件内容写作约定

- 技能正文用祈使句、按序编号；description 写"何时使用"（供 Agent 匹配），不写功能罗列。
- 技能间不复制流程：平台操作统一引用 `wiki-ops` 技能，其余技能开头一行"遵循 wiki-ops 约定"。
- 面向用户的内容（技能产出、README）用中文；代码、slug、frontmatter 值用英文 kebab-case。
- 蒸馏类文章的正文 = SKILL.md 原文（含 frontmatter），便于日后直接复制复用。

## Git 工作流

- 默认分支 `main`；非 trivial 改动开 `feat/<slug>` 或 `fix/<slug>` 分支，走 PR 合入。
- Commit message 用 Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `refactor:`。
- 发布 = bump 版本（两处清单同步）+ commit `chore(release): v<version>` + 打 tag `v<version>` + push。
- CI（`.github/workflows/ci.yml`）在 push/PR 时跑校验脚本，红着不要合。

## 已知坑

- **`api_token` 不要标 `sensitive`**：官方文档确认 sensitive 配置项当前无法在 UI 填写（提示"需要安全存储接入"），标了用户就配不了 Token。保持普通 string。
- 本插件提供的 MCP 与用户全局 `~/.zcode/cli/config.json` 里的旧 `terra-wiki` 条目会同时生效、工具重复——文档已引导用户删除全局旧条目，排查"工具出现两次"先想到这里。
- Terra 的 `create_post` 必须挂**已存在的叶子分类**；`publish_post` 需要带 `can_publish` 权限的 Token，默认 Token 只能建草稿。
- Terra 全文搜索（`search_posts`）只覆盖已发布内容，查重时要叠加 `list_posts(status: "draft")`。
- 源码改动不会热加载到已安装的插件：改完源码需要用户在 ZCode 里刷新市场源并更新插件才能生效（本地市场根 = 仓库根，或直接用 GitHub 仓库地址添加市场）。
