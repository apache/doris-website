---
{
    "title": "SHOW-TABLETS",
    "language": "zh-CN"
}
---

## SHOW-TABLETS

### Name

SHOW TABLETS

## 描述

该语句用于列出指定table的所有tablets（仅管理员使用）

语法：

```sql
SHOW TABLETS FROM [database.]table [PARTITIONS(p1,p2)]
[WHERE where_condition]
[ORDER BY col_name]
[LIMIT [offset,] row_count]
```
1. **Syntax Description:**

where_condition 可以为下列条件之一:
```
Version = version
state = "NORMAL|ROLLUP|CLONE|DECOMMISSION"
BackendId = backend_id
IndexName = rollup_name
```
或者通过`AND`组合的复合条件.

## 举例

1. 列出指定table所有的tablets

    ```sql
    SHOW TABLETS FROM example_db.table_name;
    ```

2. 列出指定partitions的所有tablets

    ```sql
    SHOW TABLETS FROM example_db.table_name PARTITIONS(p1, p2);
    ```

3. 列出某个backend上状态为DECOMMISSION的tablets

    ```sql
    SHOW TABLETS FROM example_db.table_name WHERE state="DECOMMISSION" AND BackendId=11003;
    ```

### Keywords

    SHOW, TABLETS

### Best Practice

