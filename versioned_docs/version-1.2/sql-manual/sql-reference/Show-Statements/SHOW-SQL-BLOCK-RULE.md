---
{
    "title": "SHOW-SQL-BLOCK-RULE",
    "language": "en"
}
---

## SQL-BLOCK-RULE

### Name

SHOW SQL BLOCK RULE

### Description

View the configured SQL blocking rules. If you do not specify a rule name, you will view all rules.

grammar:

```sql
SHOW SQL_BLOCK_RULE [FOR RULE_NAME];
```

### Example

1. View all rules.

    ```sql
    mysql> SHOW SQL_BLOCK_RULE;
    +------------+----------------------------+---------+- -------------+------------+-------------+--------+- -------+
    | Name | Sql | SqlHash | PartitionNum | TabletNum | Cardinality | Global | Enable |
    +------------+----------------------------+---------+- -------------+------------+-------------+--------+- -------+
    | test_rule | select * from order_analysis | NULL | 0 | 0 | 0 | true | true |
    | test_rule2 | NULL | NULL | 30 | 0 | 10000000000 | false | true |
    +------------+----------------------------+---------+- -------------+------------+-------------+--------+- -------+
    2 rows in set (0.01 sec)
    ```
    
2. Make a rule name query

    ```sql
    mysql> SHOW SQL_BLOCK_RULE FOR test_rule2;
    +------------+------+---------+---------------+---- -------+-------------+--------+--------+
    | Name | Sql | SqlHash | PartitionNum | TabletNum | Cardinality | Global | Enable |
    +------------+------+---------+---------------+---- -------+-------------+--------+--------+
    | test_rule2 | NULL | NULL | 30 | 0 | 10000000000 | false | true |
    +------------+------+---------+---------------+---- -------+-------------+--------+--------+
    1 row in set (0.00 sec)
    
    ```
    

### Keywords

    SHOW, SQL_BLOCK_RULE

### Best Practice
