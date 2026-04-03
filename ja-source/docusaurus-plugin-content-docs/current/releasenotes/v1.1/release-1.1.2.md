---
{
  "title": "リリース 1.1.2",
  "language": "ja",
  "description": "このリリースでは、Dorisチームはバージョン1.1.1以降、170以上の問題またはパフォーマンスの改善を修正しました。このリリースはバージョン1のバグフィックスリリースです。"
}
---
このリリースでは、Doris Teamは1.1.1以降170以上の問題の修正またはパフォーマンス改善を行いました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# 機能

### 新しいMemTracker

ベクトル化エンジンと非ベクトル化エンジンの両方に対して、より正確な新しいMemTrackerを導入しました。

### 現在のクエリ表示とクエリ終了のためのAPI追加

### ODBC tableによるUTF16の絵文字読み書きサポート

# 改善

### Data Lake関連の改善

- HDFS ORCファイルスキャンパフォーマンスを約300%改善しました。[#11501](https://github.com/apache/doris/pull/11501)

- IcebergテーブルクエリでのHDFS HAモードをサポートしました。

- [Apache Tez](https://tez.apache.org/)で作成されたHiveデータのクエリをサポートしました。

- Hive外部サポートとしてAli OSSを追加しました。

### Spark Loadでのstringおよびtextタイプのサポートを追加

### 非ベクトル化エンジンでのblock再利用を追加し、一部のケースで50%のパフォーマンス改善を実現しました。[#11392](https://github.com/apache/doris/pull/11392)

### likeまたはregexパフォーマンスの改善

### tcmallocのaggressive_memory_decommitを無効化

ロードまたはクエリで40%のパフォーマンス向上が見込まれます。

現在これは設定項目であり、config `tc_enable_aggressive_memory_decommit`を設定することで変更できます。

# バグ修正

### FEの障害やデータ破損を引き起こすFEに関するいくつかの問題。

- 予約BDB-JEファイルが過多になることを防ぐための予約ディスク設定を追加しました。**(重要)** HA環境では、BDB JEは多くの予約ファイルを保持します。BDB-jeログはディスク制限に近づくまで削除されません。

- FEレプリカが正しく起動できない、またはデータが破損する原因となるBDB-JEの致命的なバグを修正しました。** (重要)**

### クエリ中にFEがwaitFor_rpcでハングし、高並行シナリオでBEがハングする問題。

[#12459](https://github.com/apache/doris/pull/12459) [#12458](https://github.com/apache/doris/pull/12458) [#12392](https://github.com/apache/doris/pull/12392)

### 間違った結果を引き起こすベクトル化ストレージエンジンの致命的な問題。**(重要)**

[#11754](https://github.com/apache/doris/pull/11754) [#11694](https://github.com/apache/doris/pull/11694)

### BEのcoreまたは異常状態を引き起こすプランナー関連の多数の問題。

[#12080](https://github.com/apache/doris/pull/12080) [#12075](https://github.com/apache/doris/pull/12075) [#12040](https://github.com/apache/doris/pull/12040) [#12003](https://github.com/apache/doris/pull/12003) [#12007](https://github.com/apache/doris/pull/12007) [#11971](https://github.com/apache/doris/pull/11971) [#11933](https://github.com/apache/doris/pull/11933) [#11861](https://github.com/apache/doris/pull/11861) [#11859](https://github.com/apache/doris/pull/11859) [#11855](https://github.com/apache/doris/pull/11855) [#11837](https://github.com/apache/doris/pull/11837) [#11834](https://github.com/apache/doris/pull/11834) [#11821](https://github.com/apache/doris/pull/11821) [#11782](https://github.com/apache/doris/pull/11782) [#11723](https://github.com/apache/doris/pull/11723) [#11569](https://github.com/apache/doris/pull/11569)
