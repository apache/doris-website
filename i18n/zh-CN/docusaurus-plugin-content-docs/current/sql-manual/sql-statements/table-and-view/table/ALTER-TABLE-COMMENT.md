---
{
    "title": "ALTER TABLE COMMENT",
    "language": "zh-CN",
    "description": "该语句用于对已有 table 的 comment 进行修改。这个操作是同步的，命令返回表示执行完毕。"
}
---

## 描述

该语句用于对已有 table 的 comment 进行修改。这个操作是同步的，命令返回表示执行完毕。

语法：

```sql
ALTER TABLE [database.]table alter_clause;
```

1. 修改表注释

语法：

```sql
MODIFY COMMENT "new table comment";
```

2. 修改列注释

 语法：

```sql
MODIFY COLUMN col1 COMMENT "new column comment";
```

## 示例

1. 将名为 table1 的 comment 修改为 table1_comment

```sql
ALTER TABLE table1 MODIFY COMMENT "table1_comment";
```

2. 将名为 table1 的 col1 列的 comment 修改为 table1_col1_comment

```sql
ALTER TABLE table1 MODIFY COLUMN col1 COMMENT "table1_col1_comment";
```

## 关键词

```text
ALTER, TABLE, COMMENT, ALTER TABLE
```

### 最佳实践

