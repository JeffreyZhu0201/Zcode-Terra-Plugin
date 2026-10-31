---
name: wiki-ops
description: Terra Wiki 平台操作手册。任何需要通过 terra-wiki MCP 读写文章、管理分类/标签、上传图片或发布内容时使用。涵盖连通性预检、智能分类决策、查重与更新、图片上传管线、发布流程与修订回滚。其他 terra-wiki 插件技能（distill-skill、distill-rules、conversation-notes）上传内容时必须遵循本手册约定。
---

# Terra Wiki 平台操作手册

所有对 Terra 平台的读写都通过 `terra-wiki` MCP 服务器的工具完成（文章、分类、标签、媒体、修订、发布日历）。本手册定义统一的上传管线与操作约定。

## 预检（每次任务开始时）

1. 调用 `list_categories`（只读）验证连通性与 Token：
   - **成功** → 拿到分类树，进入后续步骤。
   - **401 / 未授权** → 停止写入，告知用户：打开 **设置 → 插件 → terra-wiki**，确认「Terra MCP 服务地址」与「Terra API Token」已正确填写（Token 在 Terra 后台签发）。
   - **连接失败** → 确认 Terra 实例是否在运行（默认 `http://localhost:3000`）。
2. 从返回的分类树记住每个分类的 `id`、`slug` 和是否为叶子分类（无子分类的分类才是叶子）。

## 上传管线（统一流程）

任何内容上传都按此顺序执行：

1. **产出内容草稿** → 展示给用户确认
2. **查重**（见下）→ 决定新建还是更新
3. **智能分类**（见下）→ 确定 `categoryId`
4. **询问发布方式**：每次都必须问用户「保持草稿还是立即发布？」不要替用户决定
5. **写入**：`create_post`（新建）或 `update_post`（更新，带 `expectedUpdatedAt` 乐观锁）
6. **按需发布**：用户选择发布时调 `publish_post`；失败（Token 无 `can_publish` 权限）则保持草稿，如实告知用户
7. **回报结果**：文章 ID、标题、所在分类路径、草稿/已发布状态

## 智能分类

Terra 的文章必须挂在**已存在的叶子分类**下。目标是一棵少而准、逐步生长的成熟分类树：

1. 调 `list_categories` 按内容主题匹配现有叶子分类（看 name 与 slug 语义，不要只做字符串前缀匹配）。
2. 命中语义合适的叶子分类 → 直接使用，向用户说明选了哪个、为什么。
3. 没有合适叶子分类时：
   - **先向用户确认再创建**。提议内容包括：`name`（中文可读名）、`slug`（小写字母/数字/连字符）、`parentId`（尽量挂在已有的父分类下，保持树浅而清晰）。
   - 用户同意后调 `create_category`，再重新 `list_categories` 拿到新分类 id。
4. 发现已有分类语义重复或挂错位置时，向用户建议 `rename_category` / `move_category`，不擅自改动。
5. 不要为单篇文章创建过深的路径；同级分类数量过多时优先复用而不是继续新增。

## 查重与更新

创建前必须查重，避免同一主题重复建文：

1. `search_posts`（全文搜索，**只覆盖已发布内容**）
2. `list_posts`（`status: "draft"`，草稿只对作者本人与管理员可见，搜索搜不到）
3. `get_post`（用 `category` 路径 + `slug` 精确探测）

命中已有文章时：

- 向用户展示现有文章（标题/分类/更新时间），询问「覆盖更新还是另建新文」。
- 更新用 `update_post`，并传 `expectedUpdatedAt`（上次读到的 `updatedAt`）做乐观锁；返回冲突时重新 `get_post` 后再试，不要静默覆盖。
- 需要回滚时用 `list_revisions` + `restore_revision`。

## 图片上传管线

`upload_image` 接收 base64 编码的原始字节，返回可直接插入 Markdown 的 URL：

1. **本地图片文件** → 读文件并 base64 编码后作为 `data` 传入，`filename` 带上原始扩展名；`mimeType` 可省略（服务端按文件头校验）。
2. **对话中生成的可视化/图表** → 先渲染导出为 PNG 文件，再走上述流程。
3. 拿到返回 URL 后，以 `![描述](URL)` 嵌入正文的对应语义位置。
4. 原图无法取回时，在正文留 `> [图片待补：…]` 占位说明，并在回报中提醒用户。
5. 需要查看媒体库时用 `list_media`；误传的图片可用 `delete_media` 清理（先向用户确认）。

## 发布与统计

- `publish_post` 需要 Token 具备 `can_publish` 权限；默认 Token 只能建草稿。
- `get_publish_calendar`（按天统计已发布文章，本地时区）可用于查看发布节奏、辅助决定发布日期话题。
- `get_post_views` 查看阅读量；`archive_post` 下架文章（无删除文章工具，删除需求用归档替代）。

## 标签约定

- `create_post` / `update_post` 的 `tags` 传中文名即可，新标签会自动创建。
- 标签用于横向主题（如 `skill蒸馏`、`日记`、`笔记`、具体技术域），与分类的树状归属互补；每篇 2–5 个为宜。
- 发现有语义重复的标签时，向用户建议 `merge_tags` / `rename_tag`。

## 写作格式约定

- 正文为 Markdown（`bodyMd`）；每篇文章配一行 `summary`（列表页展示）。
- `slug` 用小写字母/数字/连字符的 kebab-case；中文标题也要给出英文 slug。
- 蒸馏类文章的正文 = 产出的 SKILL.md 文档原文（保留 frontmatter），便于日后直接复制复用。
