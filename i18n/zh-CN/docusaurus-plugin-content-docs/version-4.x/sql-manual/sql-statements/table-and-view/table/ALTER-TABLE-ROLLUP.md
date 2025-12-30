---
{
    "title": "ALTER TABLE ROLLUP",
    "language": "zh-CN",
    "description": "该语句用于对已有 table 进行 rollup 进行修改操作。rollup 是异步操作，任务提交成功则返回，之后可使用SHOW ALTER 命令查看进度。"
}
---

## 描述

该语句用于对已有 table 进行 rollup 进行修改操作。rollup 是异步操作，任务提交成功则返回，之后可使用[SHOW ALTER](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE) 命令查看进度。

语法：

```sql
ALTER TABLE [database.]table alter_clause;
```

rollup 的 alter_clause 支持如下几种创建方式

1. 创建 rollup index

语法：

```sql
ADD ROLLUP rollup_name (column_name1, column_name2, ...)
[FROM from_index_name]
[PROPERTIES ("key"="value", ...)]
```

 properties: 支持设置超时时间，默认超时时间为 1 天。

2. 批量创建 rollup index

语法：

```sql
ADD ROLLUP [rollup_name (column_name1, column_name2, ...)
                    [FROM from_index_name]
                    [PROPERTIES ("key"="value", ...)],...]
```

注意：

- 如果没有指定 from_index_name，则默认从 base index 创建
- rollup 表中的列必须是 from_index 中已有的列
- 在 properties 中，可以指定存储格式。具体请参阅 [CREATE TABLE](./CREATE-TABLE)

3. 删除 rollup index

 语法：

```sql
DROP ROLLUP rollup_name [PROPERTIES ("key"="value", ...)]
```

4. 批量删除 rollup index

语法：

```sql
DROP ROLLUP [rollup_name [PROPERTIES ("key"="value", ...)],...]
```

注意：

- 不能删除 base index

## 示例

1. 创建 index: example_rollup_index，基于 base index（k1,k2,k3,v1,v2）。列式存储。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1, v2);
```

2. 创建 index: example_rollup_index2，基于 example_rollup_index（k1,k3,v1,v2）

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index2 (k1, v1)
FROM example_rollup_index;
```

3. 创建 index: example_rollup_index3, 基于 base index (k1,k2,k3,v1), 自定义 rollup 超时时间一小时。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1)
PROPERTIES("timeout" = "3600");
```

4. 删除 index: example_rollup_index2

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2;
```

5. 批量删除 Rollup

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2,example_rollup_index3;
```

## 关键词

```text
ALTER, TABLE, ROLLUP, ALTER TABLE
```



