---
{
  "title": "リリース 1.1.2",
  "language": "ja",
  "description": "このリリースでは、Dorisチームはバージョン1.1.1以降、170以上の問題修正またはパフォーマンス改善を行いました。このリリースはバージョン1のバグ修正リリースです。"
}
---
このリリースでは、Doris Teamは1.1.1以降170件以上の問題やパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# Features

### 新しいMemTracker

ベクター化エンジンと非ベクター化エンジンの両方により正確な新しいMemTrackerを導入しました。

### 現在のクエリ表示とクエリ強制終了のAPI追加

### ODBC table経由でのUTF16絵文字の読み書きサポート

# Improvements

### Data Lake関連の改善

- HDFS ORCファイルスキャンパフォーマンスを約300%改善しました。[#11501](https://github.com/apache/doris/pull/11501)

- Icebergテーブルクエリ時のHDFS HAモードをサポートしました。

- [Apache Tez](https://tez.apache.org/)によって作成されたHiveデータのクエリをサポートしました。

- HiveエクスターナルサポートとしてAli OSSを追加しました。

### Spark Loadでのstringとtextタイプのサポート追加

### 非ベクター化エンジンでのreuse blockサポート追加により、一部のケースで50%のパフォーマンス向上を実現しました。[#11392](https://github.com/apache/doris/pull/11392)

### likeまたはregexパフォーマンスの改善

### tcmallocのaggressive_memory_decommitを無効化

ロードまたはクエリで40%のパフォーマンス向上があります。

現在これはconfigになっており、`tc_enable_aggressive_memory_decommit`設定により変更できます。

# Bug Fix

### FEの障害やデータ破損を引き起こすFEに関するいくつかの問題

- 予約BDB-JEファイルの過多を避けるための予約ディスクconfigを追加しました。**(深刻)** HA環境では、BDB JEは多くの予約ファイルを保持します。BDB-jeログはディスク制限に近づくまで削除されません。

- FEレプリカが正常に開始できない、またはデータが破損する原因となるBDB-JEの致命的なバグを修正しました。** (深刻)**

### クエリ中のwaitFor_rpcでのFEハング、および高同時実行シナリオでのBEハング

[#12459](https://github.com/apache/doris/pull/12459) [#12458](https://github.com/apache/doris/pull/12458) [#12392](https://github.com/apache/doris/pull/12392)

### 間違った結果を引き起こすベクター化ストレージエンジンの致命的な問題 **(深刻)**

[#11754](https://github.com/apache/doris/pull/11754) [#11694](https://github.com/apache/doris/pull/11694)

### BEコアまたは異常状態を引き起こす多数のプランナー関連問題

[#12080](https://github.com/apache/doris/pull/12080) [#12075](https://github.com/apache/doris/pull/12075) [#12040](https://github.com/apache/doris/pull/12040) [#12003](https://github.com/apache/doris/pull/12003) [#12007](https://github.com/apache/doris/pull/12007) [#11971](https://github.com/apache/doris/pull/11971) [#11933](https://github.com/apache/doris/pull/11933) [#11861](https://github.com/apache/doris/pull/11861) [#11859](https://github.com/apache/doris/pull/11859) [#11855](https://github.com/apache/doris/pull/11855) [#11837](https://github.com/apache/doris/pull/11837) [#11834](https://github.com/apache/doris/pull/11834) [#11821](https://github.com/apache/doris/pull/11821) [#11782](https://github.com/apache/doris/pull/11782) [#11723](https://github.com/apache/doris/pull/11723) [#11569](https://github.com/apache/doris/pull/11569)
