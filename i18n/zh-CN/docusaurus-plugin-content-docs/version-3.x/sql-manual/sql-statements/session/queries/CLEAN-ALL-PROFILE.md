---
{
    "title": "CLEAN PROFILE",
    "language": "zh-CN",
    "description": "用于手动清理所有历史 query 或 load 的 profile 信息。"
}
---

## 描述

用于手动清理所有历史 query 或 load 的 profile 信息。

## 语法

```sql
CLEAN ALL PROFILE
```

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
|:--------------|:-----------|:--------------------------|
| GRANT_PRIV         | 数据库          | 若执行 CLEAN 语句需要获得 GRANT 权限 |

## 示例

```sql
CLEAN ALL PROFILE
```



