---
description: 把当前对话蒸馏为通用 Skill 文档并上传到 Terra 平台。
argument-hint: "[可选：要沉淀的主题或片段说明]"
skills: distill-skill
---

Use the `distill-skill` skill for this request:

$ARGUMENTS

先识别对话中可复用的方法论，产出通用 SKILL.md 格式文档草稿并展示确认，然后按 `wiki-ops` 技能的管线查重、智能分类、询问草稿/发布后上传到 Terra，最后回报文章 ID、标题、分类路径与状态。
