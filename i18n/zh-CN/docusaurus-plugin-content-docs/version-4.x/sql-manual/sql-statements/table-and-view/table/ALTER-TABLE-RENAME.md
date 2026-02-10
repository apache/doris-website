---
{
    "title": "ALTER TABLE RENAME",
    "language": "zh-CN",
    "description": "该语句用于对已有 table 属性的某些名称进行重命名操作。这个操作是同步的，命令返回表示执行完毕。"
}
---

## 描述

该语句用于对已有 table 属性的某些名称进行重命名操作。这个操作是同步的，命令返回表示执行完毕。

语法：

```sql
ALTER TABLE [database.]table alter_clause;
```

rename 的 alter_clause 支持对以下名称进行修改

1. 修改表名

语法：

```sql
RENAME new_table_name;
```

2. 修改 rollup index 名称

 语法：

```sql
RENAME ROLLUP old_rollup_name new_rollup_name;
```

3. 修改 partition 名称

语法：

```sql
RENAME PARTITION old_partition_name new_partition_name;    
```

4.  修改 column 名称
  
修改 column 名称

语法：

```sql
RENAME COLUMN old_column_name new_column_name;    
```

注意：
- 建表时需要在 property 中设置 light_schema_change=true


## 示例

1. 将名为 table1 的表修改为 table2

```sql
ALTER TABLE table1 RENAME table2;
```

2. 将表 example_table 中名为 rollup1 的 rollup index 修改为 rollup2

```sql
ALTER TABLE example_table RENAME ROLLUP rollup1 rollup2;
```

3. 将表 example_table 中名为 p1 的 partition 修改为 p2

```sql
ALTER TABLE example_table RENAME PARTITION p1 p2;
```

4. 将表 example_table 中名为 c1 的 column 修改为 c2

```sql
ALTER TABLE example_table RENAME COLUMN c1 c2;
```

## 关键词

```text
ALTER, TABLE, RENAME, ALTER TABLE
```



