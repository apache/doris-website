---
{
"title": "ALTER-WORKLOAD-GROUP",
"language": "zh-CN"
}
---

## ALTER-WORKLOAD-GROUP

### Name

ALTER WORKLOAD GROUP 

 

## 描述

该语句用于修改资源组。

语法：

```sql
ALTER WORKLOAD GROUP  "rg_name"
PROPERTIES (
    property_list
);
```

注意：

* 修改 memory_limit 属性时不可使所有 memory_limit 值的总和超过100%；
* 支持修改部分属性，例如只修改cpu_share的话，properties里只填cpu_share即可。

## 举例

1. 修改名为 g1 的资源组：

    ```sql
    alter workload group g1
    properties (
        "cpu_share"="30",
        "memory_limit"="30%"
    );
    ```

### Keywords

```sql
ALTER, WORKLOAD , GROUP
```

### Best Practice
