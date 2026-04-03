---
{
  "title": "DROP INDEX",
  "language": "ja",
  "description": "このステートメントは、テーブルから指定された名前のインデックスを削除するために使用されます。現在、inverted indexとann indexのみがサポートされています。"
}
---
## 説明

このステートメントは、テーブルから指定された名前のインデックスを削除するために使用されます。現在、inverted indexとann indexのみがサポートされています。

## 構文

```sql
DROP INDEX [ IF EXISTS ] <index_name> ON [ <db_name> . ] <table_name>;
```
## 必須パラメータ

**1. `<index_name>`**: インデックスの名前。

**2. `<table_name>`**: インデックスが属するテーブルの名前。

## オプションパラメータ

**1. `<db_name>`**: データベース名、オプション。指定されない場合、デフォルトで現在のデータベースが使用されます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限            | オブジェクト             | 備考                                         |
|:---------------------|:-------------------|:----------------------------------------------|
| ALTER_PRIV           | Table              | DROP INDEXはテーブルに対するALTER操作です |

## 例

- drop index

   ```sql
   DROP INDEX IF EXISTS index_name ON table1 ;
   ```
