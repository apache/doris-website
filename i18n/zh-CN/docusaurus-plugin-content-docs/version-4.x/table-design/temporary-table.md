---
{
    "title": "临时表（实验功能）",
    "language": "zh-CN",
    "description": "Doris 临时表（Temporary Table）是会话级物化内表，用于拆分复杂 SQL 查询、保存中间计算结果，会话结束后自动删除，无需手动清理。"
}
---

:::note

临时表是一个实验性质的功能。不推荐在生产环境使用。
:::

<!-- 知识类型: 功能特性 -->
<!-- 适用场景: 复杂 SQL 拆分 / 中间结果暂存 / 数据调试 -->

在进行复杂的数据处理任务时，将大型 SQL 查询拆分为多个步骤，并将每个步骤的计算结果临时保存为实体表，是一种有效的策略。这种方法能够显著降低 SQL 查询的复杂度，并提升数据的可调试性。然而，实体表在完成其使用目的后，需要手动进行清理；若选择使用非实体临时表，当前 Doris 仅支持通过 `WITH` 子句进行定义。

为了解决上述问题，Doris 引入了**临时表（Temporary Table）**功能。临时表是一种临时存在的物化内表，能够在简化复杂数据处理过程中临时数据存储与管理的同时，进一步增强数据处理的灵活性和安全性。

## 核心特性

| 特性 | 说明 |
| --- | --- |
| **会话绑定** | 临时表仅存在于创建它的会话（Session）中，生命周期与当前会话紧密绑定。当会话结束时，该会话内创建的临时表会自动被删除。 |
| **会话内可见** | 临时表的可见性严格限制在创建它的会话范围内。即使是同一用户在同一时间启动的另一个会话，也无法访问这些临时表。 |
| **命名灵活** | 临时表的命名不受唯一性约束。可以在不同 Session 中创建同名临时表，也可以创建与其他内表同名的临时表。 |

:::info 备注
与内表类似，临时表必须在 Internal Catalog 内的某个 Database 下创建。

如果同一 Database 中同时存在同名的临时表和非临时表，临时表具有最高访问优先级。在该 Session 内，所有针对同名表的查询和操作仅对临时表生效（创建物化视图除外）。
:::

## 适用场景

临时表适用于以下数据处理场景：

- **复杂 SQL 拆分**：将大型查询拆分为多个步骤，逐步落地中间结果，降低单条 SQL 的复杂度。
- **中间结果暂存**：在 ETL、数据探查或报表开发中保存计算中间产物，避免重复计算。
- **数据调试与验证**：将每一步的计算结果物化，便于查看和校对，提升可调试性。
- **会话隔离的数据处理**：需要数据在会话内可见、会话结束自动回收的场景，避免遗留数据污染。

## 用法

### 创建临时表

各种模型的表都可以被定义为临时表，无论是 Unique、Aggregate 还是 Duplicate 模型。可以在下列 SQL 中添加 `TEMPORARY` 关键字创建临时表：

- [CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
- [CREATE TABLE AS SELECT](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
- [CREATE TABLE LIKE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)

### 操作临时表

临时表的其它用法基本和普通内表相同。除上述 `CREATE` 语句外，其它 DDL 及 DML 语句无需添加 `TEMPORARY` 关键字。

## 使用限制

- 临时表只能在 Internal Catalog 中创建。
- 建表时 ENGINE 必须为 OLAP。
- 不支持使用 Alter 语句修改临时表。
- 由于临时性，不支持基于临时表创建视图和物化视图。
- 不支持备份临时表，不支持使用 CCR / Sync Job 同步临时表。
- 不支持导出、Stream Load、Broker Load、S3 Load、Mysql Load、Routine Load。
- 删除临时表时，不进回收站，直接彻底删除。

