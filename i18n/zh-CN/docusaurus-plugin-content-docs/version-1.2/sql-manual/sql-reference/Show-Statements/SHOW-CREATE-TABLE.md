---
{
    "title": "SHOW-CREATE-TABLE",
    "language": "zh-CN"
}
---

## SHOW-CREATE-TABLE

### Name

SHOW CREATE TABLE

## 描述

该语句用于展示数据表的创建语句.

语法：

```sql
SHOW CREATE TABLE [DBNAME.]TABLE_NAME
```

说明：

1. `DBNAMNE` : 数据库名称
2. `TABLE_NAME` : 表名

## 举例

1. 查看某个表的建表语句

   ```sql
   SHOW CREATE TABLE demo.tb1
   ```

### Keywords

    SHOW, CREATE, TABLE

### Best Practice

