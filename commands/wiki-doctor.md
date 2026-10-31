---
description: 诊断 terra-wiki 插件的安装、配置与 Terra 连接问题。
argument-hint: "[可选：具体症状描述]"
skills: wiki-doctor
---

Use the `wiki-doctor` skill for this request:

$ARGUMENTS

按技能中的检查顺序执行：先确认插件安装/启用状态，再通过 terra-wiki MCP 调 `list_categories` 测连通性，按结果（正常 / 401 / 连接失败 / 工具缺失）给出诊断总表和对应的准确修复步骤。
