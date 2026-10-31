---
{
    "title": "DROP WORKLOAD POLICY",
    "language": "zh-CN",
    "description": "删除一个 Workload Policy"
}
---

## 描述

删除一个 Workload Policy

## 语法

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```

## 必选参数

1. `<workload_policy_name>`: Workload Policy 的 Name

## 权限控制

至少具有`ADMIN_PRIV`权限

## 示例

1. 删除一个名为 `cancel_big_query` 的 Workload Policy

    ```sql
    drop workload policy if exists cancel_big_query
    ```