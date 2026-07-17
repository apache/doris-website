# Streaming CDC 参数文档补全设计

## 目标

以 Doris `master` 源码实际支持能力为准，补齐 MySQL 和 PostgreSQL Streaming Job 参数文档，并修正现有参数默认值、必选性和适用范围错误。第一阶段只修改 dev 中文文档。

## 第一阶段范围

修改以下 dev 中文页面：

- `i18n/zh-CN/docusaurus-plugin-content-docs/current/data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md`
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md`
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md`
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md`
- `i18n/zh-CN/docusaurus-plugin-content-docs/current/sql-manual/sql-functions/table-valued-functions/cdc-stream.md`

暂不修改英文和 `version-4.x` 文档。第一阶段完成并确认后，再以相同参数矩阵同步其他镜像。

## 内容结构

### 自动建表同步

MySQL 和 PostgreSQL 自动建表页面分别提供完整参数表，按连接、表选择与映射、启动位点与快照、安全连接、数据源专属资源、Doris 目标属性分类。补充：

- `exclude_tables`
- `table.<table_name>.target_table`
- `table.<table_name>.exclude_columns`
- `skip_snapshot_backfill`
- `ssl_mode`
- `ssl_rootcert`
- `offset` 的完整取值与适用范围
- MySQL `server_id`
- PostgreSQL `slot_name` 和 `publication_name`

明确 `include_tables` 优先于 `exclude_tables`，不能排除主键列；说明 MySQL server ID 范围宽度约束；说明 PostgreSQL 自定义 slot/publication 需要预先创建，且 Doris 不负责删除用户提供的资源。

### SQL Mapping 同步

MySQL 和 PostgreSQL SQL Mapping 页面列出各自完整的 `cdc_stream` 参数，补充：

- `snapshot_split_key`
- `skip_snapshot_backfill`
- `ssl_mode`
- `ssl_rootcert`
- MySQL `server_id`
- PostgreSQL `slot_name` 和 `publication_name`
- `include_delete_sign`

明确 SQL Mapping 的 `offset` 必须显式提供；`skip_snapshot_backfill` 默认 `false`，设为 `true` 会跳过快照期间的增量回填，不再具备文档所述的全量与增量 exactly-once 保证。

### CDC_STREAM 参考页

将参数分为通用必选、数据源必选和可选三类，并增加“适用数据源”信息。该页面作为 TVF 参数总参考，覆盖两个数据源的全部有效参数及关键组合约束。

## 示例

保留现有快速开始，在参数表之后增加最少但可运行的代表性配置片段：

- MySQL：表筛选/映射与自定义 server ID。
- PostgreSQL：表筛选与自定义 slot/publication。
- SSL：说明 CA 文件通过 Doris 文件管理能力提供，并展示 `ssl_mode`/`ssl_rootcert` 的组合。
- SQL Mapping：展示 `include_delete_sign` 的使用意图和目标表列要求。

示例只覆盖参数之间存在组合约束或容易误用的场景，避免重复完整快速开始。

## 正确性边界

- 只记录 Doris `master` 已合入且运行路径实际消费的参数。
- 不把仅在白名单中出现但对当前数据源无效的参数写入对应页面。
- 默认值和约束以 FE 校验、Streaming Job 初始化和 CDC reader 配置逻辑为共同依据。
- 不承诺未由实现保证的语义；尤其明确 `skip_snapshot_backfill=true` 对一致性的影响。
- 不改变页面路径、slug、侧边栏或标题，因此不需要重定向和导航调整。

## 验证

- 建立 MySQL/PostgreSQL、自动建表/SQL Mapping/CDC_STREAM 的参数覆盖矩阵。
- 检查五个 dev 中文页面的参数名称、默认值、必选性和交叉约束一致。
- 检查 Markdown 表格、相对链接、标题层级和术语。
- 运行仓库适用的格式、链接或 Docusaurus 构建检查。
- 按 `AGENTS.md` 对事实完整性、用户可理解性、可维护性和版本一致性自审。

