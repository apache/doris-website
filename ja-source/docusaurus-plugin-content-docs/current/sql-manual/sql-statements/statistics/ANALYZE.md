---
{
  "title": "分析する",
  "language": "ja",
  "description": "このステートメントはcolumn statisticsを収集するために使用されます。"
}
---
## 説明

このステートメントは列統計の収集に使用されます。列の統計は、テーブル（特定の列を指定可能）またはデータベース全体に対して収集できます。

## 構文

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] ];
```
## 必須パラメータ

**1. `<table_name>`**

> 指定するターゲットテーブル。このパラメータと<database_name>パラメータは、どちらか一方のみを指定する必要があります。

**2. `<database_name>`**

> 指定するターゲットデータベース。このパラメータと<table_name>パラメータは、どちらか一方のみを指定する必要があります。

## オプションパラメータ

**1. `<column_name>`**

> 指定するターゲットカラム。`table_name`に存在するカラムである必要があります。カンマで区切って複数のカラム名を指定できます。

**2. `WITH SYNC`**

> 統計情報を同期的に収集します。収集後に結果を返します。指定されない場合は、非同期で実行されます。

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> 収集にサンプリング方法を使用することを指定します。指定されない場合は、デフォルトで完全収集が行われます。<sample_rate>はサンプリングパラメータです。PERCENTサンプリングを使用する場合は、サンプリング割合を指定します。ROWSサンプリングを使用する場合は、サンプリングする行数を指定します。

## 戻り値

| Column | Note           |
| -- |--------------|
| Job_Id | 一意のJob Id           |
| Catalog_Name |   Catalog名           |
| DB_Name | データベース名           |
| Columns | カラム名リスト        |

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | Notes                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | ANALYZEを実行する際は、クエリ対象テーブルのSELECT_PRIV権限が必要です。 |

## 例

1. テーブルlineitemの10%をサンプリングして統計情報を収集する。

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```
2. table lineitemから100,000行をサンプリングして統計を収集します。

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
