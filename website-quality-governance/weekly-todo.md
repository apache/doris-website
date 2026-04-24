# Apache Doris Website Quality Governance Weekly TODO

本文档是 Apache Doris 官网和官方文档的自动化治理实施计划。目标不是一次性清理几个问题，而是建立一个长期可运行的质量系统：历史问题可以分批修复，新增 PR 可以在合入前被自动检查和 AI Review 拦截。

## 目标

- 系统性提升 SEO 和 GEO，使搜索引擎、AI 搜索和用户都能稳定发现、索引、引用 Doris 官方文档。
- 用确定性规则拦截低级质量问题，包括标题格式、front matter、Markdown 格式、代码块、内部链接、sidebar、Docusaurus build、SQL 函数文档结构等。
- 用 AI agent 处理确定性规则难以覆盖的问题，包括表达是否清晰、示例是否完整、版本差异是否解释清楚、中文英文日文是否语义一致。
- 降低多语言和多版本维护成本，使一次文档改动可以自动识别需要同步的版本和语言，并生成 companion PR 或明确要求例外说明。
- 建立日常巡检机制，把全站死链、SEO 元数据缺失、外链失效、搜索索引异常、AI 抓取入口异常变成可追踪 issue 或自动修复 PR。

## 当前仓库基线

- 英文 current 文档在 `docs/`。
- 英文版本文档在 `versioned_docs/`。
- 中文文档在 `i18n/zh-CN/docusaurus-plugin-content-docs/`。
- 社区文档在 `community/` 和 `i18n/zh-CN/docusaurus-plugin-content-docs-community/`。
- 当前活跃版本来自 `versions.json`，目前是 `4.x`、`3.x`、`2.1`、`current`。
- 导航由 `sidebars.ts`、`sidebarsCommunity.json`、`sidebarsReleases.json`、`versioned_sidebars/` 控制。
- CI 已有 `Build Check`，包括移动文件检测、局部版本构建和部分 link 检查。
- Docusaurus 当前配置 `onBrokenLinks: 'ignore'` 和 `onBrokenMarkdownLinks: 'ignore'`，这不适合作为长期质量门禁。
- 已有 `/review` 触发的 OpenCode Review workflow，可以扩展为专业文档 AI Review。
- 已有英文到日文翻译 workflow，但日文发布仍依赖 `ja-build`，需要纳入统一质量治理。

## 治理原则

- 确定性问题必须用脚本和 CI 解决，不依赖人肉 review。
- AI Review 只负责语义、完整性、清晰度和一致性判断，不替代构建、lint、链接检查。
- 所有自动化规则必须支持例外机制，但例外要有原因、owner 和过期时间。
- PR 门禁先 warning 后 blocking，避免一次性引入大量历史 debt 阻塞正常贡献。
- 历史治理使用分批自动修复 PR，不在业务文档 PR 中混入大规模格式化。
- 对活跃版本和多语言同步的判断以 manifest 为准，不靠 reviewer 临时猜测。

## 推荐新增目录和文件

后续实施时建议新增以下目录。当前文件只是计划，不立即创建这些实现文件。

```text
website-quality-governance/
  weekly-todo.md

scripts/docs-governance/
  README.md
  manifest.js
  lint-frontmatter.js
  lint-markdown-structure.js
  lint-seo.js
  lint-i18n-sync.js
  lint-links.js
  lint-sql-function-docs.js
  lint-feature-docs.js
  report.js

.docs-governance/
  rules.yml
  exceptions.yml
  owners.yml
  ai-review-prompts/
    seo-geo.md
    docs-clarity.md
    i18n-version-sync.md
    links-navigation.md
    frontend-accessibility.md
```

## 质量门禁分级

- `P0 blocking`: 会导致构建失败、页面不可访问、链接明显错误、active version 导航缺失、严重误导用户。
- `P1 blocking after rollout`: front matter 缺失、SQL 函数文档章节缺失、活跃版本或语言明显未同步。
- `P2 warning`: 表达不清晰、示例不完整、SEO description 质量差、标题重复、图片缺 alt。
- `P3 report only`: 外链临时失败、Search Console 趋势异常、AI crawler 访问异常、旧归档版本质量 debt。

## Week 1: 建立治理基线和 manifest 设计

### 目标

