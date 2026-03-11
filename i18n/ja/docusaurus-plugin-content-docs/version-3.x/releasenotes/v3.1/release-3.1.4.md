---
{
  "title": "リリース 3.1.4",
  "language": "ja",
  "description": "Apache Doris 3.1.4は、新機能、パフォーマンス向上、および安定性とセキュリティの改善のための重要なバグ修正により、クエリ、データレイク、およびクラウド運用を強化します。"
}
---
# 3.1.4 リリースノート

## 新機能

### Query Engine

- Dereference Expressionsのサポート [#58550](https://github.com/apache/doris/pull/58550)

### Data Lake & External Catalogs

- カタログが`AwsCredentialsProviderChain`を介したクレデンシャル読み込みをサポート [#59054](https://github.com/apache/doris/pull/59054)
- S3アクセス用にBEへの`credentials_provider_type`の渡し方をサポート [#59158](https://github.com/apache/doris/pull/59158)
- Elasticsearch `flatten`データ型をサポート [#58793](https://github.com/apache/doris/pull/58793)

### Observability & Audit

- 監査ログに保存されるSQL文の暗号化をサポート [#58508](https://github.com/apache/doris/pull/58508)
- QueryPlanActionがテーブルクエリプランからのSQLを監査ログに書き込むことをサポート [#59121](https://github.com/apache/doris/pull/59121)
- Nereidsで解析された文に対するSQL Digestの生成 [#59215](https://github.com/apache/doris/pull/59215)

## 最適化と改善

### Query Engine

- 式の一貫性を向上させるために型推論と型変換動作を調整 [#57961](https://github.com/apache/doris/pull/57961)
- 分析タスクによる列統計キャッシュの汚染を防止し、統計の精度を向上 [#58742](https://github.com/apache/doris/pull/58742)
- 複数のDISTINCT集約関数を持つクエリの実行を改善 [#58973](https://github.com/apache/doris/pull/58973)
- 不必要なプランの複雑さを回避するためにJoin / Set / CTE / 述語プッシュダウンルールを最適化 [#58664](https://github.com/apache/doris/pull/58664), [#59141](https://github.com/apache/doris/pull/59141), [#59151](https://github.com/apache/doris/pull/59151)

### Data Lake & External Catalogs

- Hiveパーティションプルーニングと書き込み性能を高速化し、大規模パーティションテーブルの書き込みレイテンシを大幅に削減 [#58886](https://github.com/apache/doris/pull/58886), [#58932](https://github.com/apache/doris/pull/58932)
- IcebergがCOUNTプッシュダウンを改善するためにダングリング削除の無視をサポート [#59069](https://github.com/apache/doris/pull/59069)
- Iceberg REST カタログの接続性チェックとネットワークタイムアウト処理を強化 [#58433](https://github.com/apache/doris/pull/58433), [#58434](https://github.com/apache/doris/pull/58434)
- 単一スナップショットシナリオにおけるPaimonインクリメンタルクエリ動作をSparkと整合 [#58253](https://github.com/apache/doris/pull/58253)

### Doris Cloud (Compute-Storage Separation)

- クラウド環境での運用柔軟性を向上させるためにtablet rebalancer設定の動的更新をサポート [#58376](https://github.com/apache/doris/pull/58376)
- 不必要なリモートブロードキャスト読み取りを回避するため、コンピュート・ストレージ分離シナリオでのTopNクエリを最適化 [#58112](https://github.com/apache/doris/pull/58112), [#58155](https://github.com/apache/doris/pull/58155)
- アップグレードプロセス中のタブレット性能一貫性を改善し、ホットスポットリスクを削減 [#58247](https://github.com/apache/doris/pull/58247)
- 大規模テーブルのキャッシュ影響を削減するためにSchema Change中のFile Cacheを適応的に設定 [#58622](https://github.com/apache/doris/pull/58622)
- IO観測性を向上させるためにクエリプロファイルにダウンロード待機時間メトリクスを追加 [#58870](https://github.com/apache/doris/pull/58870)
- LRUダンプサポートによりFile Cacheデバッグ機能を強化 [#58871](https://github.com/apache/doris/pull/58871)

### Security & Stability

- 外部カタログセキュリティを向上させるためにGlue カタログでHTTPSを強制 [#58366](https://github.com/apache/doris/pull/58366)
- Create StageにSSRF検証を追加 [#58874](https://github.com/apache/doris/pull/58874)

## バグ修正

### Query Engine (Nereids Optimizer)

- 特定シナリオでTopN / Limit / Joinルールによってトリガーされる潜在的な無限ループを修正 [#58697](https://github.com/apache/doris/pull/58697)
- 集約、ウィンドウ関数、Repeat、型変換における論理エラーを修正 [#58080](https://github.com/apache/doris/pull/58080), [#58114](https://github.com/apache/doris/pull/58114), [#58330](https://github.com/apache/doris/pull/58330), [#58548](https://github.com/apache/doris/pull/58548)

### Materialized Views (MV)

- MOWテーブル上で値列述語を持つ無効なマテリアライズドビューの作成を禁止 [#57937](https://github.com/apache/doris/pull/57937)

### Data Ingestion

- JSON Readerの複数呼び出しによって引き起こされる未定義動作を修正し、潜在的なデータ破損を防止 [#58192](https://github.com/apache/doris/pull/58192)
- Broker LoadでのCOLUMNS FROM PATHに関連する不正な動作を修正 [#58351](https://github.com/apache/doris/pull/58351), [#58904](https://github.com/apache/doris/pull/58904)
- ノードのオフラインまたは廃止時のGroup Commitの異常動作を修正 [#59118](https://github.com/apache/doris/pull/59118)
- 特定のエッジ条件下でのLoad / Delete / Partial アップデートの失敗を修正 [#58553](https://github.com/apache/doris/pull/58553), [#58230](https://github.com/apache/doris/pull/58230), [#59096](https://github.com/apache/doris/pull/59096)

### Doris Cloud (Compute-Storage Separation)

- Tablet Drop、Compaction、起動時の遅延を含む、コンピュート・ストレージ分離シナリオでの安定性問題を修正 [#58157](https://github.com/apache/doris/pull/58157), [#58195](https://github.com/apache/doris/pull/58195), [#58761](https://github.com/apache/doris/pull/58761)
- 異常条件やBE障害時のFile Cacheでのクラッシュとリソースリークを修正 [#58196](https://github.com/apache/doris/pull/58196), [#58819](https://github.com/apache/doris/pull/58819), [#59058](https://github.com/apache/doris/pull/59058)
- コンパクション後のSegment Footer Cacheのクリア不備によって引き起こされる異常読み取り動作を修正 [#59185](https://github.com/apache/doris/pull/59185)
- ORC / Parquet形式でのCopy Into実行時の失敗を修正 [#58551](https://github.com/apache/doris/pull/58551)
