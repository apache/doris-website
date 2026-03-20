---
{
  "title": "リリース 3.1.3",
  "language": "ja",
  "description": "Apache Doris 3.1.3は以下の分野で大幅な改善をもたらします："
}
---
## 新機能

### ストレージ & ファイルシステム

-   libhdfs を 3.4.2 にアップグレード ([#57638](https://github.com/apache/doris/pull/57638))
-   S3 reader に TotalGetRequestTime プロファイルメトリクスを追加 ([#57636](https://github.com/apache/doris/pull/57636))

### カタログ

-   MaxCompute catalog (project-schema-table) をサポート ([#57286](https://github.com/apache/doris/pull/57286))
-   dialect sql 実行時のエラー後の元の SQL の再試行をサポート ([#57498](https://github.com/apache/doris/pull/57498))
-   Azure Blob Storage をサポート ([#57219](https://github.com/apache/doris/pull/57219))

### Cloud Mode

-   balance sync warm-up をサポート ([#57666](https://github.com/apache/doris/pull/57666))
-   同一クラスタ内での peer BE cache read をサポート ([#57672](https://github.com/apache/doris/pull/57672))

### SQL Engine & Planner

-   plan フェーズの前に SQL regex block rule をチェック ([#57706](https://github.com/apache/doris/pull/57706))

### 関数

-   struct 型サポートで EXPLODE 関数を強化 ([#57827](https://github.com/apache/doris/pull/57827))

## 最適化

### クエリ実行 & Planner

-   NULL 値のみの場合の variant cast を最適化 ([#57161](https://github.com/apache/doris/pull/57161))
-   FROM_UNIXTIME のパフォーマンスを最適化 ([#57573](https://github.com/apache/doris/pull/57573))
-   graceful shutdown 動作とクエリ再試行を改善 ([#57805](https://github.com/apache/doris/pull/57805))

### ストレージ & Compaction

-   read slice size を設定可能にする (MergeIO) ([#57159](https://github.com/apache/doris/pull/57159))
-   cold data compaction のスコア閾値を追加 ([#57217](https://github.com/apache/doris/pull/57217))
-   小さなメモリタスク保護のための設定可能な閾値を追加 ([#56994](https://github.com/apache/doris/pull/56994))
-   ページフォルトを削減するための jemalloc 設定を改善 ([#57152](https://github.com/apache/doris/pull/57152))

### Cloud Mode

-   cloud balance メトリクスを公開 ([#57352](https://github.com/apache/doris/pull/57352))
-   warm-up ジョブロジックの作成を最適化 ([#57865](https://github.com/apache/doris/pull/57865))
-   warm-up ジョブと peer read の効率を強化 ([#57554](https://github.com/apache/doris/pull/57554), [#57807](https://github.com/apache/doris/pull/57807))

### インデックス & 検索

-   カスタムアナライザーサポートを追加 (char_filter、basic & ICU tokenizer) ([#57137](https://github.com/apache/doris/pull/57137))
-   カスタムアナライザーでの組み込みアナライザー名をサポート ([#57727](https://github.com/apache/doris/pull/57727))

## バグ修正

### ストレージ & ファイル I/O

-   key カラム追加時の segcompaction coredump を修正 ([#57212](https://github.com/apache/doris/pull/57212))
-   Parquet RLE_DICTIONARY デコードパフォーマンス問題を修正 ([#57614](https://github.com/apache/doris/pull/57614))
-   schema change expr cache の誤用を修正 ([#57517](https://github.com/apache/doris/pull/57517))
-   tablet report を ForkJoinPool に置換 ([#57927](https://github.com/apache/doris/pull/57927))

### Cloud Mode

-   cloud pipeline タスク数計算を修正 ([#57261](https://github.com/apache/doris/pull/57261))
-   rebalance 残留メトリクスのクリーンアップを修正 ([#57438](https://github.com/apache/doris/pull/57438))
-   rebalance が初期化されていない場合の tablet report をスキップ ([#57393](https://github.com/apache/doris/pull/57393))
-   ドメインユーザーのデフォルトクラスタレポートエラーを修正 ([#57555](https://github.com/apache/doris/pull/57555))
-   間違った private endpoint 設定を修正 ([#57675](https://github.com/apache/doris/pull/57675))
-   peer read バグとスレッドハンドリングを修正 ([#57910](https://github.com/apache/doris/pull/57910), [#57807](https://github.com/apache/doris/pull/57807))
-   filecache メトリクスと microbench 問題を修正 ([#57535](https://github.com/apache/doris/pull/57535), [#57536](https://github.com/apache/doris/pull/57536))

### カタログ

-   MaxCompute predicate pushdown null pointer を修正 ([#57567](https://github.com/apache/doris/pull/57567))
-   Iceberg client.region と REST 認証情報問題を修正 ([#57539](https://github.com/apache/doris/pull/57539))
-   Iceberg catalog NPE とクエリエラーを修正 ([#57796](https://github.com/apache/doris/pull/57796), [#57790](https://github.com/apache/doris/pull/57790))
-   Paimon S3 プレフィックス統一と設定を修正 ([#57526](https://github.com/apache/doris/pull/57526))
-   `zeroDateTimeBehavior` の JDBC catalog 互換性を修正 ([#57731](https://github.com/apache/doris/pull/57731))
-   Parquet スキーマ解析エラーを修正 ([#57500](https://github.com/apache/doris/pull/57500))
-   Parquet 全行グループフィルタリング問題を修正 ([#57646](https://github.com/apache/doris/pull/57646))
-   escape が enclose と等しい場合の CSV reader の間違った結果を修正 ([#57762](https://github.com/apache/doris/pull/57762))
-   refresh キューからの catalog 削除を防止 ([#57671](https://github.com/apache/doris/pull/57671))
-   `max_meta_object_cache_num` は > 0 である必要がある設定を修正 ([#57793](https://github.com/apache/doris/pull/57793))

### SQL Engine & Planner

-   decimal リテラルを含む FROM_UNIXTIME の定数折りたたみを修正 ([#57606](https://github.com/apache/doris/pull/57606))
-   group sets とフィルターでの MV rewrite 失敗を修正 ([#57674](https://github.com/apache/doris/pull/57674))
-   prepare statement stage での explain SQL のみを修正 ([#57504](https://github.com/apache/doris/pull/57504))
-   Profile.releaseMemory() で物理プランを解放 ([#57316](https://github.com/apache/doris/pull/57316))
-   group sets が存在する場合の集約除去エラーを修正 ([#57885](https://github.com/apache/doris/pull/57885))
-   max_value+1 での LargeInt オーバーフローを修正 ([#57351](https://github.com/apache/doris/pull/57351))
-   float にキャストする際の decimal256 オーバーフローを修正 ([#57503](https://github.com/apache/doris/pull/57503))

### ネットワーキング & プラットフォーム

-   MySQL SSL unwrap 無限ループを修正 ([#57599](https://github.com/apache/doris/pull/57599))
-   MySQL での TLS 再ネゴシエーションを無効化 ([#57748](https://github.com/apache/doris/pull/57748))
-   アライメントされていない uint128 コンストラクタを修正 ([#57430](https://github.com/apache/doris/pull/57430))
-   JNI ローカル/グローバル参照リークを修正 ([#57597](https://github.com/apache/doris/pull/57597))
-   Scanner.close() をスレッドセーフにする ([#57644](https://github.com/apache/doris/pull/57644))
-   nullptr による exchange coredump を修正 ([#57698](https://github.com/apache/doris/pull/57698))

## 雑務 & インフラストラクチャ

-   LakeSoul external catalog を非推奨化 ([#57163](https://github.com/apache/doris/pull/57163))

## 概要

Apache Doris **3.1.3** では以下の主要な改善をもたらします：

-   **ストレージ互換性** (Azure Blob、Hadoop 3.4.2、S3 メトリクスサポート)
-   **Cloud パフォーマンスと信頼性** (warm-up、rebalance、peer cache)
-   **SQL planner の安定性**
-   **依存関係の近代化とセキュリティ強化**

このリリースでは、ハイブリッドデータ環境全体での**安定性、パフォーマンス、クラウドネイティブ統合**を大幅に強化しました。