把仓库里的文档、版本、语言、URL、sidebar、owner 关系建模，后续所有检查都依赖这个统一事实源。

### TODO

- [x] 定义 `docs-manifest.json` schema，字段至少包括 `doc_id`、`source_path`、`locale`、`version`、`route_path`、`sidebar_source`、`title`、`description`、`slug`、`doc_type`、`owner`、`is_archived`、`sync_group_id`。
- [x] 定义文档类型识别规则：SQL 函数、SQL 语句、Feature 文档、Release Notes、Blog、Community、普通概念文档。
- [x] 设计 active version 范围：默认只对 `versions.json` 中的 `4.x`、`3.x`、`2.1`、`current` 做 blocking，`1.2` 和 `2.0` 先 report only。
- [x] 设计语言范围：英文和中文先 blocking，日文先纳入 report only，等发布链路统一后升级。
- [x] 设计 `exceptions.yml`：允许记录缺失翻译、版本差异、跳过 SEO、外链白名单、旧版本不修复等例外。
- [x] 设计 `owners.yml`：按路径映射 owner，例如 SQL 函数、Lakehouse、Install、Admin、AI、Community。
- [x] 盘点现有脚本：`check_move.py`、`scripts/check_move.js`、`scripts/check_dead_links.py`、`scripts/verify-links.sh`、`scripts/verify-link-anchors.sh`、`scripts/i18n/*`，明确保留、合并或废弃策略。
- [x] 输出第一版 `website-quality-governance/baseline-audit.md`，列出当前自动化能力、缺口、可复用脚本和风险。

### 验收标准

- [x] 任何一篇文档都能映射到一个稳定 `doc_id`。
- [x] 任意 PR 修改一个文档文件后，可以根据 manifest 找到对应的 active versions、locales、sidebars 和 URL。
- [x] 例外机制有 owner、原因和过期时间，不允许永久无主例外。
- [x] 有明确的 blocking 范围，避免历史问题一次性阻塞所有 PR。

### 风险和处理

- `sidebars.ts` 很大，解析复杂。先用 Docusaurus build 生成的 metadata 或简单 AST/文本规则提取，再逐步完善。
- 日文当前不是完整 Docusaurus i18n 发布链路，先 report only，不要阻塞 PR。

## Week 2: 实现确定性检查 MVP

### 目标

先实现低风险、高收益的脚本检查，并在 CI 中以 warning/report 模式运行。

### TODO

- [x] 新增 `scripts/docs-governance/manifest.js`，生成 manifest 和 sync group。
- [x] 新增 `scripts/docs-governance/lint-frontmatter.js`，检查 `title`、`description`、`slug`、`keywords`、`tags`、`sidebar_position` 的存在性和格式。
- [x] 新增 `scripts/docs-governance/lint-markdown-structure.js`，检查标题层级跳跃、多个 H1、空标题、代码块未标语言、表格格式、中文中英文空格。
- [x] 新增 `scripts/docs-governance/lint-sidebar.js`，检查 sidebar 引用文件是否存在、文档是否孤儿、active docs 是否缺 sidebar。
- [x] 新增 `scripts/docs-governance/report.js`，统一输出 GitHub Actions annotation 和 JSON 报告。
- [x] 在 `package.json` 增加脚本建议：`docs:manifest`、`docs:lint`、`docs:lint:changed`、`docs:report`。
- [x] 在 `.github/workflows/build-check.yml` 加入 non-blocking step，先生成 report，不阻塞合入。
- [x] 给脚本加最小单元测试或 fixture，避免规则误伤。

### 验收标准

- [x] 本地执行 `yarn docs:lint:changed` 可以只检查 PR 变更文件。
- [x] CI 能把问题以 annotation 形式标到 PR。
- [x] 检查失败不会修改用户文件，只输出建议。
- [x] 规则误报可通过 `exceptions.yml` 精准豁免。

### 风险和处理

- 现有 front matter 有 JSON 和 YAML 混用。脚本统一用 `gray-matter` 解析，并保留原格式，不做自动写回。
- 现有 Markdown 质量 debt 可能很多。Week 2 只 report，不 blocking。

## Week 3: 死链、导航和 Docusaurus build 强化

### 目标

把内部链接、anchor、移动文件、删除文件、redirect 和 Docusaurus build 纳入可靠门禁。

### TODO

