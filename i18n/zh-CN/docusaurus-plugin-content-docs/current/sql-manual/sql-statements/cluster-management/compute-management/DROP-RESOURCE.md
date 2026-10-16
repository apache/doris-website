---
{
    "title": "DROP RESOURCE",
    "language": "zh-CN",
    "description": "该语句用于删除一个已有的资源。仅 root 或 admin 用户可以删除资源。"
}
---

## 描述

该语句用于删除一个已有的资源。仅 root 或 admin 用户可以删除资源。

自 4.1.5 版本起，新建且由 root 创建的 AI Resource 只能由 root 修改或删除，其他 ADMIN 用户也不能操作；升级前没有 root 创建标记的资源不追溯限制。详见 [AI 资源权限](../../../sql-functions/ai-functions/overview.md#创建修改与删除权限415-起)。

## 语法

```sql
DROP RESOURCE '<resource_name>'
```

## 注意事项

正在使用的 ODBC/S3 资源无法删除。

## 示例

1. 删除名为 spark0 的 Spark 资源：
    
    ```sql
    DROP RESOURCE 'spark0';
    ```
