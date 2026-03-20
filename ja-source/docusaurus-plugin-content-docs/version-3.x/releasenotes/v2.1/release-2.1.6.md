---
{
  "title": "リリース 2.1.6",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.6 が 2024年9月10日に正式リリースされました。"
}
---
コミュニティの皆様、**Apache Dorisバージョン2.1.6が2024年9月10日に正式リリースされました。** このバージョンでは、レイクハウス、Async Materialized Views、Semi-Structured Data Managementの継続的なアップグレードと改善を提供しています。さらに、クエリオプティマイザー、実行エンジン、ストレージ管理、権限管理などの分野において複数の修正が実装されました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHubリリース:** https://github.com/apache/doris/releases

## 動作変更

- create repositoryから`delete_if_exists`オプションを削除しました。[#38192](https://github.com/apache/doris/pull/38192)

- JDBC prepared statementが監査ログを記録するかどうかを制御する`enable_prepared_stmt_audit_log`セッション変数を追加しました。デフォルトは記録しません。[#38624](https://github.com/apache/doris/pull/38624) [#39009](https://github.com/apache/doris/pull/39009)

- segment cacheのfdリミットとメモリ制約を実装しました。[#39689](https://github.com/apache/doris/pull/39689)

- FE設定項目`sys_log_mode`がBRIEFに設定されている場合、ログにファイルロケーション情報が追加されます。[#39571](https://github.com/apache/doris/pull/39571)

- セッション変数`max_allowed_packet`のデフォルト値を16MBに変更しました。[#38697](https://github.com/apache/doris/pull/38697)

- 単一リクエストに複数のステートメントが含まれる場合、セミコロンを使用してそれらを分離する必要があります。[#38670](https://github.com/apache/doris/pull/38670)

- ステートメントがセミコロンで始まることをサポートしました。[#39399](https://github.com/apache/doris/pull/39399)

- `show create table`などのステートメントでタイプフォーマットをMySQLに合わせました。[#38012](https://github.com/apache/doris/pull/38012)

- 新しいオプティマイザーの計画がタイムアウトした場合、古いオプティマイザーがより長い計画時間を使用することを防ぐため、フォールバックしなくなりました。[#39499](https://github.com/apache/doris/pull/39499)

## 新機能

### レイクハウス

- Icebergテーブルのwritebackをサポートしました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/lakehouse/datalake-building/iceberg-build)を参照してください。

- SQLインターセプションルールが外部テーブルをサポートするようになりました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception)を参照してください。

- BEデータキャッシュメトリクスを表示するシステムテーブル`file_cache_statistics`を追加しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/system-tables/file_cache_statistics)を参照してください。

### Async Materialized View

- INSERT時の透明な書き換えをサポートしました。[#38115](https://github.com/apache/doris/pull/38115)

- クエリにvariant typesが存在する場合の透明な書き換えをサポートしました。[#37929](https://github.com/apache/doris/pull/37929)

### Semi-Structured Data Management

- ARRAY MAPからJSONタイプへのキャストをサポートしました。[#36548](https://github.com/apache/doris/pull/36548)

- `json_keys`関数をサポートしました。[#36411](https://github.com/apache/doris/pull/36411)

- JSON インポート時にJSONパス $.の指定をサポートしました。[#38213](https://github.com/apache/doris/pull/38213)

- ARRAY、MAP、STRUCTタイプが`replace_if_not_null`をサポートするようになりました。[#38304](https://github.com/apache/doris/pull/38304)

- ARRAY、MAP、STRUCTタイプがカラム順序の調整をサポートするようになりました。[#39210](https://github.com/apache/doris/pull/39210)

- 複数フィールド間でキーワードをマッチングし、inverted indexアクセラレーションをサポートする`multi_match`関数を追加しました。[#37722](https://github.com/apache/doris/pull/37722)

### Query Optimizer

- MySQLプロトコルで返されるカラムに、元のデータベース名、テーブル名、カラム名、およびエイリアスを入力しました。[#38126](https://github.com/apache/doris/pull/38126)

- 集約関数`group_concat`でorder byとdistinctの同時使用をサポートしました。[#38080](https://github.com/apache/doris/pull/38080)

- SQLキャッシュが異なるコメントを持つクエリのキャッシュ結果の再利用をサポートするようになりました。[#40049](https://github.com/apache/doris/pull/40049)

- パーティションプルーニングで、フィルター条件に`date_trunc`と日付関数を含めることをサポートしました。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- テーブルエイリアスの修飾子プレフィックスとして、テーブルが存在するデータベース名の使用を許可しました。[#38640](https://github.com/apache/doris/pull/38640)

- ヒントスタイルコメントをサポートしました。[#39113](https://github.com/apache/doris/pull/39113)

### Others

- テーブルプロパティを表示するシステムテーブル`table_properties`を追加しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/system-tables/information_schema/table_properties)を参照してください。

- FEにデッドロックとスローロック検出を導入しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/admin-manual/maint-monitor/frontend-lock-manager)を参照してください。

## 改善

### レイクハウス

- 外部テーブルメタデータキャッシュメカニズムを再実装しました。

  - 詳細については、[ドキュメント](https://doris.apache.org/docs/lakehouse/metacache)を参照してください。

- デフォルト値がfalseの`keep_carriage_return`セッション変数を追加しました。デフォルトでは、Hive Textフォーマットテーブルの読み取りで`\r\n`と`\n`の両方を改行文字として扱います。[#38099](https://github.com/apache/doris/pull/38099)

- Parquet/ORCファイル読み書き操作のメモリ統計を最適化しました。[#37257](https://github.com/apache/doris/pull/37257)

- Paimonテーブルに対するIN/NOT INプレディケートのプッシュダウンをサポートしました。[#38390](https://github.com/apache/doris/pull/38390)

- Hudiテーブル用のTime Travel構文をサポートするようオプティマイザーを強化しました。[#38591](https://github.com/apache/doris/pull/38591)

- Kerberos認証関連プロセスを最適化しました。[#37301](https://github.com/apache/doris/pull/37301)

- カラム名変更操作後のHiveテーブル読み取りを有効にしました。[#38809](https://github.com/apache/doris/pull/38809)

- 外部テーブルのパーティションカラムの読み取りパフォーマンスを最適化しました。[#38810](https://github.com/apache/doris/pull/38810)

- 外部テーブルクエリ計画時のデータシャードマージ戦略を改善し、多数の小さなシャードによるパフォーマンス低下を回避しました。[#38964](https://github.com/apache/doris/pull/38964)

- `SHOW CREATE DATABASE/TABLE`にlocationなどの属性を追加しました。[#39644](https://github.com/apache/doris/pull/39644)

- MaxCompute カタログで複合型をサポートしました。[#39822](https://github.com/apache/doris/pull/39822)

- 非同期読み込みを使用してBEの長い起動時間を回避し、ファイルキャッシュローディング戦略を最適化しました。[#39036](https://github.com/apache/doris/pull/39036)

- 長期間保持されるロックの削除など、ファイルキャッシュ削除戦略を改善しました。[#39721](https://github.com/apache/doris/pull/39721)

### Async Materialized View

- 時間別、週別、四半期別のパーティションロールアップ構築をサポートしました。[#37678](https://github.com/apache/doris/pull/37678)

- Hive外部テーブルベースのマテリアライズドビューについて、各更新時に最新データを確実に取得するため、更新前にメタデータキャッシュを更新するようになりました。[#38212](https://github.com/apache/doris/pull/38212)

- メタデータのバッチ取得により、ストレージ・コンピュート分離モードでの透明な書き換え計画のパフォーマンスを向上させました。[#39301](https://github.com/apache/doris/pull/39301)

- 重複した列挙を禁止することで、透明な書き換え計画のパフォーマンスを向上させました。[#39541](https://github.com/apache/doris/pull/39541)

- Hive外部テーブルパーティションベースのマテリアライズドビュー更新のための透明な書き換えパフォーマンスを改善しました。[#38525](https://github.com/apache/doris/pull/38525)

### Semi-Structured Data Management

- TOPNクエリのメモリ割り当てを最適化してパフォーマンスを向上させました。[#37429](https://github.com/apache/doris/pull/37429)

- inverted indexにおける文字列処理のパフォーマンスを向上させました。[#37395](https://github.com/apache/doris/pull/37395)

- MOWテーブルのinverted indexのパフォーマンスを最適化しました。[#37428](https://github.com/apache/doris/pull/37428)

- 圧縮効果を制御するため、テーブル作成時のrow-store`page_size`指定をサポートしました。[#37145](https://github.com/apache/doris/pull/37145)

### Query Optimizer

- mark joinの行数推定アルゴリズムを調整し、より正確なカーディナリティ推定を実現しました。[#38270](https://github.com/apache/doris/pull/38270)

- semi/anti joinのコスト推定アルゴリズムを最適化し、より正確なsemi/anti joinの順序選択を可能にしました。[#37951](https://github.com/apache/doris/pull/37951)

- 一部のカラムに統計情報がない場合のフィルター推定アルゴリズムを調整し、より正確なカーディナリティ推定を実現しました。[#39592](https://github.com/apache/doris/pull/39592)

- set operation operatorのインスタンス計算ロジックを修正し、極端なケースでの並列性不足を防ぎました。[#39999](https://github.com/apache/doris/pull/39999)

- bucket shuffleの使用戦略を調整し、データが十分にシャッフルされていない場合により良いパフォーマンスを実現しました。[#36784](https://github.com/apache/doris/pull/36784)

- ウィンドウ関数データの早期フィルタリングを有効にし、単一プロジェクションでの複数のウィンドウ関数をサポートしました。[#38393](https://github.com/apache/doris/pull/38393)

- フィルター条件に`NullLiteral`が存在する場合、falseに折り畳み、さらに`EmptySet`に変換して不要なデータスキャンと計算を削減できるようになりました。[#38135](https://github.com/apache/doris/pull/38135)

- 述語導出の範囲を拡張し、特定のパターンを持つクエリでのデータスキャンを削減しました。[#37314](https://github.com/apache/doris/pull/37314)

- パーティションプルーニングで部分短絡評価ロジックをサポートし、パーティションプルーニングのパフォーマンスを向上させ、特定のシナリオで100%以上の改善を実現しました。[#38191](https://github.com/apache/doris/pull/38191)

- ユーザー変数内での任意のスカラー関数の計算を有効にしました。[#39144](https://github.com/apache/doris/pull/39144)

- クエリにエイリアス競合が存在する場合、エラーメッセージをMySQLと一致させました。[#38104](https://github.com/apache/doris/pull/38104)

### Query Execution

- 2.1から3.xへの互換性のためにAggStateを適応し、coredump問題を修正しました。[#37104](https://github.com/apache/doris/pull/37104)

- joinが関与しない場合のローカルシャッフルの戦略選択をリファクタリングしました。[#37282](https://github.com/apache/doris/pull/37282)

- 内部テーブルクエリのスキャナーを非同期アプローチに修正し、内部テーブルクエリ中のブロッキングを防ぎました。[#38403](https://github.com/apache/doris/pull/38403)

- Join operatorでハッシュテーブル構築時のブロックマージプロセスを最適化しました。[#37471](https://github.com/apache/doris/pull/37471)

- MultiCast操作のロック保持時間を短縮しました。[37462](https://github.com/apache/doris/pull/37462)

- gRPCのkeepAliveTimeを最適化し、接続監視メカニズムを追加し、クエリ実行中のRPCエラーによるクエリ失敗の確率を削減しました。[#37304](https://github.com/apache/doris/pull/37304)

- メモリ制限を超えた場合にjemallocのすべてのdirty pageをクリーンアップしました。[#37164](https://github.com/apache/doris/pull/37164)

- 定数型を処理する際の`aes_encrypt`/`decrypt`関数のパフォーマンスを向上させました。[#37194](https://github.com/apache/doris/pull/37194)

- 定数データ処理時の`json_extract`関数のパフォーマンスを最適化しました。[#36927](https://github.com/apache/doris/pull/36927)

- 定数データ処理時のParseURL関数のパフォーマンスを最適化しました。[#36882](https://github.com/apache/doris/pull/36882)

### Backup Recovery / CCR

- Restoreで冗長なタブレットの削除とパーティションオプションをサポートしました。[#39363](https://github.com/apache/doris/pull/39363)

- リポジトリ作成時にストレージ接続を確認します。[#39538](https://github.com/apache/doris/pull/39538)

- binlogが`DROP TABLE`をサポートし、CCRが`DROP TABLE`操作を増分同期できるようになりました。[#38541](https://github.com/apache/doris/pull/38541)

### Compaction

- 高優先度compactionタスクがタスク同時実行制御制限の対象でなかった問題を改善しました。[#38189](https://github.com/apache/doris/pull/38189)

- データ特性に基づいてcompactionのメモリ消費を自動的に削減します。[#37486](https://github.com/apache/doris/pull/37486)

- 順次データ最適化戦略がaggregate tablesやMOR UNIQUEテーブルで不正なデータを引き起こす可能性があった問題を修正しました。[#38299](https://github.com/apache/doris/pull/38299)

- レプリカ補充中のcompaction時のrowset選択戦略を最適化し、-235エラーの発生を回避しました。[#39262](https://github.com/apache/doris/pull/39262)

### MOW (Merge-On-Write)

- 同時カラム更新とcompactionによって引き起こされる低速カラム更新を最適化しました。[#38682](https://github.com/apache/doris/pull/38682)

- バルクデータインポート中のsegcompactionが不正なMOWデータを引き起こす可能性があった問題を修正しました。[#38992](https://github.com/apache/doris/pull/38992) [#39707](https://github.com/apache/doris/pull/39707)

- BE再起動後に発生する可能性があったカラム更新でのデータロスを修正しました。[#39035](https://github.com/apache/doris/pull/39035)

### Storage Management

- ホットコールド階層化下でクエリがローカルデータレプリカを優先するかどうかを制御するFE設定を追加しました。[#38322](https://github.com/apache/doris/pull/38322)

- 期限切れBEレポートメッセージが新しく作成されたタブレットを含むよう最適化しました。[#38839](https://github.com/apache/doris/pull/38839) [#39605](https://github.com/apache/doris/pull/39605)

- データが不足しているレプリカを優先するレプリカスケジューリング優先度戦略を最適化しました。[#38884](https://github.com/apache/doris/pull/38884)

- 未完了のALTERジョブを持つタブレットのバランシングを防ぎました。[#39202](https://github.com/apache/doris/pull/39202)

- listパーティショニングを持つテーブルのバケット数変更を有効にしました。[#39688](https://github.com/apache/doris/pull/39688)

- オンラインディスクサービスからのクエリを優先します。[#39654](https://github.com/apache/doris/pull/39654)

- 同期中に削除をサポートしないマテリアライズドビューベーステーブルのエラーメッセージを改善しました。[#39857](https://github.com/apache/doris/pull/39857)

- 単一カラムが4GBを超える場合のエラーメッセージを改善しました。[#39897](https://github.com/apache/doris/pull/39897)

- `INSERT`ステートメント中にプランエラーが発生した場合に、中止されたトランザクションが省略されていた問題を修正しました。[#38260](https://github.com/apache/doris/pull/38260)

- SSL接続クローズ中の例外を修正しました。[#38677](https://github.com/apache/doris/pull/38677)

- ラベルを使用してトランザクションを中止する際にテーブルロックが保持されていなかった問題を修正しました。[#38842](https://github.com/apache/doris/pull/38842)

- `gson pretty`が大きな画像問題を引き起こしていた問題を修正しました。[#39135](https://github.com/apache/doris/pull/39135)

- 新しいオプティマイザーが`CREATE TABLE`ステートメントでバケット値0をチェックしていなかった問題を修正しました。[#38999](https://github.com/apache/doris/pull/38999)

- `DELETE`条件述語に中国語カラム名が含まれる場合のエラーを修正しました。[#39500](https://github.com/apache/doris/pull/39500)

- パーティションバランシングモードでの頻繁なタブレットバランシング問題を修正しました。[#39606](https://github.com/apache/doris/pull/39606)

- パーティションストレージポリシー属性が失われる問題を修正しました。[#39677](https://github.com/apache/doris/pull/39677)

- トランザクション内で複数テーブルをインポートする際の統計の不正確さを修正しました。[#39548](https://github.com/apache/doris/pull/39548)

- ランダムバケットテーブル削除時のエラーを修正しました。[#39830](https://github.com/apache/doris/pull/39830)

- 存在しないUDFによるFE起動失敗の問題を修正しました。[#39868](https://github.com/apache/doris/pull/39868)

- FEマスターとスレーブ間の最後の失敗バージョンの不整合を修正しました。[#39947](https://github.com/apache/doris/pull/39947)

- schema changeジョブがキャンセルされた際に関連タブレットがまだschema change状態にある可能性があった問題を修正しました。[#39327](https://github.com/apache/doris/pull/39327)

- 単一ステートメントschema change（SC）でタイプとカラム順序を変更する際のエラーを修正しました。[#39107](https://github.com/apache/doris/pull/39107)

### Data Loading

- インポート中の-238エラーのエラーメッセージを改善しました。[#39182](https://github.com/apache/doris/pull/39182)

- パーティション復元中に他のパーティションへのインポートを許可しました。[#39915](https://github.com/apache/doris/pull/39915)

- group commit中にFEがBEを選択する戦略を最適化しました。[#37830](https://github.com/apache/doris/pull/37830) [#39010](https://github.com/apache/doris/pull/39010)

- 一般的なstreamloadエラーメッセージでスタックトレースの印刷を回避しました。[#38418](https://github.com/apache/doris/pull/38418)

- オフラインBEがインポートエラーに影響する可能性がある問題の処理を改善しました。[#38256](https://github.com/apache/doris/pull/38256)

### 許可

- Ranger認証プラグインを有効にした後のアクセスパフォーマンスを最適化しました。[#38575](https://github.com/apache/doris/pull/38575)
- Refresh カタログ/Database/table操作の権限戦略を最適化し、ユーザーがSHOW権限のみでこれらの操作を実行できるようにしました。[#39008](https://github.com/apache/doris/pull/39008)

## バグ修正

### レイクハウス

- カタログ切り替え時にデータベースが見つからないエラーが発生する可能性があった問題を修正しました。[#38114](https://github.com/apache/doris/pull/38114)

- S3上の存在しないデータの読み取り試行によって引き起こされる例外を対処しました。[#38253](https://github.com/apache/doris/pull/38253)

- エクスポート操作中に異常なパスを指定した場合に不正なエクスポート場所につながる可能性があった問題を解決しました。[#38602](https://github.com/apache/doris/pull/38602)

- Paimonテーブルの時刻カラムのタイムゾーン問題を修正しました。[#37716](https://github.com/apache/doris/pull/37716)

- 特定の誤った動作を回避するため、Parquet PageIndex機能を一時的に無効にしました。

- 外部テーブルクエリ中のブラックリスト内Backendノードの選択を修正しました。[#38984](https://github.com/apache/doris/pull/38984)

- Parquet Structカラムタイプでサブカラムが不足することによって引き起こされるエラーを解決しました。[#39192](https://github.com/apache/doris/pull/39192)

- JDBC カタログでのpredicate pushdownに関する複数の問題を対処しました。[#39082](https://github.com/apache/doris/pull/39082)

- 一部の履歴Parquetフォーマットが不正なクエリ結果につながる問題を修正しました。[#39375](https://github.com/apache/doris/pull/39375)

- Oracle JDBC カタログのojdbc6ドライバーとの互換性を改善しました。[#39408](https://github.com/apache/doris/pull/39408)

- Refresh カタログ/Database/table操作によって引き起こされる可能性があったFEメモリリークを解決しました。[#39186](https://github.com/apache/doris/pull/39186) [#39871](https://github.com/apache/doris/pull/39871)

- 特定の条件下でJDBC カタログのスレッドリークを修正しました。[#39666](https://github.com/apache/doris/pull/39666) [#39582](https://github.com/apache/doris/pull/39582)

- Hive Metastoreイベント購読を有効にした後の潜在的なイベント処理失敗を対処しました。[#39239](https://github.com/apache/doris/pull/39239)

- データエラーを防ぐため、カスタムエスケープ文字とnullフォーマットを持つHive Textフォーマットテーブルの読み取りを無効にしました。[#39869](https://github.com/apache/doris/pull/39869)

- 特定の条件下でIceberg APIを介して作成されたIcebergテーブルへのアクセス問題を解決しました。[#39203](https://github.com/apache/doris/pull/39203)

- 高可用性が有効なHDFSクラスター上に保存されたPaimonテーブルを読み取れない問題を修正しました。[#39876](https://github.com/apache/doris/pull/39876)

- ファイルキャッシングを有効にした後でPaimonテーブル削除ベクターを読み取る際に発生する可能性があったエラーを対処しました。[#39875](https://github.com/apache/doris/pull/39875)

- 特定の条件下でParquetファイル読み取り時に発生する可能性があったデッドロックを解決しました。[#39945](https://github.com/apache/doris/pull/39945)

### Async Materialized View

- フォロワーFEで`SHOW CREATE MATERIALIZED VIEW`を使用できない問題を修正しました。[#38794](https://github.com/apache/doris/pull/38794)

- データツールでの適切な表
