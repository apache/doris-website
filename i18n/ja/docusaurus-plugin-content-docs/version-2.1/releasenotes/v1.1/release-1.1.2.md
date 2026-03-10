---
{
  "title": "リリース 1.1.2",
  "language": "ja",
  "description": "このリリースでは、Dorisチームはバージョン1.1.1以降、170以上の問題やパフォーマンス改善を修正しました。このリリースは1のbugfixリリースです。"
}
---
このリリースでは、Doris Teamは1.1.1以降で170を超える問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# Features

### 新しいMemTracker

vectorized engineとnon-vectorized engineの両方に対して、より正確な新しいMemTrackerを導入しました。

### 現在のクエリ表示とクエリ終了のAPI追加

### ODBC Table経由でのUTF16絵文字の読み書きサポート

# Improvements

### Data Lake関連の改善

- HDFS ORC Fileスキャンパフォーマンスを約300%改善しました。[#11501](https://github.com/apache/doris/pull/11501)

- Icebergテーブルクエリ時のHDFS HAモードをサポートしました。

- [Apache Tez](https://tez.apache.org/)で作成されたHiveデータのクエリをサポートしました。

- HiveエクスターナルサポートとしてAli OSSを追加しました。

### Spark Loadでのstringとtextタイプのサポート追加

### non-vectorized engineでのブロック再利用追加により、一部のケースで50%のパフォーマンス改善を実現。[#11392](https://github.com/apache/doris/pull/11392)

### likeまたはregexのパフォーマンス改善

### tcmallocのaggressive_memory_decommitを無効化

これにより、ロードまたはクエリで40%のパフォーマンス向上が得られます。

現在これは設定項目であり、`tc_enable_aggressive_memory_decommit`設定で変更できます。

# Bug Fix

### FE障害やデータ破損を引き起こすFEに関する問題

- 予約BDB-JEファイルが過多になることを防ぐ予約ディスク設定を追加。**(重要)** HA環境では、BDB JEは多くの予約ファイルを保持します。BDB-jeログはディスク制限に近づくまで削除されません。

- FEレプリカが正しく開始できない、またはデータが破損する原因となるBDB-JEの致命的なバグを修正。**(重要)**

### クエリ中のwaitFor_rpcでFeがハングし、高並行シナリオでBEがハングする問題

[#12459](https://github.com/apache/doris/pull/12459) [#12458](https://github.com/apache/doris/pull/12458) [#12392](https://github.com/apache/doris/pull/12392)

### 間違った結果を引き起こすvectorized storage engineの致命的な問題。**(重要)**

[#11754](https://github.com/apache/doris/pull/11754) [#11694](https://github.com/apache/doris/pull/11694)

### BEコアまたは異常状態を引き起こす多数のplanner関連問題

[#12080](https://github.com/apache/doris/pull/12080) [#12075](https://github.com/apache/doris/pull/12075) [#12040](https://github.com/apache/doris/pull/12040) [#12003](https://github.com/apache/doris/pull/12003) [#12007](https://github.com/apache/doris/pull/12007) [#11971](https://github.com/apache/doris/pull/11971) [#11933](https://github.com/apache/doris/pull/11933) [#11861](https://github.com/apache/doris/pull/11861) [#11859](https://github.com/apache/doris/pull/11859) [#11855](https://github.com/apache/doris/pull/11855) [#11837](https://github.com/apache/doris/pull/11837) [#11834](https://github.com/apache/doris/pull/11834) [#11821](https://github.com/apache/doris/pull/11821) [#11782](https://github.com/apache/doris/pull/11782) [#11723](https://github.com/apache/doris/pull/11723) [#11569](https://github.com/apache/doris/pull/11569)
