---
{
  "title": "DROP INDEX",
  "description": "この文は、tableから指定された名前のインデックスを削除するために使用されます。現在、bitmapインデックスのみがサポートされています。",
  "language": "ja"
}
---
## 説明

このステートメントは、tableから指定された名前のインデックスを削除するために使用されます。現在、bitmapインデックスのみがサポートされています。

## 構文

```sql
DROP INDEX [ IF EXISTS ] <index_name> ON [ <db_name> . ] <table_name>;
```
## 必須パラメータ

**1. `<index_name>`**: インデックスの名前。

**2. `<table_name>`**: インデックスが属するTableの名前。

## オプションパラメータ

**1. `<db_name>`**: データベース名、オプション。指定されない場合、デフォルトで現在のデータベースが使用されます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限                  | オブジェクト        | 注意事項                                       |
|:---------------------|:-------------------|:----------------------------------------------|
| ALTER_PRIV           | Table              | DROP INDEXはTableに対するALTER操作です       |

## 例

- drop index

   ```sql
   DROP INDEX IF NOT EXISTS index_name ON table1 ;
   ```
