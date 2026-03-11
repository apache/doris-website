---
{
  "title": "リリース 1.2.2",
  "language": "ja",
  "description": "参考: https://doris.apache.org/docs/dev/lakehouse/multi-catalog/"
}
---
# 新機能

### レイクハウス 

- Hive metastoreの自動同期をサポート。

- Iceberg Snapshotの読み取りと、Snapshot履歴の表示をサポート。

- JDBC カタログがPostgreSQL、Clickhouse、Oracle、SQLServerをサポート

- JDBC カタログがInsert操作をサポート

参照: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/)

### Auto バケット

異なるパーティションのバケット数を設定・スケールして、tabletの数を比較的適切な範囲に保つ。

### 新機能

新しい関数`width_bucket`を追加。

参照: [https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/width-bucket/#description](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/width-bucket/#description)

# 動作変更

- BEのpage cacheをデフォルトで無効化: `disable_storage_page_cache=true`

この設定をオフにすることで、メモリ使用量を最適化し、メモリOOMのリスクを軽減する。
ただし、一部の小さなクエリのクエリ遅延が増加する。
クエリ遅延に敏感な場合や、高同時実行で小さなクエリのシナリオがある場合は、*disable_storage_page_cache=false*を設定してpage cacheを再度有効にできる。

- 新しいセッション変数`group_by_and_having_use_alias_first`を追加、groupとhaving句でエイリアスを使用するかどうかを制御するために使用。

参照: [https://doris.apache.org/docs/dev/advanced/variables](https://doris.apache.org/docs/dev/advanced/variables)

# 改善

### Compaction

- `Vertical Compaction`をサポート。ワイドテーブルのcompactionオーバーヘッドと効率を最適化。

- `Segment compaction`をサポート。高頻度インポートでの-238と-235の問題を修正。

### レイクハウス

- Hive カタログがHiveバージョン1/2/3と互換可能

- Hive カタログがBrokerを使用したJuiceFS基盤のHDFSにアクセス可能。

- Iceberg カタログがHive MetastoreとRest カタログタイプをサポート。

- ES カタログが_idカラムマッピングをサポート。

- 大量の削除行があるIceberg V2の読み取りパフォーマンスを最適化。

- Schema Evolution後のIcebergテーブルの読み取りをサポート

- Parquet Readerがカラム名の大文字小文字を正しく処理。

### その他

- Hadoop KMS暗号化HDFSへのアクセスをサポート。

- 進行中のExportエクスポートタスクのキャンセルをサポート。

- `explode_split`のパフォーマンスを1倍最適化。

- nullable列の読み取りパフォーマンスを3倍最適化。

- Memtrackerの一部の問題を最適化し、メモリ管理精度を向上させ、メモリ申請を最適化。

# バグ修正

- Doris Flink Connectorでデータロード時のメモリリークを修正。

- BEの可能なスレッドスケジューリング問題を修正し、BEスレッド枯渇による`Fragment sent timeout`エラーを削減。

- 列タイプdatetimev2/decimalv3の様々な正確性と精度の問題を修正。

- Unique Key Merge-on-Readテーブルのデータ正確性問題を修正。

- Light Schema Change機能の様々な既知の問題を修正。

- bitmapタイプRuntime Filterの様々なデータ正確性問題を修正。

- バージョン1.2.1で導入されたcsvリーダーの読み取りパフォーマンス低下の問題を修正。

- Spark Loadデータダウンロード段階によるBE OOMの問題を修正。

- バージョン1.1からバージョン1.2へのアップグレード時の可能なメタデータ互換性問題を修正。

- ResourceでJDBC カタログを作成する際のメタデータ問題を修正。

- load操作による高CPU使用率の問題を修正。

- 大量の失敗したBroker Loadジョブによるfe OOMの問題を修正。

- 浮動小数点型ロード時の精度損失の問題を修正。

- 2PC stream load使用時のメモリリークの問題を修正

# その他

BEでの総rowsetとsegment数を表示するメトリクスを追加

- doris_be_all_rowsets_numとdoris_be_all_segments_num

# 謝辞

このリリースに貢献してくれた全ての方々に感謝します！

@adonis0147

@AshinGau

@BePPPower

@BiteTheDDDDt

@ByteYue

@caiconghui

@cambyzju

@chenlinzhong

@DarvenDuan

@dataroaring

@Doris-Extras

@dutyu

@englefly

@freemandealer

@Gabriel39

@HappenLee

@Henry2SS

@htyoung

@isHuangXin

@JackDrogon

@jacktengg

@Jibing-Li

@kaka11chen

@Kikyou1997

@Lchangliang

@LemonLiTree

@liaoxin01

@liqing-coder

@luozenglin

@morningman

@morrySnow

@mrhhsg

@nextdreamblue

@qidaye

@qzsee

@spaces-X

@stalary

@starocean999

@weizuo93

@wsjz

@xiaokang

@xinyiZzz

@xy720

@yangzhg

@yiguolei

@yixiutt

@Yukang-Lian

@Yulei-Yang

@zclllyybb

@zddr

@zhangstar333

@zhannngchen

@zy-kkk
