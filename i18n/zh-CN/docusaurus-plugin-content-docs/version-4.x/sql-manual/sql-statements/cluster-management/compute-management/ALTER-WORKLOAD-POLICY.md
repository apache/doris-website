---
{
    "title": "ALTER WORKLOAD POLICY",
    "language": "zh-CN",
    "description": "修改一个 Workload Policy 的属性，目前只支持修改属性，不支持修改 action 和 condition。"
}
---

## 描述

修改一个 Workload Policy 的属性，目前只支持修改属性，不支持修改 action 和 condition。

## 语法

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## 必选参数

1. `<workload_policy_name>`: Workload Policy 的 Name

2. `<properties>`:

    - enabled，取值为 true 或 false，默认值为 true，表示当前 Policy 处于启用状态，false 表示当前 Policy 处于禁用状态。
    - priority，取值范围为 0 到 100 的正整数，默认值为 0，代表 Policy 的优先级，该值越大，优先级越高。这个属性的主要作用是，当匹配到多个 Policy 时，选择优先级最高的 Policy。
    - workload_group，目前一个 Policy 可以绑定一个 Workload Group，代表这个 Policy 只对某个 Workload Group 生效。默认为空，代表对所有查询生效。

        由于 Workload Group 自身归属于 Compute Group，因此该属性的取值需要按以下规则书写：

        - **存算分离模式（Cloud 模式）**：必须使用完整的 `<compute_group>.<workload_group>` 形式，例如 `'workload_group'='compute_group_a.wg1'`。如果使用裸的 `<workload_group>` 形式、出现多于一个的 `.`、或前后存在空段（如 `.wg1`、`wg1.`），都会被拒绝并抛出 `workload_group must be '<compute_group>.<workload_group>' in cloud mode` 错误。
        - **存算一体模式（非 Cloud 模式）**：支持以下两种形式：
            - `<workload_group>`：默认绑定到默认 Resource Group（`default`）下的同名 Workload Group。
            - `<resource_group>.<workload_group>`：显式指定 Resource Group。此处的前缀实际指代 Resource Group（Tag），与存算分离模式共用语法只是为了形式统一。
            
            同样不允许多于一个的 `.` 或空段，违反将抛出 `workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode` 错误。

## 权限控制

至少具有`ADMIN_PRIV`权限

## 示例

1. 禁用一个 Workload Policy

    ```Java
    alter workload policy cancel_big_query properties('enabled'='false')
    ```