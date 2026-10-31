# 🤝 贡献指南

感谢关注 **terra-wiki**！这是一个纯声明式的 ZCode 插件（Markdown + JSON，无构建、无依赖），贡献门槛很低——但为了让插件在多个 ZCode 版本间稳定加载，请遵守下面的约定。

## 🌱 环境准备

| 需要 | 说明 |
| --- | --- |
| Node ≥ 20 | 仅用于运行校验脚本 |
| 文本编辑器 | 插件全部是 Markdown 与 JSON |

```bash
git clone https://github.com/JeffreyZhu0201/Zcode-Terra-Plugin.git
cd Zcode-Terra-Plugin
node scripts/validate-plugin-files.mjs   # 先确认起点是绿的
```

## 🔄 开发流程

```text
main (protected, CI 必须绿)
  └── feat/<slug> | fix/<slug> | docs/<slug>
        └── commit (Conventional Commits)
              └── PR → CI → review → merge
```

1. **从 `main` 拉分支**，命名 `<类型>/<短横线描述>`，如 `feat/love-diary-mode`、`docs/fix-badge-link`。
2. **修改并自测**：本地跑 `node scripts/validate-plugin-files.mjs`，退出码非零不要提交。
3. **提交**：Conventional Commits（见下节），一个 commit 只做一件事。
4. **推送并发 PR**：描述里写清动机与验证方式；CI 绿是合入前提。
5. **Review 合并**：维护者 review 后合入 `main`；合并时倾向 squash，保持主干历史线性。

### 改动即版本变更

只要动了 `plugins/terra-wiki/` 下的内容，就按语义化版本 bump，且 **两处清单必须同步**：

| 文件 | 字段 |
| --- | --- |
| `plugins/terra-wiki/.zcode-plugin/plugin.json` | `version` |
| `plugins/marketplace.json` | 对应条目的 `version` |

- 🩹 `patch`：措辞、格式、文档修正
- ✨ `minor`：新增技能/命令/配置项、新增上游工具支持说明
- ‼️ `major`：修改既有约定导致旧用法不兼容

## 📝 提交规范（Conventional Commits）

```text
<type>(<scope>): <简短描述>

feat(skills): add love-diary scenario guidance
fix(ci): pin node version to 20
docs(readme): rewrite user stories
chore(release): v0.2.0
```

| type | 用途 |
| --- | --- |
| `feat` | 新能力 |
| `fix` | 修复 |
| `docs` | 仅文档 |
| `refactor` | 不改行为的调整 |
| `chore` | 杂务，含 `chore(release)` 发布提交 |

发布流程：版本 bump → commit `chore(release): v<version>` → 打 tag `v<version>` → push（含 tag）。

## 📐 插件内容规范

写/改技能文档时：

- **frontmatter 必填**：每个 `skills/<name>/SKILL.md` 需要 `name`（英文 kebab-case）+ `description`（写"何时使用"，供 Agent 匹配）；每个 `commands/*.md` 需要 `description`。
- **wiki-ops 是唯一事实来源**：平台操作约定（预检、智能分类、查重、图片管线、发布流程）只写在 `skills/wiki-ops/SKILL.md`，其他技能开头一句"遵循 wiki-ops 约定"引用，**不要复制流程**。
- **语言分工**：面向用户的内容用中文；代码、slug、frontmatter 值用英文 kebab-case。
- **蒸馏类文章**：正文 = SKILL.md 原文（含 frontmatter），保证日后可整篇复制复用。

### 硬性红线（CI 会拦）

- ❌ `plugin.json` 的 `name` 与目录名不一致，或含非法字符
- ❌ 任何形式的密钥/Token 写入源码（凭据一律走 `userConfig`，用户在插件设置里填）
- ❌ 删除 `plugin.json` 中 `${user_config.*}` 模板占位符（那是 ZCode 运行时展开的机制）
- ❌ 两处清单版本不同步

## 🔗 上游 Terra-Wiki 对齐

本插件封装 [Terra-Wiki](https://github.com/JeffreyZhu0201/Terra-Wiki) 的 MCP（工具定义在其 `src/mcp/tools.ts`，默认分支 `develop`）。如果你在上游加了工具或改了行为：

1. 更新 `skills/wiki-ops/SKILL.md` 中受影响的工具说明；
2. 检查其他技能文档是否有引用受影响的行为；
3. 按 minor/major bump 版本；
4. PR 中贴出上游对应 commit，方便 review 对照。

## 🐛 报告问题

提 Issue 时请附上：

- ZCode 版本与操作系统
- 插件版本（**设置 → 插件 → terra-wiki**）
- 复现步骤：你说了什么、Agent 做了什么、期望是什么
- 若是 MCP 连接问题：插件设置中服务地址是否可达（不要贴 Token！）

## 📄 License

提交即表示你同意以 [MIT](LICENSE) 许可证发布你的贡献。
