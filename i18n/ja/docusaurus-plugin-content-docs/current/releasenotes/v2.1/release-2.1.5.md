---
{
  "title": "リリース 2.1.5",
  "language": "ja",
  "description": "Apache Doris バージョン 2.1.5 は 2024年7月24日に正式リリースされました。このアップデートでは、"
}
---
**Apache Doris バージョン 2.1.5 が 2024年7月24日に正式リリースされました。** このアップデートでは、データレイクハウスと高同時実行シナリオにおける様々な機能体験、および非同期マテリアライズドビューの機能を最適化しました。さらに、安定性を向上させるためのいくつかの改良とバグ修正を実装しました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- JDBC Catalog のデフォルトコネクションプールサイズが 10 から 30 に増加され、高同時実行シナリオでの接続不足を防止します。[#37023](https://github.com/apache/doris/pull/37023)。

- システムの予約メモリ（low water mark）が `min(6.4GB, MemTotal * 5%)` に調整され、BE OOM問題を軽減します。

- 単一リクエストで複数のステートメントを処理する際、`CLIENT_MULTI_STATEMENTS` フラグが設定されていない場合、最後のステートメントの結果のみが返されます。

- 非同期マテリアライズドビューのデータの直接変更は許可されなくなりました。[#37129](https://github.com/apache/doris/pull/37129)

- CTAS（Create Table As Select）中の varchar および char 型の長さ生成の動作を制御するセッション変数 `use_max_length_of_varchar_in_ctas` が追加されました。デフォルト値は true です。false に設定すると、最大長ではなく派生された varchar 長が使用されます。[#37284](https://github.com/apache/doris/pull/37284)

- 統計収集では、ファイルサイズに基づいて Hive テーブルの行数を推定する機能がデフォルトで有効化されました。[#37694](https://github.com/apache/doris/pull/37694)

- 非同期マテリアライズドビューの透過的リライトがデフォルトで有効化されました。[#35897](https://github.com/apache/doris/pull/35897)

- 透過的リライトはパーティション化されたマテリアライズドビューを利用します。パーティションが失敗した場合、データの正確性を確保するため、ベーステーブルがマテリアライズドビューと結合されます。[#35897](https://github.com/apache/doris/pull/35897)

## 新機能

### Lakehouse

- セッション変数 `read_csv_empty_line_as_null` を使用して、CSV 形式ファイルを読み取る際に空行を無視するかどうかを制御できます。[#37153](https://github.com/apache/doris/pull/37153)

  デフォルトでは空行は無視されます。true に設定すると、空行はすべての列が null である行として読み取られます。

- `serde_dialect="presto"` を設定することで、Presto の複合型出力形式との互換性を有効化できます。[#37253](https://github.com/apache/doris/pull/37253)

### Multi-Table Materialized View

- マテリアライズドビューの構築で非決定的関数をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- 非同期マテリアライズドビューの定義をアトミックに置換します。[#37147](https://github.com/apache/doris/pull/37147)

- ビュー作成ステートメントは `SHOW CREATE MATERIALIZED VIEW` で表示できます。[#37125](https://github.com/apache/doris/pull/37125)

- 多次元集約および非集約クエリの透過的リライト。[#37436](https://github.com/apache/doris/pull/37436) [#37497](https://github.com/apache/doris/pull/37497)

- キー列を使用した DISTINCT 集約とロールアップのパーティション化をサポートします。[#37651](https://github.com/apache/doris/pull/37651)

- `date_trunc` を使用してパーティションをロールアップするパーティション化マテリアライズドビューのサポート [#31812](https://github.com/apache/doris/pull/31812) [#35562](https://github.com/apache/doris/pull/35562)

- パーティション化されたテーブル値関数（TVF）をサポートします。[#36479](https://github.com/apache/doris/pull/36479)

### Semi-Structured Data Management

- VARIANT 型を使用するテーブルで部分列更新をサポートします。[#34925](https://github.com/apache/doris/pull/34925)

- PreparedStatement サポートがデフォルトで有効化されました。[#36581](https://github.com/apache/doris/pull/36581)

- VARIANT 型を CSV 形式でエクスポートできます。[#37857](https://github.com/apache/doris/pull/37857)

- `explode_json_object` 関数が JSON Object の行を列に転置します。[#36887](https://github.com/apache/doris/pull/36887)

- ES Catalog で ES NESTED または OBJECT 型を Doris JSON 型にマッピングするようになりました。[#37101](https://github.com/apache/doris/pull/37101)

- デフォルトで、指定されたアナライザーを持つ転置インデックスで support_phrase が有効化され、match_phrase 系クエリのパフォーマンスが向上します。[#37949](https://github.com/apache/doris/pull/37949)

### Query Optimizer

- `DELETE FROM` ステートメントの explain をサポートします。[#37100](https://github.com/apache/doris/pull/37100)

- 定数式パラメータのヒント形式をサポートします [#37988](https://github.com/apache/doris/pull/37988)

### Memory Management

- キャッシュをクリアする HTTP API が追加されました。[#36599](https://github.com/apache/doris/pull/36599)

### Permissions

- テーブル値関数（TVF）内のリソースの認可をサポートします [#37132](https://github.com/apache/doris/pull/37132)

## 改良

### Lakehouse

- Paimon をバージョン 0.8.1 にアップグレード

- Paimon テーブルクエリ時の org.apache.commons.lang.StringUtils の ClassNotFoundException を修正。[#37512](https://github.com/apache/doris/pull/37512)

- Tencent Cloud LakeFS のサポートを追加。[#36891](https://github.com/apache/doris/pull/36891)

- 外部テーブルクエリでファイルリストを取得する際のタイムアウト時間を最適化。[#36842](https://github.com/apache/doris/pull/36842)

- セッション変数 `fetch_splits_max_wait_time_ms` で設定可能。

- SQLServer JDBC Catalog のデフォルト接続ロジックを改良。[#36971](https://github.com/apache/doris/pull/36971)

  デフォルトでは、接続暗号化設定に介入しません。`force_sqlserver_jdbc_encrypt_false` が true に設定されている場合のみ、認証エラーを減らすために JDBC URL に encrypt=false が強制的に追加されます。これにより、暗号化動作をより柔軟に制御でき、必要に応じてオン・オフを切り替えることができます。

- Hive テーブルの show create table ステートメントに serde プロパティを追加。[#37096](https://github.com/apache/doris/pull/37096)

- FE での Hive テーブルリストのデフォルトキャッシュ時間を 1日から 4時間に変更

- データエクスポート（Export/Outfile）で Parquet と ORC の圧縮形式の指定をサポート

  詳細については、[docs](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT/?_highlight=compress_type) を参照してください。

- CTAS+TVF を使用してテーブルを作成する際、TVF のパーティション列が String ではなく Varchar(65533) に自動マッピングされ、内部テーブルのパーティション列として使用可能になりました [#37161](https://github.com/apache/doris/pull/37161)

- Hive 書き込み操作でのメタデータアクセス数を最適化 [#37127](https://github.com/apache/doris/pull/37127)

- ES Catalog で nested/object 型を Doris の Json 型にマッピングできるようになりました。[#37182](https://github.com/apache/doris/pull/37182)

- 古いバージョンの ojdbc ドライバーを使用して Oracle に接続する際のエラーメッセージを改良 [#37634](https://github.com/apache/doris/pull/37634)

- Hudi テーブルが Incremental Read 中に空のセットを返す場合、Doris もエラーではなく空のセットを返すようになりました [#37636](https://github.com/apache/doris/pull/37636)

- 内外テーブル結合クエリが一部の場合に FE タイムアウトを引き起こす可能性がある問題を修正 [#37757](https://github.com/apache/doris/pull/37757)

- Hive metastore イベントリスナーが有効な状態で古いバージョンから新しいバージョンにアップグレードする際の FE メタデータリプレイエラーの問題を修正。[#37757](https://github.com/apache/doris/pull/37757)

### Multi-Table Materialized View

- 非同期マテリアライズドビューのキー列選択を自動化。[#36601](https://github.com/apache/doris/pull/36601)

- マテリアライズドビューのパーティション定義で date_trunc をサポート。[#35562](https://github.com/apache/doris/pull/35562)

- ネストしたマテリアライズドビュー集約間での透過的リライトを有効化。[#37651](https://github.com/apache/doris/pull/37651)

- スキーマ変更がデータの正確性に影響しない場合、非同期マテリアライズドビューは利用可能なままです。[#37122](https://github.com/apache/doris/pull/37122)

- 透過的リライトの計画速度を向上。[#37935](https://github.com/apache/doris/pull/37935)

- 非同期マテリアライズドビューの可用性計算で、現在のリフレッシュ状態を考慮しなくなりました。[#36617](https://github.com/apache/doris/pull/36617)

### Semi-Structured Data Management

- サンプリングを通じた VARIANT サブ列表示の DESC パフォーマンスを最適化。[#37217](https://github.com/apache/doris/pull/37217)

- JSON 型で空のキーを持つ特殊な JSON データをサポート。[#36762](https://github.com/apache/doris/pull/36762)

### Inverted Index

- オブジェクトストレージアクセスの遅延を避けるため、転置インデックス存在確認の呼び出しを最小化してレイテンシを削減。[#36945](https://github.com/apache/doris/pull/36945)

- 転置インデックスクエリプロセスのオーバーヘッドを最適化。[#35357](https://github.com/apache/doris/pull/35357)

- マテリアライズドビューでの転置インデックスを防止。[#36869](https://github.com/apache/doris/pull/36869)

### Query Optimizer

- 比較式の両側がリテラルの場合、文字列リテラルは他方の型への変換を試行します。[#36921](https://github.com/apache/doris/pull/36921)

- variant 型のサブパス・プッシュダウン機能をリファクタリングし、複雑なプッシュダウンシナリオをより適切にサポートするようになりました。[#36923](https://github.com/apache/doris/pull/36923)

- マテリアライズドビューのコスト計算ロジックを最適化し、より低コストのマテリアライズドビューをより正確に選択できるようになりました。[#37098](https://github.com/apache/doris/pull/37098)

- SQL でユーザー変数を使用する際の SQL キャッシュ計画速度を改良。[#37119](https://github.com/apache/doris/pull/37119)

- NOT NULL 式の行推定ロジックを最適化し、クエリに NOT NULL が存在する場合のパフォーマンスが向上しました。[#37498](https://github.com/apache/doris/pull/37498)

- LIKE 式の null 拒否導出ロジックを最適化。[#37864](https://github.com/apache/doris/pull/37864)

- 特定のパーティションのクエリが失敗した際のエラーメッセージを改良し、どのテーブルが問題を引き起こしているかをより明確に表示。[#37280](https://github.com/apache/doris/pull/37280)

### Query Execution

- 特定のシナリオで bitmap_union オペレータのパフォーマンスを最大3倍改善。

- ARM環境での Arrow Flight の読み取りパフォーマンスを向上。

- explode、explode_map、explode_json 関数の実行パフォーマンスを最適化。

### Data Loading

- `INSERT INTO ... FROM TABLE VALUE FUNCTION` での `max_filter_ratio` 設定をサポート

## バグ修正

### Lakehouse

- Parquet 形式をクエリする際に一部の場合で BE クラッシュを引き起こす問題を修正 [#37086](https://github.com/apache/doris/pull/37086)

- Parquet 形式をクエリする際に BE が過度のログを出力する問題を修正。[#37012](https://github.com/apache/doris/pull/37012)

- FE 側で一部の場合に大量の重複 FileSystem オブジェクトが作成される問題を修正。[#37142](https://github.com/apache/doris/pull/37142)

- 一部の場合で Hive への書き込み後にトランザクション情報がクリーンアップされない問題を修正。[#37172](https://github.com/apache/doris/pull/37172)

- 一部の場合で Hive テーブル書き込み操作によるスレッドリーク問題を修正。[#37247](https://github.com/apache/doris/pull/37247)

- 一部の場合で Hive Text 形式の行・列区切り文字が正しく取得できない問題を修正。[#37188](https://github.com/apache/doris/pull/37188)

- 一部の場合で lz4 圧縮ブロック読み取り時の同時実行問題を修正。[#37187](https://github.com/apache/doris/pull/37187)

- 一部の場合で Iceberg テーブルの `count(*)` が間違った結果を返す問題を修正。[#37810](https://github.com/apache/doris/pull/37810)

- 一部の場合で MinIO ベースの Paimon カタログ作成が FE メタデータリプレイエラーを引き起こす問題を修正。[#37249](https://github.com/apache/doris/pull/37249)

- 一部の場合で Ranger を使用したカタログ作成がクライアントハングを引き起こす問題を修正。[#37551](https://github.com/apache/doris/pull/37551)

### Multi-Table Materialized View

- ベーステーブルに新しいパーティションを追加する際に、パーティション集約ロールアップリライト後に間違った結果になる問題を修正。[#37651](https://github.com/apache/doris/pull/37651)

- 関連するベーステーブルパーティション削除後にマテリアライズドビューパーティションステータスが同期外れに設定されない問題を修正。[#36602](https://github.com/apache/doris/pull/36602)

- 非同期マテリアライズドビュー構築中の時折発生するデッドロック問題を修正。[#37133](https://github.com/apache/doris/pull/37133)

- 単一の非同期マテリアライズドビューリフレッシュで大量のパーティションをリフレッシュする際の時折発生する「nereids cost too much time」エラーを修正。[#37589](https://github.com/apache/doris/pull/37589)

- 最終選択リストに null リテラルが含まれている場合に非同期マテリアライズドビューが作成できない問題を修正。[#37281](https://github.com/apache/doris/pull/37281)

- 単一テーブルマテリアライズドビューで、集約マテリアライズドビューのリライトが成功したにもかかわらず CBO がそれを選択しない問題を修正。[#35721](https://github.com/apache/doris/pull/35721) [#36058](https://github.com/apache/doris/pull/36058)

- 結合入力の両方が集約である場合のパーティション化マテリアライズドビュー構築時にパーティション導出が失敗する問題を修正。[#34781](https://github.com/apache/doris/pull/34781)

### Semi-Structured Data Management

- 同時実行や異常データなど特殊な場合での VARIANT の問題を修正。[#37976](https://github.com/apache/doris/pull/37976) [#37839](https://github.com/apache/doris/pull/37839) [#37794](https://github.com/apache/doris/pull/37794) [#37674](https://github.com/apache/doris/pull/37674) [#36997](https://github.com/apache/doris/pull/36997)

- サポートされていない SQL で VARIANT を使用する際の coredump 問題を修正。[#37640](https://github.com/apache/doris/pull/37640)

- 1.x から 2.x 以上のバージョンにアップグレードする際の MAP データ型に関連する coredump 問題を修正。[#36937](https://github.com/apache/doris/pull/36937)

- ES Catalog での Array 型サポートを改良。[#36936](https://github.com/apache/doris/pull/36936)

### Inverted Index

- Inverted Index v2 の DROP INDEX がメタデータを削除しない問題を修正。[#37646](https://github.com/apache/doris/pull/37646)

- 文字列長が「ignore above」閾値を超えた場合のクエリ精度問題を修正。[#37679](https://github.com/apache/doris/pull/37679)

- インデックスサイズ統計の問題を修正。[#37232](https://github.com/apache/doris/pull/37232) [#37564](https://github.com/apache/doris/pull/37564)

### Query Optimizer

- 予約キーワード使用によりインポート操作の実行が妨げられる問題を修正。[#35938](https://github.com/apache/doris/pull/35938)

- テーブル作成時に char(255) が char(1) として誤って記録される型エラーを修正。[#37671](https://github.com/apache/doris/pull/37671)

- 相関サブクエリの結合式が複雑式の場合の間違った結果を修正。[#37683](https://github.com/apache/doris/pull/37683)

- decimal 型の間違ったバケットプルーニングの潜在的問題を修正。[#38013](https://github.com/apache/doris/pull/38013)

- 特定のシナリオで pipeline local shuffle が有効な場合の間違った集約オペレータ結果を修正。[#38016](https://github.com/apache/doris/pull/38016)

- 集約オペレータに等価式が存在する場合に発生する可能性がある計画エラーを修正。[#36622](https://github.com/apache/doris/pull/36622)

- 集約オペレータにラムダ式が存在する場合に発生する可能性がある計画エラーを修正。[#37285](https://github.com/apache/doris/pull/37285)

- ウィンドウ関数からリテラルに最適化されたリテラルが間違った型を持ち、実行を阻止する問題を修正。[#37283](https://github.com/apache/doris/pull/37283)

- 集約関数 foreach コンビネータによる null 属性の間違った出力問題を修正。[#37980](https://github.com/apache/doris/pull/37980)

- パラメータが範囲外のリテラルの場合に acos 関数が計画できない問題を修正。[#37996](https://github.com/apache/doris/pull/37996)

- 同期マテリアライズドビューのクエリでパーティション指定時の計画エラーを修正。[#36982](https://github.com/apache/doris/pull/36982)

- 計画中の時折発生する Null Pointer Exception（NPE）を修正。[#38024](https://github.com/apache/doris/pull/38024)

### Query Execution

- decimal データ型を条件として使用する delete where ステートメントのエラーを修正。[#37801](https://github.com/apache/doris/pull/37801)

- クエリ実行終了後に BE メモリが解放されない問題を修正。[#37792](https://github.com/apache/doris/pull/37792) [#37297](https://github.com/apache/doris/pull/37297)

- 高 QPS シナリオで監査ログが FE メモリを過度に占有する問題を修正。[#37786](https://github.com/apache/doris/pull/37786)

- sleep 関数が不正な入力値を受けた際の BE core dump を修正。[#37681](https://github.com/apache/doris/pull/37681)

- sync filter size 実行中に発生するエラーを修正。[#37103](https://github.com/apache/doris/pull/37103)

- 実行中にタイムゾーンを使用する際の間違った結果を修正。[#37062](https://github.com/apache/doris/pull/37062)

- 文字列から整数へのキャスト時の間違った結果を修正。[#36788](https://github.com/apache/doris/pull/36788)

- pipelinex 有効時の Arrow Flight プロトコル使用でのクエリエラーを修正。[#35804](https://github.com/apache/doris/pull/35804)

- 文字列から日付/日時へのキャスト時のエラーを修正。[#35637](https://github.com/apache/doris/pull/35637)

- <=> を使用した大型テーブル結合クエリ中の BE core dump を修正。[#36263](https://github.com/apache/doris/pull/36263)

### Storage Management

- 列更新・書き込み操作中に発生する不可視 DELETE SIGN データの問題を修正。[#36755](https://github.com/apache/doris/pull/36755)

- スキーマ変更中の FE メモリ使用量を最適化。[#36756](https://github.com/apache/doris/pull/36756)

- トランザクション中断がされないことによる BE 再起動時のハング問題を修正 [#36437](https://github.com/apache/doris/pull/36437)

- NOT NULL から NULL データ型への変更時の時折発生するエラーを修正。[#36389](https://github.com/apache/doris/pull/36389)

- BE ダウン時のレプリカ修復スケジューリングを最適化。[#36897](https://github.com/apache/doris/pull/36897)

- 単一 BE でのタブレット作成におけるラウンドロビンディスク選択をサポート。[#36900](https://github.com/apache/doris/pull/36900)

- 遅い公開による クエリエラー -230 を修正。[#36222](https://github.com/apache/doris/pull/36222)

- パーティション バランシングの速度を向上。[#36976](https://github.com/apache/doris/pull/36976)

- FD 不足を避けるため、ファイル記述子（FD）数とメモリを使用してセグメントキャッシュを制御。[#37035](https://github.com/apache/doris/pull/37035)

- 同時 clone と alter 操作による潜在的レプリカ損失を修正 [#36858](https://github.com/apache/doris/pull/36858)

- 列順序調整ができない問題を修正。[#37226](https://github.com/apache/doris/pull/37226)

- 自動増分列での特定のスキーマ変更操作を禁止。[#37331](https://github.com/apache/doris/pull/37331)

- DELETE 操作での不正確なエラー報告を修正。[#37374](https://github.com/apache/doris/pull/37374)

- BE 側のゴミ箱有効期限を1日に調整。[#37409](https://github.com/apache/doris/pull/37409)

- コンパクション メモリ使用量とスケジューリングを最適化。[#37491](https://github.com/apache/doris/pull/37491)

- FE 再起動を引き起こす可能性がある過大バックアップをチェック。[#37466](https://github.com/apache/doris/pull/37466)

- 動的パーティション削除ポリシーとクロスパーティション動作を 2.1.3 に復元。[#37570](https://github.com/apache/doris/pull/37570) [#37506](https://github.com/apache/doris/pull/37506)

- DELETE 述語での decimal 型関連エラーを修正。[#37710](https://github.com/apache/doris/pull/37710)

### Data Loading

- インポート中のエラーハンドリングでの競合状態による データ不可視問題を修正 [#36744](https://github.com/apache/doris/pull/36744)

- streamload インポートでの hhl_from_base64 サポートを追加。[#36819](https://github.com/apache/doris/pull/36819)

- 単一テーブルの非常に大量のタブレットをインポートする際の潜在的 FE OOM 問題を修正。[#36944](https://github.com/apache/doris/pull/36944)

- FE マスター・スレーブ切り替え時の自動増分列重複の可能性を修正。[#36961](https://github.com/apache/doris/pull/36961)

- 自動増分列での insert into select 時のエラーを修正。[#37029](https://github.com/apache/doris/pull/37029)

- メモリ使用量最適化のためデータフラッシュスレッド数を削減。[#37092](https://github.com/apache/doris/pull/37092)

- routine load タスクの自動復旧とエラーメッセージを改良。[#37371](https://github.com/apache/doris/pull/37371)

- routine load のデフォルトバッチサイズを増加。[#37388](https://github.com/apache/doris/pull/37388)

-
