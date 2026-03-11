---
{
  "title": "SHOW CREATE CATALOG",
  "description": "この文は doris catalog の作成文を表示します。",
  "language": "ja"
}
---
## デスクリプション

この文はdoris catalogの作成文を表示します。

## Syntax

```sql
SHOW CREATE CATALOG <catalog_name>;
```
## 必須パラメータ

**1. `<catalog_name>`**

作成文を表示する必要があるカタログの名前。

## アクセス制御要件
| 権限                                                                                    | オブジェクト  | 備考                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | カタログ | 上記の権限のいずれかが必要です。 |


## 例

1. dorisでoracleカタログの作成文を表示する

   ```sql
   SHOW CREATE CATALOG oracle;
   ```
   ```sql
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | カタログ | CreateCatalog                                                                                                        |
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
