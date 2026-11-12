---
{
    "title": "SHOW-TABLES",
    "language": "zh-CN"
}
---

## SHOW-TABLES

### Name 

SHOW TABLES

## 描述

该语句用于展示当前 db 下所有的 table

语法：

```sql
SHOW [FULL] TABLES [LIKE]
```

说明:

1. LIKE：可按照表名进行模糊查询

## 举例

 1. 查看DB下所有表
    
     ```sql
     mysql> show tables;
     +---------------------------------+
     | Tables_in_demo                  |
     +---------------------------------+
     | ads_client_biz_aggr_di_20220419 |
     | cmy1                            |
     | cmy2                            |
     | intern_theme                    |
     | left_table                      |
     +---------------------------------+
     5 rows in set (0.00 sec)
     ```

2. 按照表名进行模糊查询

   ```sql
   mysql> show tables like '%cm%';
   +----------------+
   | Tables_in_demo |
   +----------------+
   | cmy1           |
   | cmy2           |
   +----------------+
   2 rows in set (0.00 sec)
   ```

### Keywords

    SHOW, TABLES

### Best Practice

