---
name: distill-rules
description: 把 Agent 规则文件（CLAUDE.md、AGENTS.md、.cursorrules、GEMINI.md、系统提示词、自定义 skill 文件等）蒸馏为通用 Skill 规范并上传到 Terra 平台记录。当用户说"把这个规则文件蒸馏成 skill 规范"、"沉淀 CLAUDE.md"之类的话时使用。
---

# Agent 规则文件蒸馏为通用 Skill 规范

把项目里的 Agent 规则文件提炼成通用、可迁移的 Skill 规范文档，上传 Terra 平台沉淀，使其脱离原项目也能被理解和复用。

平台操作（预检、查重、分类、发布、回报）一律遵循 **wiki-ops** 技能的约定；若尚未加载，先通过 Skill 工具加载 `wiki-ops`。

## Instructions

1. **定位规则文件**。按用户指定的路径读取；用户未指定时，在工作区内探测常见规则文件：`CLAUDE.md`、`AGENTS.md`、`GEMINI.md`、`.cursorrules`、`.cursor/rules/*`、`.zcode/skills/*/SKILL.md` 等。列出找到的文件让用户确认要蒸馏哪些。

2. **多文件时先出批量计划**。每个规则文件（或语义上拆分的每组规则）对应一篇文章。列出计划表（文件 → 拟生成文章标题 → 目标分类），经用户确认后再逐个执行。

3. **蒸馏为通用 Skill 规范**。每个文件产出一份 SKILL.md 格式文档：
   - YAML frontmatter：`name`（体现来源与主题，如 `repo-conventions-frontend`）与 `description`
   - 正文按主题分组重组，而非照抄原文顺序：**适用时机 → 规范条目（祈使句、一条一事）→ 陷阱与例外 → 验证方式**
   - **剥离项目私有信息**：具体绝对路径、内部仓库名、Token/密钥、内部服务地址一律泛化（`<你的路径>`、`<内部服务>`）或删除；确实项目强绑定的条目合并为"项目特有约定"一节并明确标注不可迁移
   - 规则背后的**理由**比规则本身更值得保留：尽量把"必须 X"补全为"必须 X，因为 Y"

4. **展示草稿并确认**。逐份展示，根据反馈修订。

5. **上传**（遵循 wiki-ops 管线，与 distill-skill 相同）：
   - 查重 → 智能分类（优先"规范/规则沉淀"相关的现有叶子分类）→ 询问草稿/发布
   - `create_post`：`title` = 规范名，`slug` = frontmatter 的 name，`bodyMd` = SKILL.md 原文（含 frontmatter），`summary` = 一句话，`tags` 含 `skill规范` + 主题标签

6. **回报**：每篇文章的 ID、标题、分类路径、状态；批量执行时汇总为一张清单。
