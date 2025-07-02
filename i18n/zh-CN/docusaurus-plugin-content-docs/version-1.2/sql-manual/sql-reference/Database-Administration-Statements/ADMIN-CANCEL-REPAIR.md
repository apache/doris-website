---
{
    "title": "ADMIN-CANCEL-REPAIR",
    "language": "zh-CN"
}
---

## ADMIN-CANCEL-REPAIR

### Name

ADMIN CANCEL REPAIR

## 描述

该语句用于取消以高优先级修复指定表或分区

语法：

```sql
ADMIN CANCEL REPAIR TABLE table_name[ PARTITION (p1,...)];
```

说明：

1. 该语句仅表示系统不再以高优先级修复指定表或分区的分片副本。系统仍会以默认调度方式修复副本。

## 举例

 1. 取消高优先级修复

       ```sql
        ADMIN CANCEL REPAIR TABLE tbl PARTITION(p1);
       ```

### Keywords

    ADMIN, CANCEL, REPAIR

### Best Practice

