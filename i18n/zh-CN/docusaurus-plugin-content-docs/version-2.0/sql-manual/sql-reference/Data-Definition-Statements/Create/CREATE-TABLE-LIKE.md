---
{
    "title": "CREATE-TABLE-LIKE",
    "language": "zh-CN"
}
---

## CREATE-TABLE-LIKE

### Name

CREATE TABLE LIKE

## 描述

该语句用于创建一个表结构和另一张表完全相同的空表，同时也能够可选复制一些rollup。 

语法：

```sql
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] [database.]table_name LIKE [database.]table_name [WITH ROLLUP (r1,r2,r3,...)]
```

说明: 

- 复制的表结构包括Column Definition、Partitions、Table Properties等 
- 用户需要对复制的原表有`SELECT`权限 
- 支持复制MySQL等外表 
- 支持复制OLAP Table的rollup

## 举例

1. 在test1库下创建一张表结构和table1相同的空表，表名为table2

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1
    ```

2. 在test2库下创建一张表结构和test1.table1相同的空表，表名为table2

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1
    ```

3. 在test1库下创建一张表结构和table1相同的空表，表名为table2，同时复制table1的r1，r2两个rollup

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1 WITH ROLLUP (r1,r2)
    ```

4. 在test1库下创建一张表结构和table1相同的空表，表名为table2，同时复制table1的所有rollup

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1 WITH ROLLUP
    ```

5. 在test2库下创建一张表结构和test1.table1相同的空表，表名为table2，同时复制table1的r1，r2两个rollup

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1 WITH ROLLUP (r1,r2)
    ```

6. 在test2库下创建一张表结构和test1.table1相同的空表，表名为table2，同时复制table1的所有rollup

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1 WITH ROLLUP
    ```

7. 在test1库下创建一张表结构和MySQL外表table1相同的空表，表名为table2

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1
    ```

### Keywords

    CREATE, TABLE, LIKE

### Best Practice

