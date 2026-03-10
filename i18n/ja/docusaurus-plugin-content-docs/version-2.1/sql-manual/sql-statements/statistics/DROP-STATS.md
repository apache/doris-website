---
{
  "title": "DROP STATS",
  "language": "ja",
  "description": "指定されたテーブルと列の統計情報を削除します。列名が指定されていない場合、"
}
---
## 説明

指定されたテーブルと列の統計情報を削除します。列名が指定されていない場合、すべての列の統計情報が削除されます。

## 構文

```sql
DROP STATS <table_name> [ <column_names> ]
```
ここで：

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```
## 必須パラメータ

**<table_name>**

> テーブルの識別子（名前）。

## オプションパラメータ

**<column_names>**

> カラム識別子（名前）のリスト。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 注記 |
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
