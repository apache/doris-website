---
{
    "title": "DROP WORKLOAD GROUP",
    "language": "zh-CN",
    "description": "该语句用于删除资源组。"
}
---

## 描述

该语句用于删除资源组。


## 语法

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>'
```

## 示例

1. 删除名为 g1 的资源组：
    
    ```sql
    drop workload group if exists g1;
    ```
