---
{
    "title": "CREATE WORKLOAD GROUP",
    "language": "zh-CN",
    "description": "该语句用于创建资源组。资源组可实现单个 be 上 cpu 资源和内存资源的隔离。"
}
---

## 描述

该语句用于创建资源组。资源组可实现单个 be 上 cpu 资源和内存资源的隔离。

## 语法

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "<rg_name>"
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## 参数

1.`<property>`

`<property>` 格式为 `<key>` = `<value>`，`<key>`的具体可选值可以参考[workload group](../../../../admin-manual/workload-management/workload-group.md).



## 示例

1. 创建名为 g1 的资源组：

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```