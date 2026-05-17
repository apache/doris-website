---
{
    "title": "DROP RESOURCE",
    "language": "zh-CN",
    "description": "该语句用于删除一个已有的资源。仅 root 或 admin 用户可以删除资源。"
}
---

## 描述

该语句用于删除一个已有的资源。仅 root 或 admin 用户可以删除资源。

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
