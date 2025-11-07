---
{
    "title": "DROP-DATABASE",
    "language": "zh-CN"
}
---

## DROP-DATABASE

### Name 

DOPR DATABASE

## 描述

该语句用于删除数据库（database）
语法：    

```sql
DROP DATABASE [IF EXISTS] db_name [FORCE];
```

说明：

- 执行 DROP DATABASE 一段时间内，可以通过 RECOVER 语句恢复被删除的数据库。详见 [RECOVER](../../Database-Administration-Statements/RECOVER.md) 语句
- 如果执行 DROP DATABASE FORCE，则系统不会检查该数据库是否存在未完成的事务，数据库将直接被删除并且不能被恢复，一般不建议执行此操作

## 举例

1. 删除数据库 db_test
    
    ```sql
    DROP DATABASE db_test;
    ```
    

### Keywords

    DROP, DATABASE

### Best Practice