- [x] 合并现有死链脚本，形成一个统一 `lint-links.js`。
- [x] 覆盖 Markdown 链接、MDX 链接、Docusaurus absolute path、relative path、anchor、图片路径。
- [x] 检查链接时忽略代码块和 inline code，避免误报。
- [x] 对移动和删除文件做全仓引用检查，确保 `docs/`、`versioned_docs/`、`i18n/`、`community/`、sidebars 都被覆盖。
- [x] 将 `onBrokenLinks` 和 `onBrokenMarkdownLinks` 从固定 ignore 改为环境变量控制；当前 CI build 保持 warn，PR 通过 changed-only link gate 阻塞新增内部死链，历史清理完成后再切换 Docusaurus build 为 throw。
- [x] 生成 redirect 检查：如果路径、文件名、slug、heading anchor 改变，要求检查 `@docusaurus/plugin-client-redirects` 或更新所有引用。
- [x] 定义外链策略：PR 不阻塞外链，scheduled 巡检检查外链并创建 issue。
- [x] 输出 `broken-links-baseline.md`，列出历史死链和分批修复优先级。

### 验收标准

- [x] 新增或修改的内部死链会通过 `docs:links:changed --fail-on-errors` 阻塞 PR。
- [x] 移动或删除文档时，所有 inbound links 和 sidebar references 都能被检测。
- [x] Docusaurus build 已支持通过环境变量开启 fail-fast；当前默认 warn，避免历史死链阻塞所有 PR。
- [x] 外链失败不会因为临时网络问题阻塞普通 PR。

### 风险和处理

- Docusaurus route 和 Markdown 文件路径不完全等价。脚本需要同时检查源文件路径和构建后 URL。
- 大量历史死链已经存在。当前先只阻塞 changed files 和新增问题，全量死链进入 baseline 和巡检 issue；全量 Docusaurus `throw` 要等历史错误清理到可控范围后再启用。

## Week 4: SEO 和 GEO 基线建设

### 目标

补齐搜索和 AI 发现入口，建立可自动检查的 SEO/GEO 基线。

### TODO

- [ ] 新增 `lint-seo.js`，检查每个可索引页面的 `title`、`description`、canonical、hreflang、sitemap inclusion、robots policy。
- [ ] 定义 title 规则：页面 title 唯一，保留 Apache Doris 品牌，但避免所有页面 title 重复。
- [ ] 定义 description 规则：长度建议 80 到 160 字符，必须具体说明页面内容，不允许通用描述。
- [ ] 检查 `sitemap.xml` 是否排除 search 页面，是否覆盖 docs、blog、community、releases、localized pages。
- [ ] 生成 `robots.txt` 策略草案：允许 Google/Bing 等搜索引擎；允许搜索类 AI crawler；训练类 AI crawler 由社区决定。
- [ ] 生成 `llms.txt` 草案：列出 Overview、Getting Started、SQL Manual、Load、Lakehouse、AI、Admin、Release Notes、Community 入口。
- [ ] 设计 `llms-full-docs.txt` 或分主题 AI 索引文件，但控制大小，避免生成不可用巨型文件。
- [ ] 评估结构化数据：BlogPosting 用于 blog，TechArticle 或 Article 用于文档，BreadcrumbList 用于文档路径。
- [ ] 建立 Search Console 和 Bing Webmaster 数据采集计划，记录 impressions、clicks、indexing errors、top query、404。

### 验收标准

- [ ] 每个 active docs 页面都有可用 title 和 description。
- [ ] 多语言页面有正确 hreflang 和 canonical 关系。
- [ ] `robots.txt` 和 `llms.txt` 有明确维护规则。
- [ ] SEO/GEO 检查能在 PR 中发现新增页面的元数据缺陷。

### 风险和处理

- 自动生成 description 容易泛泛而谈。历史批量修复可以用 AI 生成，但 PR 门禁只检查质量下限。
- AI crawler 策略涉及社区取舍。先提交草案和选项，不直接默认开放训练类 crawler。

## Week 5: SQL 函数和 Feature 文档质量规则

### 目标

把 AGENTS.md 中的文档标准变成可执行规则，优先覆盖最容易影响用户理解的 SQL 函数和 Feature 文档。

### TODO

