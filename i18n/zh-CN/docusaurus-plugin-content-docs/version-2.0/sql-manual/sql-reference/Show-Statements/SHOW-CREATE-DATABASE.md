---
{
    "title": "SHOW-CREATE-DATABASE",
    "language": "zh-CN"
}
---

## SHOW-CREATE-DATABASE

### Name

SHOW CREATE DATABASE

## 描述

该语句查看doris数据库的创建情况。

语法：

```sql
SHOW CREATE DATABASE db_name;
```

说明：

- `db_name`: 为doris存在的数据库名称。

## 举例

1. 查看doris中test数据库的创建情况

   ```sql
   mysql> SHOW CREATE DATABASE test;
   +----------+------------------------+
   | Database | Create Database        |
   +----------+------------------------+
   | test     | CREATE DATABASE `test` |
   +----------+------------------------+
   1 row in set (0.00 sec)
   ```

### Keywords

    SHOW, CREATE, DATABASE

### Best Practice

