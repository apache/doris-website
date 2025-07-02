---
{
    "title": "SHOW-CREATE-MATERIALIZED-VIEW",
    "language": "zh-CN"
}
---

## SHOW-CREATE-MATERIALIZED-VIEW

### Name

SHOW CREATE MATERIALIZED VIEW

## 描述

该语句用于查询创建物化视图的语句。

语法：

```sql
SHOW CREATE MATERIALIZED VIEW mv_name ON table_name
```

1. mv_name:
        物化视图的名称。必填项。

2. table_name:
        物化视图所属的表名。必填项。

## 举例

创建物化视图的语句为

```sql
create materialized view id_col1 as select id,col1 from table3;
```

查询后返回

```sql
mysql> show create materialized view id_col1 on table3;
+-----------+----------+----------------------------------------------------------------+
| TableName | ViewName | CreateStmt                                                     |
+-----------+----------+----------------------------------------------------------------+
| table3    | id_col1  | create materialized view id_col1 as select id,col1 from table3 |
+-----------+----------+----------------------------------------------------------------+
1 row in set (0.00 sec)
```

### Keywords

    SHOW, MATERIALIZED, VIEW

### Best Practice

