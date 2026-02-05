---
{
    "title": "临时表",
    "language": "zh-CN",
    "description": "在进行复杂的数据处理任务时，将大型 SQL 查询拆分为多个步骤，并将每个步骤的计算结果临时保存为实体表，是一种有效的策略。这种方法能够显著降低 SQL 查询的复杂度，并提升数据的可调试性。然而，需要注意的是，实体表在完成其使用目的后，需要手动进行清理。若选择使用非实体临时表，"
}
---

在进行复杂的数据处理任务时，将大型 SQL 查询拆分为多个步骤，并将每个步骤的计算结果临时保存为实体表，是一种有效的策略。这种方法能够显著降低 SQL 查询的复杂度，并提升数据的可调试性。然而，需要注意的是，实体表在完成其使用目的后，需要手动进行清理。若选择使用非实体临时表，当前 Doris 仅支持通过 `WITH` 子句进行定义。

为了解决上述问题，Doris 引入了临时表功能。临时表是一种临时存在的物化内表，具备以下关键特性：
1. **会话绑定**：临时表仅存在于创建它的会话（Session）中。其生命周期与当前会话紧密绑定，即当会话结束时，该会话中创建的临时表会自动被删除。

2. **会话内可见性**：临时表的可见性严格限制在创建它的会话范围内。即使在同一时间由同一用户启动的另一个会话，也无法访问这些临时表。

通过引入临时表功能，Doris 不仅简化了复杂数据处理过程中的临时数据存储与管理，还进一步增强了数据处理的灵活性和安全性。


:::info 备注

与内表类似，临时表必须在 Internal Catalog 内的某个 Database 下创建。但由于临时表基于 Session，因此其命名不受唯一性约束。您可以在不同 Session 中创建同名临时表，或创建与其他内表同名的临时表。

如果同一 Database 中同时存在同名的临时表和非临时表，临时表具有最高访问优先级。在该 Session 内，所有针对同名表的查询和操作仅对临时表生效（除创建物化视图外）。
:::

## 用法

### 创建临时表
各种模型的表都可以被定义为临时表， 不论是 Unique、Aggregate 或是 Duplicate 模型。可以在下列 SQL 中添加 TEMPORARY 关键字创建临时表：
-  [CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
-  [CREATE TABLE AS SELECT](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
-  [CREATE TABLE LIKE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)

临时表的其它用法基本和普通内表相同。除上述 Create 语句外， 其它 DDL 及 DML 语句无需添加 TEMPORARY 关键字。

## 注意事项

- 临时表只能在 Internal Catalog 中创建
- 建表时 `ENGINE` 必须为 `OLAP`
- 不支持使用 Alter 语句修改临时表
- 由于临时性，不支持基于临时表创建视图和物化视图
- 不支持备份临时表，不支持使用 CCR / Sync Job 同步临时表
- 不支持导出、Stream Load、Broker Load、S3 Load、Mysql Load、Routine Load、Spark Load
- 删除临时表时，不进回收站，直接彻底删除