- [ ] 新增 `lint-sql-function-docs.js`，检查 SQL 函数文档必须按顺序包含 `Description`、`Syntax`、`Parameters`、`Return Value`、`Example`。
- [ ] 检查 SQL 函数 `Syntax` 是否只有 fenced `sql` code block。
- [ ] 检查 `Parameters` 是否是 Markdown table，列名包含 `Parameter` 和 `Description`。
- [ ] 检查 `Return Value` 是否说明返回类型和 NULL 条件。
- [ ] 检查 `Example` 中每个 SQL query 后是否有 expected output 的 fenced `text` block。
- [ ] 新增 `lint-feature-docs.js`，检查 Feature 文档是否包含 Overview、Quick Start、Parameters/Options、Examples、Error handling、Best practices。
- [ ] 对中文 SQL 函数文档设计等价章节名映射，例如 `描述`、`语法`、`参数`、`返回值`、`示例`。
- [ ] 对 2.1 及更早版本降低要求，只 report，不 blocking。
- [ ] 建立 SQL 函数模板和 Feature 文档模板，供后续作者复制。

### 验收标准

- [ ] 新增 SQL 函数文档缺少关键章节时，CI 能明确指出缺失章节。
- [ ] 新增 Feature 文档没有 Quick Start 或参数说明时，AI Review 和脚本都能提示。
- [ ] 规则不强行重写旧文档，只阻止新增低质量结构。

### 风险和处理

- 某些文档类型不适合完整 Feature 模板。通过 `doc_type` 和 `exceptions.yml` 控制。
- 中文章节名可能不完全统一。先建立映射表，再用历史修复 PR 统一。

## Week 6: 多版本和多语言同步自动化

### 目标

解决一次改动需要人工判断多版本、多语言同步的问题。

### TODO

- [ ] 新增 `lint-i18n-sync.js`，基于 manifest 检查同一 `sync_group_id` 下 active version 和 locale 是否同步。
- [ ] 对 docs path 建立映射：`docs/foo.md` 对应 `versioned_docs/version-4.x/foo.md`、`i18n/zh-CN/docusaurus-plugin-content-docs/current/foo.md` 等。
- [ ] 定义同步策略：current 和 4.x 默认强同步，3.x 视功能支持情况同步，2.1 对新增功能默认不要求。
- [ ] 要求 PR 描述中选择受影响版本和语言，或者由脚本自动评论建议补齐。
- [ ] 对只改英文的 PR 自动生成中文和日文 companion PR 的 workflow 草案。
- [ ] 对只改中文的 PR 检查英文是否需要同步，避免中文单独漂移。
- [ ] 将日文 workflow 从手动翻译升级为按 changed files 触发的 candidate translation，但默认由人工 review 后合入。
- [ ] 设计 translation memory 或术语表：Doris、FE、BE、Tablet、Routine Load、Lakehouse、Catalog 等关键术语不可随意翻译。

### 验收标准

- [ ] 修改英文 current 文档时，CI 能指出对应中文 current 是否需要更新。
- [ ] 修改 4.x 文档时，CI 能判断 current 或 3.x 是否应同步或需要例外说明。
- [ ] 自动翻译 PR 不覆盖人工修改，所有输出可 review。
- [ ] 术语表可以被翻译 workflow 和 AI Review 复用。

### 风险和处理

- 不同版本确实存在行为差异。不能简单做文件 diff，必须允许版本差异说明。
- 自动翻译可能破坏 Markdown 或代码。继续沿用中间 JSON 结构，只翻译自然语言 segment。

## Week 7: AI Review agents 接入 PR

### 目标

把现有 `/review` workflow 扩展为文档站专用 AI Review，覆盖确定性规则无法处理的问题。

### TODO

- [ ] 拆分 AI Review prompt：SEO/GEO、文档清晰度、i18n/version sync、links/navigation、frontend/accessibility。
- [ ] AI Review 输入必须包含 changed files、diff、manifest 相关 sync group、AGENTS.md、相关邻近文档。
- [ ] AI Review 输出 JSON：`severity`、`path`、`line`、`issue`、`evidence`、`suggested_fix`、`blocking_recommendation`、`needs_human_verification`。
- [ ] AI 不允许直接断言未验证事实。涉及 Doris 功能行为时，如果仓库文档中找不到证据，必须标为需要人工确认。
- [ ] 对 PR 评论做去重，避免每次 rerun 重复刷屏。
- [ ] 将 `/review` 保留为手动触发，新增 label 触发，例如 `ai-review-docs`。
- [ ] 对高风险路径自动要求 AI Review，例如 `docs/sql-manual/`、`versioned_docs/`、`i18n/`、`docusaurus.config.js`、`sidebars.ts`。
- [ ] 将 AI Review 结论分为 blocking suggestion 和 non-blocking suggestion，最终是否阻塞由确定性 CI 决定。

