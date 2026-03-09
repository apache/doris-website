---
{
  "title": "リリース 1.2.3",
  "language": "ja",
  "description": "現在、Jdbc Catalogは別のDorisデータベースに接続するためにJDBC jarパッケージの5.xバージョンの使用のみをサポートしています。8を使用する場合。"
}
---
# 改善

### JDBC Catalog 

- JDBC Catalogを通じたDorisクラスターへの接続をサポート。

現在、Jdbc Catalogは5.xバージョンのJDBC jarパッケージを使用して別のDorisデータベースに接続することのみサポートしています。8.xバージョンのJDBC jarパッケージを使用する場合、カラムのデータ型が一致しない可能性があります。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris)

- `only_specified_database`属性を通じて指定されたデータベースのみを同期することをサポート。

- `lower_case_table_names`を通じて小文字形式でのテーブル名の同期をサポートし、テーブル名の大文字小文字の区別の問題を解決。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc)

- JDBC Catalogの読み込みパフォーマンスを最適化。

### Elasticsearch Catalog

- Array型マッピングをサポート。

- `like_push_down`属性を通じてlike式をプッシュダウンするかどうかをサポートし、ESクラスターのCPUオーバーヘッドを制御。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es)

### Hive Catalog

- Hiveテーブルのデフォルトパーティション`_HIVE_DEFAULT_PARTITION_`をサポート。

- Hive Metastoreメタデータの自動同期で圧縮形式での通知イベントをサポート。

### Dynamic Partition改善

- Dynamic partitionで`storage_medium`パラメータを指定して新しく追加されるパーティションのストレージメディアを制御することをサポート。

参考: [https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition](https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition)


### BEのThreadingモデルの最適化

- 頻繁なスレッドの作成と破棄によって引き起こされる安定性の問題を避けるため、BEのthreadingモデルを最適化。

# Bugfix

- Merge-On-Write Unique Keyテーブルの問題を修正。

- compaction関連の問題を修正。

- データエラーの原因となるいくつかのdelete文の問題を修正。

- いくつかのクエリ実行エラーを修正。

- 一部のオペレーティングシステムでJDBC catalogの使用がBEクラッシュを引き起こす問題を修正。

- Multi-Catalogの問題を修正。

- メモリ統計と最適化の問題を修正。

- decimalV3およびdate/datetimev2関連の問題を修正。

- ロードトランザクションの安定性の問題を修正。

- light-weight schema changeの問題を修正。

- バッチパーティション作成で`datetime`型を使用する際の問題を修正。

- 大量の失敗したbroker loadがFEメモリ使用量を過度に高くする問題を修正。

- テーブル削除後にstream loadをキャンセルできない問題を修正。

- 一部のケースで`information_schema`のクエリがタイムアウトする問題を修正。

- `select outfile`を使用した並行データエクスポートによって引き起こされるBEクラッシュの問題を修正。

- transactional insert操作のメモリリークを修正。

- いくつかのquery/loadプロファイルの問題を修正し、FE web uiを通じたプロファイルの直接ダウンロードをサポート。

- BE tablet GCスレッドがIO utilを過度に高くする問題を修正。

- Kafka routine loadでcommit offsetが不正確になる問題を修正。
