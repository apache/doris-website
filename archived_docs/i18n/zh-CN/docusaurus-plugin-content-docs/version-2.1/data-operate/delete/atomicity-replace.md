---
{
    "title": "表原子替换",
    "language": "zh-CN",
    "description": "Doris 支持对两个表进行原子替换操作，仅适用于 OLAP 表。"
}
---

Doris 支持对两个表进行原子替换操作，仅适用于 OLAP 表。

## 适用场景

在某些情况下，用户希望重写表数据，但如果先删除再导入，会有一段时间无法查看数据。此时，用户可以先使用 `CREATE TABLE LIKE` 语句创建一个相同结构的新表，将新数据导入新表后，通过替换操作原子替换旧表。分区级别的原子覆盖写操作，请参阅 [临时分区文档](../delete/table-temp-partition)。

## 语法说明

```Plain
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

将表 tbl1 替换为表 tbl2。

如果 `swap` 参数为 `true`，替换后，tbl1 表中的数据为原 tbl2 表中的数据，tbl2 表中的数据为原 tbl1 表中的数据，即两张表数据互换。

如果 `swap` 参数为 `false`，替换后，tbl1 表中的数据为原 tbl2 表中的数据，tbl2 表被删除。

## 原理

替换表功能将以下操作集合变成一个原子操作。

假设将表 A 替换为表 B，且 `swap` 为 `true`，操作如下：

1. 将表 B 重命名为表 A。
2. 将表 A 重命名为表 B。

如果 `swap` 为 `false`，操作如下：

1. 删除表 A。
2. 将表 B 重命名为表 A。

## 注意事项

- 如果 `swap` 参数为 `false`，被替换的表（表 A）将被删除，且无法恢复。
- 替换操作仅能发生在两张 OLAP 表之间，不检查两张表的表结构是否一致。
- 替换操作不会改变原有的权限设置，因为权限检查以表名称为准。
