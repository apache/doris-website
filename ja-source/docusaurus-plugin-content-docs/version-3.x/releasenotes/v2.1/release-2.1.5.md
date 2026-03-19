---
{
  "title": "リリース 2.1.5",
  "language": "ja",
  "description": "Apache Doris バージョン 2.1.5 は 2024年7月24日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris version 2.1.5が2024年7月24日に正式リリースされました。** このアップデートでは、データレイクハウスと高同時実行シナリオ向けの様々な機能体験を最適化し、非同期マテリアライズドビューの機能性を向上させました。さらに、安定性を向上させるためのいくつかの改善とバグ修正を実装しました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作の変更

- JDBC カタログのデフォルト接続プールサイズが10から30に増加され、高同時実行シナリオでの接続枯渇を防止します。[#37023](https://github.com/apache/doris/pull/37023)

- システムの予約メモリ（low water mark）が`min(6.4GB, MemTotal * 5%)`に調整され、BE OOMの問題を軽減します。

- 単一リクエストで複数のステートメントを処理する際、`CLIENT_MULTI_STATEMENTS`フラグが設定されていない場合は、最後のステートメントの結果のみが返されます。

- 非同期マテリアライズドビューのデータの直接変更は許可されなくなりました。[#37129](https://github.com/apache/doris/pull/37129)

- CTAS（Create table As Select）中のvarcharとchar型の長さ生成の動作を制御するセッション変数`use_max_length_of_varchar_in_ctas`が追加されました。デフォルト値はtrueです。falseに設定すると、最大長ではなく導出されたvarchar長が使用されます。[#37284](https://github.com/apache/doris/pull/37284)

- 統計収集では、ファイルサイズに基づいてHiveテーブルの行数を推定する機能がデフォルトで有効になりました。[#37694](https://github.com/apache/doris/pull/37694)

- 非同期マテリアライズドビューの透過的リライトがデフォルトで有効になりました。[#35897](https://github.com/apache/doris/pull/35897)

- 透過的リライトはパーティション化されたマテリアライズドビューを利用します。パーティションが失敗した場合、データの正確性を確保するため、ベーステーブルがマテリアライズドビューと結合されます。[#35897](https://github.com/apache/doris/pull/35897)

## 新機能

### レイクハウス

- セッション変数`read_csv_empty_line_as_null`を使用して、CSV形式ファイル読み取り時に空行を無視するかどうかを制御できます。[#37153](https://github.com/apache/doris/pull/37153)

  デフォルトでは空行は無視されます。trueに設定すると、空行は全ての列がnullの行として読み取られます。

- `serde_dialect="presto"`を設定することで、Prestoの複合型出力形式との互換性を有効にできます。[#37253](https://github.com/apache/doris/pull/37253)

### Multi-table Materialized View

- マテリアライズドビューの構築において非決定的関数をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- 非同期マテリアライズドビューの定義を原子的に置き換えます。[#37147](https://github.com/apache/doris/pull/37147)

- ビューの作成ステートメントを`SHOW CREATE MATERIALIZED VIEW`で確認できます。[#37125](https://github.com/apache/doris/pull/37125)

- 多次元集約と非集約クエリの透過的リライト。[#37436](https://github.com/apache/doris/pull/37436) [#37497](https://github.com/apache/doris/pull/37497)

- キー列とパーティション化を使用したロールアップでのDISTINCT集約をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- `date_trunc`を使用したパーティション化マテリアライズドビューによるパーティションロールアップをサポートします。[#31812](https://github.com/apache/doris/pull/31812) [#35562](https://github.com/apache/doris/pull/35562)

- パーティション化されたテーブル値関数（TVF）をサポートします。[#36479](https://github.com/apache/doris/pull/36479)

### Semi-Structured Data Management

- VARIANT型を使用するテーブルで部分カラム更新をサポートします。[#34925](https://github.com/apache/doris/pull/34925)

- PreparedStatementサポートがデフォルトで有効になりました。[#36581](https://github.com/apache/doris/pull/36581)

- VARIANT型をCSV形式にエクスポートできます。[#37857](https://github.com/apache/doris/pull/37857)

- `explode_json_object`関数がJSON Objectの行を列に転置します。[#36887](https://github.com/apache/doris/pull/36887)

- ES カタログでES NESTEDまたはOBJECT型をDoris JSON型にマップします。[#37101](https://github.com/apache/doris/pull/37101)

- match_phraseシリーズクエリのパフォーマンスを向上させるため、指定されたアナライザーを持つ転置インデックスでsupport_phraseがデフォルトで有効になります。[#37949](https://github.com/apache/doris/pull/37949)

### Query Optimizer

- `DELETE FROM`ステートメントの説明をサポートします。[#37100](https://github.com/apache/doris/pull/37100)

- 定数式パラメータのhint形式をサポートします。[#37988](https://github.com/apache/doris/pull/37988)

### Memory Management

- キャッシュをクリアするHTTP APIが追加されました。[#36599](https://github.com/apache/doris/pull/36599)

### 許可

- テーブル値関数（TVF）内のリソースの認可をサポートします。[#37132](https://github.com/apache/doris/pull/37132)

## 改善

### レイクハウス

- Paimonをバージョン0.8.1にアップグレード

- Paimonテーブル照会時のorg.apache.commons.lang.StringUtilsのClassNotFoundExceptionを修正。[#37512](https://github.com/apache/doris/pull/37512)

- Tencent Cloud LakeFSのサポートを追加。[#36891](https://github.com/apache/doris/pull/36891)

- 外部テーブルクエリでファイルリストを取得する際のタイムアウト時間を最適化。[#36842](https://github.com/apache/doris/pull/36842)

- セッション変数`fetch_splits_max_wait_time_ms`で設定可能。

- SQLServer JDBC カタログのデフォルト接続ロジックを改善。[#36971](https://github.com/apache/doris/pull/36971)

  デフォルトでは接続暗号化設定に介入しません。`force_sqlserver_jdbc_encrypt_false`がtrueに設定された場合のみ、認証エラーを減らすためにJDBC URLにencrypt=falseが強制的に追加されます。これにより、必要に応じて暗号化の有効/無効を切り替える、より柔軟な暗号化動作の制御が可能になります。

- Hiveテーブルのshow create tableステートメントにserdeプロパティを追加。[#37096](https://github.com/apache/doris/pull/37096)

- FEでのHiveテーブルリストのデフォルトキャッシュ時間を1日から4時間に変更

- データエクスポート（Export/Outfile）でParquetとORCの圧縮形式の指定をサポート

  詳細については、[docs](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT/?_highlight=compress_type)を参照してください。

- CTAS+TVFを使用してテーブルを作成する際、TVF内のパーティションカラムがStringではなくVarchar(65533)に自動的にマップされ、内部テーブルのパーティションカラムとして使用できます。[#37161](https://github.com/apache/doris/pull/37161)

- Hive書き込み操作のメタデータアクセス回数を最適化。[#37127](https://github.com/apache/doris/pull/37127)

- ES カタログでnested/object型のDoris Json型へのマッピングをサポート。[#37182](https://github.com/apache/doris/pull/37182)

- 古いバージョンのojdbcドライバーを使用してOracleに接続する際のエラーメッセージを改善。[#37634](https://github.com/apache/doris/pull/37634)

- Incremental Read中にHudiテーブルが空のセットを返した場合、Dorisもエラーではなく空のセットを返すように改善。[#37636](https://github.com/apache/doris/pull/37636)

- 一部のケースで内部-外部テーブル結合クエリがFEタイムアウトを引き起こす問題を修正。[#37757](https://github.com/apache/doris/pull/37757)

- Hive metastoreイベントリスナーが有効な場合に、古いバージョンから新しいバージョンへのアップグレード中にFEメタデータリプレイエラーが発生する問題を修正。[#37757](https://github.com/apache/doris/pull/37757)

### Multi-table Materialized View

- 非同期マテリアライズドビューのキーカラム選択を自動化。[#36601](https://github.com/apache/doris/pull/36601)

- マテリアライズドビューのパーティション定義でdate_truncをサポート。[#35562](https://github.com/apache/doris/pull/35562)

- ネストされたマテリアライズドビュー集約での透過的リライトを有効化。[#37651](https://github.com/apache/doris/pull/37651)

- スキーマ変更がデータの正確性に影響しない場合、非同期マテリアライズドビューが利用可能な状態を維持。[#37122](https://github.com/apache/doris/pull/37122)

- 透過的リライトの計画速度を向上。[#37935](https://github.com/apache/doris/pull/37935)

- 非同期マテリアライズドビューの可用性を計算する際、現在のリフレッシュステータスは考慮されなくなりました。[#36617](https://github.com/apache/doris/pull/36617)

### Semi-Structured Data Management

- サンプリングによるVARIANTサブカラム表示のDESCパフォーマンスを最適化。[#37217](https://github.com/apache/doris/pull/37217)

- JSON型で空のキーを持つ特殊なJSONデータをサポート。[#36762](https://github.com/apache/doris/pull/36762)

### Inverted Index

- オブジェクトストレージアクセスの遅延を避けるため、転置インデックス存在確認の呼び出しを最小化してレイテンシを削減。[#36945](https://github.com/apache/doris/pull/36945)

- 転置インデックスクエリプロセスのオーバーヘッドを最適化。[#35357](https://github.com/apache/doris/pull/35357)

- マテリアライズドビューでの転置インデックスを防止。[#36869](https://github.com/apache/doris/pull/36869)

### Query Optimizer

- 比較式の両辺がリテラルの場合、文字列リテラルは相手側の型への変換を試行します。[#36921](https://github.com/apache/doris/pull/36921)

- variant型のサブパスpushdown機能をリファクタリングし、複雑なpushdownシナリオのサポートを向上。[#36923](https://github.com/apache/doris/pull/36923)

- マテリアライズドビューのコスト計算ロジックを最適化し、より低コストのマテリアライズドビューをより正確に選択できるようになりました。[#37098](https://github.com/apache/doris/pull/37098)

- SQLでユーザー変数を使用する際のSQLキャッシュ計画速度を改善。[#37119](https://github.com/apache/doris/pull/37119)

- NOT NULL式の行推定ロジックを最適化し、クエリにNOT NULLが含まれる場合のパフォーマンスを向上。[#37498](https://github.com/apache/doris/pull/37498)

- LIKE式のnull rejection導出ロジックを最適化。[#37864](https://github.com/apache/doris/pull/37864)

- 特定のパーティションのクエリが失敗した場合のエラーメッセージを改善し、問題の原因となるテーブルをより明確に表示。[#37280](https://github.com/apache/doris/pull/37280)

### Query Execution

- 特定のシナリオでbitmap_union演算子のパフォーマンスを最大3倍まで改善。

- ARM環境でのArrow Flight読み取りパフォーマンスを向上。

- explode、explode_map、explode_json関数の実行パフォーマンスを最適化。

### Data Loading

- `INSERT INTO ... FROM TABLE VALUE FUNCTION`での`max_filter_ratio`設定をサポート

## バグ修正

### レイクハウス

- 一部のケースでParquet形式をクエリする際にBEクラッシュを引き起こす問題を修正。[#37086](https://github.com/apache/doris/pull/37086)

- Parquet形式をクエリする際にBE側で過度なログが出力される問題を修正。[#37012](https://github.com/apache/doris/pull/37012)

- 一部のケースでFE側で大量の重複FileSystemオブジェクトが作成される問題を修正。[#37142](https://github.com/apache/doris/pull/37142)

- 一部のケースでHiveへの書き込み後にトランザクション情報がクリーンアップされない問題を修正。[#37172](https://github.com/apache/doris/pull/37172)

- 一部のケースでHiveテーブル書き込み操作によって引き起こされるスレッドリークの問題を修正。[#37247](https://github.com/apache/doris/pull/37247)

- 一部のケースでHive Textフォーマットの行・列区切り文字が正しく取得できない問題を修正。[#37188](https://github.com/apache/doris/pull/37188)

- 一部のケースでlz4圧縮ブロック読み取り時の同時実行の問題を修正。[#37187](https://github.com/apache/doris/pull/37187)

- 一部のケースでIcebergテーブルでの`count(*)`が間違った結果を返す問題を修正。[#37810](https://github.com/apache/doris/pull/37810)

- 一部のケースでMinIOベースのPaimonカタログ作成がFEメタデータリプレイエラーを引き起こす問題を修正。[#37249](https://github.com/apache/doris/pull/37249)

- 一部のケースでRangerを使用してカタログを作成するとクライアントがハングする問題を修正。[#37551](https://github.com/apache/doris/pull/37551)

### Multi-table Materialized View

- ベーステーブルに新しいパーティションを追加した後、パーティション集約ロールアップリライト後に間違った結果を導く問題を修正。[#37651](https://github.com/apache/doris/pull/37651)

- 関連するベーステーブルパーティションを削除した後、マテリアライズドビューパーティションステータスが非同期に設定されない問題を修正。[#36602](https://github.com/apache/doris/pull/36602)

- 非同期マテリアライズドビュー構築中の時々発生するデッドロックの問題を修正。[#37133](https://github.com/apache/doris/pull/37133)

- 単一の非同期マテリアライズドビューリフレッシュで大量のパーティションをリフレッシュする際に時々発生する「nereids cost too much time」エラーを修正。[#37589](https://github.com/apache/doris/pull/37589)

- 最終のselectリストにnullリテラルが含まれる場合に非同期マテリアライズドビューを作成できない問題を修正。[#37281](https://github.com/apache/doris/pull/37281)

- 単一テーブルマテリアライズドビューで、集約マテリアライズドビューが正常にリライトされたにも関わらず、CBOがそれを選択しない問題を修正。[#35721](https://github.com/apache/doris/pull/35721) [#36058](https://github.com/apache/doris/pull/36058)

- 結合入力が両方とも集約であるパーティション化マテリアライズドビューを構築する際にパーティション導出が失敗する問題を修正。[#34781](https://github.com/apache/doris/pull/34781)

### Semi-Structured Data Management

- 同時実行や異常データなどの特殊なケースでのVARIANTの問題を修正。[#37976](https://github.com/apache/doris/pull/37976) [#37839](https://github.com/apache/doris/pull/37839) [#37794](https://github.com/apache/doris/pull/37794) [#37674](https://github.com/apache/doris/pull/37674) [#36997](https://github.com/apache/doris/pull/36997)

- サポートされていないSQLでVARIANTを使用した際のcoredumpの問題を修正。[#37640](https://github.com/apache/doris/pull/37640)

- 1.xから2.x以上のバージョンにアップグレードする際のMAPデータ型に関連するcoredumpの問題を修正。[#36937](https://github.com/apache/doris/pull/36937)

- Array型のES カタログサポートを改善。[#36936](https://github.com/apache/doris/pull/36936)

### Inverted Index

- Inverted Index v2のDROP INDEXでメタデータが削除されない問題を修正。[#37646](https://github.com/apache/doris/pull/37646)

- 文字列長が「ignore above」閾値を超えた場合のクエリ精度の問題を修正。[#37679](https://github.com/apache/doris/pull/37679)

- インデックスサイズ統計の問題を修正。[#37232](https://github.com/apache/doris/pull/37232) [#37564](https://github.com/apache/doris/pull/37564)

### Query Optimizer

- 予約キーワードの使用によってインポート操作の実行が阻害される問題を修正。[#35938](https://github.com/apache/doris/pull/35938)

- テーブル作成時にchar(255)がchar(1)として誤って記録される型エラーを修正。[#37671](https://github.com/apache/doris/pull/37671)

- 相関サブクエリの結合式が複雑な式の場合に間違った結果を返す問題を修正。[#37683](https://github.com/apache/doris/pull/37683)

- decimal型の不正確なバケットプルーニングの潜在的問題を修正。[#38013](https://github.com/apache/doris/pull/38013)

- 特定のシナリオでpipeline local shuffleが有効な場合の不正確な集約演算子結果を修正。[#38016](https://github.com/apache/doris/pull/38016)

- 集約演算子に等価式が存在する場合に発生する計画エラーを修正。[#36622](https://github.com/apache/doris/pull/36622)

- 集約演算子にlambda式が存在する場合に発生する計画エラーを修正。[#37285](https://github.com/apache/doris/pull/37285)

- ウィンドウ関数がリテラルに最適化された際に生成されるリテラルの型が間違っていて実行を阻害する問題を修正。[#37283](https://github.com/apache/doris/pull/37283)

- 集約関数foreachコンビネータによるnull属性の誤った出力の問題を修正。[#37980](https://github.com/apache/doris/pull/37980)

- acos関数のパラメータが範囲外のリテラルの場合に計画できない問題を修正。[#37996](https://github.com/apache/doris/pull/37996)

- 同期マテリアライズドビューでのクエリにパーティションを指定した際の計画エラーを修正。[#36982](https://github.com/apache/doris/pull/36982)

- 計画中に時々発生するNull Pointer Exception（NPE）を修正。[#38024](https://github.com/apache/doris/pull/38024)

### Query Execution

- decimal データ型を条件として使用した際のdelete whereステートメントのエラーを修正。[#37801](https://github.com/apache/doris/pull/37801)

- クエリ実行終了後にBEメモリが解放されない問題を修正。[#37792](https://github.com/apache/doris/pull/37792) [#37297](https://github.com/apache/doris/pull/37297)

- 高QPSシナリオで監査ログがFEメモリを過度に占有する問題を修正。[#37786](https://github.com/apache/doris/pull/37786)

- sleep関数が不正な入力値を受け取った際のBE core dumpを修正。[#37681](https://github.com/apache/doris/pull/37681)

- sync filter size実行中に発生するエラーを修正。[#37103](https://github.com/apache/doris/pull/37103)

- 実行中にタイムゾーンを使用した際の間違った結果を修正。[#37062](https://github.com/apache/doris/pull/37062)

- 文字列を整数にキャストする際の間違った結果を修正。[#36788](https://github.com/apache/doris/pull/36788)

- pipelinex有効時にArrow Flightプロトコルを使用した際のクエリエラーを修正。[#35804](https://github.com/apache/doris/pull/35804)

- 文字列をdate/datetimeにキャストする際のエラーを修正。[#35637](https://github.com/apache/doris/pull/35637)

- <=>を使用した大きなテーブル結合クエリ中のBE core dumpを修正。[#36263](https://github.com/apache/doris/pull/36263)

### Storage Management

- カラム更新・書き込み操作中に発生するDELETE SIGNデータの非表示問題を修正。[#36755](https://github.com/apache/doris/pull/36755)

- スキーマ変更中のFEメモリ使用量を最適化。[#36756](https://github.com/apache/doris/pull/36756)

- トランザクションが中止されないためにBE再起動時にハングする問題を修正。[#36437](https://github.com/apache/doris/pull/36437)

- NOT NULLからNULLデータ型に変更する際に時々発生するエラーを修正。[#36389](https://github.com/apache/doris/pull/36389)

- BE停止時のレプリカ修復スケジューリングを最適化。[#36897](https://github.com/apache/doris/pull/36897)

- 単一BE上でのタブレット作成のラウンドロビンディスク選択をサポート。[#36900](https://github.com/apache/doris/pull/36900)

- 遅いパブリッシングによって引き起こされるクエリエラー-230を修正。[#36222](https://github.com/apache/doris/pull/36222)

- パーティションバランシングの速度を向上。[#36976](https://github.com/apache/doris/pull/36976)

- FD枯渇を避けるため、ファイル記述子（FD）数とメモリを使用してセグメントキャッシュを制御。[#37035](https://github.com/apache/doris/pull/37035)

- 同時実行クローンとalter操作によって引き起こされる潜在的レプリカ損失を修正。[#36858](https://github.com/apache/doris/pull/36858)

- カラム順序を調整できない問題を修正。[#37226](https://github.com/apache/doris/pull/37226)

- auto-incrementカラムでの特定のスキーマ変更操作を禁止。[#37331](https://github.com/apache/doris/pull/37331)

- DELETE操作の不正確なエラー報告を修正。[#37374](https://github.com/apache/doris/pull/37374)

- BE側でのtrash有効期限を1日に調整。[#37409](https://github.com/apache/doris/pull/37409)

- コンパクションメモリ使用量とスケジューリングを最適化。[#37491](https://github.com/apache/doris/pull/37491)

- FE再起動を引き起こす潜在的な過大バックアップをチェック。[#37466](https://github.com/apache/doris/pull/37466)

- 動的パーティション削除ポリシーとクロスパーティション動作を2.1.3に復元。[#37570](https://github.com/apache/doris/pull/37570) [#37506](https://github.com/apache/doris/pull/37506)

- DELETE述語でのdecimal型に関連するエラーを修正。[#37710](https://github.com/apache/doris/pull/37710)

### Data Loading

- インポート中のエラーハンドリングでの競合状態によるデータ非表示問題を修正。[#36744](https://github.com/apache/doris/pull/36744)

- streamloadインポートでのhhl_from_base64のサポートを追加。[#36819](https://github.com/apache/doris/pull/36819)

- 単一テーブルに対して非常に大量のタブレットをインポートする際の潜在的FE OOM問題を修正。[#36944](https://github.com/apache/doris/pull/36944)

- FEマスター・スレーブ切り替え中に発生する可能性があるauto-incrementカラム重複を修正。[#36961](https://github.com/apache/doris/pull/36961)

- auto-incrementカラムでのinsert into selectのエラーを修正。[#37029](https://github.com/apache/doris/pull/37029)

- メモリ使用量を最適化するためデータflushスレッド数を削減。[#37092](https://github.com/apache/doris/pull/37092)

- routine loadタスクの自
