---
{
  "title": "リリース 2.1.7",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン2.1.7が2024年11月10日に正式リリースされました。このバージョンでは継続的なアップグレードと改善が行われています。"
}
---
コミュニティの皆様、**Apache Doris バージョン 2.1.7 が 2024 年 11 月 10 日に正式リリースされました。** このバージョンでは継続的なアップグレードと改善が行われています。さらに、Lakehouse、Async Materialized Views、Semi-Structured Data Management、Query Optimizer、Permission Management などの分野でいくつかの修正が実装されました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- 以下のグローバル変数は強制的に以下のデフォルト値に設定されます：
  - enable_nereids_dml: true
  - enable_nereids_dml_with_pipeline: true
  - enable_nereids_planner: true
  - enable_fallback_to_original_planner: true
  - enable_pipeline_x_engine: true
- audit log に新しいカラムが追加されました。[#42262](https://github.com/apache/doris/pull/42262)
  - 詳細については、[docs](https://doris.apache.org/docs/admin-manual/audit-plugin/) を参照してください

## 新機能

### Async Materialized View

- 非同期 materialized view に `use_for_rewrite` プロパティが追加され、透過的な書き換えに参加するかどうかを制御できます。[#40332](https://github.com/apache/doris/pull/40332)

### Query Execution

- 変更されたセッション変数のリストが Profile に出力されるようになりました。[#41016](https://github.com/apache/doris/pull/41016)
- `trim_in`、`ltrim_in`、`rtrim_in` 関数のサポートが追加されました。[#42641](https://github.com/apache/doris/pull/42641)（注：これは重複した記載ですが、元のリストに従って含めています。）
- いくつかの URL 関数（top_level_domain、first_significant_subdomain、cut_to_first_significant_subdomain）のサポートが追加されました。[#42916](https://github.com/apache/doris/pull/42916)
- `bit_set` 関数が追加されました。[#42916](https://github.com/apache/doris/pull/42099)
- `count_substrings` 関数が追加されました。[#42055](https://github.com/apache/doris/pull/42055)
- `translate` および `url_encode` 関数が追加されました。[#41051](https://github.com/apache/doris/pull/41051)
- `normal_cdf`、`to_iso8601`、`from_iso8601_date` 関数が追加されました。[#40695](https://github.com/apache/doris/pull/40695)

### Storage Management

- `information_schema.table_options` および `table_properties` システムテーブルが追加され、テーブル作成時に設定された属性のクエリをサポートします。[#34384](https://github.com/apache/doris/pull/34384)
- `bitmap_empty` をデフォルト値とするサポートが実装されました。[#40364](https://github.com/apache/doris/pull/40364)
- unique key テーブルに `INSERT INTO SELECT` で書き込む際にシーケンスカラムの提供が必要かどうかを制御する新しいセッション変数 `require_sequence_in_insert` が導入されました。[#41655](https://github.com/apache/doris/pull/41655)

### その他

- BE WebUI ページでのフレームグラフ生成を可能にしました。[#41044](https://github.com/apache/doris/pull/41044)

## 改善

### Lakehouse

- Hive text format テーブルへのデータ書き込みをサポートしました。[#40537](https://github.com/apache/doris/pull/40537)
  - 詳細については、[docs](../../lakehouse/catalogs/hive-catalog) を参照してください
- MaxCompute Open Storage API を使用した MaxCompute データへのアクセス。[#41610](https://github.com/apache/doris/pull/41610)
  - 詳細については、[docs](../../lakehouse/catalogs/maxcompute-catalog) を参照してください
- Paimon DLF Catalog のサポート。[#41694](https://github.com/apache/doris/pull/41694)
  - 詳細については、[docs](../../lakehouse/catalogs/paimon-catalog) を参照してください
- `table$partitions` 構文を追加し、Hive パーティション情報を直接クエリできるようにしました。[#41230](https://github.com/apache/doris/pull/41230)
  - 詳細については、[docs](../../lakehouse/catalogs/hive-catalog) を参照してください
- brotli 圧縮形式の Parquet ファイル読み込みをサポートしました。[#42162](https://github.com/apache/doris/pull/42162)
- Parquet ファイルでの DECIMAL 256 タイプの読み込みをサポートしました。[#42241](https://github.com/apache/doris/pull/42241)
- OpenCsvSerde 形式の Hive テーブル読み込みをサポートしました。[#42939](https://github.com/apache/doris/pull/42939)

### Async Materialized View

- 非同期 materialized view のビルドプロセス中のロック保持の粒度を改良しました。[#40402](https://github.com/apache/doris/pull/40402) [#41010](https://github.com/apache/doris/pull/41010)。

### Query optimizer

- 極端なケースでの統計情報収集と使用の精度を向上させ、プランニングの安定性を強化しました。[#40457](https://github.com/apache/doris/pull/40457)
- より多くのシナリオでランタイムフィルターを生成できるようになり、クエリパフォーマンスが向上しました。[#40815](https://github.com/apache/doris/pull/40815)
- 数値、日付、文字列関数の定数フォールディング機能を強化し、クエリパフォーマンスを向上させました。[#40820](https://github.com/apache/doris/pull/40820)
- カラムプルーニングアルゴリズムを最適化し、クエリパフォーマンスを向上させました。[#41548](https://github.com/apache/doris/pull/41548)

### Query Execution

- 並列準備をサポートし、短いクエリで消費される時間を削減しました。[#40270](https://github.com/apache/doris/pull/40270)
- profile 内の一部のカウンターの名前を audit log と一致するように修正しました。[#41993](https://github.com/apache/doris/pull/41993)
- 特定のクエリを高速化するための新しい local shuffle ルールを追加しました。[#40637](https://github.com/apache/doris/pull/40637)

### Storage Management

- `SHOW PARTITIONS` コマンドが commit version の表示をサポートするようになりました。[#28274](https://github.com/apache/doris/pull/28274)
- テーブル作成時に不合理なパーティション式をチェックするようになりました。[#40158](https://github.com/apache/doris/pull/40158)
- Routine Load で EOF に遭遇した際のスケジューリングロジックを最適化しました。[#40509](https://github.com/apache/doris/pull/40509)
- Routine Load がスキーマ変更を認識するようにしました。[#40508](https://github.com/apache/doris/pull/40508)
- Routine Load タスクのタイムアウトロジックを改善しました。[#41135](https://github.com/apache/doris/pull/41135)

### その他

- BE 設定を介して BRPC の内蔵サービスポートを閉じることを可能にしました。[#41047](https://github.com/apache/doris/pull/41047)
- audit log のフィールド欠落と重複レコードの問題を修正しました。[#43015](https://github.com/apache/doris/pull/43015)

## バグ修正

### Lakehouse

- INSERT OVERWRITE の Hive との動作の不整合を修正しました。[#39840](https://github.com/apache/doris/pull/39840)
- 一時的に作成されたフォルダーをクリーンアップし、HDFS 上の空フォルダーが多すぎる問題に対処しました。[#40424](https://github.com/apache/doris/pull/40424)
- 一部のケースで JDBC Catalog の使用によって FE で発生するメモリリークを解決しました。[#40923](https://github.com/apache/doris/pull/40923)
- 一部のケースで JDBC Catalog の使用によって BE で発生するメモリリークを解決しました。[#41266](https://github.com/apache/doris/pull/41266)
- 特定のシナリオでの Snappy 圧縮形式読み取りエラーを修正しました。[#40862](https://github.com/apache/doris/pull/40862)
- 特定のシナリオでの FE 側の潜在的な FileSystem リークに対処しました。[#41108](https://github.com/apache/doris/pull/41108)
- EXPLAIN VERBOSE を使用して外部テーブルの実行プランを表示する際に、一部のケースで null pointer exception が発生する問題を解決しました。[#41231] (https://github.com/apache/doris/pull/41231)
- Paimon parquet 形式のテーブルが読み取れない問題を修正しました。[#41487](https://github.com/apache/doris/pull/41487)
- JDBC Oracle Catalog の互換性変更によって導入されたパフォーマンスの問題に対処しました。[#41407](https://github.com/apache/doris/pull/41407)
- 暗黙の変換後の述語プッシュダウンを無効にし、JDBC Catalog での一部のケースでの不正なクエリ結果を解決しました。[#42242](https://github.com/apache/doris/pull/42242)
- External Catalog でのテーブル名の大文字小文字区別アクセスの問題を修正しました。[#42261](https://github.com/apache/doris/pull/42261)

### Async Materialized View

- ユーザー指定の開始時刻が有効でない問題を修正しました。[#39573](https://github.com/apache/doris/pull/39573)
- ネストされた materialized view が更新されない問題を解決しました。[#40433](https://github.com/apache/doris/pull/40433)
- ベーステーブルが削除され再作成された後に materialized view が更新されない可能性がある問題を修正しました。[#41762](https://github.com/apache/doris/pull/41762)
- パーティション補償書き換えが不正な結果につながる可能性がある問題に対処しました。[#40803](https://github.com/apache/doris/pull/40803)
- `sql_select_limit` が設定された際の書き換え結果での潜在的なエラーを修正しました。[#40106](https://github.com/apache/doris/pull/40106)

### Semi-Structured Data Management

- インデックスファイルハンドルリークの問題を修正しました。[#41915](https://github.com/apache/doris/pull/41915)
- 特殊なケースでの転置インデックスの `count()` 関数の不正確さに対処しました。(#41127)[https://github.com/apache/doris/pull/41127]
- light schema change が有効でない場合の variant での例外を修正しました。[#40908](https://github.com/apache/doris/pull/40908)
- variant が配列を返す際のメモリリークを解決しました。[#41339](https://github.com/apache/doris/pull/41339)

### Query optimizer

- 外部テーブルクエリ中のフィルター条件での nullable 計算の潜在的なエラーを修正し、実行例外につながる問題を解決しました。[#41014](https://github.com/apache/doris/pull/41014)
- 範囲比較式の最適化での潜在的なエラーを修正しました。[#41356](https://github.com/apache/doris/pull/41356)

### Query Execution

- match_regexp 関数が空文字列を正しく処理できない問題。[#39503](https://github.com/apache/doris/pull/39503)
- 高並行シナリオでスキャナースレッドプールがスタックする可能性がある問題を解決しました。[#40495](https://github.com/apache/doris/pull/40495)
- `data_floor` 関数の結果エラーを修正しました。[#41948](https://github.com/apache/doris/pull/41948)
- 一部のシナリオでの不正なキャンセルメッセージに対処しました。[#41798](https://github.com/apache/doris/pull/41798)
- arrow flight によって出力される過剰な警告ログの問題を修正しました。[#41770](https://github.com/apache/doris/pull/41770)
- 一部のシナリオでランタイムフィルターの送信が失敗する問題を解決しました。[#41698](https://github.com/apache/doris/pull/41698)
- 一部のシステムテーブルクエリが正常に終了できない、またはスタックする問題を修正しました。[#41592](https://github.com/apache/doris/pull/41592)
- ウィンドウ関数の不正な結果に対処しました。][#40761](https://github.com/apache/doris/pull/40761)
- encrypt および decrypt 関数が BE コアを引き起こす問題を修正しました。[#40726](https://github.com/apache/doris/pull/40726)
- conv 関数の結果エラーを解決しました。[#40530](https://github.com/apache/doris/pull/40530)

### Storage Management

- マシンクラッシュを伴うマルチレプリカシナリオで Memtable migration を使用した際のインポート失敗を修正しました。[#38003](https://github.com/apache/doris/pull/38003)
- インポート中の Memtable フラッシュフェーズでの不正確なメモリ統計に対処しました。[#39536](https://github.com/apache/doris/pull/39536)
- マルチレプリカシナリオでの Memtable migration のフォルトトレランスの問題を修正しました。[#40477](https://github.com/apache/doris/pull/40477)
- Memtable migration での不正確な bvar 統計を解決しました。[#40985](https://github.com/apache/doris/pull/40985)
- S3 ロードでの不正確な進捗報告を修正しました。[#40987](https://github.com/apache/doris/pull/40987)

### Permissions

- show columns、show sync、show data from db.table に関連する権限の問題を修正しました。[#39726](https://github.com/apache/doris/pull/39726)

### その他

- バージョン 2.0 の audit log plugin がバージョン 2.1 で使用できない問題を修正しました。[#41400](https://github.com/apache/doris/pull/41400)
