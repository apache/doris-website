---
{
  "title": "Release 1.2.4",
  "language": "ja",
  "description": "参照: https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino"
}
---
# 動作変更

- `DateV2`/`DatetimeV2`および`DecimalV3`タイプについて、`DESCRIBLE`および`SHOW CREATE TABLE`ステートメントの結果では、`DateV2`/`DatetimeV2`や`DecimalV3`として表示されなくなり、`Date`/`Datetime`や`Decimal`として直接表示されるようになります。

	- この変更は一部のBIツールとの互換性のためです。カラムの実際のタイプを確認したい場合は、`DESCRIBE ALL`ステートメントで確認できます。

- `information_schema`データベースのテーブルをクエリする際、外部カタログのメタ情報（データベース、テーブル、カラムなど）はデフォルトでは返されなくなります。

	- この変更により、一部の外部カタログの接続問題によって`information_schema`データベースがクエリできなくなる問題を回避し、一部のBIツールでDorisを使用する際の問題を解決します。これはFE設定`infodb_support_ext_catalog`で制御でき、デフォルト値は`false`、つまり外部カタログのメタ情報は返されません。

# 改善

### JDBC カタログ

- JDBC カタログによるTrino/Prestoへの接続をサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino)

- JDBC カタログがClickhouseデータソースに接続し、Arrayタイプマッピングをサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse)

### Spark Load 

- Spark LoadがResource Manager HA関連設定をサポート

​        参照: https://github.com/apache/doris/pull/15000

## バグ修正

- Hive カタログの複数の接続問題を修正しました。

- Hudi カタログのClassNotFound問題を修正しました。

- JDBC カタログの接続プールを最適化し、接続数の過多を回避しました。

- JDBC カタログを通じて他のDorisクラスターからデータをインポートする際にOOMが発生する問題を修正しました。

- 複数のクエリおよびインポートプランニング問題を修正しました。

- Unique Key Merge-On-Writeデータモデルの複数の問題を修正しました。

- 複数のBDBJE問題を修正し、一部のケースでのFEメタデータ異常の問題を解決しました。

- `CREATE VIEW`ステートメントがtable Valued Functionをサポートしない問題を修正しました。

- 複数のメモリ統計問題を修正しました。

- Parquet/ORC形式読み取りの複数の問題を修正しました。

- DecimalV3の複数の問題を修正しました。

- SHOW QUERY/LOAD PROFILEの複数の問題を修正しました。
