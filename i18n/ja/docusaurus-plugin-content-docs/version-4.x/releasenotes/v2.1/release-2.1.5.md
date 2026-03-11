---
{
  "title": "リリース 2.1.5",
  "language": "ja",
  "description": "Apache Doris バージョン2.1.5は2024年7月24日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris version 2.1.5 が2024年7月24日に正式にリリースされました。** このアップデートでは、データレイクハウスおよび高並行性シナリオに対する各種機能体験、非同期マテリアライズドビューの機能を最適化しました。さらに、安定性を向上させるためにいくつかの改善とバグ修正を実装しました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- JDBC カタログ のデフォルトコネクションプールサイズを10から30に増加し、高並行性シナリオでのコネクション不足を防止します。[#37023](https://github.com/apache/doris/pull/37023)

- システムの予約メモリ（low water mark）を `min(6.4GB, MemTotal * 5%)` に調整し、BE OOM問題を軽減します。

- 単一リクエストで複数のステートメントを処理する際、`CLIENT_MULTI_STATEMENTS` フラグが設定されていない場合、最後のステートメントの結果のみが返されます。

- 非同期マテリアライズドビューのデータの直接変更は許可されなくなりました。[#37129](https://github.com/apache/doris/pull/37129)

- CTAS（Create table As Select）中のvarcharおよびchar型の長さ生成の動作を制御するセッション変数 `use_max_length_of_varchar_in_ctas` が追加されました。デフォルト値はtrueです。falseに設定すると、最大長ではなく派生したvarchar長が使用されます。[#37284](https://github.com/apache/doris/pull/37284)

- 統計収集では、ファイルサイズに基づくHiveテーブルの行数推定機能がデフォルトで有効になりました。[#37694](https://github.com/apache/doris/pull/37694)

- 非同期マテリアライズドビューの透過的リライトがデフォルトで有効になりました。[#35897](https://github.com/apache/doris/pull/35897)

- 透過的リライトはパーティション化されたマテリアライズドビューを利用します。パーティションが失敗した場合、データの正確性を確保するためにベーステーブルがマテリアライズドビューと結合されます。[#35897](https://github.com/apache/doris/pull/35897)

## 新機能

### レイクハウス

- セッション変数 `read_csv_empty_line_as_null` を使用して、CSV形式ファイル読み取り時に空行を無視するかどうかを制御できます。[#37153](https://github.com/apache/doris/pull/37153)

  デフォルトでは空行は無視されます。trueに設定すると、空行はすべての列がnullの行として読み取られます。

- `serde_dialect="presto"` を設定することで、Prestoの複合型出力形式との互換性を有効にできます。[#37253](https://github.com/apache/doris/pull/37253)

### Multi-table Materialized View

- マテリアライズドビュー構築で非決定的関数をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- 非同期マテリアライズドビューの定義をアトミックに置換します。[#37147](https://github.com/apache/doris/pull/37147)

- `SHOW CREATE MATERIALIZED VIEW` によりビュー作成文を確認できます。[#37125](https://github.com/apache/doris/pull/37125)

- 多次元集約および非集約クエリの透過的リライト。[#37436](https://github.com/apache/doris/pull/37436) [#37497](https://github.com/apache/doris/pull/37497)

- ロールアップのキー列およびパーティション化によるDISTINCT集約をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- `date_trunc` を使用してパーティションをロールアップするパーティション化マテリアライズドビューをサポートします。[#31812](https://github.com/apache/doris/pull/31812) [#35562](https://github.com/apache/doris/pull/35562)

- パーティション化されたテーブル値関数（TVF）をサポートします。[#36479](https://github.com/apache/doris/pull/36479)

### 半構造化データ管理

- VARIANT型を使用するテーブルで部分列更新をサポートします。[#34925](https://github.com/apache/doris/pull/34925)

- PreparedStatementサポートがデフォルトで有効になりました。[#36581](https://github.com/apache/doris/pull/36581)

- VARIANT型をCSV形式でエクスポートできます。[#37857](https://github.com/apache/doris/pull/37857)

- `explode_json_object` 関数がJSON Objectの行を列に転置します。[#36887](https://github.com/apache/doris/pull/36887)

- ES カタログがES NESTEDまたはOBJECT型をDoris JSON型にマッピングします。[#37101](https://github.com/apache/doris/pull/37101)

- match_phraseシリーズクエリのパフォーマンス向上のため、指定されたアナライザーを持つ転置インデックスでsupport_phraseがデフォルトで有効になりました。[#37949](https://github.com/apache/doris/pull/37949)

### クエリオプティマイザー

- `DELETE FROM` 文のexplainをサポートします。[#37100](https://github.com/apache/doris/pull/37100)

- 定数式パラメータのヒント形式をサポートします。[#37988](https://github.com/apache/doris/pull/37988)

### メモリ管理

- キャッシュをクリアするHTTP APIを追加しました。[#36599](https://github.com/apache/doris/pull/36599)

### 権限

- テーブル値関数（TVF）内のリソースの認証をサポートします。[#37132](https://github.com/apache/doris/pull/37132)

## 改善

### レイクハウス

- Paimonをバージョン0.8.1にアップグレードしました

- Paimonテーブル照会時のorg.apache.commons.lang.StringUtilsのClassNotFoundExceptionを修正しました。[#37512](https://github.com/apache/doris/pull/37512)

- Tencent Cloud LakeFSのサポートを追加しました。[#36891](https://github.com/apache/doris/pull/36891)

- 外部テーブルクエリでファイルリスト取得時のタイムアウト時間を最適化しました。[#36842](https://github.com/apache/doris/pull/36842)

- セッション変数 `fetch_splits_max_wait_time_ms` で設定可能です。

- SQLServer JDBC カタログのデフォルト接続ロジックを改善しました。[#36971](https://github.com/apache/doris/pull/36971)

  デフォルトでは、接続暗号化設定に介入しません。`force_sqlserver_jdbc_encrypt_false` がtrueに設定された場合のみ、認証エラーを減らすためにJDBC URLにencrypt=falseが強制的に追加されます。これにより暗号化動作をより柔軟に制御でき、必要に応じてオンまたはオフにできます。

- Hiveテーブルのshow create table文にserdeプロパティを追加しました。[#37096](https://github.com/apache/doris/pull/37096)

- FE上のHiveテーブルリストのデフォルトキャッシュ時間を1日から4時間に変更しました

- データエクスポート（Export/Outfile）でParquetおよびORCの圧縮形式指定をサポートします

  詳細については、[docs](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT/?_highlight=compress_type)を参照してください。

- CTAS+TVFを使用してテーブルを作成する際、TVF内のパーティション列がStringではなく自動的にVarchar(65533)にマッピングされ、内部テーブルのパーティション列として使用できます。[#37161](https://github.com/apache/doris/pull/37161)

- Hive書き込み操作のメタデータアクセス数を最適化しました。[#37127](https://github.com/apache/doris/pull/37127)

- ES カタログがnested/object型をDorisのJson型にマッピングすることをサポートします。[#37182](https://github.com/apache/doris/pull/37182)

- 古いバージョンのojdbcドライバーを使用してOracleに接続する際のエラーメッセージを改善しました。[#37634](https://github.com/apache/doris/pull/37634)

- Incremental Read中にHudiテーブルが空セットを返す場合、Dorisもエラーではなく空セットを返すようになりました。[#37636](https://github.com/apache/doris/pull/37636)

- 一部のケースで内部外部テーブル結合クエリがFEタイムアウトを引き起こす可能性がある問題を修正しました。[#37757](https://github.com/apache/doris/pull/37757)

- Hive metastore event listenerが有効な場合の古いバージョンから新しいバージョンへのアップグレード時のFEメタデータリプレイエラーの問題を修正しました。[#37757](https://github.com/apache/doris/pull/37757)

### Multi-table Materialized View

- 非同期マテリアライズドビューのキー列選択を自動化しました。[#36601](https://github.com/apache/doris/pull/36601)

- マテリアライズドビューパーティション定義でdate_truncをサポートします。[#35562](https://github.com/apache/doris/pull/35562)

- ネストされたマテリアライズドビュー集約全体の透過的リライトを有効にします。[#37651](https://github.com/apache/doris/pull/37651)

- スキーマ変更がデータの正確性に影響しない場合、非同期マテリアライズドビューは利用可能のままです。[#37122](https://github.com/apache/doris/pull/37122)

- 透過的リライトの計画速度を向上させました。[#37935](https://github.com/apache/doris/pull/37935)

- 非同期マテリアライズドビューの利用可能性を計算する際、現在のリフレッシュ状態は考慮されなくなりました。[#36617](https://github.com/apache/doris/pull/36617)

### 半構造化データ管理

- サンプリングによるVARIANTサブ列表示のDESCパフォーマンスを最適化しました。[#37217](https://github.com/apache/doris/pull/37217)

- JSON型で空キーを持つ特別なJSONデータをサポートします。[#36762](https://github.com/apache/doris/pull/36762)

### 転置インデックス

- オブジェクトストレージアクセス時の遅延を避けるため、転置インデックス存在確認の呼び出しを最小化してレイテンシを削減します。[#36945](https://github.com/apache/doris/pull/36945)

- 転置インデックスクエリプロセスのオーバーヘッドを最適化しました。[#35357](https://github.com/apache/doris/pull/35357)

- マテリアライズドビューでの転置インデックスを防止します。[#36869](https://github.com/apache/doris/pull/36869)

### クエリオプティマイザー

- 比較式の両辺がリテラルの場合、文字列リテラルは他方の型への変換を試行します。[#36921](https://github.com/apache/doris/pull/36921)

- variant型のサブパスプッシュダウン機能をリファクタリングし、複雑なプッシュダウンシナリオをより適切にサポートします。[#36923](https://github.com/apache/doris/pull/36923)

- マテリアライズドビューのコスト計算ロジックを最適化し、より低コストのマテリアライズドビューをより正確に選択できるようになりました。[#37098](https://github.com/apache/doris/pull/37098)

- SQLでユーザー変数を使用する際のSQLキャッシュ計画速度を改善しました。[#37119](https://github.com/apache/doris/pull/37119)

- NOT NULL式の行推定ロジックを最適化し、クエリでNOT NULLが存在する場合のパフォーマンスが向上しました。[#37498](https://github.com/apache/doris/pull/37498)

- LIKE式のnull拒否派生ロジックを最適化しました。[#37864](https://github.com/apache/doris/pull/37864)

- 特定のパーティションのクエリが失敗した際のエラーメッセージを改善し、どのテーブルが問題を引き起こしているかをより明確にしました。[#37280](https://github.com/apache/doris/pull/37280)

### クエリ実行

- 特定のシナリオでbitmap_union演算子のパフォーマンスを最大3倍向上させました。

- ARM環境でのArrow Flight読み取りパフォーマンスを向上させました。

- explode、explode_map、explode_json関数の実行パフォーマンスを最適化しました。

### データローディング

- `INSERT INTO ... FROM TABLE VALUE FUNCTION` で `max_filter_ratio` の設定をサポートします

## バグ修正

### レイクハウス

- Parquet形式照会時に一部のケースでBEクラッシュを引き起こす問題を修正しました。[#37086](https://github.com/apache/doris/pull/37086)

- Parquet形式照会時にBEが大量のログを出力する問題を修正しました。[#37012](https://github.com/apache/doris/pull/37012)

- 一部のケースでFE側が大量の重複FileSystemオブジェクトを作成する問題を修正しました。[#37142](https://github.com/apache/doris/pull/37142)

- 一部のケースでHive書き込み後にトランザクション情報がクリーンアップされない問題を修正しました。[#37172](https://github.com/apache/doris/pull/37172)

- 一部のケースでHiveテーブル書き込み操作によって引き起こされるスレッドリーク問題を修正しました。[#37247](https://github.com/apache/doris/pull/37247)

- 一部のケースでHive Text形式の行および列区切り文字が正しく取得できない問題を修正しました。[#37188](https://github.com/apache/doris/pull/37188)

- 一部のケースでlz4圧縮ブロック読み取り時の並行性問題を修正しました。[#37187](https://github.com/apache/doris/pull/37187)

- 一部のケースでIcebergテーブルの `count(*)` が不正な結果を返す問題を修正しました。[#37810](https://github.com/apache/doris/pull/37810)

- 一部のケースでMinIOベースのPaimonカタログ作成がFEメタデータリプレイエラーを引き起こす問題を修正しました。[#37249](https://github.com/apache/doris/pull/37249)

- 一部のケースでRangerを使用したカタログ作成がクライアントハングを引き起こす問題を修正しました。[#37551](https://github.com/apache/doris/pull/37551)

### Multi-table Materialized View

- ベーステーブルに新しいパーティションを追加した後、パーティション集約ロールアップリライト後に不正な結果が生じる可能性がある問題を修正しました。[#37651](https://github.com/apache/doris/pull/37651)

- 関連するベーステーブルパーティション削除後にマテリアライズドビューパーティション状態が非同期に設定されない問題を修正しました。[#36602](https://github.com/apache/doris/pull/36602)

- 非同期マテリアライズドビュー構築中の稀なデッドロック問題を修正しました。[#37133](https://github.com/apache/doris/pull/37133)

- 単一の非同期マテリアライズドビューリフレッシュで大量のパーティションをリフレッシュする際の稀な「nereids cost too much time」エラーを修正しました。[#37589](https://github.com/apache/doris/pull/37589)

- 最終select listにnullリテラルが含まれている場合に非同期マテリアライズドビューを作成できない問題を修正しました。[#37281](https://github.com/apache/doris/pull/37281)

- 集約マテリアライズドビューが正常にリライトされても、CBOがそれを選択しない単一テーブルマテリアライズドビューの問題を修正しました。[#35721](https://github.com/apache/doris/pull/35721) [#36058](https://github.com/apache/doris/pull/36058)

- 両方の結合入力が集約であるパーティション化マテリアライズドビューを構築する際にパーティション派生が失敗する問題を修正しました。[#34781](https://github.com/apache/doris/pull/34781)

### 半構造化データ管理

- 並行性や異常データなどの特殊ケースでのVARIANTの問題を修正しました。[#37976](https://github.com/apache/doris/pull/37976) [#37839](https://github.com/apache/doris/pull/37839) [#37794](https://github.com/apache/doris/pull/37794) [#37674](https://github.com/apache/doris/pull/37674) [#36997](https://github.com/apache/doris/pull/36997)

- サポートされていないSQLでVARIANTを使用した際のcoredump問題を修正しました。[#37640](https://github.com/apache/doris/pull/37640)

- 1.xから2.x以上のバージョンにアップグレードする際のMAPデータ型に関連するcoredump問題を修正しました。[#36937](https://github.com/apache/doris/pull/36937)

- ES カタログのArray型サポートを改善しました。[#36936](https://github.com/apache/doris/pull/36936)

### 転置インデックス

- 転置インデックスv2のDROP INDEXがメタデータを削除しない問題を修正しました。[#37646](https://github.com/apache/doris/pull/37646)

- 文字列長が「ignore above」閾値を超えた際のクエリ精度問題を修正しました。[#37679](https://github.com/apache/doris/pull/37679)

- インデックスサイズ統計の問題を修正しました。[#37232](https://github.com/apache/doris/pull/37232) [#37564](https://github.com/apache/doris/pull/37564)

### クエリオプティマイザー

- 予約キーワード使用によりインポート操作の実行が妨げられる問題を修正しました。[#35938](https://github.com/apache/doris/pull/35938)

- テーブル作成時にchar(255)がchar(1)として誤って記録される型エラーを修正しました。[#37671](https://github.com/apache/doris/pull/37671)

- 相関サブクエリの結合式が複雑な式である場合の不正な結果を修正しました。[#37683](https://github.com/apache/doris/pull/37683)

- decimal型の不正なバケットプルーニングの潜在的問題を修正しました。[#38013](https://github.com/apache/doris/pull/38013)

- 特定のシナリオでpipeline local shuffleが有効な場合の不正な集約演算子結果を修正しました。[#38016](https://github.com/apache/doris/pull/38016)

- 集約演算子で等式が存在する場合に発生する可能性があった計画エラーを修正しました。[#36622](https://github.com/apache/doris/pull/36622)

- 集約演算子でラムダ式が存在する場合に発生する可能性があった計画エラーを修正しました。[#37285](https://github.com/apache/doris/pull/37285)

- ウィンドウ関数からリテラルに最適化されたリテラルの型が誤って実行を妨げる問題を修正しました。[#37283](https://github.com/apache/doris/pull/37283)

- 集約関数foreach combinatorによるnull属性の誤った出力問題を修正しました。[#37980](https://github.com/apache/doris/pull/37980)

- パラメータが範囲外のリテラルの場合にacos関数が計画できない問題を修正しました。[#37996](https://github.com/apache/doris/pull/37996)

- 同期マテリアライズドビューのクエリでパーティションを指定する際の計画エラーを修正しました。[#36982](https://github.com/apache/doris/pull/36982)

- 計画中の稀なNull Pointer Exception（NPE）を修正しました。[#38024](https://github.com/apache/doris/pull/38024)

### クエリ実行

- decimal データ型を条件として使用する際の delete where 文のエラーを修正しました。[#37801](https://github.com/apache/doris/pull/37801)

- クエリ実行終了後にBEメモリが解放されない問題を修正しました。[#37792](https://github.com/apache/doris/pull/37792) [#37297](https://github.com/apache/doris/pull/37297)

- 高QPSシナリオでauditログがFEメモリを大量に占有する問題を修正しました。[#37786](https://github.com/apache/doris/pull/37786)

- sleep関数が不正な入力値を受け取った際のBEコアダンプを修正しました。[#37681](https://github.com/apache/doris/pull/37681)

- sync filter size実行中に発生するエラーを修正しました。[#37103](https://github.com/apache/doris/pull/37103)

- 実行中にタイムゾーンを使用する際の不正な結果を修正しました。[#37062](https://github.com/apache/doris/pull/37062)

- 文字列を整数にキャストする際の不正な結果を修正しました。[#36788](https://github.com/apache/doris/pull/36788)

- pipelinex有効時にArrow Flightプロトコルを使用する際のクエリエラーを修正しました。[#35804](https://github.com/apache/doris/pull/35804)

- 文字列を日付/日時にキャストする際のエラーを修正しました。[#35637](https://github.com/apache/doris/pull/35637)

- <=> を使用した大テーブル結合クエリ中のBEコアダンプを修正しました。[#36263](https://github.com/apache/doris/pull/36263)

### ストレージ管理

- 列更新および書き込み操作中に発生するDELETE SIGNデータが見えない問題を修正しました。[#36755](https://github.com/apache/doris/pull/36755)

- スキーマ変更中のFEメモリ使用量を最適化しました。[#36756](https://github.com/apache/doris/pull/36756)

- トランザクションが中断されないことによる再起動時のBEハング問題を修正しました。[#36437](https://github.com/apache/doris/pull/36437)

- NOT NULLからNULLデータ型に変更する際の稀なエラーを修正しました。[#36389](https://github.com/apache/doris/pull/36389)

- BE停止時のレプリカ修復スケジューリングを最適化しました。[#36897](https://github.com/apache/doris/pull/36897)

- 単一BE上のタブレット作成でラウンドロビンディスク選択をサポートしました。[#36900](https://github.com/apache/doris/pull/36900)

- 遅いパブリッシングによって引き起こされるクエリエラー-230を修正しました。[#36222](https://github.com/apache/doris/pull/36222)

- パーティションバランシングの速度を向上させました。[#36976](https://github.com/apache/doris/pull/36976)

- FD枯渇を避けるため、ファイル記述子（FD）数とメモリを使用してセグメントキャッシュを制御しました。[#37035](https://github.com/apache/doris/pull/37035)

- 並行クローンと変更操作によって引き起こされる潜在的なレプリカ損失を修正しました。[#36858](https://github.com/apache/doris/pull/36858)

- 列順序調整ができない問題を修正しました。[#37226](https://github.com/apache/doris/pull/37226)

- auto-increment列での特定のスキーマ変更操作を禁止しました。[#37331](https://github.com/apache/doris/pull/37331)

- DELETE操作の不正確なエラー報告を修正しました。[#37374](https://github.com/apache/doris/pull/37374)

- BE側のtrash有効期限を1日に調整しました。[#37409](https://github.com/apache/doris/pull/37409)

- compactionメモリ使用量とスケジューリングを最適化しました。[#37491](https://github.com/apache/doris/pull/37491)

- FE再起動を引き起こす潜在的な特大バックアップをチェックしました。[#37466](https://github.com/apache/doris/pull/37466)

- 動的パーティション削除ポリシーとクロスパーティション動作を2.1.3に復元しました。[#37570](https://github.com/apache/doris/pull/37570) [#37506](https://github.com/apache/doris/pull/37506)

- DELETE述語でのdecimal型に関連するエラーを修正しました。[#37710](https://github.com/apache/doris/pull/37710)

### データローディング

- インポート中のエラーハンドリングでの競合状態によって引き起こされるデータ非表示問題を修正しました。[#36744](https://github.com/apache/doris/pull/36744)

- streamloadインポートでhhl_from_base64のサポートを追加しました。[#36819](https://github.com/apache/doris/pull/36819)

- 単一テーブルに対して非常に大量のタブレットをインポートする際の潜在的FE OOM問題を修正しました。[#36944](https://github.com
