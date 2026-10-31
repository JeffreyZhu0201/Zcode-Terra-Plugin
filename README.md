# Zcode-Terra-Plugin

[ZCode](https://zcode.ai) 插件 **terra-wiki** —— 让 Agent 帮你整理自托管博客。

基于 [Terra-Wiki](https://github.com/JeffreyZhu0201/Terra-Wiki) 的 MCP，提供：

- 🧪 **对话蒸馏**（`distill-skill`）：把对话中验证过的方法论沉淀为通用 SKILL.md 文档上传记录
- 📜 **规则蒸馏**（`distill-rules`）：把 CLAUDE.md / AGENTS.md / .cursorrules 等规则文件蒸馏为通用 Skill 规范
- 📝 **笔记/日记**（`conversation-notes`）：把对话连同其中的图片整理为笔记或日记上传
- 🛠 **平台操作手册**（`wiki-ops`）：智能分类、查重更新、图片上传管线、发布流程

## 安装

克隆本仓库后，在 ZCode 中：**插件市场 → 添加 → 添加插件市场**，粘贴本仓库的 `plugins/` 目录路径，然后到 **个人** 页安装 **Terra Wiki 博客助手**。

安装后在 **设置 → 插件 → terra-wiki** 填入 Terra 实例的 MCP 地址（默认 `http://localhost:3000/api/mcp`）与 API Token（在 Terra 后台签发；默认 Token 只能建草稿，发布需 `can_publish` 权限）。

## 开发

```bash
node scripts/validate-plugin-files.mjs   # 文件级校验（CI 同款）
```

开发规范见 [AGENTS.md](AGENTS.md)：版本同步规则、上游 Terra-Wiki 工具同步流程、Git 工作流与 CI 约定。

## License

MIT
