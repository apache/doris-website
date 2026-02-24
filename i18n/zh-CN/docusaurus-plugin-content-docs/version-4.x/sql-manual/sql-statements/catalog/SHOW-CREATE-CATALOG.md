---
{
    "title": "SHOW CREATE CATALOG",
    "language": "zh-CN",
    "description": "该语句查看 Doris 数据目录的创建语句。"
}
---

## 描述

该语句查看 Doris 数据目录的创建语句。

## 语法

```sql
SHOW CREATE CATALOG <catalog_name>;
```

## 必选参数

**1. `<catalog_name>`**

需要查看创建语句的 catalog 的名字

## 权限控制
| 权限（Privilege）                                                                                | 对象（Object） | 说明（Notes）      |
|:---------------------------------------------------------------------------------------------|:-----------|:---------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog    | 需要有上述权限中的一种就可以 |

## 示例

1. 查看 Doris 中 oracle 数据目录的创建语句

   ```sql
   SHOW CREATE CATALOG oracle;
   ```
   ```sql
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | Catalog | CreateCatalog                                                                                                        |
    +---------+----------------------------------------------------------------------------------------------------------------------+
    | oracle  |
    CREATE CATALOG `oracle` PROPERTIES (
    "user" = "XXX",
    "type" = "jdbc",
    "password" = "*XXX",
    "jdbc_url" = "XXX",
    "driver_url" = "XXX",
    "driver_class" = "oracle.jdbc.driver.OracleDriver",
    "checksum" = "XXX"
    ); |
    +---------+----------------------------------------------------------------------------------------------------------------------+
   ```