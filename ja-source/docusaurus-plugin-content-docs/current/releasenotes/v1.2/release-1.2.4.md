---
{
  "title": "Release 1.2.4",
  "language": "ja",
  "description": "参照: https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino"
}
---
# 動作変更

- `DateV2`/`DatetimeV2` および `DecimalV3` 型について、`DESCRIBLE` および `SHOW CREATE TABLE` ステートメントの結果において、これらは `DateV2`/`DatetimeV2` や `DecimalV3` として表示されなくなり、直接 `Date`/`Datetime` や `Decimal` として表示されるようになります。

	- この変更は一部のBIツールとの互換性のためです。カラムの実際の型を確認したい場合は、`DESCRIBE ALL` ステートメントで確認できます。

- `information_schema` データベース内のテーブルをクエリする際、外部カタログのメタ情報（データベース、テーブル、カラムなど）はデフォルトでは返されなくなります。

	- この変更により、一部の外部カタログの接続問題が原因で `information_schema` データベースをクエリできない問題を回避し、DorisでBIツールを使用する際の問題を解決します。これはFE設定の `infodb_support_ext_catalog` で制御でき、デフォルト値は `false` です。つまり外部カタログのメタ情報は返されません。

# 改善

### JDBC カタログ

- JDBC カタログ経由でTrino/Prestoへの接続をサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino)

- JDBC カタログがClickhouseデータソースに接続し、Array型マッピングをサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse)

### Spark Load 

- Spark LoadがResource Manager HA関連設定をサポート

​        参照: https://github.com/apache/doris/pull/15000

## バグ修正

- Hive カタログでの複数の接続問題を修正。

- Hudi カタログでのClassNotFound問題を修正。

- JDBC カタログの接続プールを最適化し、接続過多を回避。

- JDBC カタログ経由で別のDorisクラスターからデータをインポートする際にOOMが発生する問題を修正。

- 複数のクエリおよびインポートプランニング問題を修正。

- Unique Key Merge-On-Writeデータモデルでの複数の問題を修正。

- 複数のBDBJE問題を修正し、一部のケースでのFEメタデータ異常問題を解決。

- `CREATE VIEW` ステートメントがtable Valued Functionをサポートしない問題を修正。

- 複数のメモリ統計問題を修正。

- Parquet/ORC形式読み取りでの複数の問題を修正。

- DecimalV3での複数の問題を修正。

- SHOW QUERY/LOAD PROFILEでの複数の問題を修正。
