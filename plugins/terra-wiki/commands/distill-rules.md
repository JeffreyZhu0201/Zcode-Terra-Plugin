---
description: 把 Agent 规则文件（CLAUDE.md、AGENTS.md、.cursorrules 等）蒸馏为通用 Skill 规范并上传到 Terra 平台。
argument-hint: "[可选：规则文件路径，缺省时自动探测]"
skills: distill-rules
---

Use the `distill-rules` skill for this request:

$ARGUMENTS

先定位规则文件并让用户确认范围；多文件时先给出批量计划。逐份蒸馏为去私有信息的通用 Skill 规范，展示确认后按 `wiki-ops` 技能的管线查重、智能分类、询问草稿/发布并上传到 Terra，最后汇总回报清单。
