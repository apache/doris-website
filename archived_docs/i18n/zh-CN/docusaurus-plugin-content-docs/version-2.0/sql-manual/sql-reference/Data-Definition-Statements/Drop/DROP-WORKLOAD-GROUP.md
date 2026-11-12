---
{
    "title": "DROP-WORKLOAD-GROUP",
    "language": "zh-CN"
}
---

## DROP-WORKLOAD-GROUP

### Name

DROP WORKLOAD GROUP

## 描述

 

该语句用于删除资源组。

```sql
DROP WORKLOAD GROUP [IF EXISTS] 'rg_name'
```

## 举例

1. 删除名为 g1 的资源组：
    
    ```sql
    drop workload group if exists g1;
    ```

### Keywords

    DROP, WORKLOAD, GROUP

### Best Practice

