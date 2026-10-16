---
{
    "title": "Lookup Join（ルックアップ結合）",
    "language": "ja",
    "description": "Flink Doris Connector を使用したディメンションテーブルとの Lookup Join、バッチ化された非同期クエリ、および Lookup のオプションについて説明します。"
}
---

# Lookup Join（ルックアップ結合）

Lookup Join は、Flink におけるディメンションテーブルとの結合の性能を向上させることができます。Flink JDBC Connector を使用してディメンションテーブルと結合する場合、次のような問題が生じることがあります。

- Flink JDBC Connector は同期クエリを使用します。上流のデータソース（Kafka など）からレコードが届くたびに Doris のディメンションテーブルを直ちに照会するため、同時実行数が多い場合はクエリのレイテンシーが高くなります。
- JDBC 経由のクエリは通常、レコードを一件ずつ照会するポイントルックアップです。一方、Doris ではクエリの効率を高めるためにバッチクエリを推奨しています。

Flink Doris Connector で [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) を使用すると、次の利点があります。

- 上流のデータをバッチ単位でキャッシュし、レコードごとのクエリによる高いレイテンシーとデータベースへの負荷を回避します。
- 結合クエリを非同期で実行し、データのスループットを高めながら Doris へのクエリ負荷を軽減します。

## 例 {#example}

ディメンションテーブルには `jdbc-url` を設定する必要があります。Lookup クエリはこの URL を経由します。`lookup.cache.*` オプションでキャッシュを有効にします。

```sql
CREATE TABLE fact_table (
    `id` BIGINT,
    `name` STRING,
    `city` STRING,
    `process_time` as proctime()
) WITH (
    'connector' = 'kafka',
    ...
);

create table dim_city(
    `city` STRING,
    `level` INT,
    `province` STRING,
    `country` STRING
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'dim.dim_city',
    'username' = 'root',
    'password' = '',
    'lookup.cache.max-rows' = '100000',
    'lookup.cache.ttl' = '300s'
);

SELECT a.id, a.name, a.city, c.province, c.country, c.level
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

## オプション {#options}

| キー                               | デフォルト値 | 必須 | 説明                                       |
| --------------------------------- | ------------- | -------- | --------------------------------------------- |
| lookup.cache.max-rows             | -1            | N        | Lookup でキャッシュする行の最大数。デフォルト値は -1 で、この場合キャッシュは無効になります。 |
| lookup.cache.ttl                  | 10s           | N        | Lookup のキャッシュの最大保持時間。デフォルト値は 10s です。 |
| lookup.max-retries                | 1             | N        | Lookup クエリが失敗した後の再試行回数。 |
| lookup.jdbc.async                 | FALSE         | N        | 非同期 Lookup を有効にするかどうか。デフォルトは false です。 |
| lookup.jdbc.read.batch.size       | 128           | N        | 非同期 Lookup でのクエリごとの最大バッチサイズ。 |
| lookup.jdbc.read.batch.queue-size | 256           | N        | 非同期 Lookup で使用する中間バッファキューのサイズ。 |
| lookup.jdbc.read.thread-size      | 3             | N        | 各タスクで Lookup に使用する JDBC スレッドの数。 |