### 验收标准

- [ ] AI Review 可以指出文档内容缺失、示例不完整、表达歧义、版本说明缺失。
- [ ] AI Review 不再泛泛输出 summary，而是给出可执行 file/line finding。
- [ ] 人类 reviewer 能快速判断每条建议是否采纳。
- [ ] AI Review prompt 与 AGENTS.md 保持一致，不出现两套标准。

### 风险和处理

- AI Review 成本和延迟可能较高。只对 changed files 和相关 sync group 运行。
- AI 可能误报。所有 AI blocking 都先作为建议，待稳定后再提升规则。

## Week 8: 历史问题第一批自动修复

### 目标

处理低风险、可自动化、收益明确的历史问题。

### TODO

- [ ] 批量修复缺失 description，但每个 PR 控制在一个主题或一个目录内。
- [ ] 批量修复重复 title，避免 SEO 结果中大量页面标题相同。
- [ ] 批量修复明显内部死链和图片路径。
- [ ] 批量修复代码块语言缺失，例如 SQL 使用 `sql`，输出使用 `text`，Shell 使用 `bash`。
- [ ] 批量修复中文中英文空格、全角半角标点、空标题、多 H1。
- [ ] 批量补齐图片 alt 或将装饰图片标记为可忽略。
- [ ] 对每批修复 PR 附带自动生成报告：修复数量、影响路径、验证命令、风险。
- [ ] 只做机械修复，不在同一个 PR 中改写内容语义。

### 验收标准

- [ ] 每个历史修复 PR 都能通过 `docs:lint`、link check 和 scoped build。
- [ ] 修复 PR 小而可 review，不超过一个主题或一个目录。
- [ ] 没有把机械格式修复和内容重写混在一起。

### 风险和处理

- 自动修复可能改变 front matter 格式。脚本必须保留原格式或显式说明格式变化。
- 大批量 PR 可能影响 reviewer。每周限制数量，优先修复高流量 docs。

## Week 9: 历史问题第二批 AI 辅助内容修复

### 目标

开始处理表达不清晰、示例不完整、版本说明不足等需要语义判断的问题。

### TODO

- [ ] 从高流量页面开始，优先处理 Getting Started、Install、Load、SQL Manual、Lakehouse、AI。
- [ ] 对每篇文档生成 AI quality report：用户目标、缺失信息、歧义点、示例覆盖、版本差异、推荐修复。
- [ ] 对 SQL 函数文档按模板补齐缺失章节，尤其是 NULL 行为、返回类型、特殊参数和 expected output。
- [ ] 对 Feature 文档补齐 Quick Start、完整参数表、常见错误、最佳实践。
- [ ] 对中英文文档做语义一致性检查，不要求逐字一致，但行为和限制必须一致。
- [ ] 涉及功能事实的修改必须要求 Doris committer 或模块 owner review。
- [ ] 对 AI 生成修改保留 source note：基于哪篇原文、哪些邻近文档、哪些规则生成。
- [ ] 建立 “AI suggested, human verified” 标签，便于后续追踪。

### 验收标准

- [ ] 每个内容修复 PR 都说明用户会因此少踩什么坑。
- [ ] 每个新增示例都包含可执行输入和预期输出或明确结果。
- [ ] 中英文内容没有行为差异，除非文档明确说明版本或语言差异。

### 风险和处理

- AI 可能补充不存在的功能行为。涉及功能事实必须由 owner 验证。
- 内容 PR review 成本高。每次只处理一类文档或一个功能域。

## Week 10: 日常巡检和自动 issue/PR

### 目标

建立持续巡检，避免历史问题清完后再次积累。

### TODO

