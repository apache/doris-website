---
{
    "title": "SHOW CREATE CATALOG",
    "language": "ja",
    "description": "このステートメントは、Doris カタログの作成文を表示します。"
}
---

## 説明

このステートメントは、Doris カタログの作成文を表示します。

## 構文

```sql
SHOW CREATE CATALOG <catalog_name>;
```

## 必須パラメータ

**1. `<catalog_name>`**

作成文を表示するカタログの名前。

## アクセス制御要件
| 権限                                                                                        | オブジェクト | 備考                             |
|:---------------------------------------------------------------------------------------------|:---------------|:---------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | カタログ     | 上記の権限のいずれかが必要です。 |


## 例

1. Doris の oracle カタログの作成文を表示する

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
