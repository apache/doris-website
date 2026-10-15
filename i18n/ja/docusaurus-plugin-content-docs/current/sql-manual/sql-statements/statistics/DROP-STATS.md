---
{
    "title": "DROP STATS",
    "language": "ja",
    "description": "指定したテーブルと列の統計情報を削除します。列名を指定しない場合は、すべての列の統計情報を削除します。"
}
---

## 説明

指定したテーブルと列の統計情報を削除します。列名を指定しない場合は、すべての列の統計情報を削除します。

## 構文

```sql
DROP STATS <table_name> [ <column_names> ]
```

ここで:

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```

## 必須パラメータ

**<table_name>**

> テーブルの識別子（名前）。

## 任意パラメータ

**<column_names>**

> 列の識別子（名前）のリスト。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| DROP_PRIV | テーブル |       |

## 例

- table1 のすべての列の統計情報を削除する

  ```sql
  DROP STATS table1
  ```
- table1 の col1 と col2 の統計情報を削除する

  ```sql
  DROP STATS table1 (col1, col2)
  ```
