---
{
  "title": "SHOW TABLE STATS",
  "description": "この文は、tableの概要統計を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、tableの概要統計を表示するために使用されます。

## 構文

```SQL
SHOW TABLE STATS <table_name>;
```
## 必須パラメータ

**1. `<table_name>`**

> Table名

## オプションパラメータ

**なし**

## 戻り値

| Column | Note           |
| -- |--------------|
| updated_rows | Table更新行数           |
| query_times |   Tableクエリ回数           |
| row_count | Table行数           |
| updated_time | Table最終更新時刻        |
| columns | 分析済みカラムリスト           |
| trigger |   最後のanalyze実行方法           |
| new_partition |  新しいパーティションの初回読み込みフラグ           |
| user_inject | ユーザー統計情報注入フラグ         |
| enable_auto_analyze | 自動analyze有効化フラグ         |
| last_analyze_time |   最後のanalyze実行時刻          |

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | SHOWを実行する際、クエリ対象TableのSELECT_PRIV権限が必要です。 |

## 例

1. Tabletest1の概要統計情報を表示します。

```sql
SHOW TABLE STATS test1;
```
```text
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
| updated_rows | query_times | row_count | updated_time        | columns                | trigger | new_partition | user_inject | enable_auto_analyze | last_analyze_time   |
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
| 0            | 0           | 100000    | 2025-01-17 16:46:31 | [test1:name, test1:id] | MANUAL  | false         | false       | true                | 2025-02-05 12:17:41 |
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
```
