---
{
  "title": "リリース 2.1.6",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.6 が 2024年9月10日に正式リリースされました。"
}
---
コミュニティの皆様、**Apache Doris バージョン 2.1.6 が2024年9月10日に正式にリリースされました。** このバージョンでは、レイクハウス、Async Materialized Views、半構造化データ管理において継続的なアップグレードと改善をもたらします。さらに、クエリオプティマイザー、実行エンジン、ストレージ管理、権限管理などの分野でいくつかの修正が実装されています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- create repository から `delete_if_exists` オプションを削除しました。[#38192](https://github.com/apache/doris/pull/38192)

- JDBC prepared statement が監査ログを記録するかどうかを制御する `enable_prepared_stmt_audit_log` セッション変数を追加し、デフォルトでは記録しません。[#38624](https://github.com/apache/doris/pull/38624) [#39009](https://github.com/apache/doris/pull/39009)

- segment cache に fd 制限とメモリ制約を実装しました。[#39689](https://github.com/apache/doris/pull/39689)

- FE 設定項目 `sys_log_mode` が BRIEF に設定された場合、ログにファイル位置情報が追加されます。[#39571](https://github.com/apache/doris/pull/39571)

- セッション変数 `max_allowed_packet` のデフォルト値を16MBに変更しました。[#38697](https://github.com/apache/doris/pull/38697)

- 単一リクエストに複数のステートメントが含まれる場合、セミコロンで区切る必要があります。[#38670](https://github.com/apache/doris/pull/38670)

- ステートメントがセミコロンで始まることをサポートしました。[#39399](https://github.com/apache/doris/pull/39399)

- `show create table` などのステートメントで型フォーマットを MySQL と統一しました。[#38012](https://github.com/apache/doris/pull/38012)

- 新しいオプティマイザーの計画がタイムアウトした場合、古いオプティマイザーがより長い計画時間を使用することを防ぐため、フォールバックしなくなりました。[#39499](https://github.com/apache/doris/pull/39499)

## 新機能

### レイクハウス

- Iceberg テーブルの書き戻しをサポートしました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/lakehouse/datalake-building/iceberg-build)を参照してください。

- SQL インターセプトルールが外部テーブルをサポートするようになりました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception)を参照してください。

- BE データキャッシュメトリクスを表示するためのシステムテーブル `file_cache_statistics` を追加しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/system-tables/file_cache_statistics)を参照してください。

### Async Materialized View

- 挿入時の透過的リライトをサポートしました。[#38115](https://github.com/apache/doris/pull/38115)

- クエリに variant 型が存在する場合の透過的リライトをサポートしました。[ #37929](https://github.com/apache/doris/pull/37929)

### 半構造化データ管理

- ARRAY MAP を JSON 型にキャストすることをサポートしました。[ #36548](https://github.com/apache/doris/pull/36548)

- `json_keys` 関数をサポートしました。[ #36411](https://github.com/apache/doris/pull/36411)

- JSON インポート時に JSON パス $. を指定することをサポートしました。[#38213](https://github.com/apache/doris/pull/38213)

- ARRAY、MAP、STRUCT 型で `replace_if_not_null` をサポートしました。[#38304](https://github.com/apache/doris/pull/38304)

- ARRAY、MAP、STRUCT 型でカラム順序の調整をサポートしました。[#39210](https://github.com/apache/doris/pull/39210)

- 複数フィールドでキーワードをマッチさせる `multi_match` 関数を追加し、転置インデックスアクセラレーションをサポートしました。[#37722](https://github.com/apache/doris/pull/37722)

### Query Optimizer

- MySQL プロトコルで返されるカラムに、元のデータベース名、テーブル名、カラム名、エイリアスを埋めました。[ #38126](https://github.com/apache/doris/pull/38126)

- 集約関数 `group_concat` で order by と distinct を同時にサポートしました。[#38080](https://github.com/apache/doris/pull/38080)

- SQL キャッシュで異なるコメントを持つクエリのキャッシュ結果再利用をサポートしました。[#40049](https://github.com/apache/doris/pull/40049)

- パーティション剪定で、フィルタ条件に `date_trunc` と日付関数を含めることをサポートしました。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- テーブルエイリアスの修飾子プレフィックスとしてテーブルが存在するデータベース名を使用することを許可しました。[#38640](https://github.com/apache/doris/pull/38640)

- ヒントスタイルのコメントをサポートしました。[#39113](https://github.com/apache/doris/pull/39113)

### その他

- テーブルプロパティを表示するためのシステムテーブル `table_properties` を追加しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/system-tables/information_schema/table_properties)を参照してください。

- FE でデッドロックと遅いロック検出を導入しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/maint-monitor/frontend-lock-manager)を参照してください。

## 改善

### レイクハウス

- 外部テーブルメタデータキャッシング機構を再実装しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/lakehouse/metacache)を参照してください。

- デフォルト値が false の `keep_carriage_return` セッション変数を追加しました。デフォルトでは、Hive Text フォーマットテーブルを読み取る際、`\r\n` と `\n` の両方を改行文字として扱います。[#38099](https://github.com/apache/doris/pull/38099)

- Parquet/ORC ファイル読み書き操作のメモリ統計を最適化しました。[#37257](https://github.com/apache/doris/pull/37257)

- Paimon テーブルで IN/NOT IN 述語の push down をサポートしました。[#38390](https://github.com/apache/doris/pull/38390)

- Hudi テーブルの Time Travel 構文をサポートするようにオプティマイザーを強化しました。[#38591](https://github.com/apache/doris/pull/38591)

- Kerberos 認証関連プロセスを最適化しました。[ #37301](https://github.com/apache/doris/pull/37301)

- カラム名変更操作後の Hive テーブルの読み取りを可能にしました。[#38809](https://github.com/apache/doris/pull/38809)

- 外部テーブルのパーティションカラムの読み取りパフォーマンスを最適化しました。[#38810](https://github.com/apache/doris/pull/38810)

- 外部テーブルクエリ計画時のデータシャードマージ戦略を改善し、大量の小シャードによるパフォーマンス低下を回避しました。[#38964](https://github.com/apache/doris/pull/38964)

- `SHOW CREATE DATABASE/TABLE` に location などの属性を追加しました。[#39644](https://github.com/apache/doris/pull/39644)

- MaxCompute カタログ で複雑な型をサポートしました。[#39822](https://github.com/apache/doris/pull/39822)

- 非同期読み込みを使用してファイルキャッシュ読み込み戦略を最適化し、長い BE 起動時間を回避しました。[#39036](https://github.com/apache/doris/pull/39036)

- 長時間保持されるロックの除去など、ファイルキャッシュ除去戦略を改善しました。[#39721](https://github.com/apache/doris/pull/39721)

### Async Materialized View

- 時間単位、週単位、四半期単位のパーティションロールアップ構築をサポートしました。[#37678](https://github.com/apache/doris/pull/37678)

- Hive 外部テーブルベースのマテリアライズドビューについて、各リフレッシュ時に最新データを取得するため、リフレッシュ前にメタデータキャッシュを更新するようになりました。[#38212](https://github.com/apache/doris/pull/38212)

- ストレージ・コンピュート分離モードでメタデータをバッチ取得することで透過的リライト計画のパフォーマンスを改善しました。[#39301](https://github.com/apache/doris/pull/39301)

- 重複列挙を禁止することで透過的リライト計画のパフォーマンスを強化しました。[#39541](https://github.com/apache/doris/pull/39541)

- Hive 外部テーブルパーティションベースのマテリアライズドビューのリフレッシュのための透過的リライトのパフォーマンスを改善しました。[#38525](https://github.com/apache/doris/pull/38525)

### 半構造化データ管理

- TOPN クエリのメモリ割り当てを最適化してパフォーマンスを向上させました。[#37429](https://github.com/apache/doris/pull/37429)

- 転置インデックスでの文字列処理のパフォーマンスを強化しました。[#37395](https://github.com/apache/doris/pull/37395)

- MOW テーブルでの転置インデックスのパフォーマンスを最適化しました。[#37428](https://github.com/apache/doris/pull/37428)

- テーブル作成時に行ストア `page_size` を指定して圧縮効果を制御することをサポートしました。[#37145](https://github.com/apache/doris/pull/37145)

### Query Optimizer

- mark join の行数推定アルゴリズムを調整し、より正確な mark join のカーディナリティ推定を実現しました。[#38270](https://github.com/apache/doris/pull/38270)

- semi/anti join のコスト推定アルゴリズムを最適化し、より正確な semi/anti join 順序の選択を可能にしました。[#37951](https://github.com/apache/doris/pull/37951)

- 一部のカラムに統計情報がない場合のフィルタ推定アルゴリズムを調整し、より正確なカーディナリティ推定を実現しました。[#39592](https://github.com/apache/doris/pull/39592)

- set 操作演算子のインスタンス計算ロジックを変更し、極端なケースでの並列性不足を防ぎました。[#39999](https://github.com/apache/doris/pull/39999)

- bucket shuffle の使用戦略を調整し、データが十分にシャッフルされていない場合により良いパフォーマンスを実現しました。[#36784](https://github.com/apache/doris/pull/36784)

- ウィンドウ関数データの早期フィルタリングを有効にし、単一プロジェクションでの複数ウィンドウ関数をサポートしました。[#38393](https://github.com/apache/doris/pull/38393)

- フィルタ条件に `NullLiteral` が存在する場合、false に折りたたみ、さらに `EmptySet` に変換して不要なデータスキャンと計算を削減できるようになりました。[#38135](https://github.com/apache/doris/pull/38135)

- 述語導出の範囲を拡張し、特定のパターンのクエリでのデータスキャンを削減しました。[#37314](https://github.com/apache/doris/pull/37314)

- パーティション剪定で部分短絡評価ロジックをサポートし、パーティション剪定のパフォーマンスを改善し、特定のシナリオで100%以上の改善を実現しました。[#38191](https://github.com/apache/doris/pull/38191)

- ユーザー変数内での任意のスカラー関数の計算を可能にしました。[#39144](https://github.com/apache/doris/pull/39144)

- クエリでエイリアス競合が存在する場合のエラーメッセージを MySQL と一致させました。[#38104](https://github.com/apache/doris/pull/38104)

### Query Execution

- 2.1から3.xへの互換性のため AggState を適合させ、coredump 問題を修正しました。[#37104](https://github.com/apache/doris/pull/37104)

- join が関与しない場合の local shuffle の戦略選択をリファクタリングしました。[#37282](https://github.com/apache/doris/pull/37282)

- 内部テーブルクエリ中のブロックを防ぐため、内部テーブルクエリのスキャナーを非同期アプローチに変更しました。[#38403](https://github.com/apache/doris/pull/38403)

- Join 演算子でハッシュテーブルを構築する際のブロックマージプロセスを最適化しました。[#37471](https://github.com/apache/doris/pull/37471)

- MultiCast 操作のロック保持時間を短縮しました。[37462](https://github.com/apache/doris/pull/37462)

- gRPC の keepAliveTime を最適化し、接続監視機構を追加し、クエリ実行中の RPC エラーによるクエリ失敗の確率を削減しました。[#37304](https://github.com/apache/doris/pull/37304)

- メモリ制限を超えた場合に jemalloc のすべてのダーティページをクリーンアップしました。[#37164](https://github.com/apache/doris/pull/37164)

- 定数型を処理する際の `aes_encrypt`/`decrypt` 関数のパフォーマンスを改善しました。[#37194](https://github.com/apache/doris/pull/37194)

- 定数データを処理する際の `json_extract` 関数のパフォーマンスを最適化しました。[#36927](https://github.com/apache/doris/pull/36927)

- 定数データを処理する際の ParseURL 関数のパフォーマンスを最適化しました。[#36882](https://github.com/apache/doris/pull/36882)

### Backup Recovery / CCR

- Restore で冗長タブレットの削除とパーティションオプションをサポートしました。[#39363](https://github.com/apache/doris/pull/39363)

- repository 作成時にストレージ接続性をチェックします。[#39538](https://github.com/apache/doris/pull/39538)

- binlog で `DROP TABLE` をサポートし、CCR が `DROP TABLE` 操作を増分同期できるようになりました。[#38541](https://github.com/apache/doris/pull/38541)

### Compaction

- 高優先度コンパクションタスクがタスク並行制御制限の対象外だった問題を改善しました。[#38189](https://github.com/apache/doris/pull/38189)

- データ特性に基づいてコンパクションメモリ消費を自動的に削減します。[#37486](https://github.com/apache/doris/pull/37486)

- 集約テーブルや MOR UNIQUE テーブルで順次データ最適化戦略が不正なデータを引き起こす可能性がある問題を修正しました。[ #38299](https://github.com/apache/doris/pull/38299)

- レプリカ補充中のコンパクション中の rowset 選択戦略を最適化し、-235 エラーのトリガーを回避しました。[#39262](https://github.com/apache/doris/pull/39262)

### MOW (Merge-On-Write)

- 並行カラム更新とコンパクションによる遅いカラム更新を最適化しました。[#38682](https://github.com/apache/doris/pull/38682)

- バルクデータインポート中の segcompaction が不正な MOW データを引き起こす可能性がある問題を修正しました。[#38992](https://github.com/apache/doris/pull/38992) [#39707](https://github.com/apache/doris/pull/39707)

- BE 再起動後に発生する可能性があるカラム更新でのデータ損失を修正しました。[#39035](https://github.com/apache/doris/pull/39035)

### Storage Management

- ホット・コールドティアリング下でクエリがローカルデータレプリカを優先するかどうかを制御する FE 設定を追加しました。[#38322](https://github.com/apache/doris/pull/38322)

- 新しく作成されたタブレットを含むように期限切れ BE レポートメッセージを最適化しました。[#38839](https://github.com/apache/doris/pull/38839) [#39605](https://github.com/apache/doris/pull/39605)

- データが欠落しているレプリカを優先するレプリカスケジューリング優先度戦略を最適化しました。[#38884](https://github.com/apache/doris/pull/38884)

- 未完了の ALTER ジョブがあるタブレットがバランスされることを防ぎました。[#39202](https://github.com/apache/doris/pull/39202)

- list パーティショニングを持つテーブルのバケット数変更を可能にしました。[#39688](https://github.com/apache/doris/pull/39688)

- オンラインディスクサービスからのクエリを優先します。[#39654](https://github.com/apache/doris/pull/39654)

- 同期中に削除をサポートしないマテリアライズドビューベーステーブルのエラーメッセージを改善しました。[#39857](https://github.com/apache/doris/pull/39857)

- 単一カラムが4GBを超える場合のエラーメッセージを改善しました。[#39897](https://github.com/apache/doris/pull/39897)

- `INSERT` ステートメント中にプランエラーが発生した際に中止されたトランザクションが省略される問題を修正しました。[#38260](https://github.com/apache/doris/pull/38260)

- SSL 接続終了中の例外を修正しました。[#38677](https://github.com/apache/doris/pull/38677)

- ラベルを使用してトランザクションを中止する際にテーブルロックが保持されない問題を修正しました。[#38842](https://github.com/apache/doris/pull/38842)

- 大きなイメージ問題を引き起こす `gson pretty` を修正しました。[#39135](https://github.com/apache/doris/pull/39135)

- 新しいオプティマイザーが `CREATE TABLE` ステートメントで0のバケット値をチェックしない問題を修正しました。[#38999](https://github.com/apache/doris/pull/38999)

- `DELETE` 条件述語に中国語カラム名が含まれる場合のエラーを修正しました。[#39500](https://github.com/apache/doris/pull/39500)

- パーティションバランシングモードでの頻繁なタブレットバランシング問題を修正しました。[#39606](https://github.com/apache/doris/pull/39606)

- パーティションストレージポリシー属性が失われる問題を修正しました。[#39677](https://github.com/apache/doris/pull/39677)

- トランザクション内で複数テーブルをインポートする際の不正な統計を修正しました。[#39548](https://github.com/apache/doris/pull/39548)

- ランダムバケットテーブル削除時のエラーを修正しました。[#39830](https://github.com/apache/doris/pull/39830)

- 存在しない UDF により FE 起動に失敗する問題を修正しました。[#39868](https://github.com/apache/doris/pull/39868)

- FE master と slave 間の最後の失敗バージョンの不整合を修正しました。[#39947](https://github.com/apache/doris/pull/39947)

- schema change ジョブがキャンセルされた際に関連タブレットが schema change 状態のままになる可能性がある問題を修正しました。[ #39327](https://github.com/apache/doris/pull/39327)

- 単一ステートメント schema change (SC) で型とカラム順序を変更する際のエラーを修正しました。[#39107](https://github.com/apache/doris/pull/39107)

### Data Loading

- インポート中の -238 エラーのエラーメッセージを改善しました。[#39182](https://github.com/apache/doris/pull/39182)

- パーティションを復元中に他のパーティションへのインポートを許可しました。[#39915](https://github.com/apache/doris/pull/39915)

- group commit 中に FE が BE を選択する戦略を最適化しました。[#37830](https://github.com/apache/doris/pull/37830) [#39010](https://github.com/apache/doris/pull/39010)

- 一般的な streamload エラーメッセージのスタックトレース印刷を回避しました。[#38418](https://github.com/apache/doris/pull/38418)

- オフライン BE がインポートエラーに影響を与える可能性がある問題の処理を改善しました。[#38256](https://github.com/apache/doris/pull/38256)

### 許可

- Ranger 認証プラグイン有効後のアクセスパフォーマンスを最適化しました。[#38575](https://github.com/apache/doris/pull/38575)
- Refresh カタログ/Database/table 操作の権限戦略を最適化し、ユーザーが SHOW 権限のみでこれらの操作を実行できるようになりました。[#39008](https://github.com/apache/doris/pull/39008)

## バグ修正

### レイクハウス

- カタログ切り替え時にデータベースが見つからないエラーが発生する可能性がある問題を修正しました。[#38114](https://github.com/apache/doris/pull/38114)

- S3上の存在しないデータを読み取ろうとすることによる例外を対処しました。[#38253](https://github.com/apache/doris/pull/38253)

- エクスポート操作中に異常なパスを指定すると不正なエクスポート場所になる可能性がある問題を解決しました。[#38602](https://github.com/apache/doris/pull/38602)

- Paimon テーブルの時間カラムのタイムゾーン問題を修正しました。[#37716](https://github.com/apache/doris/pull/37716)

- 特定の誤った動作を避けるため、Parquet PageIndex 機能を一時的に無効にしました。

- 外部テーブルクエリ中のブラックリスト内の Backend ノード選択を修正しました。[#38984](https://github.com/apache/doris/pull/38984)

- Parquet Struct カラム型で subcolumn が欠落することによるエラーを解決しました。[#39192](https://github.com/apache/doris/pull/39192)

- JDBC カタログ での述語 push down に関するいくつかの問題を対処しました。[#39082](https://github.com/apache/doris/pull/39082)

- 一部の履歴 Parquet フォーマットが不正なクエリ結果を引き起こす問題を修正しました。[#39375](https://github.com/apache/doris/pull/39375)

- Oracle JDBC カタログ での ojdbc6 ドライバーとの互換性を改善しました。[#39408](https://github.com/apache/doris/pull/39408)

- Refresh カタログ/Database/table 操作による FE メモリリークの可能性を解決しました。[#39186](https://github.com/apache/doris/pull/39186) [#39871](https://github.com/apache/doris/pull/39871)

- 特定の条件下での JDBC カタログ でのスレッドリークを修正しました。[#39666](https://github.com/apache/doris/pull/39666) [#39582](https://github.com/apache/doris/pull/39582)

- Hive Metastore イベント購読を有効にした後の潜在的なイベント処理失敗を対処しました。[#39239](https://github.com/apache/doris/pull/39239)

- データエラーを防ぐため、カスタムエスケープ文字と null フォーマットを持つ Hive Text フォーマットテーブルの読み取りを無効にしました。[#39869](https://github.com/apache/doris/pull/39869)

- 特定の条件下で Iceberg API を通じて作成された Iceberg テーブルへのアクセス問題を解決しました。[#39203](https://github.com/apache/doris/pull/39203)

- 高可用性が有効な HDFS クラスタに保存された Paimon テーブルが読み取れない問題を修正しました。[#39876](https://github.com/apache/doris/pull/39876)

- ファイルキャッシングを有効にした後の Paimon テーブル削除ベクター読み取り時に発生する可能性があるエラーを対処しました。[#39875](https://github.com/apache/doris/pull/39875)

- 特定の条件下で Parquet ファイル読み取り時の潜在的なデッドロックを解決しました。[#39945](https://github.com/apache/doris/pull/39945)

### Async Materialized View

- フォロワー FE で `SHOW CREATE MATERIALIZED VIEW` が使用できない問題を修正しました。[#38794](https://github.com/apache/doris/pull/38794)

- データツールでの適切な表示を可能にするため、メタデータ内の非同期マテリアライズドビューのオブジェクト型をテーブルとして統一しました。[#38797](https://github.com/apache/doris/
