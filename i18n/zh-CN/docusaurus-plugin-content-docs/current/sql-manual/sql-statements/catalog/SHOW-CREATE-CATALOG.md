---
{
    "title": "SHOW CREATE CATALOG",
    "language": "zh-CN",
    "description": "该语句查看 Doris 数据目录的创建语句。"
}
---

## 描述

该语句查看 Doris 数据目录的创建语句。

## 属性脱敏

统一脱敏规则计划在 Doris 4.2.0、5.0 及后续版本支持。敏感属性展示为 `*XXX`，部分内部属性直接省略；明确的 JDBC 连接串整值遮蔽，普通 URI 按值清理 userinfo、秘密参数和签名。完整规则见 [Catalog 属性脱敏](../../../lakehouse/catalog-property-masking.md)。下例使用此规则，不表示 4.0、4.1 或 3.x 的行为。 示例中的 `*XXX` 是实际脱敏标记，其他 `XXX` 是示例占位符。

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
   ```text
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | Catalog | CreateCatalog                                                                                                        |
    +---------+----------------------------------------------------------------------------------------------------------------------+
    | oracle  |
    CREATE CATALOG `oracle` PROPERTIES (
    "user" = "XXX",
    "type" = "jdbc",
    "password" = "*XXX",
    "jdbc_url" = "*XXX",
    "driver_url" = "XXX",
    "driver_class" = "oracle.jdbc.driver.OracleDriver",
    "checksum" = "XXX"
    ); |
    +---------+----------------------------------------------------------------------------------------------------------------------+
   ```