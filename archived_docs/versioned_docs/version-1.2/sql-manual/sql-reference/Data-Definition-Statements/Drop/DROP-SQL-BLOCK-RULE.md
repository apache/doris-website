---
{
    "title": "DROP-DATABASE",
    "language": "en"
}
---

## DROP-SQL-BLOCK-RULE

### Name

DROP SQL BLOCK RULE

### Description

Delete SQL blocking rules, support multiple rules, separated by ,

grammar:

```sql
DROP SQL_BLOCK_RULE test_rule1,...
```

### Example

1. Delete the test_rule1 and test_rule2 blocking rules

    ```sql
    mysql> DROP SQL_BLOCK_RULE test_rule1,test_rule2;
    Query OK, 0 rows affected (0.00 sec)
    ```

### Keywords

```text
DROP, SQL_BLOCK_RULE
```

### Best Practice
