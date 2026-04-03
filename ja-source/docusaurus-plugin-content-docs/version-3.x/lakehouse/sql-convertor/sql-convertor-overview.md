---
{
  "title": "SQL方言変換",
  "description": "バージョン2.1以降、DorisはPresto、Trino、Hive、PostgreSQL、Spark、Clickhouseなど、複数のSQLダイアレクトをサポートできます。",
  "language": "ja"
}
---
バージョン2.1以降、DorisはPresto、Trino、Hive、PostgreSQL、Spark、Clickhouseなど、複数のSQLダイアレクトをサポートできます。この機能により、ユーザーは対応するSQLダイアレクトを直接使用してDoris内のデータをクエリでき、既存のビジネスをDorisにスムーズに移行することが便利になります。

:::note
この機能は現在実験的なものです。使用中に問題が発生した場合は、メーリングリスト、[GitHub Issue](https://github.com/apache/doris/issues)などを通じてお気軽にフィードバックをお寄せください。
:::

## サービスのデプロイ

1. 最新版の[SQL Convertor](https://www.selectdb.com/tools/doris-sql-convertor)をダウンロードします

    :::info
    SQLダイアレクト変換ツールは、オープンソースの[SQLGlot](https://github.com/tobymao/sqlglot)をベースとし、SelectDBによってさらに開発されています。SQLGlotの詳細については、[SQLGlot公式ウェブサイト](https://sqlglot.com/sqlglot.html)を参照してください。

    SQL ConvertorはApache Dorisによって保守またはサポートされているものではありません。これらの作業はCommittersとDoris PMCによって監督されています。これらのリソースやサービスの使用は完全にあなたの判断によるものであり、コミュニティはこれらのツールのライセンスや妥当性を検証する責任を負いません。
    :::

2. 任意のFEノード上で、以下のコマンドでサービスを開始します：

    ```shell
    # Configure service port
    vim apiserver/conf/config.conf

    # Start SQL Converter for Apache Doris conversion service
    sh apiserver/bin/start.sh

    # If a frontend interface is needed, configure the corresponding port in the webserver and start it. If no frontend is needed, you can ignore the following 運用
    vim webserver/conf/config.conf

    # Start the frontend interface
    sh webserver/bin/start.sh
    ```
:::tip
    - このサービスはステートレスであり、いつでも開始または停止できます。

    - `apiserver/conf/config.conf`でポートを設定して利用可能な任意のポートを指定し、workersを設定して開始するスレッド数を指定してください。同時実行シナリオでは、必要に応じて調整できます。デフォルトは1です。

    - 各FEノードで個別のサービスを開始することを推奨します。

    - フロントエンドインターフェースを開始する必要がある場合は、`webserver/conf/config.conf`でSQL Converter for Apache Doris変換サービスのアドレスを設定できます。デフォルトは`API_HOST=http://127.0.0.1:5001`です。
    :::

3. Dorisクラスター（バージョン2.1以上）を開始します

4. 以下のコマンドでDorisにSQL方言変換サービスのURLを設定します：

  `MySQL> set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"`

  - `127.0.0.1:5001`は、SQL方言変換サービスのデプロイメントノードのIPとポートです。

  - バージョン3.0.7以降では、SQL方言変換サービスの高可用性を提供するために複数のURLアドレスを設定できます。詳細については**関連パラメータ**のセクションを参照してください。

## SQL方言の使用

現在サポートされている方言タイプには以下が含まれます：

- `presto`

- `trino`

- `clickhouse`

- `hive`

- `spark`

- `postgres`

例：

### Presto

```sql
CREATE TABLE  test_sqlconvert (
    id INT,
    start_time DATETIME,
    value STRING,
    arr_int ARRAY<INT>,
    arr_str ARRAY<STRING>
) ENGINE=OLAP
DUPLICATE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_sqlconvert VALUES(1, '2024-05-20 13:14:52', '2024-01-14',[1, 2, 3, 3], ['Hello', 'World']);

SET sql_dialect = presto;

SELECT CAST(start_time AS varchar(20)) AS col1,
      array_distinct(arr_int) AS col2,
      FILTER(arr_str, x -> x LIKE '%World%') AS col3,
      to_date(value,'%Y-%m-%d') AS col4,
      YEAR(start_time) AS col5,
      date_add('month', 1, start_time) AS col6,
      REGEXP_EXTRACT_ALL(value, '-.') AS col7,
      JSON_EXTRACT('{"id": "33"}', '$.id')AS col8,
      element_at(arr_int, 1) AS col9,
      date_trunc('day',start_time) AS col10
    FROM test_sqlconvert
    WHERE date_trunc('day',start_time) = DATE '2024-05-20'     
ORDER BY id;
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
```
### Clickhouse

```sql
SET sql_dialect = clickhouse;

SELECT toString(start_time) AS col1,
       arrayCompact(arr_int) AS col2,
       arrayFilter(x -> x LIKE '%World%',arr_str) AS col3,
       toDate(value) AS col4,
       toYear(start_time) AS col5,
       addMonths(start_time, 1) AS col6,
       extractAll(value, '-.') AS col7,
       JSONExtractString('{"id": "33"}' , 'id') AS col8,
       arrayElement(arr_int, 1) AS col9,
       date_trunc('day',start_time) AS col10
    FROM test_sqlconvert
    WHERE date_trunc('day',start_time)= '2024-05-20 00:00:00'     
ORDER BY id;
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| col1                | col2      | col3      | col4       | col5 | col6                | col7        | col8 | col9 | col10               |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
| 2024-05-20 13:14:52 | [1, 2, 3] | ["World"] | 2024-01-14 | 2024 | 2024-06-20 13:14:52 | ['-0','-1'] | "33" |    1 | 2024-05-20 00:00:00 |
+---------------------+-----------+-----------+------------+------+---------------------+-------------+------+------+---------------------+
```
## Serde Dialect

異なるシステムでは、異なる列タイプに対して異なる表示方法を持つ場合があります。

例えば、NULL値については、DorisとHiveは`null`として表示しますが、Trino/Prestoは`NULL`として表示します。

Mapタイプについては、Hiveは`{1:null,2:null}`として表示しますが、Trino/Prestoは{1=NULL, 2=NULL}として表示します。

ユーザーの移行動作の一貫性を可能な限り確保するため、Dorisはdialectシリアライゼーションモードオプションを提供しており、異なるモードに応じて異なる表示フォーマットを返すことができます。

```
SET serde_diactor=<dialect>;
```
現在サポートされているシリアライゼーションモードのタイプは以下の通りです：

- doris（デフォルト）
- hive
- presto/trino

> 注意：この機能はバージョン3.0.6からサポートされています。

### Serde比較表

以下の表は、さまざまなデータ型が異なるシリアライゼーションモードでどのように表示されるかを示しています。記載されていない型は同じ表示方法です。

| タイプ | Doris | Hive | Presto/Trino |
| --- | --- | --- | --- |
| `Bool` | `1`, `0` | `1`, `0` | `1`, `0` |
| `Integer` | `1`, `1000` | `1`, `1000` | `1`, `1000` |
| `Float/Decimal` | `1.2`, `3.00` | `1.2`, `3.00` | `1.2`, `3.00` |
| `Date/Datetime` | `2025-01-01`， `2025-01-01 10:11:11` |  `2025-01-01`， `2025-01-01 10:11:11` | `2025-01-01`， `2025-01-01 10:11:11` |
| `String` | `abc`, `中国` | `abc`, `中国` | `abc`, `中国` |
| `Null` | `null` | `null` | `NULL` |
| `Array<bool>` | `[1, 0]` | `[true,false]` | `[1, 0]` |
| `Array<int>` | `[1, 1000]` | `[1,1000]` | `[1, 1000]` |
| `Array<string>` | `["abc", "中国"]` | `["abc","中国"]` | `["abc", "中国"]` |
| `Array<date/datetime>` | `["2025-01-01", "2025-01-01 10:11:11"]` | `["2025-01-01","2025-01-01 10:11:11"]` | `["2025-01-01", "2025-01-01 10:11:11"]` |
| `Array<null>` | `[null]` | `[null]` | `[NULL]` |
| `Map<int, string>` | `{1:"abc", 2:"中国"}` |`{1:"abc",2:"中国"}` |`{1=abc, 2=中国}` |
| `Map<string, date/datetime>` | `{"k1":"2022-10-01", "k2":"2022-10-01 10:10:10"}` | `{"k1":"2022-10-01","k2":"2022-10-01 10:10:10"}` | `{k1=2022-10-01, k2=2022-10-01 10:10:10}` |
| `Map<int, null>` | `{1:null, 2:null}` | `{1:null,2:null}` | `{1=NULL, 2=NULL}` |
| `Struct<>` | Same as map | Same as map | Same as map | Same as map | |

## 設定

- 変数

    | 変数名 | 例 | 説明 |
    | --- | --- | --- |
    | `sql_converter_service_url` | `set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert"` | グローバル変数、sql converterサービスのアドレスを指定するために使用 |
    | `sql_dialect` | `set sql_dialect=presto` | セッション変数、現在のセッションのdialectを指定するために使用 |
    | `serde_dialect` | `set serde_dialect=hive` | セッション変数、現在のセッションのシリアライゼーションdialectフォーマットを指定するために使用 |
    | `enable_sql_convertor_features` | `set enable_sql_convertor_features="ctas"` | セッション変数、sql converterの特定の特殊機能を有効にするためにユーザーが指定。`ctas`：`CTAS`文の`SELECT`部分の変換を許可。（この変数はDoris 3.0.6およびSQL Convertor 1.0.8.10からサポート）|
    | `sql_convertor_config` | `set sql_convertor_config = '{"ignore_udf": ["func1", "func2", "fucn3"]}'` | SQL Convertorが一部のUDFを無視するように指定するために使用されるセッション変数。SQL Convertorはリスト内の関数を変換しません。そうでなければ「Unknown ファンクション」エラーが報告される可能性があります。（この変数はDoris 3.0.6およびSQL Convertor 1.0.8.10からサポート）|

    バージョン3.0.7以降、カンマで区切った複数のURLアドレスを設定できます：

    ```
    set global sql_converter_service_url = "http://127.0.0.1:5001/api/v1/convert,http://127.0.0.2:5001/api/v1/convert"
    ```
Dorisはローカルサービスアドレス`127.0.0.1`を優先します。優先アドレスが利用できない場合、サービスの可用性を確保するために他の利用可能なアドレスに自動的に切り替わります。

## Best Practices

- 変換する必要のない関数を指定する

    場合によっては、元のシステムと完全に一致する関数をDorisで見つけることができない、または変換後の一部の関数が特定の特別なパラメータの下で元の関数とまったく同じように動作しない可能性があります。この場合、ユーザーはまずUDFを使用して元のシステムと完全に一致する関数を実装し、それをDorisに登録できます。次に、このUDFを`sql_convertor_config`の`ignore_udf`に追加します。このようにすることで、SQL Convertorはこの関数を変換しなくなり、ユーザーはUDFを使用して関数の動作を制御できます。

## Release 注釈

[SQL Convertor Release 注釈](https://docs.selectdb.com/docs/ecosystem/sql-converter/sql-converter-release-node)
