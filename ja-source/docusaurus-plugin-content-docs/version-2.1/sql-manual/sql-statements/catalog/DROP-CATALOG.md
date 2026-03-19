---
{
  "title": "DROP CATALOG",
  "language": "ja",
  "description": "この文は外部カタログを削除するために使用されます。"
}
---
## 説明

このステートメントは外部カタログを削除するために使用されます。

## 構文

```sql
DROP CATALOG [IF EXISTS] <catalog_name>;
```
## 必須パラメータ

**1. `<catalog_name>`**
削除するカタログの名前。

## アクセス制御要件
| 権限 | オブジェクト  | 備考                                                               |
|:----------|:--------|:--------------------------------------------------------------------|
| DROP_PRIV | Catalog | 対応するカタログに対するDROP_PRIV権限が必要です。 |


## 例

1. catalog hiveを削除

   ```sql
   DROP CATALOG hive;
   ```
