# terra-wiki — Terra Wiki 博客整理助手

基于 [Terra](http://localhost:3000) MCP 的博客整理插件，让 Agent 方便地整理自己的博客：

| 能力 | 说明 |
| --- | --- |
| `wiki-ops` | 平台操作手册：预检、智能分类、查重更新、图片上传、发布流程（其他技能共享的约定） |
| `distill-skill` / `/distill-skill` | 把当前对话蒸馏为通用 Skill 文档（SKILL.md 格式）上传平台记录 |
| `distill-rules` / `/distill-rules` | 把 Agent 规则文件（CLAUDE.md、AGENTS.md、.cursorrules 等）蒸馏为通用 Skill 规范上传 |
| `conversation-notes` / `/conversation-notes` | 把当前对话及其中的图片整理为笔记或日记上传 |

插件内置 `terra-wiki` MCP 服务器（HTTP 型），安装后需完成下面的配置。

## 配置

安装插件后，打开 **设置 → 插件 → terra-wiki** 填写：

1. **Terra MCP 服务地址**（`server_url`）：默认 `http://localhost:3000/api/mcp`，按实际实例修改。
2. **Terra API Token**（`api_token`）：在 Terra 后台签发的访问令牌，以 Bearer 方式携带。
   - 默认 Token **没有发布权限**，只能创建草稿；
   - 需要 Agent 直接发布时，签发带 `can_publish` 权限的 Token。
   - 该值保存在本机插件配置中，请勿提交到版本库。

## 已有全局 terra-wiki MCP 的用户

如果你之前在 `~/.zcode/cli/config.json` 手工配置过 `terra-wiki` MCP，安装本插件后两者会同时生效、工具重复。可在全局配置中删除或停用旧条目，统一由插件提供。

## 分类约定

上传内容的分类采用"智能分类"：优先挂到语义匹配的现有**叶子分类**；没有合适分类时 Agent 会提议新建（需确认）。长期使用会逐步长出一棵少而准的分类树。
