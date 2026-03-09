---
{
  "title": "リリース 1.2.3",
  "language": "ja",
  "description": "現在、Jdbc Catalogは別のDorisデータベースに接続するために5.xバージョンのJDBCjarパッケージの使用のみをサポートしています。8を使用する場合。"
}
---
# 改善

### JDBC Catalog 

- JDBC Catalogを通じたDorisクラスターへの接続をサポート。

現在、Jdbc Catalogは5.xバージョンのJDBC jarパッケージを使用して別のDorisデータベースに接続することのみサポートしています。8.xバージョンのJDBC jarパッケージを使用する場合、カラムのデータ型が一致しない可能性があります。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris)

- `only_specified_database`属性を通じて、指定されたデータベースのみの同期をサポート。

- `lower_case_table_names`を通じて小文字形式でのテーブル名の同期をサポートし、テーブル名の大文字小文字の区別の問題を解決。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc)

- JDBC Catalogの読み取りパフォーマンスを最適化。

### Elasticsearch Catalog

- Array型マッピングをサポート。

- `like_push_down`属性を通じてlike式のプッシュダウンの有無をサポートし、ESクラスターのCPUオーバーヘッドを制御。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es)

### Hive Catalog

- Hiveテーブルのデフォルトパーティション`_HIVE_DEFAULT_PARTITION_`をサポート。

- Hive Metastoreメタデータ自動同期で圧縮形式の通知イベントをサポート。

### Dynamic Partition改善

- Dynamic partitionで`storage_medium`パラメータの指定をサポートし、新しく追加されるパーティションのストレージメディアを制御。

参考: [https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition](https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition)

### BEのThreadingモデルの最適化

- BEのThreadingモデルを最適化し、頻繁なスレッドの作成と破棄によって引き起こされる安定性の問題を回避。

# バグ修正

- Merge-On-Write Unique Keyテーブルの問題を修正。

- compaction関連の問題を修正。

- データエラーを引き起こすdelete文の問題を修正。

- 複数のクエリ実行エラーを修正。

- 一部のオペレーティングシステムでJDBC catalogの使用がBEクラッシュを引き起こす問題を修正。

- Multi-Catalogの問題を修正。

- メモリ統計と最適化の問題を修正。

- decimalV3とdate/datetimev2関連の問題を修正。

- load transactionの安定性の問題を修正。

- light-weight schema changeの問題を修正。

- バッチパーティション作成で`datetime`型を使用する問題を修正。

- 大量の失敗したbroker loadがFEメモリ使用量を過度に高くする問題を修正。

- テーブルをドロップした後にstream loadをキャンセルできない問題を修正。

- 一部のケースで`information_schema`のクエリがタイムアウトする問題を修正。

- `select outfile`を使用した同時データエクスポートによって引き起こされるBEクラッシュの問題を修正。

- transactional insert操作のメモリリークを修正。

- 複数のquery/load profileの問題を修正し、FE web ui経由でのプロファイルの直接ダウンロードをサポート。

- BE tablet GCスレッドがIO utilを過度に高くする問題を修正。

- Kafka routine loadでcommit offsetが不正確な問題を修正。
