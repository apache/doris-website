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
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>' [FOR <compute_group>]
```

## 参数

1. `<compute_group>`

    指定要删除的 Workload Group 所归属的 Compute Group。

    - **存算分离模式（Cloud 模式）**：`FOR <compute_group>` 子句**必须显式指定**。若省略，将报错：`Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **存算一体模式（非 Cloud 模式）**：`FOR <compute_group>` 子句可选。此处取值实际指代 Resource Group（Tag），语法与存算分离模式保持一致只是为了形式统一。若省略，则默认从默认 Resource Group（`default`）中删除同名的 Workload Group。

## 示例

1. 删除名为 g1 的资源组（存算一体模式下，从默认 Resource Group 中删除）：
    
    ```sql
    drop workload group if exists g1;
    ```

2. 从 `compute_group_a` 中删除名为 g1 的 Workload Group（存算分离模式下该子句必须指定）：

    ```sql
    drop workload group if exists g1 for compute_group_a;
    ```
