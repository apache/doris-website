---
{
  "title": "リリース 1.2.4",
  "language": "ja",
  "description": "参照先: https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino"
}
---
# 動作変更

- `DateV2`/`DatetimeV2`および`DecimalV3`型について、`DESCRIBLE`および`SHOW CREATE TABLE`文の結果で、`DateV2`/`DatetimeV2`や`DecimalV3`として表示されなくなり、直接`Date`/`Datetime`や`Decimal`として表示されます。

	- この変更は一部のBIツールとの互換性のためです。カラムの実際の型を確認したい場合は、`DESCRIBE ALL`文で確認できます。

- `information_schema`データベース内のテーブルを照会する際、外部カタログのメタ情報（データベース、テーブル、カラムなど）がデフォルトで返されなくなりました。

	- この変更により、一部の外部カタログの接続問題によって`information_schema`データベースが照会できない問題を回避し、一部のBIツールをDorisで使用する際の問題を解決します。FE設定の`infodb_support_ext_catalog`で制御でき、デフォルト値は`false`で、外部カタログのメタ情報は返されません。

# 改善

### JDBC カタログ

- JDBC カタログによるTrino/Prestoへの接続をサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino)

- JDBC カタログのClickhouseデータソースへの接続でArray型マッピングをサポート

​        参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse)

### Spark Load 

- Spark LoadでResource Manager HA関連設定をサポート

​        参照: https://github.com/apache/doris/pull/15000

## バグ修正

- Hive カタログでの複数の接続問題を修正しました。

- Hudi カタログでのClassNotFound問題を修正しました。

- JDBC カタログの接続プールを最適化し、接続数過多を回避しました。

- JDBC カタログを通じて他のDorisクラスターからデータをインポートする際にOOMが発生する問題を修正しました。

- 複数のクエリおよびインポートプランニング問題を修正しました。

- Unique Key Merge-On-Writeデータモデルでの複数の問題を修正しました。

- 複数のBDBJE問題を修正し、一部のケースでのFEメタデータ異常の問題を解決しました。

- `CREATE VIEW`文がtable Valued Functionをサポートしない問題を修正しました。

- 複数のメモリ統計問題を修正しました。

- Parquet/ORC形式読み取りでの複数の問題を修正しました。

- DecimalV3での複数の問題を修正しました。

- SHOW QUERY/LOAD PROFILEでの複数の問題を修正しました。
