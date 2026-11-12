---
{
    "title": "ANALYZE",
    "language": "ja",
    "description": "このステートメントは、列の統計情報を収集するために使用します。"
}
---

## 説明 {#description}

このステートメントは、列の統計情報を収集するために使用します。テーブル（特定の列を指定可能）またはデータベース全体の列統計情報を収集できます。

## 構文 {#syntax}

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] ];
```

## 必須パラメータ {#required-parameters}

**1. `<table_name>`**

> 指定した対象テーブル。このパラメータと <database_name> パラメータは、いずれか一方のみを指定する必要があります。

**2. `<database_name>`**

> 指定した対象データベース。このパラメータと <table_name> パラメータは、いずれか一方のみを指定する必要があります。

## オプションパラメータ {#optional-parameters}

**1. `<column_name>`**

> 指定した対象列。`table_name` に存在する列である必要があります。複数の列名をカンマ区切りで指定できます。

**2. `WITH SYNC`**

> 統計情報を同期的に収集します。収集が完了すると戻ります。指定しない場合は非同期で実行されます。

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> 収集にサンプリング方式を使用するよう指定します。指定しない場合、デフォルトは全量収集です。<sample_rate> はサンプリングパラメータです。PERCENT サンプリングではサンプリング率を、ROWS サンプリングではサンプリングする行数を指定します。

## 戻り値 {#return-value}

| 列 | 注記           |
| -- |--------------|
| Job_Id | 一意のジョブ ID           |
| Catalog_Name |   Catalog 名           |
| DB_Name | データベース名           |
| Columns | 列名の一覧        |

## アクセス制御要件 {#access-control-requirements}

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 注記                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | テーブル    | ANALYZE の実行時には、クエリ対象テーブルに対する SELECT_PRIV 権限が必要です。 |

## 例 {#examples}

1. lineitem テーブルから 10% をサンプリングして統計情報を収集します。

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```

2. lineitem テーブルから 100,000 行をサンプリングして統計情報を収集します。

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```
