---
{
    "title": "DROP-SQL-BLOCK-RULE",
    "language": "zh-CN"
}
---

## DROP-SQL-BLOCK-RULE

### Name

DROP SQL BLOCK RULE

## 描述

删除SQL阻止规则，支持多规则，以,隔开

语法：

```sql
DROP SQL_BLOCK_RULE test_rule1,...
```

## 举例

1. 删除test_rule1、test_rule2阻止规则

   ```sql
   mysql> DROP SQL_BLOCK_RULE test_rule1,test_rule2;
   Query OK, 0 rows affected (0.00 sec)
   ```

### Keywords

```text
DROP, SQL_BLOCK_RULE
```

### Best Practice