- [ ] 新增 scheduled workflow：每周全量 build 所有 locale 和 active version。
- [ ] 新增 scheduled workflow：全站内部链接和外链检查，外链失败连续两次才创建 issue。
- [ ] 新增 scheduled workflow：SEO/GEO audit，检查 sitemap、robots、llms.txt、canonical、hreflang、structured data。
- [ ] 新增 scheduled workflow：Search Console 和 Bing Webmaster 数据采集，如果凭证可用。
- [ ] 新增 scheduled workflow：AI crawler 入口检查，确认 robots 和 llms.txt 可访问。
- [ ] 自动创建 GitHub issue，包含路径、错误、影响范围、owner、建议修复命令。
- [ ] 对机械修复问题自动创建 PR，例如缺失 description、重复 title、简单死链修复。
- [ ] 建立 `website-quality-governance/reports/` 保存周报摘要，但不要提交大量临时日志。

### 验收标准

- [ ] 每周能看到全站质量趋势，而不是只看单个 PR。
- [ ] 巡检失败有 owner 和下一步，不只是红色 CI。
- [ ] 临时外链抖动不会制造噪音。

### 风险和处理

- 外部工具凭证涉及 ASF 和社区权限。没有凭证时先生成本地 crawl 报告。
- 全量构建耗时可能较高。scheduled workflow 可以分 locale 和 version matrix 运行。

## Week 11: CI 门禁升级和贡献者体验优化

### 目标

把稳定规则从 warning 升级为 blocking，同时保证贡献者能理解如何修复。

### TODO

- [ ] 将新增内部死链、sidebar 缺失、Docusaurus build broken link 升级为 blocking。
- [ ] 将新增文档 front matter 缺 `title` 或 `description` 升级为 blocking。
- [ ] 将新增 SQL 函数文档缺关键章节升级为 blocking。
- [ ] 将 active version 或中文同步缺失升级为 blocking，但允许有原因的 exception。
- [ ] 更新 `.github/PULL_REQUEST_TEMPLATE.md`，加入自动化说明和版本/语言同步原因。
- [ ] 更新 `AGENTS.md` 和新增 `CLAUDE.md`，把 review 标准、例外机制、AI Review 输出格式固化。
- [ ] 新增 `scripts/docs-governance/README.md`，说明本地如何运行检查和修复。
- [ ] 在 CI comment 中输出精简修复建议，不要求贡献者读长日志。

### 验收标准

- [ ] 新贡献者能根据 CI annotation 自行修复常见问题。
- [ ] Reviewer 不再需要手动检查低级格式和链接问题。
- [ ] 例外机制可审计，不会变成绕过质量门禁的万能开关。

### 风险和处理

- 门禁过早升级会降低贡献效率。每条 blocking 规则先观察两周误报率。
- PR template 不能太长。详细规则放 `AGENTS.md` 和 README，template 只保留 checklist。

## Week 12: 复盘、指标和长期运行机制

### 目标

把项目从实施阶段切换到长期运维阶段，明确指标、owner 和节奏。

### TODO

- [ ] 复盘 12 周内完成的规则、修复 PR、拦截问题、误报、未解决 debt。
- [ ] 建立质量指标 dashboard：broken internal links、external link failures、missing descriptions、duplicate titles、unsynced docs、AI Review findings、build duration。
- [ ] 定义每月质量目标，例如 active docs 内部死链为 0，新增 SQL 函数文档结构合规率 100%。
- [ ] 定义 owner 轮值：每周处理巡检 issue，每月做历史 debt batch。
- [ ] 决定日文是否升级为 blocking。如果日文发布链路仍不统一，继续 report only。
- [ ] 决定训练类 AI crawler 策略。如果社区同意，更新 robots；如果不同意，只开放搜索类 AI crawler。
- [ ] 将稳定脚本加入 release checklist，版本发布前必须跑全量 docs governance。
- [ ] 输出最终 runbook：如何新增文档、如何移动文档、如何处理多版本、如何处理翻译、如何处理例外。

### 验收标准

- [ ] 网站质量治理不依赖某一个人手动记忆。
- [ ] 每个质量问题都有检测、owner、修复路径和例外路径。
- [ ] 历史 debt 有可见下降趋势。
- [ ] 新增 PR 的质量问题能在合入前被发现。

## 每周固定巡检清单

以下任务从 Week 10 开始常态化执行。

