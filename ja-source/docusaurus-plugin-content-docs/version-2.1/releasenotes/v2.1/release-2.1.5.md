---
{
  "title": "リリース 2.1.5",
  "language": "ja",
  "description": "Apache Doris バージョン 2.1.5 は 2024年7月24日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris バージョン 2.1.5 が 2024年7月24日に正式にリリースされました。** このアップデートでは、データレイクハウスおよび高並行性シナリオに対するさまざまな機能エクスペリエンス、非同期マテリアライズドビューの機能を最適化しました。さらに、安定性を向上させるためのいくつかの改善とバグ修正を実装しました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- JDBC カタログ のデフォルトコネクションプールサイズが、高並行性シナリオでの接続不足を防ぐため、10から30に増加されました。[#37023](https://github.com/apache/doris/pull/37023)

- システムの予約メモリ（low water mark）が BE OOM の問題を軽減するため、`min(6.4GB, MemTotal * 5%)` に調整されました。

- 単一リクエスト内で複数のステートメントを処理する際、`CLIENT_MULTI_STATEMENTS` フラグが設定されていない場合は、最後のステートメントの結果のみが返されます。

- 非同期マテリアライズドビューのデータの直接変更が許可されなくなりました。[#37129](https://github.com/apache/doris/pull/37129)

- CTAS（Create table As Select）における varchar および char 型の長さ生成の動作を制御するセッション変数 `use_max_length_of_varchar_in_ctas` が追加されました。デフォルト値は true です。false に設定すると、最大長ではなく派生された varchar 長が使用されます。[#37284](https://github.com/apache/doris/pull/37284)

- 統計収集で、ファイルサイズに基づく Hive テーブルの行数推定機能がデフォルトで有効になりました。[#37694](https://github.com/apache/doris/pull/37694)

- 非同期マテリアライズドビューの透過的リライトがデフォルトで有効になりました。[#35897](https://github.com/apache/doris/pull/35897)

- 透過的リライトがパーティション化されたマテリアライズドビューを利用します。パーティションが失敗した場合、データの正確性を保証するため、ベーステーブルがマテリアライズドビューと結合されます。[#35897](https://github.com/apache/doris/pull/35897)

## 新機能

### レイクハウス

- セッション変数 `read_csv_empty_line_as_null` を使用して、CSV 形式ファイルを読み取る際に空行を無視するかどうかを制御できます。[#37153](https://github.com/apache/doris/pull/37153)

  デフォルトでは、空行は無視されます。true に設定すると、空行はすべての列が null の行として読み取られます。

- `serde_dialect="presto"` を設定することで、Presto の複合型出力形式との互換性を有効にできます。[#37253](https://github.com/apache/doris/pull/37253)

### Multi-table Materialized View

- マテリアライズドビューの構築において非決定的関数をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- 非同期マテリアライズドビューの定義をアトミックに置換します。[#37147](https://github.com/apache/doris/pull/37147)

- ビューの作成ステートメントを `SHOW CREATE MATERIALIZED VIEW` で表示できます。[#37125](https://github.com/apache/doris/pull/37125)

- 多次元集約および非集約クエリの透過的リライト。[#37436](https://github.com/apache/doris/pull/37436) [#37497](https://github.com/apache/doris/pull/37497)

- キー列を持つ DISTINCT 集約とロールアップのパーティション化をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- `date_trunc` を使用してパーティションをロールアップするパーティション化マテリアライズドビューをサポートします。[#31812](https://github.com/apache/doris/pull/31812) [#35562](https://github.com/apache/doris/pull/35562)

- パーティション化されたテーブル値関数（TVF）をサポートします。[#36479](https://github.com/apache/doris/pull/36479)

### 半構造化データ管理

- VARIANT 型を使用するテーブルで部分列更新をサポートします。[#34925](https://github.com/apache/doris/pull/34925)

- PreparedStatement サポートがデフォルトで有効になりました。[#36581](https://github.com/apache/doris/pull/36581)

- VARIANT 型を CSV 形式にエクスポートできます。[#37857](https://github.com/apache/doris/pull/37857)

- `explode_json_object` 関数が JSON Object 行を列に転置します。[#36887](https://github.com/apache/doris/pull/36887)

- ES カタログ で ES NESTED または OBJECT 型が Doris JSON 型にマップされるようになりました。[#37101](https://github.com/apache/doris/pull/37101)

- match_phrase シリーズクエリのパフォーマンスを向上させるため、指定されたアナライザーを持つ転置インデックスでは、デフォルトで support_phrase が有効になります。[#37949](https://github.com/apache/doris/pull/37949)

### クエリオプティマイザー

- `DELETE FROM` ステートメントの説明をサポートします。[#37100](https://github.com/apache/doris/pull/37100)

- 定数式パラメータのヒント形式をサポートします。[#37988](https://github.com/apache/doris/pull/37988)

### メモリ管理

- キャッシュをクリアする HTTP API が追加されました。[#36599](https://github.com/apache/doris/pull/36599)

### 権限

- テーブル値関数（TVF）内のリソースの認可をサポートします。[#37132](https://github.com/apache/doris/pull/37132)

## 改善

### レイクハウス

- Paimon をバージョン 0.8.1 にアップグレード

- Paimon テーブルクエリ時の org.apache.commons.lang.StringUtils の ClassNotFoundException を修正。[#37512](https://github.com/apache/doris/pull/37512)

- Tencent Cloud LakeFS のサポートが追加されました。[#36891](https://github.com/apache/doris/pull/36891)

- 外部テーブルクエリのファイルリスト取得時のタイムアウト時間を最適化。[#36842](https://github.com/apache/doris/pull/36842)

- セッション変数 `fetch_splits_max_wait_time_ms` で設定可能。

- SQLServer JDBC カタログ のデフォルト接続ロジックを改善。[#36971](https://github.com/apache/doris/pull/36971)

  デフォルトでは、接続暗号化設定には介入しません。`force_sqlserver_jdbc_encrypt_false` が true に設定されている場合のみ、認証エラーを減らすため JDBC URL に encrypt=false が強制的に追加されます。これにより暗号化動作をより柔軟に制御でき、必要に応じて有効または無効にできます。

- Hive テーブルの show create table ステートメントに serde プロパティが追加されました。[#37096](https://github.com/apache/doris/pull/37096)

- FE での Hive テーブルリストのデフォルトキャッシュ時間が 1 日から 4 時間に変更

- データエクスポート（Export/Outfile）で Parquet および ORC の圧縮形式の指定をサポート

  詳細については、[docs](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT/?_highlight=compress_type) をご参照ください。

- CTAS+TVF を使用してテーブルを作成する際、TVF 内のパーティション列が String ではなく Varchar(65533) に自動的にマップされ、内部テーブルのパーティション列として使用できるようになりました。[#37161](https://github.com/apache/doris/pull/37161)

- Hive 書き込み操作のメタデータアクセス数を最適化。[#37127](https://github.com/apache/doris/pull/37127)

- ES カタログ で nested/object 型の Doris Json 型へのマッピングをサポート。[#37182](https://github.com/apache/doris/pull/37182)

- 古いバージョンの ojdbc ドライバを使用して Oracle に接続する際のエラーメッセージを改善。[#37634](https://github.com/apache/doris/pull/37634)

- Hudi テーブルが Incremental Read 時に空セットを返す場合、Doris もエラーではなく空セットを返すようになりました。[#37636](https://github.com/apache/doris/pull/37636)

- 内部外部テーブル結合クエリが一部のケースで FE タイムアウトを引き起こす可能性がある問題を修正。[#37757](https://github.com/apache/doris/pull/37757)

- Hive metastore イベントリスナーが有効な場合、古いバージョンから新しいバージョンへのアップグレード時の FE メタデータリプレイエラーの問題を修正。[#37757](https://github.com/apache/doris/pull/37757)

### Multi-table Materialized View

- 非同期マテリアライズドビューのキー列選択を自動化。[#36601](https://github.com/apache/doris/pull/36601)

- マテリアライズドビューのパーティション定義で date_trunc をサポート。[#35562](https://github.com/apache/doris/pull/35562)

- ネストされたマテリアライズドビュー集約間での透過的リライトを有効化。[#37651](https://github.com/apache/doris/pull/37651)

- スキーマ変更がデータの正確性に影響しない場合、非同期マテリアライズドビューが利用可能な状態を維持。[#37122](https://github.com/apache/doris/pull/37122)

- 透過的リライトの計画速度を改善。[#37935](https://github.com/apache/doris/pull/37935)

- 非同期マテリアライズドビューの可用性を計算する際、現在のリフレッシュ状態は考慮されなくなりました。[#36617](https://github.com/apache/doris/pull/36617)

### 半構造化データ管理

- サンプリングによる VARIANT サブ列の表示で DESC パフォーマンスを最適化。[#37217](https://github.com/apache/doris/pull/37217)

- JSON 型で空キーを持つ特別な JSON データをサポート。[#36762](https://github.com/apache/doris/pull/36762)

### 転置インデックス

- オブジェクトストレージへのアクセス遅延を避けるため、転置インデックス exists の呼び出しを最小化してレイテンシを削減。[#36945](https://github.com/apache/doris/pull/36945)

- 転置インデックスクエリプロセスのオーバーヘッドを最適化。[#35357](https://github.com/apache/doris/pull/35357)

- マテリアライズドビューでの転置インデックスを防止。[#36869](https://github.com/apache/doris/pull/36869)

### クエリオプティマイザー

- 比較式の両辺がリテラルの場合、文字列リテラルが相手側の型への変換を試行します。[#36921](https://github.com/apache/doris/pull/36921)

- variant 型のサブパスプッシュダウン機能をリファクタリングし、より複雑なプッシュダウンシナリオをサポート。[#36923](https://github.com/apache/doris/pull/36923)

- マテリアライズドビューのコスト計算ロジックを最適化し、より低コストなマテリアライズドビューのより正確な選択を可能に。[#37098](https://github.com/apache/doris/pull/37098)

- SQL でユーザー変数を使用する際の SQL キャッシュ計画速度を改善。[#37119](https://github.com/apache/doris/pull/37119)

- NOT NULL 式の行推定ロジックを最適化し、クエリに NOT NULL が存在する場合のパフォーマンスを向上。[#37498](https://github.com/apache/doris/pull/37498)

- LIKE 式の null 拒否導出ロジックを最適化。[#37864](https://github.com/apache/doris/pull/37864)

- 特定のパーティションのクエリが失敗した際のエラーメッセージを改善し、どのテーブルが問題を引き起こしているかをより明確に。[#37280](https://github.com/apache/doris/pull/37280)

### クエリ実行

- 特定のシナリオで bitmap_union 演算子のパフォーマンスを最大 3 倍改善。

- ARM 環境での Arrow Flight の読み取りパフォーマンスを向上。

- explode、explode_map、explode_json 関数の実行パフォーマンスを最適化。

### データロード

- `INSERT INTO ... FROM TABLE VALUE FUNCTION` で `max_filter_ratio` の設定をサポート

## バグ修正

### レイクハウス

- Parquet 形式クエリ時に一部のケースで BE クラッシュを引き起こす問題を修正。[#37086](https://github.com/apache/doris/pull/37086)

- Parquet 形式クエリ時に BE が過剰なログを出力する問題を修正。[#37012](https://github.com/apache/doris/pull/37012)

- 一部のケースで FE 側が大量の重複 FileSystem オブジェクトを作成する問題を修正。[#37142](https://github.com/apache/doris/pull/37142)

- 一部のケースで Hive への書き込み後にトランザクション情報がクリーンアップされない問題を修正。[#37172](https://github.com/apache/doris/pull/37172)

- 一部のケースで Hive テーブル書き込み操作によるスレッドリークの問題を修正。[#37247](https://github.com/apache/doris/pull/37247)

- 一部のケースで Hive Text 形式の行列区切り文字が正しく取得できない問題を修正。[#37188](https://github.com/apache/doris/pull/37188)

- 一部のケースで lz4 圧縮ブロック読み取り時の並行性問題を修正。[#37187](https://github.com/apache/doris/pull/37187)

- 一部のケースで Iceberg テーブルの `count(*)` が不正な結果を返す問題を修正。[#37810](https://github.com/apache/doris/pull/37810)

- 一部のケースで MinIO ベースの Paimon カタログ作成が FE メタデータリプレイエラーを引き起こす問題を修正。[#37249](https://github.com/apache/doris/pull/37249)

- 一部のケースで Ranger を使用したカタログ作成がクライアントをハングさせる問題を修正。[#37551](https://github.com/apache/doris/pull/37551)

### Multi-table Materialized View

- ベーステーブルに新しいパーティションを追加した後、パーティション集約ロールアップリライト後に不正な結果になる問題を修正。[#37651](https://github.com/apache/doris/pull/37651)

- 関連するベーステーブルパーティション削除後、マテリアライズドビューのパーティション状態が非同期に設定されない問題を修正。[#36602](https://github.com/apache/doris/pull/36602)

- 非同期マテリアライズドビュー構築中の時折発生するデッドロック問題を修正。[#37133](https://github.com/apache/doris/pull/37133)

- 単一の非同期マテリアライズドビューリフレッシュで大量のパーティションをリフレッシュする際に時々発生する「nereids cost too much time」エラーを修正。[#37589](https://github.com/apache/doris/pull/37589)

- 最終選択リストに null リテラルが含まれている場合に非同期マテリアライズドビューが作成できない問題を修正。[#37281](https://github.com/apache/doris/pull/37281)

- 単一テーブルマテリアライズドビューで、集約マテリアライズドビューが正常にリライトされたにも関わらず、CBO が選択しない問題を修正。[#35721](https://github.com/apache/doris/pull/35721) [#36058](https://github.com/apache/doris/pull/36058)

- 結合入力の両方が集約であるパーティション化マテリアライズドビューを構築する際にパーティション導出が失敗する問題を修正。[#34781](https://github.com/apache/doris/pull/34781)

### 半構造化データ管理

- 並行性や異常データなど特殊なケースでの VARIANT の問題を修正。[#37976](https://github.com/apache/doris/pull/37976) [#37839](https://github.com/apache/doris/pull/37839) [#37794](https://github.com/apache/doris/pull/37794) [#37674](https://github.com/apache/doris/pull/37674) [#36997](https://github.com/apache/doris/pull/36997)

- サポートされていない SQL で VARIANT を使用した際の coredump 問題を修正。[#37640](https://github.com/apache/doris/pull/37640)

- 1.x から 2.x 以上のバージョンにアップグレードする際の MAP データ型関連の coredump 問題を修正。[#36937](https://github.com/apache/doris/pull/36937)

- ES カタログ の Array 型サポートを改善。[#36936](https://github.com/apache/doris/pull/36936)

### 転置インデックス

- 転置インデックス v2 の DROP INDEX でメタデータが削除されない問題を修正。[#37646](https://github.com/apache/doris/pull/37646)

- 文字列長が「ignore above」しきい値を超えた場合のクエリ精度問題を修正。[#37679](https://github.com/apache/doris/pull/37679)

- インデックスサイズ統計の問題を修正。[#37232](https://github.com/apache/doris/pull/37232) [#37564](https://github.com/apache/doris/pull/37564)

### クエリオプティマイザー

- 予約キーワードの使用によりインポート操作が実行できない問題を修正。[#35938](https://github.com/apache/doris/pull/35938)

- テーブル作成時に char(255) が char(1) として誤って記録される型エラーを修正。[#37671](https://github.com/apache/doris/pull/37671)

- 相関サブクエリの結合式が複雑な式の場合の不正な結果を修正。[#37683](https://github.com/apache/doris/pull/37683)

- decimal 型の不正なバケットプルーニングの潜在的問題を修正。[#38013](https://github.com/apache/doris/pull/38013)

- 特定のシナリオでパイプラインローカルシャッフルが有効な場合の不正な集約演算子結果を修正。[#38016](https://github.com/apache/doris/pull/38016)

- 集約演算子に等価式が存在する場合に発生する可能性がある計画エラーを修正。[#36622](https://github.com/apache/doris/pull/36622)

- 集約演算子にラムダ式が存在する場合に発生する可能性がある計画エラーを修正。[#37285](https://github.com/apache/doris/pull/37285)

- ウィンドウ関数からリテラルに最適化されて生成されたリテラルの型が間違っており、実行を妨げる問題を修正。[#37283](https://github.com/apache/doris/pull/37283)

- 集約関数 foreach コンビネーターによる null 属性の不正な出力問題を修正。[#37980](https://github.com/apache/doris/pull/37980)

- パラメータが範囲外のリテラルの場合に acos 関数が計画できない問題を修正。[#37996](https://github.com/apache/doris/pull/37996)

- 同期マテリアライズドビューでクエリのパーティションを指定する際の計画エラーを修正。[#36982](https://github.com/apache/doris/pull/36982)

- 計画中に時々発生する Null Pointer Exception（NPE）を修正。[#38024](https://github.com/apache/doris/pull/38024)

### クエリ実行

- decimal データ型を条件として使用する際の delete where ステートメントのエラーを修正。[#37801](https://github.com/apache/doris/pull/37801)

- クエリ実行終了後に BE メモリが解放されない問題を修正。[#37792](https://github.com/apache/doris/pull/37792) [#37297](https://github.com/apache/doris/pull/37297)

- 高 QPS シナリオで監査ログが FE メモリを過度に占有する問題を修正。[#37786](https://github.com/apache/doris/pull/37786)

- sleep 関数が不正な入力値を受け取った際の BE コアダンプを修正。[#37681](https://github.com/apache/doris/pull/37681)

- sync filter size 実行中に発生するエラーを修正。[#37103](https://github.com/apache/doris/pull/37103)

- 実行中にタイムゾーンを使用する際の不正な結果を修正。[#37062](https://github.com/apache/doris/pull/37062)

- 文字列から整数へのキャスト時の不正な結果を修正。[#36788](https://github.com/apache/doris/pull/36788)

- pipelinex が有効な状態で Arrow Flight プロトコルを使用する際のクエリエラーを修正。[#35804](https://github.com/apache/doris/pull/35804)

- 文字列から日付/日時へのキャスト時のエラーを修正。[#35637](https://github.com/apache/doris/pull/35637)

- <=> を使用した大規模テーブル結合クエリ時の BE コアダンプを修正。[#36263](https://github.com/apache/doris/pull/36263)

### ストレージ管理

- 列更新および書き込み操作時に発生する見えない DELETE SIGN データの問題を修正。[#36755](https://github.com/apache/doris/pull/36755)

- スキーマ変更時の FE のメモリ使用量を最適化。[#36756](https://github.com/apache/doris/pull/36756)

- トランザクションが中断されないことによる BE 再起動時のハングの問題を修正。[#36437](https://github.com/apache/doris/pull/36437)

- NOT NULL から NULL データ型に変更する際の時々発生するエラーを修正。[#36389](https://github.com/apache/doris/pull/36389)

- BE がダウンした際のレプリカ修復スケジューリングを最適化。[#36897](https://github.com/apache/doris/pull/36897)

- 単一 BE でのタブレット作成時のラウンドロビンディスク選択をサポート。[#36900](https://github.com/apache/doris/pull/36900)

- 遅いパブリッシングによるクエリエラー -230 を修正。[#36222](https://github.com/apache/doris/pull/36222)

- パーティションバランシングの速度を改善。[#36976](https://github.com/apache/doris/pull/36976)

- FD 不足を避けるため、ファイルディスクリプタ（FD）数とメモリを使用してセグメントキャッシュを制御。[#37035](https://github.com/apache/doris/pull/37035)

- 並行クローンおよび alter 操作による潜在的なレプリカ損失を修正。[#36858](https://github.com/apache/doris/pull/36858)

- 列順序を調整できない問題を修正。[#37226](https://github.com/apache/doris/pull/37226)

- 自動増分列での特定のスキーマ変更操作を禁止。[#37331](https://github.com/apache/doris/pull/37331)

- DELETE 操作の不正確なエラー報告を修正。[#37374](https://github.com/apache/doris/pull/37374)

- BE 側のゴミ箱有効期限を 1 日に調整。[#37409](https://github.com/apache/doris/pull/37409)

- コンパクションメモリ使用量とスケジューリングを最適化。[#37491](https://github.com/apache/doris/pull/37491)

- FE 再起動を引き起こす可能性がある過大なバックアップをチェック。[#37466](https://github.com/apache/doris/pull/37466)

- 動的パーティション削除ポリシーとクロスパーティション動作を 2.1.3 に復元。[#37570](https://github.com/apache/doris/pull/37570) [#37506](https://github.com/apache/doris/pull/37506)

- DELETE 述語での decimal 型関連のエラーを修正。[#37710](https://github.com/apache/doris/pull/37710)

### データロード

- インポート時のエラー処理における競合状態によるデータ不可視の問題を修正。[#36744](https://github.com/apache/doris/pull/36744)

- streamload インポートでの hhl_from_base64 のサポートを追加。[#36819](https://github.com/apache/doris/pull/36819)

- 単一テーブルに対して非常に多数のタブレットをインポートする際の潜在的な FE OOM の問題を修正。[#36944](https://github.com/apache/doris/pull/36944)

- FE マスター・スレーブ切り替え時の自動増分列重複の可能性を修正。[#36961](https://github.com/apache/doris/pull/36961)

- 自動増分列での insert into select 時のエラーを修正。[#37029](https://github.com/apache/doris/pull/37029)

- メモリ使用量を最適化するため、データフラッシュスレッド数を削減。[#37092](https://github.
