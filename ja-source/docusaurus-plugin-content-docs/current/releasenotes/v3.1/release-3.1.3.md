---
{
  "title": "リリース 3.1.3",
  "language": "ja",
  "description": "Apache Doris 3.1.3では以下の主要な改善が行われています："
}
---
## 新機能

### Storage & Filesystem

-   libhdfsを3.4.2にアップグレード ([#57638](https://github.com/apache/doris/pull/57638))
-   S3 readerにTotalGetRequestTimeプロファイルメトリックを追加 ([#57636](https://github.com/apache/doris/pull/57636))

### カタログ

-   MaxCompute catalog（project-schema-table）をサポート ([#57286](https://github.com/apache/doris/pull/57286))
-   dialect SQL実行時のエラー後に元のSQLの再試行をサポート ([#57498](https://github.com/apache/doris/pull/57498))
-   Azure Blob Storageをサポート ([#57219](https://github.com/apache/doris/pull/57219))

### Cloud Mode

-   balance sync warm-upをサポート ([#57666](https://github.com/apache/doris/pull/57666))
-   同一クラスタ内でのpeer BEキャッシュ読み取りをサポート ([#57672](https://github.com/apache/doris/pull/57672))

### SQL Engine & Planner

-   プラン段階前にSQL regexブロックルールをチェック ([#57706](https://github.com/apache/doris/pull/57706))

### Functions

-   struct型サポートでEXPLODE関数を拡張 ([#57827](https://github.com/apache/doris/pull/57827))

## 最適化

### Query Execution & Planner

-   NULL値のみの場合のvariantキャストを最適化 ([#57161](https://github.com/apache/doris/pull/57161))
-   FROM_UNIXTIMEのパフォーマンスを最適化 ([#57573](https://github.com/apache/doris/pull/57573))
-   グレースフルシャットダウンの動作とクエリ再試行を改善 ([#57805](https://github.com/apache/doris/pull/57805))

### Storage & Compaction

-   読み取りスライスサイズを設定可能に（MergeIO） ([#57159](https://github.com/apache/doris/pull/57159))
-   コールドデータcompactionのスコア閾値を追加 ([#57217](https://github.com/apache/doris/pull/57217))
-   小メモリタスク保護の設定可能な閾値を追加 ([#56994](https://github.com/apache/doris/pull/56994))
-   ページフォルト削減のためjemallocの設定を改善 ([#57152](https://github.com/apache/doris/pull/57152))

### Cloud Mode

-   cloudバランスメトリックを公開 ([#57352](https://github.com/apache/doris/pull/57352))
-   warm-upジョブロジックの作成を最適化 ([#57865](https://github.com/apache/doris/pull/57865))
-   warm-upジョブとpeer読み取り効率を向上 ([#57554](https://github.com/apache/doris/pull/57554), [#57807](https://github.com/apache/doris/pull/57807))

### Index & Search

-   カスタムアナライザサポートを追加（char_filter、basic & ICU tokenizer） ([#57137](https://github.com/apache/doris/pull/57137))
-   カスタムアナライザでビルトインアナライザ名をサポート ([#57727](https://github.com/apache/doris/pull/57727))

## バグ修正

### Storage & File I/O

-   キー列追加時のsegcompaction coredumpを修正 ([#57212](https://github.com/apache/doris/pull/57212))
-   Parquet RLE_DICTIONARYデコードのパフォーマンス問題を修正 ([#57614](https://github.com/apache/doris/pull/57614))
-   スキーマ変更exprキャッシュの誤用を修正 ([#57517](https://github.com/apache/doris/pull/57517))
-   tablet reportをForkJoinPoolに置き換え ([#57927](https://github.com/apache/doris/pull/57927))

### Cloud Mode

-   cloudパイプラインタスク数計算を修正 ([#57261](https://github.com/apache/doris/pull/57261))
-   rebalance残留メトリクスのクリーンアップを修正 ([#57438](https://github.com/apache/doris/pull/57438))
-   rebalanceが初期化されていない場合のtablet reportをスキップ ([#57393](https://github.com/apache/doris/pull/57393))
-   ドメインユーザーのデフォルトクラスタレポートエラーを修正 ([#57555](https://github.com/apache/doris/pull/57555))
-   間違ったprivate endpoint設定を修正 ([#57675](https://github.com/apache/doris/pull/57675))
-   peer読み取りのバグとスレッド処理を修正 ([#57910](https://github.com/apache/doris/pull/57910), [#57807](https://github.com/apache/doris/pull/57807))
-   filecacheメトリクスとmicrobenchの問題を修正 ([#57535](https://github.com/apache/doris/pull/57535), [#57536](https://github.com/apache/doris/pull/57536))

### カタログ

-   MaxCompute述語プッシュダウンのnull pointerを修正 ([#57567](https://github.com/apache/doris/pull/57567))
-   Iceberg client.regionとREST認証情報の問題を修正 ([#57539](https://github.com/apache/doris/pull/57539))
-   Iceberg catalog NPEとクエリエラーを修正 ([#57796](https://github.com/apache/doris/pull/57796), [#57790](https://github.com/apache/doris/pull/57790))
-   Paimon S3プレフィックス統一と設定を修正 ([#57526](https://github.com/apache/doris/pull/57526))
-   `zeroDateTimeBehavior`のJDBC catalog互換性を修正 ([#57731](https://github.com/apache/doris/pull/57731))
-   Parquetスキーマ解析エラーを修正 ([#57500](https://github.com/apache/doris/pull/57500))
-   Parquetの全行グループフィルタ問題を修正 ([#57646](https://github.com/apache/doris/pull/57646))
-   escapeとencloseが等しい場合のCSV readerの誤った結果を修正 ([#57762](https://github.com/apache/doris/pull/57762))
-   リフレッシュキューからのcatalog削除を防止 ([#57671](https://github.com/apache/doris/pull/57671))
-   `max_meta_object_cache_num`は0より大きくなければならない設定を修正 ([#57793](https://github.com/apache/doris/pull/57793))

### SQL Engine & Planner

-   decimal literalでのFROM_UNIXTIMEの定数畳み込みを修正 ([#57606](https://github.com/apache/doris/pull/57606))
-   group setとfilterでのMV書き換え失敗を修正 ([#57674](https://github.com/apache/doris/pull/57674))
-   prepare statement段階でのexplain SQLのみを修正 ([#57504](https://github.com/apache/doris/pull/57504))
-   Profile.releaseMemory()で物理プランを解放 ([#57316](https://github.com/apache/doris/pull/57316))
-   group setが存在する場合の集約除去エラーを修正 ([#57885](https://github.com/apache/doris/pull/57885))
-   max_value+1でのLargeIntオーバーフローを修正 ([#57351](https://github.com/apache/doris/pull/57351))
-   floatへのキャスト時のdecimal256オーバーフローを修正 ([#57503](https://github.com/apache/doris/pull/57503))

### Networking & Platform

-   MySQL SSL unwrapの無限ループを修正 ([#57599](https://github.com/apache/doris/pull/57599))
-   MySQLでTLS再ネゴシエーションを無効化 ([#57748](https://github.com/apache/doris/pull/57748))
-   非整列uint128コンストラクタを修正 ([#57430](https://github.com/apache/doris/pull/57430))
-   JNI local/global refリークを修正 ([#57597](https://github.com/apache/doris/pull/57597))
-   Scanner.close()をスレッドセーフに ([#57644](https://github.com/apache/doris/pull/57644))
-   nullptrによるexchange coredumpを修正 ([#57698](https://github.com/apache/doris/pull/57698))

## 雑務とインフラストラクチャ

-   LakeSoul外部catalogを非推奨化 ([#57163](https://github.com/apache/doris/pull/57163))

## まとめ

Apache Doris **3.1.3** では以下の主要な改善をお届けします：

-   **ストレージ互換性**（Azure Blob、Hadoop 3.4.2、S3メトリクスサポート）
-   **クラウドのパフォーマンスと信頼性**（warm-up、rebalance、peerキャッシュ）
-   **SQLプランナーの安定性**
-   **依存関係の近代化とセキュリティ強化**

このリリースは、ハイブリッドデータ環境全体での**安定性、パフォーマンス、クラウドネイティブ統合**を大幅に向上させます。
