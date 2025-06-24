---
{
    "title": "ADMIN-SHOW-REPLICA-DISTRIBUTION",
    "language": "zh-CN"
}
---

## ADMIN-SHOW-REPLICA-DISTRIBUTION

### Name

ADMIN SHOW REPLICA DISTRIBUTION

## 描述

该语句用于展示一个表或分区副本分布状态

语法：

```sql
ADMIN SHOW REPLICA DISTRIBUTION FROM [db_name.]tbl_name [PARTITION (p1, ...)];
```

说明：

1. 结果中的 Graph 列以图形的形式展示副本分布比例

## 举例

1. 查看表的副本分布

    ```sql
    ADMIN SHOW REPLICA DISTRIBUTION FROM tbl1;
    ```

 2. 查看表的分区的副本分布

      ```sql
      ADMIN SHOW REPLICA DISTRIBUTION FROM db1.tbl1 PARTITION(p1, p2);
      ```

### Keywords

    ADMIN, SHOW, REPLICA, DISTRIBUTION, ADMIN SHOW

### Best Practice

