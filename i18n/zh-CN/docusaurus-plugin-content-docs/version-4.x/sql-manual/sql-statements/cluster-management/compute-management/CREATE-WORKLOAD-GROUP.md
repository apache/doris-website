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
[FOR <compute_group>]
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## 参数

1. `<compute_group>`

    指定 Workload Group 绑定的 Compute Group。

    - **存算分离模式（Cloud 模式）**：`FOR <compute_group>` 子句**必须显式指定**，用于将 Workload Group 绑定到具体的 Compute Group。若省略，将报错：`Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **存算一体模式（非 Cloud 模式）**：`FOR <compute_group>` 子句可选。此处的取值实际指代 Resource Group（Tag），并非真正的 Compute Group，语法与存算分离模式保持一致只是为了形式统一。若省略，则默认绑定到默认的 Resource Group（`default`）。

2. `<property>`

    `<property>` 格式为 `<key>` = `<value>`，`<key>` 的具体可选值可以参考 [workload group](../../../../admin-manual/workload-management/workload-group.md).



## 示例

1. 创建名为 g1 的资源组（存算一体模式下，绑定到默认 Resource Group）：

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```

2. 创建名为 g1 的 Workload Group，并绑定到 `compute_group_a`（存算分离模式下该子句必须指定）：

   ```sql
    create workload group if not exists g1 for compute_group_a
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```