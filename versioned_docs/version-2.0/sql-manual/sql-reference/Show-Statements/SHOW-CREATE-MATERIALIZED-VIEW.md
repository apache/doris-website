---
{
    "title": "SHOW-CREATE-MATERIALIZED-VIEW",
    "language": "en"
}
---

## SHOW-CREATE-MATERIALIZED-VIEW

### Name

SHOW CREATE MATERIALIZED VIEW

### Description

This statement is used to query statements that create materialized views.

grammar：

```sql
SHOW CREATE MATERIALIZED VIEW mv_name ON table_name
```

1. mv_name:
   Materialized view name. required.

2. table_name:
   The table name of materialized view. required.

### Example

Create materialized view

```sql
create materialized view id_col1 as select id,col1 from table3;
```

Return after query

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

