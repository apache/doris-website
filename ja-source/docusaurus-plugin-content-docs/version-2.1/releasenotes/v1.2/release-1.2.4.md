---
{
  "title": "Release 1.2.4",
  "language": "ja",
  "description": "参照：https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino"
}
---
# 動作変更

- `DateV2`/`DatetimeV2`および`DecimalV3`タイプについて、`DESCRIBLE`および`SHOW CREATE TABLE`ステートメントの結果では、`DateV2`/`DatetimeV2`または`DecimalV3`として表示されなくなり、直接`Date`/`Datetime`または`Decimal`として表示されます。

	- この変更は一部のBIツールとの互換性のためです。カラムの実際のタイプを確認したい場合は、`DESCRIBE ALL`ステートメントで確認できます。

- `information_schema`データベースのテーブルをクエリする際、外部カタログのメタ情報（データベース、テーブル、カラムなど）はデフォルトでは返されなくなりました。

	- この変更により、一部の外部カタログの接続問題が原因で`information_schema`データベースがクエリできなくなる問題を回避し、DorisでのBIツール使用時の問題を解決します。これはFE設定`infodb_support_ext_catalog`で制御でき、デフォルト値は`false`です。つまり、外部カタログのメタ情報は返されません。

# 改善

### JDBC カタログ

- JDBC カタログによるTrino/Prestoへの接続をサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino)

- JDBC カタログのClickhouseデータソース接続でArrayタイプマッピングをサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse)

### Spark Load 

- Spark LoadでResource Manager HA関連設定をサポート

​        参照: https://github.com/apache/doris/pull/15000

## バグ修正

- Hive カタログでのいくつかの接続問題を修正しました。

- Hudi カタログでのClassNotFound問題を修正しました。

- JDBC カタログの接続プールを最適化し、接続数の過多を回避します。

- JDBC カタログを通じて他のDorisクラスターからデータをインポートする際にOOMが発生する問題を修正しました。

- いくつかのクエリおよびインポート計画の問題を修正しました。

- Unique Key Merge-On-Writeデータモデルでのいくつかの問題を修正しました。

- いくつかのBDBJE問題を修正し、一部のケースでのFEメタデータ異常の問題を解決しました。

- `CREATE VIEW`ステートメントがtable Valued Functionをサポートしない問題を修正しました。

- いくつかのメモリ統計問題を修正しました。

- Parquet/ORC形式読み込みでのいくつかの問題を修正しました。

- DecimalV3でのいくつかの問題を修正しました。

- SHOW QUERY/LOAD PROFILEでのいくつかの問題を修正しました。
