---
{
  "title": "リリース 3.0.5",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.5バージョンが2025年4月28日に正式リリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.5 バージョンが 2025年4月28日に正式リリースされました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases


## 新機能

### レイクハウス

- FE Metrics に カタログ/Database/table 数量監視メトリクスを追加 ([#47891](https://github.com/apache/doris/pull/47891))
- MaxCompute カタログ で Timestamp 型をサポート ([#48768](https://github.com/apache/doris/pull/48768))

### Query Execution

- URL 処理関数を追加: `top_level_domain`、`first_significant_subdomain`、`cut_to_first_significant_subdomain` ([#42488](https://github.com/apache/doris/pull/42488))
- Trino 互換実装での `year_of_week` 関数を追加 ([#48870](https://github.com/apache/doris/pull/48870))
- `percentile_array` 関数で Float と Double データ型をサポート ([#48094](https://github.com/apache/doris/pull/48094))

### Storage-Compute Separation

- compute group のリネーム機能を追加 ([#46221](https://github.com/apache/doris/pull/46221))

## 改善

### Storage

- Compaction タスク生成を高速化してパフォーマンスを向上 ([#49547](https://github.com/apache/doris/pull/49547))
- Stream Load で圧縮 JSON ファイル取り込みをサポート ([#49044](https://github.com/apache/doris/pull/49044))
- 様々な取り込みシナリオでエラーメッセージを強化 ([#48436](https://github.com/apache/doris/pull/48436) [#47721](https://github.com/apache/doris/pull/47721) [#47804](https://github.com/apache/doris/pull/47804) [#48638](https://github.com/apache/doris/pull/48638) [#48344](https://github.com/apache/doris/pull/48344) [#49287](https://github.com/apache/doris/pull/49287) [#48009](https://github.com/apache/doris/pull/48009))
- Routine Load に複数のメトリクスを追加 ([#49045](https://github.com/apache/doris/pull/49045) [#48764](https://github.com/apache/doris/pull/48764))
- Routine Load スケジューリングアルゴリズムを最適化し、単一ジョブの失敗が全体のスケジューリングに影響しないよう改善 ([#47847](https://github.com/apache/doris/pull/47847))
- Routine Load システムテーブルを追加 ([#49284](https://github.com/apache/doris/pull/49284))
- 高頻度取り込み下での Merge-On-Write (MOW) テーブルのクエリパフォーマンスを向上 ([#48968](https://github.com/apache/doris/pull/48968))
- Key Range クエリの Profile 情報表示を強化 ([#48191](https://github.com/apache/doris/pull/48191))

### Compute-Storage Decoupled

- File Cache の安定性とパフォーマンス問題を複数修正 ([#48786](https://github.com/apache/doris/pull/48786) [#48623](https://github.com/apache/doris/pull/48623) [#48687](https://github.com/apache/doris/pull/48687) [#49050](https://github.com/apache/doris/pull/49050) [#48318](https://github.com/apache/doris/pull/48318))
- Storage Vault 作成の検証ロジックを改善 ([#48073](https://github.com/apache/doris/pull/48073) [#48369](https://github.com/apache/doris/pull/48369))

### レイクハウス

- Trino Connector カタログ の BE Scanner クローズロジックを最適化してメモリ解放を高速化 ([#47857](https://github.com/apache/doris/pull/47857))
- ClickHouse JDBC カタログ で異なるドライバーバージョンに自動適応 ([#46026](https://github.com/apache/doris/pull/46026))

### 非同期マテリアライズドビュー

- transparent rewrite の計画パフォーマンスを強化 ([#48782](https://github.com/apache/doris/pull/48782))
- `tvf mv_infos` のパフォーマンスを最適化 ([#47415](https://github.com/apache/doris/pull/47415))
- 外部テーブルベース MV 構築中の catalog メタデータ更新を無効化してメモリ使用量を削減 ([#48767](https://github.com/apache/doris/pull/48767))

### Query Optimizer

- キーカラムとパーティションカラムの統計収集パフォーマンスを向上 ([#46534](https://github.com/apache/doris/pull/46534))
- クエリ結果のエイリアスがユーザー入力と厳密に一致するよう改善 ([#47093](https://github.com/apache/doris/pull/47093))
- 集約演算子での共通部分式抽出後のカラムプルーニングを強化 ([#46627](https://github.com/apache/doris/pull/46627))
- 関数バインディング失敗とサポート外サブクエリのエラーメッセージを改善 ([#47919](https://github.com/apache/doris/pull/47919) [#47985](https://github.com/apache/doris/pull/47985))

### 半構造化データ管理

- `json_object` 関数で複合型パラメータをサポート ([#47779](https://github.com/apache/doris/pull/47779))
- UInt128 から IPv6 型への書き込みサポートを追加 ([#48802](https://github.com/apache/doris/pull/48802))
- VARIANT 型の ARRAY フィールドでの倒置インデックスサポートを有効化 ([#47688](https://github.com/apache/doris/pull/47688) [#48117](https://github.com/apache/doris/pull/48117))

### セキュリティ

- Ranger 認証パフォーマンスを向上 ([#49352](https://github.com/apache/doris/pull/49352))

### その他

- JVM Metrics インターフェースのパフォーマンスを最適化 ([#49380](https://github.com/apache/doris/pull/49380))

## バグ修正

### Storage

- 複数のエッジケースでのデータ正確性問題を修正 ([#48056](https://github.com/apache/doris/pull/48056) [#48399](https://github.com/apache/doris/pull/48399) [#48400](https://github.com/apache/doris/pull/48400) [#48748](https://github.com/apache/doris/pull/48748) [#48775](https://github.com/apache/doris/pull/48775) [#48867](https://github.com/apache/doris/pull/48867) [#49165](https://github.com/apache/doris/pull/49165) [#49193](https://github.com/apache/doris/pull/49193) [#49350](https://github.com/apache/doris/pull/49350) [#49710](https://github.com/apache/doris/pull/49710) [#49825](https://github.com/apache/doris/pull/49825))
- 完了したトランザクションの適切でないクリーンアップを修正 ([#49564](https://github.com/apache/doris/pull/49564))
- 部分カラム更新での JSONB デフォルト値を `{}` に変更 ([#49066](https://github.com/apache/doris/pull/49066))
- Storage-Compute Separation モデルでの delete bitmap 更新ロック解放問題を修正 ([#47766](https://github.com/apache/doris/pull/47766))
- ARM アーキテクチャでの Stream Load データ損失を修正 ([#49666](https://github.com/apache/doris/pull/49666))
- Insert Into Select でのデータ品質問題に対するエラー URL 戻り値の欠落を修正 ([#49687](https://github.com/apache/doris/pull/49687))
- マルチテーブル Routine Load データ品質問題のエラー URL 報告を修正 ([#49130](https://github.com/apache/doris/pull/49130))
- Schema Change 中の Insert Into Values 使用時の不正な結果を修正 ([#49338](https://github.com/apache/doris/pull/49338))
- tablet commit info 報告によるコアダンプを修正 ([#48732](https://github.com/apache/doris/pull/48732))
- S3 Load での Azure China リージョンサポートを追加 ([#48642](https://github.com/apache/doris/pull/48642))
- K8s 環境での "get image failed" エラーを修正 ([#49072](https://github.com/apache/doris/pull/49072))
- 動的パーティションスケジューリングでの CPU 消費を削減 ([#48577](https://github.com/apache/doris/pull/48577))
- マテリアライズドビュー名前変更後のカラム例外を修正 ([#48328](https://github.com/apache/doris/pull/48328))
- Schema Change 失敗後のメモリとファイルキャッシュリークを修正 ([#48426](https://github.com/apache/doris/pull/48426))
- 空のパーティションを持つテーブルでの base compaction 失敗を修正 ([#49062](https://github.com/apache/doris/pull/49062))
- 複合型変更でのデータ正確性問題を修正 ([#49452](https://github.com/apache/doris/pull/49452))
- cold compaction でのコアダンプを修正 ([#48329](https://github.com/apache/doris/pull/48329))
- 削除操作による cumulative point 停滞を修正 ([#47282](https://github.com/apache/doris/pull/47282))
- 大規模 full compaction でのメモリ不足を修正 ([#48958](https://github.com/apache/doris/pull/48958))

### Compute-Storage Decoupled

- K8s 環境でのファイルキャッシュクリーンアップ失敗を修正 ([#49199](https://github.com/apache/doris/pull/49199))
- 高頻度取り込み中の読み書きロックによる FE CPU スパイクを修正 ([#48564](https://github.com/apache/doris/pull/48564))

### レイクハウス

**Data Lakes**

- Hive/Iceberg テーブルへの同時書き込み中の BE コアダンプを修正 ([#49842](https://github.com/apache/doris/pull/49842))
- AWS S3 での Hive/Iceberg テーブルへの書き込み失敗を修正 ([#47162](https://github.com/apache/doris/pull/47162))
- 不正な Iceberg Position Deletion 読み取りを修正 ([#47977](https://github.com/apache/doris/pull/47977))
- Iceberg テーブル作成での Tencent Cloud COS サポートを追加 ([#49885](https://github.com/apache/doris/pull/49885))
- HDFS 上の Paimon データでの Kerberos 認証を修正 ([#47192](https://github.com/apache/doris/pull/47192))
- Hudi Jni Scanner でのメモリリークを修正 ([#48955](https://github.com/apache/doris/pull/48955))
- MaxCompute カタログ でのマルチパーティションリスト読み取りを修正 ([#48325](https://github.com/apache/doris/pull/48325))

**JDBC**

- JDBC カタログ からの行数取得時の NPE を修正 ([#49442](https://github.com/apache/doris/pull/49442))
- OceanBase Oracle モード接続テストを修正 ([#49442](https://github.com/apache/doris/pull/49442))
- JDBC カタログ 同時アクセスでのカラム型長さ不整合を修正 ([#48541](https://github.com/apache/doris/pull/48541))
- JDBC カタログ BE での Classloader リークを修正 ([#46912](https://github.com/apache/doris/pull/46912))
- PostgreSQL JDBC カタログ での接続スレッドリークを修正 ([#49568](https://github.com/apache/doris/pull/49568))

**Export**

- EXPORT ジョブが EXPORTING 状態でスタックする問題を修正 ([#47974](https://github.com/apache/doris/pull/47974))
- 重複ファイルを防ぐため OUTFILE 自動リトライを無効化 ([#48095](https://github.com/apache/doris/pull/48095))

**その他**

- FE WebUI 経由での TVF クエリ実行時の NPE を修正 ([#49213](https://github.com/apache/doris/pull/49213))
- Hadoop Libhdfs スレッドローカル null pointer exception を修正 ([#48280](https://github.com/apache/doris/pull/48280))
- FE Hadoop アクセスでの "Filesystem already closed" エラーを修正 ([#48351](https://github.com/apache/doris/pull/48351))
- カタログ コメント永続化問題を修正 ([#46946](https://github.com/apache/doris/pull/46946))
- Parquet 複合型読み取りエラーを修正 ([#47734](https://github.com/apache/doris/pull/47734))

### 非同期マテリアライズドビュー

- 極端なシナリオでの MV 構築の遅延を修正 ([#48074](https://github.com/apache/doris/pull/48074))
- ネストされた MV transparent rewrite 失敗を修正 ([#48222](https://github.com/apache/doris/pull/48222))

### Query Optimizer

- 定数畳み込み計算エラーを修正 ([#49225](https://github.com/apache/doris/pull/49225) [#47966](https://github.com/apache/doris/pull/47966) [#49416](https://github.com/apache/doris/pull/49416) [#49087](https://github.com/apache/doris/pull/49087) [#49033](https://github.com/apache/doris/pull/49033) [#49061](https://github.com/apache/doris/pull/49061) [#48895](https://github.com/apache/doris/pull/48895) [#48957](https://github.com/apache/doris/pull/48957) [#47288](https://github.com/apache/doris/pull/47288) [#48641](https://github.com/apache/doris/pull/48641) [#49413](https://github.com/apache/doris/pull/49413) [#48783](https://github.com/apache/doris/pull/48783))
- ネストされたウィンドウ関数での ORDER BY による予期しないエラーを修正 ([#48492](https://github.com/apache/doris/pull/48492))

### Query Execution

- pipeline タスクスケジューリングデッドロック/パフォーマンス問題を修正 ([#49976](https://github.com/apache/doris/pull/49976) [#49007](https://github.com/apache/doris/pull/49007))
- FE 接続失敗時のメモリ破損を修正 ([#48370](https://github.com/apache/doris/pull/48370) [#48313](https://github.com/apache/doris/pull/48313))
- lambda と array 関数でのメモリ破損を修正 ([#49140](https://github.com/apache/doris/pull/49140))
- null 文字列から JSONB への変換による BE コアを修正 ([#49810](https://github.com/apache/doris/pull/49810))
- `parse_url` での未定義動作を標準化 ([#49149](https://github.com/apache/doris/pull/49149))
- `array_overlap` null ハンドリングを修正 ([#49403](https://github.com/apache/doris/pull/49403))
- 非ASCII文字での大小文字変換エラーを修正 ([#49763](https://github.com/apache/doris/pull/49763))
- `percentile` 関数での BE コアを修正 ([#48563](https://github.com/apache/doris/pull/48563))
- 複数のメモリ破損問題を修正 ([#48288](https://github.com/apache/doris/pull/48288) [#49737](https://github.com/apache/doris/pull/49737) [#48018](https://github.com/apache/doris/pull/48018) [#47964](https://github.com/apache/doris/pull/47964))
- SET 演算子の不正な結果を修正 ([#48001](https://github.com/apache/doris/pull/48001))
- FD 枯渇を防ぐためデフォルト Arrow Flight スレッドプールサイズを削減 ([#48530](https://github.com/apache/doris/pull/48530))
- ウィンドウ関数のメモリ破損を修正 ([#48458](https://github.com/apache/doris/pull/48458))

### 半構造化データ管理

- チャンク化された Stream Load JSON インポートを修正 ([#48474](https://github.com/apache/doris/pull/48474))
- JSONB フォーマット検証を強化 ([#48731](https://github.com/apache/doris/pull/48731))
- 大きな STRUCT フィールドでのクラッシュを修正 ([#49552](https://github.com/apache/doris/pull/49552))
- 複合型での VARCHAR 長さサポートを拡張 ([#48025](https://github.com/apache/doris/pull/48025))
- 特定パラメータでの `array_avg` クラッシュを修正 ([#48691](https://github.com/apache/doris/pull/48691))
- VARIANT 型での `ColumnObject::pop_back` クラッシュを修正 ([#48935](https://github.com/apache/doris/pull/48935) [#48978](https://github.com/apache/doris/pull/48978))
- VARIANT 型でのインデックス構築を無効化 ([#49844](https://github.com/apache/doris/pull/49844))
- VARIANT 型での倒置インデックス v1 フォーマットを無効化 ([#49890](https://github.com/apache/doris/pull/49890))
- VARIANT 型での多層 CAST エラーを修正 ([#47954](https://github.com/apache/doris/pull/47954))
- 多くのサブカラムを持つ VARIANT での倒置インデックスメタデータルックアップを最適化 ([#48153](https://github.com/apache/doris/pull/48153))
- Storage-Compute Separation モードでの VARIANT スキーマメモリ消費を削減 ([#47629](https://github.com/apache/doris/pull/47629) [#48463](https://github.com/apache/doris/pull/48463))
- PreparedStatement ID オーバーフローを修正 ([#48116](https://github.com/apache/doris/pull/48116))
- DELETE 操作での行ストレージを修正 ([#49609](https://github.com/apache/doris/pull/49609))

### 倒置インデックス

- ARRAY 型 null bitmap ハンドリングを修正 ([#48052](https://github.com/apache/doris/pull/48052))
- Date/Datetimev1 Bloomfilter 比較を修正 ([#47005](https://github.com/apache/doris/pull/47005))
- UTF-8 4バイト文字切り捨てを修正 ([#48792](https://github.com/apache/doris/pull/48792))
- カラム追加直後のインデックス損失を修正 ([#48547](https://github.com/apache/doris/pull/48547))
- ARRAY 倒置インデックスでの空データハンドリングを修正 ([#48264](https://github.com/apache/doris/pull/48264))
- FE メタデータアップグレード互換性を改善 ([#49283](https://github.com/apache/doris/pull/49283))
- `match_phrase_prefix` キャッシュエラーを修正 ([#46517](https://github.com/apache/doris/pull/46517))
- compaction 後のファイルキャッシュクリーンアップを修正 ([#49738](https://github.com/apache/doris/pull/49738))

### セキュリティ

- DELETE 操作での Select_Priv チェックを削除 ([#49239](https://github.com/apache/doris/pull/49239))
- root 以外のユーザーが root 権限を変更することを防止 ([#48752](https://github.com/apache/doris/pull/48752))
- 断続的な LDAP PartialResultException を修正 ([#47858](https://github.com/apache/doris/pull/47858))

### その他

- JAVA_OPTS_FOR_JDK_17 認識を修正 ([#48170](https://github.com/apache/doris/pull/48170))
- InterruptException による BDB メタデータ書き込み失敗を修正 ([#47874](https://github.com/apache/doris/pull/47874))
- マルチステートメント要求での SQL ハッシュ生成を改善 ([#48242](https://github.com/apache/doris/pull/48242))
- ユーザー属性変数がセッション変数をオーバーライドするよう修正 ([#48548](https://github.com/apache/doris/pull/48548))