- [ ] 跑全量 Docusaurus build，覆盖 `en`、`zh-CN` 和已发布日文内容。
- [ ] 跑全量内部链接和 anchor 检查。
- [ ] 跑外链检查，连续失败两次才创建 issue。
- [ ] 检查 sitemap 是否可访问，是否覆盖新增页面。
- [ ] 检查 robots.txt 和 llms.txt 是否可访问。
- [ ] 检查 Search Console 和 Bing Webmaster 的 indexing error。
- [ ] 检查站内搜索索引是否生成，搜索页面是否 noindex。
- [ ] 检查最近一周 PR 中是否有 AI Review findings 未处理。
- [ ] 检查 `exceptions.yml` 中是否有过期例外。
- [ ] 生成周报：新增问题、已修复问题、剩余 debt、下周建议。

## PR 增量门禁清单

每个 PR 按变更类型触发不同检查。

- [ ] 修改 `docs/` 或 `versioned_docs/`：检查 front matter、Markdown 结构、内部链接、sidebar、active version sync、localized docs sync。
- [ ] 修改 `i18n/`：检查英文源文档是否同步、术语表、Markdown 结构、内部链接。
- [ ] 修改 `sidebars.ts` 或 `versioned_sidebars/`：检查 sidebar 引用、孤儿文档、构建后导航。
- [ ] 移动、删除、重命名文档：检查 inbound links、redirect、sidebar、localized counterpart。
- [ ] 修改 SQL 函数文档：检查固定章节、语法块、参数表、返回值、NULL 行为、示例输出。
- [ ] 修改 Feature 文档：检查 Quick Start、参数表、示例、错误处理、最佳实践。
- [ ] 修改 `docusaurus.config.js`、`src/`、`static/`、`config/`：检查 build、SEO metadata、responsive behavior、accessibility、search、PWA。
- [ ] 修改 blog 或 release notes：检查 title、description、slug、tags、date、canonical、链接。

## AI Review 任务分工

- [ ] SEO/GEO agent：检查 title、description、canonical、hreflang、sitemap、robots、llms.txt、结构化数据。
- [ ] 文档清晰度 agent：检查用户目标是否明确、步骤是否完整、示例是否可运行、术语是否一致。
- [ ] 多版本多语言 agent：检查 active versions 和 locales 是否同步，差异是否解释清楚。
- [ ] 链接导航 agent：检查路径、anchor、sidebar、redirect、移动文件影响。
- [ ] 前端可访问性 agent：检查 Docusaurus config、React、CSS、移动端、ARIA、hydration 风险。

AI Review 输出必须包含具体文件、行号、证据和建议修复。没有证据时，只能标记为需要人工确认。

## 历史治理优先级

- [ ] P0: active docs 内部死链、sidebar 错误、构建失败风险、错误 redirect。
- [ ] P1: 高流量页面缺 title 或 description、重复 title、canonical/hreflang 错误。
- [ ] P1: SQL 函数文档结构不完整，尤其是缺返回值、NULL 行为、示例输出。
- [ ] P2: current、4.x、中文文档明显不同步。
- [ ] P2: Quick Start 缺先决条件、参数表缺默认值、错误处理缺失。
- [ ] P3: 旧归档版本格式问题、低流量页面表达优化、外链替换。

## 建议成功指标

- [ ] Active docs 内部死链数量：目标 0。
- [ ] 新增文档 front matter 合规率：目标 100%。
- [ ] 新增 SQL 函数文档结构合规率：目标 100%。
- [ ] 新增 PR 中未说明的 active version sync 缺失：目标 0。
- [ ] 新增 PR 中未说明的中英文同步缺失：目标 0。
- [ ] 每周外链连续失败 unresolved issue：持续下降。
- [ ] Search Console indexing error：持续下降。
- [ ] AI Review 有效建议采纳率：持续跟踪，低于阈值时调整 prompt。

## 最小可行版本

如果团队资源有限，先做下面 4 件事即可形成闭环。

- [ ] Week 1 到 Week 3：manifest、front matter 检查、内部链接检查、CI annotation。
- [ ] Week 4：SEO metadata、robots、llms.txt、sitemap 检查。
- [ ] Week 6：active version 和中文同步检查。
- [ ] Week 7：AI Review 针对 docs clarity 和 version sync 输出 file/line findings。

完成最小可行版本后，新增文档 PR 已经能被基础质量门禁覆盖，历史问题可以按目录逐步清理。
