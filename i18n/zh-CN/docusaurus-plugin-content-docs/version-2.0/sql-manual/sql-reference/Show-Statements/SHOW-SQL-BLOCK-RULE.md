---
{
    "title": "SHOW-SQL-BLOCK-RULE",
    "language": "zh-CN"
}
---

## SHOW-SQL-BLOCK-RULE

### Name

SHOW SQL  BLOCK RULE

## 描述

查看已配置的SQL阻止规则，不指定规则名则为查看所有规则。

语法：

```sql
SHOW SQL_BLOCK_RULE [FOR RULE_NAME];
```

## 举例

1. 查看所有规则。

    ```sql
    mysql> SHOW SQL_BLOCK_RULE;
    +------------+------------------------+---------+--------------+-----------+-------------+--------+--------+
    | Name       | Sql                    | SqlHash | PartitionNum | TabletNum | Cardinality | Global | Enable |
    +------------+------------------------+---------+--------------+-----------+-------------+--------+--------+
    | test_rule  | select * from order_analysis | NULL    | 0            | 0         | 0           | true   | true   |
    | test_rule2 | NULL                   | NULL    | 30           | 0         | 10000000000 | false  | true   |
    +------------+------------------------+---------+--------------+-----------+-------------+--------+--------+
    2 rows in set (0.01 sec)
    ```
    
2. 指定规则名查询

    ```sql
    mysql> SHOW SQL_BLOCK_RULE FOR test_rule2;
    +------------+------+---------+--------------+-----------+-------------+--------+--------+
    | Name       | Sql  | SqlHash | PartitionNum | TabletNum | Cardinality | Global | Enable |
    +------------+------+---------+--------------+-----------+-------------+--------+--------+
    | test_rule2 | NULL | NULL    | 30           | 0         | 10000000000 | false  | true   |
    +------------+------+---------+--------------+-----------+-------------+--------+--------+
    1 row in set (0.00 sec)
    
    ```
    

### Keywords

    SHOW, SQL_BLOCK_RULE

### Best Practice

