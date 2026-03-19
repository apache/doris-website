---
{
  "title": "DROP STATS",
  "description": "指定されたtableと列の統計情報を削除します。列名が指定されていない場合、",
  "language": "ja"
}
---
## デスクリプション

指定されたtableと列の統計情報を削除します。列名が指定されていない場合、すべての列の統計情報が削除されます。

## Syntax

```sql
DROP STATS <table_name> [ <column_names> ]
```
説明:

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```
## 必須パラメータ

**<table_name>**

> Tableの識別子（名前）。

## オプションパラメータ

**<column_names>**

> カラム識別子（名前）のリスト。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| DROP_PRIV | Table  |       |

## 例

- table1の全カラムの統計情報を削除

  ```sql
  DROP STATS table1
  ```
- table1のcol1とcol2の統計情報を削除する

  ```sql
  DROP STATS table1 (col1, col2)
  ```
