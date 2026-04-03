---
{
  "title": "ANALYZE",
  "description": "この文は列統計を収集するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは列の統計情報を収集するために使用されます。列の統計情報は、table（特定の列を指定可能）またはデータベース全体に対して収集することができます。

## 構文

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] ];
```
## 必須パラメータ

**1. `<table_name>`**

> 指定されたターゲットTable。このパラメータと<database_name>パラメータは、そのうちの1つのみを指定する必要があり、指定できるのは1つのみです。

**2. `<database_name>`**

> 指定されたターゲットデータベース。このパラメータと<table_name>パラメータは、そのうちの1つのみを指定する必要があり、指定できるのは1つのみです。

## オプションパラメータ

**1. `<column_name>`**

> 指定されたターゲットカラム。`table_name`内の既存のカラムである必要があります。カンマで区切って複数のカラム名を指定できます。

**2. `WITH SYNC`**

> 統計情報を同期的に収集します。収集後に戻ります。指定されていない場合、非同期で実行されます。

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> 収集にサンプリング方式を使用することを指定します。指定されていない場合、デフォルトでフル収集が行われます。<sample_rate>はサンプリングパラメータです。PERCENTサンプリングを使用する場合、サンプリング率を指定します。ROWSサンプリングを使用する場合、サンプリングする行数を指定します。

## 戻り値

| Column | Note           |
| -- |--------------|
| Job_Id | 一意のJob Id           |
| Catalog_Name |   Catalog名           |
| DB_Name | database名           |
| Columns | column名リスト        |

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | ANALYZEを実行する際、クエリ対象Tableに対するSELECT_PRIV権限が必要です。 |

## 例

1. Tablelineitemの10%をサンプリングして統計情報を収集する。

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```
2. Tablelineitemから100,000行をサンプリングして統計情報を収集する。

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
