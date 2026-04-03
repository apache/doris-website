---
{
  "title": "Release 1.2.3",
  "language": "ja",
  "description": "現在、Jdbc カタログは別のDorisデータベースに接続するためにJDBC jarパッケージの5.xバージョンの使用のみをサポートしています。8を使用する場合。"
}
---
# 改善

### JDBC カタログ 

- JDBC カタログによるDorisクラスターへの接続をサポート。

現在、Jdbc カタログは5.xバージョンのJDBC jarパッケージを使用した別のDorisデータベースへの接続のみをサポートしています。8.xバージョンのJDBC jarパッケージを使用する場合、カラムのデータ型が一致しない可能性があります。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris)

- `only_specified_database`属性による指定されたデータベースのみの同期をサポート。

- `lower_case_table_names`による小文字形式でのテーブル名同期をサポートし、テーブル名の大文字小文字の区別の問題を解決。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc)

- JDBC カタログの読み取りパフォーマンスを最適化。

### Elasticsearch カタログ

- Array型マッピングをサポート。

- `like_push_down`属性によるlike式のプッシュダウンの制御をサポートし、ESクラスターのCPUオーバーヘッドを制御。

参考: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es)

### Hive カタログ

- Hiveテーブルのデフォルトパーティション`_HIVE_DEFAULT_PARTITION_`をサポート。

- Hive Metastoreメタデータの自動同期で圧縮形式の通知イベントをサポート。

### Dynamic パーティション改善

- Dynamic partitionで`storage_medium`パラメータの指定をサポートし、新規追加パーティションのストレージメディアを制御。

参考: [https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition](https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition)

### BEのThreadingモデルの最適化

- BEのthreadingモデルを最適化し、頻繁なスレッドの作成と破棄による安定性の問題を回避。

# Bugfix

- Merge-On-Write Unique Keyテーブルの問題を修正。

- compaction関連の問題を修正。

- データエラーを引き起こすdelete文の問題を修正。

- 複数のクエリ実行エラーを修正。

- 一部のオペレーティングシステムでJDBC catalogの使用によりBEクラッシュが発生する問題を修正。

- Multi-カタログの問題を修正。

- メモリ統計と最適化の問題を修正。

- decimalV3およびdate/datetimev2関連の問題を修正。

- ロードトランザクションの安定性の問題を修正。

- light-weight schema changeの問題を修正。

- バッチパーティション作成で`datetime`型を使用する際の問題を修正。

- 大量の失敗したbroker loadがFEメモリ使用量を過度に高くする問題を修正。

- テーブル削除後にstream loadがキャンセルできない問題を修正。

- 一部のケースで`information_schema`のクエリがタイムアウトする問題を修正。

- `select outfile`を使用した並行データエクスポートによるBEクラッシュの問題を修正。

- transactional insert操作のメモリリークを修正。

- 複数のクエリ/ロードプロファイルの問題を修正し、FE web ui経由でのプロファイルの直接ダウンロードをサポート。

- BE tablet GCスレッドがIO utilを過度に高くする問題を修正。

- Kafka routine loadでcommit offsetが不正確になる問題を修正。
