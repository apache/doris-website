---
{
    "title": "ALTER WORKLOAD GROUP",
    "language": "zh-CN",
    "description": "该语句用于修改资源组。"
}
---

## 描述

该语句用于修改资源组。

## 语法

```sql
ALTER WORKLOAD GROUP  "<rg_name>"
PROPERTIES (
  `<property>`
  [ , ... ]
);
```

## 参数

1.`<property>`

`<property>` 格式为 `<key>` = `<value>`，`<key>`的具体可选值可以参考[workload group](../../../../admin-manual/workload-management/workload-group.md).


## 示例

1. 修改名为 g1 的资源组：

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```