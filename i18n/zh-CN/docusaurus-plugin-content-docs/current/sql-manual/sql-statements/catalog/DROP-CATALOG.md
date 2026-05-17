---
{
    "title": "DROP CATALOG",
    "language": "zh-CN",
    "description": "该语句用于删除外部数据目录（catalog）"
}
---

## 描述

该语句用于删除外部数据目录（catalog）

## 语法

```sql
DROP CATALOG [IF EXISTS] <catalog_name>;
```

## 必选参数

**1. `<catalog_name>`**

需要删除 catalog 的名字

## 权限控制
| 权限（Privilege） | 对象（Object） | 说明（Notes）                |
|:--------------|:-----------|:-------------------------|
| DROP_PRIV     | Catalog    | 需要有对应 catalog 的 DROP_PRIV 权限 |

## 示例

1. 删除数据目录 hive

   ```sql
   DROP CATALOG hive;
   ```