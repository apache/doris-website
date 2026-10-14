---
{
    "title": "ANALYZE",
    "language": "ja",
    "description": "この文は列の統計情報を収集するために使用します。"
}
---

## 説明

この文は列の統計情報を収集するために使用します。テーブルの列（特定の列を指定可能）、またはデータベース全体の列について、統計情報を収集できます。

## 構文

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] [ WITH HOT VALUE ] ];
```

## 必須パラメータ

**1. `<table_name>`**

> 対象のテーブルを指定します。このパラメータと <database_name> のうち、いずれか一方のみを指定する必要があります。

**2. `<database_name>`**

> 対象のデータベースを指定します。このパラメータと <table_name> のうち、いずれか一方のみを指定する必要があります。

## オプションパラメータ

**1. `<column_name>`**

> 対象の列を指定します。`table_name` に存在する列である必要があります。列名をカンマで区切って複数指定できます。

**2. `WITH SYNC`**

> 統計情報を同期的に収集します。収集が完了してから処理が戻ります。指定しない場合は非同期で実行されます。

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> サンプリング方式で収集することを指定します。指定しない場合は、デフォルトで全件を収集します。<sample_rate> はサンプリングのパラメータです。PERCENT サンプリングではサンプリングの割合を、ROWS サンプリングではサンプリングする行数を指定します。

**4. `WITH HOT VALUE`**

> 手動で全件収集する際にホット値も収集することを指定します。ホット値は、データの偏りがある場合にオプティマイザが述語をより正確に推定するのに役立ちますが、カーディナリティの高い列では収集時に多くのメモリを消費する可能性があります。このオプションを指定しない場合、Doris は従来の動作を維持します。全件収集ではホット値を収集せず、サンプル収集では常にホット値を収集します。`WITH HOT VALUE` と `WITH SAMPLE` を併用するとエラーになります。

## 戻り値

| 列 | 説明 |
| -- | -- |
| Job_Id | 一意のジョブ ID |
| Catalog_Name | カタログ名 |
| DB_Name | データベース名 |
| Columns | 列名のリスト |

## アクセス制御の要件

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 説明 |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV | テーブル | ANALYZE を実行するには、照会対象のテーブルに対する SELECT_PRIV 権限が必要です。 |

## 例

1. テーブル lineitem の 10% をサンプリングして統計情報を収集します。

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```

2. テーブル lineitem から 100,000 行をサンプリングして統計情報を収集します。

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

3. 全件の統計情報とホット値を収集します。

```sql
ANALYZE TABLE lineitem WITH SYNC WITH HOT VALUE;
```
