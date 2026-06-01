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
[FOR <compute_group>]
PROPERTIES (
  `<property>`
  [ , ... ]
);
```

:::note
`ALTER` 语句仅用于修改 Workload Group 的属性，**不能修改 Workload Group 与 Compute Group 的绑定关系**。`FOR <compute_group>` 子句用于定位需要修改的 Workload Group 所归属的 Compute Group。
:::

## 参数

1. `<compute_group>`

    指定要修改的 Workload Group 所归属的 Compute Group。

    - **存算分离模式（Cloud 模式）**：`FOR <compute_group>` 子句**必须显式指定**。若省略，将报错：`Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **存算一体模式（非 Cloud 模式）**：`FOR <compute_group>` 子句可选。此处取值实际指代 Resource Group（Tag），语法与存算分离模式保持一致只是为了形式统一。若省略，则默认作用于默认 Resource Group（`default`）下同名的 Workload Group。

2. `<property>`

    `<property>` 格式为 `<key>` = `<value>`，`<key>` 的具体可选值可以参考 [workload group](../../../../admin-manual/workload-management/workload-group.md).


## 示例

1. 修改名为 g1 的资源组（存算一体模式下，作用于默认 Resource Group 中的 g1）：

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```

2. 修改 `compute_group_a` 中名为 g1 的 Workload Group（存算分离模式下该子句必须指定）：

    ```sql
    alter workload group g1 for compute_group_a
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```