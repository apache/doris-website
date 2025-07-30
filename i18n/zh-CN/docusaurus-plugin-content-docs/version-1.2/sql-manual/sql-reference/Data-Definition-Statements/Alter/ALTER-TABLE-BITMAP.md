---
{
    "title": "ALTER-TABLE-BITMAP",
    "language": "zh-CN"
}
---

## ALTER-TABLE-BITMAP

### Name

ALTER  TABLE  BITMAP

## 描述

该语句用于对已有 table 进行 bitmap index 操作。

语法：

```sql
ALTER TABLE [database.]table alter_clause;
```

bitmap index 的 alter_clause 支持如下几种修改方式

1. 创建bitmap 索引

语法：

```sql
ADD INDEX [IF NOT EXISTS] index_name (column [, ...],) [USING BITMAP] [COMMENT 'balabala'];
```

注意：

- 目前仅支持bitmap 索引
- BITMAP 索引仅在单列上创建

2. 删除索引

语法：

```sql
DROP INDEX [IF EXISTS] index_name；
```

## 举例

1. 在table1 上为siteid 创建bitmap 索引

```sql
ALTER TABLE table1 ADD INDEX [IF NOT EXISTS] index_name (siteid) [USING BITMAP] COMMENT 'balabala';
```

2. 删除table1 上的siteid列的bitmap 索引

```sql
ALTER TABLE table1 DROP INDEX [IF EXISTS] index_name;
```

### Keywords

```text
ALTER, TABLE, BITMAP, INDEX, ALTER TABLE
```

### Best Practice

