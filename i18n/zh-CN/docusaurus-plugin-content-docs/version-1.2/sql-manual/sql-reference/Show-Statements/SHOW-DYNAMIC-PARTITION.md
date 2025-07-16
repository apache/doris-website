---
{
    "title": "SHOW-DYNAMIC-PARTITION",
    "language": "zh-CN"
}
---

## SHOW-DYNAMIC-PARTITION

### Name

SHOW DYNAMIC

## 描述

该语句用于展示当前db下所有的动态分区表状态

语法：

```sql
SHOW DYNAMIC PARTITION TABLES [FROM db_name];
```

## 举例

 1. 展示数据库 database 的所有动态分区表状态
    
     ```sql
     SHOW DYNAMIC PARTITION TABLES FROM database;
     ```

### Keywords

    SHOW, DYNAMIC, PARTITION

### Best Practice

