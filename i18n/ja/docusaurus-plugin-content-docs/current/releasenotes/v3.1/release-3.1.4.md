---
{
  "title": "リリース 3.1.4",
  "language": "ja",
  "description": "Apache Doris 3.1.4は、新機能、パフォーマンス向上、および安定性とセキュリティを改善する重要なバグ修正により、クエリ、データレイク、およびクラウド操作を強化します。"
}
---
# 3.1.4 リリースノート

## 新機能

### クエリエンジン

- Dereference Expressions のサポート [#58550](https://github.com/apache/doris/pull/58550)

### Data Lake & External Catalogs

- Catalog で `AwsCredentialsProviderChain` 経由での認証情報読み込みをサポート [#59054](https://github.com/apache/doris/pull/59054)
- S3 アクセス用に `credentials_provider_type` を BE に渡すことをサポート [#59158](https://github.com/apache/doris/pull/59158)
- Elasticsearch の `flatten` データ型をサポート [#58793](https://github.com/apache/doris/pull/58793)

### 可観測性と監査

- 監査ログに保存される SQL 文の暗号化をサポート [#58508](https://github.com/apache/doris/pull/58508)
- QueryPlanAction でテーブルクエリプランからの SQL を監査ログに書き込むことをサポート [#59121](https://github.com/apache/doris/pull/59121)
- Nereids でパースされた文の SQL Digest 生成 [#59215](https://github.com/apache/doris/pull/59215)

## 最適化と改善

### クエリエンジン

- 式の一貫性を向上させるために型推論と強制動作を調整 [#57961](https://github.com/apache/doris/pull/57961)
- 分析タスクが列統計キャッシュを汚染することを防止し、統計精度を向上 [#58742](https://github.com/apache/doris/pull/58742)
- 複数の DISTINCT 集計関数を含むクエリの実行を改善 [#58973](https://github.com/apache/doris/pull/58973)
- 不要な実行計画の複雑さを避けるために Join / Set / CTE / 述語プッシュダウンルールを最適化 [#58664](https://github.com/apache/doris/pull/58664), [#59141](https://github.com/apache/doris/pull/59141), [#59151](https://github.com/apache/doris/pull/59151)

### Data Lake & External Catalogs

- Hive パーティションプルーニングと書き込みパフォーマンスを向上させ、大きなパーティションテーブルの書き込み遅延を大幅に削減 [#58886](https://github.com/apache/doris/pull/58886), [#58932](https://github.com/apache/doris/pull/58932)
- Iceberg で dangling deletes を無視して COUNT プッシュダウンを改善することをサポート [#59069](https://github.com/apache/doris/pull/59069)
- Iceberg REST Catalog の接続性チェックとネットワークタイムアウト処理を強化 [#58433](https://github.com/apache/doris/pull/58433), [#58434](https://github.com/apache/doris/pull/58434)
- 単一スナップショットシナリオで Paimon 増分クエリの動作を Spark と整合 [#58253](https://github.com/apache/doris/pull/58253)

### Doris Cloud（コンピュート・ストレージ分離）

- tablet rebalancer 設定の動的更新をサポートし、クラウド環境での運用柔軟性を向上 [#58376](https://github.com/apache/doris/pull/58376)
- コンピュート・ストレージ分離シナリオで TopN クエリを最適化し、不要なリモートブロードキャスト読み取りを回避 [#58112](https://github.com/apache/doris/pull/58112), [#58155](https://github.com/apache/doris/pull/58155)
- アップグレードプロセス中の tablet パフォーマンス一貫性を改善し、ホットスポットリスクを削減 [#58247](https://github.com/apache/doris/pull/58247)
- Schema Change 中に File Cache を適応的にし、大きなテーブルのキャッシュ影響を削減 [#58622](https://github.com/apache/doris/pull/58622)
- IO 可観測性を向上させるためにクエリプロファイルにダウンロード待機時間メトリクスを追加 [#58870](https://github.com/apache/doris/pull/58870)
- LRU ダンプサポートで File Cache デバッグ機能を強化 [#58871](https://github.com/apache/doris/pull/58871)

### セキュリティと安定性

- 外部カタログセキュリティを向上させるために Glue Catalog で HTTPS を強制 [#58366](https://github.com/apache/doris/pull/58366)
- Create Stage で SSRF 検証を追加 [#58874](https://github.com/apache/doris/pull/58874)

## バグ修正

### クエリエンジン（Nereids Optimizer）

- 特定のシナリオで TopN / Limit / Join ルールによって引き起こされる潜在的な無限ループを修正 [#58697](https://github.com/apache/doris/pull/58697)
- 集計、ウィンドウ関数、Repeat、型変換でのロジックエラーを修正 [#58080](https://github.com/apache/doris/pull/58080), [#58114](https://github.com/apache/doris/pull/58114), [#58330](https://github.com/apache/doris/pull/58330), [#58548](https://github.com/apache/doris/pull/58548)

### マテリアライズドビュー（MV）

- MOW テーブルで値列述語を持つ無効なマテリアライズドビューの作成を禁止 [#57937](https://github.com/apache/doris/pull/57937)

### データ取り込み

- JSON Reader の複数回呼び出しによる未定義動作を修正し、潜在的なデータ破損を防止 [#58192](https://github.com/apache/doris/pull/58192)
- Broker Load での `COLUMNS FROM PATH` に関する不正な動作を修正 [#58351](https://github.com/apache/doris/pull/58351), [#58904](https://github.com/apache/doris/pull/58904)
- ノードがオフラインまたは廃止された時の Group Commit の異常動作を修正 [#59118](https://github.com/apache/doris/pull/59118)
- 特定のエッジ条件下での Load / Delete / Partial Update の失敗を修正 [#58553](https://github.com/apache/doris/pull/58553), [#58230](https://github.com/apache/doris/pull/58230), [#59096](https://github.com/apache/doris/pull/59096)

### Doris Cloud（コンピュート・ストレージ分離）

- Tablet Drop、Compaction、初期起動の遅延などコンピュート・ストレージ分離シナリオでの安定性問題を修正 [#58157](https://github.com/apache/doris/pull/58157), [#58195](https://github.com/apache/doris/pull/58195), [#58761](https://github.com/apache/doris/pull/58761)
- 異常条件や BE 障害時の File Cache でのクラッシュとリソースリークを修正 [#58196](https://github.com/apache/doris/pull/58196), [#58819](https://github.com/apache/doris/pull/58819), [#59058](https://github.com/apache/doris/pull/59058)
- コンパクション後に Segment Footer Cache がクリアされないことによる異常読み取り動作を修正 [#59185](https://github.com/apache/doris/pull/59185)
- ORC / Parquet 形式での Copy Into 実行時の失敗を修正 [#58551](https://github.com/apache/doris/pull/58551)
