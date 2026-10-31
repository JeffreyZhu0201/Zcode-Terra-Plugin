---
description: 把当前对话及其中的图片整理为笔记或日记上传到 Terra 平台。
argument-hint: "[可选：笔记/日记 模式与主题说明]"
skills: conversation-notes
---

Use the `conversation-notes` skill for this request:

$ARGUMENTS

先判定笔记/日记模式并确定标题，整理正文，把对话中的图片按 `wiki-ops` 技能的图片管线上传并嵌入对应位置。草稿确认后按 `wiki-ops` 管线查重、智能分类、询问草稿/发布并上传到 Terra，最后回报文章 ID、标题、分类路径、状态与图片处理情况。
