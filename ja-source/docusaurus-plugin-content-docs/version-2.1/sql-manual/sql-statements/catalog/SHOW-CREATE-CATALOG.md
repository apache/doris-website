---
{
  "title": "SHOW CREATE CATALOG",
  "language": "ja",
  "description": "この文はdorisカタログの作成文を示しています。"
}
---
## 説明

このステートメントはdoris catalogの作成ステートメントを表示します。

## 構文

```sql
SHOW CREATE CATALOG <catalog_name>;
```
## 必須パラメータ

**1. `<catalog_name>`**

作成ステートメントを表示する必要があるカタログの名前。

## アクセス制御要件
| 権限                                                                                    | オブジェクト  | 備考                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | 上記権限のいずれかが必要です。 |


## 例

1. dorisでhive oracleの作成ステートメントを表示

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
