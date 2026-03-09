---
{
  "title": "リリース 3.0.5",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.5バージョンが2025年4月28日に正式にリリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.5バージョンが2025年4月28日に正式リリースされました。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHubリリース:** https://github.com/apache/doris/releases


## 新機能

### Lakehouse

- FE MetricsにCatalog/Database/Table数量監視メトリクスを追加 ([#47891](https://github.com/apache/doris/pull/47891))
- MaxCompute CatalogでTimestamp型をサポート ([#48768](https://github.com/apache/doris/pull/48768))

### クエリ実行

- URL処理関数を追加：`top_level_domain`、`first_significant_subdomain`、`cut_to_first_significant_subdomain` ([#42488](https://github.com/apache/doris/pull/42488))
- Trino互換実装の`year_of_week`関数を追加 ([#48870](https://github.com/apache/doris/pull/48870))
- `percentile_array`関数でFloatおよびDoubleデータ型をサポート ([#48094](https://github.com/apache/doris/pull/48094))

### ストレージ・コンピュート分離

- コンピュートグループのリネーム機能を追加 ([#46221](https://github.com/apache/doris/pull/46221))

## 改善

### ストレージ

- Compactionタスク生成を高速化してパフォーマンスを向上 ([#49547](https://github.com/apache/doris/pull/49547))
- Stream Loadで圧縮JSONファイルの取り込みをサポート ([#49044](https://github.com/apache/doris/pull/49044))
- 様々な取り込みシナリオのエラーメッセージを強化 ([#48436](https://github.com/apache/doris/pull/48436) [#47721](https://github.com/apache/doris/pull/47721) [#47804](https://github.com/apache/doris/pull/47804) [#48638](https://github.com/apache/doris/pull/48638) [#48344](https://github.com/apache/doris/pull/48344) [#49287](https://github.com/apache/doris/pull/49287) [#48009](https://github.com/apache/doris/pull/48009))
- Routine Load用の複数メトリクスを追加 ([#49045](https://github.com/apache/doris/pull/49045) [#48764](https://github.com/apache/doris/pull/48764))
- 単一ジョブの失敗が全体のスケジューリングに影響しないようRoutine Loadスケジューリングアルゴリズムを最適化 ([#47847](https://github.com/apache/doris/pull/47847))
- Routine Loadシステムテーブルを追加 ([#49284](https://github.com/apache/doris/pull/49284))
- 高頻度取り込み下でのMerge-On-Write（MOW）テーブルのクエリパフォーマンスを向上 ([#48968](https://github.com/apache/doris/pull/48968))
- Key Rangeクエリ用のProfile情報表示を強化 ([#48191](https://github.com/apache/doris/pull/48191))

### コンピュート・ストレージ分離

- 複数のFile Cacheの安定性およびパフォーマンス問題を修正 ([#48786](https://github.com/apache/doris/pull/48786) [#48623](https://github.com/apache/doris/pull/48623) [#48687](https://github.com/apache/doris/pull/48687) [#49050](https://github.com/apache/doris/pull/49050) [#48318](https://github.com/apache/doris/pull/48318))
- Storage Vault作成の検証ロジックを改善 ([#48073](https://github.com/apache/doris/pull/48073) [#48369](https://github.com/apache/doris/pull/48369))

### Lakehouse

- Trino Connector Catalog用のBE Scannerクロージャロジックを最適化してメモリ解放を加速 ([#47857](https://github.com/apache/doris/pull/47857))
- ClickHouse JDBC Catalogで異なるドライババージョンに自動適応 ([#46026](https://github.com/apache/doris/pull/46026))

### 非同期マテリアライズドビュー

- 透過的リライトの計画パフォーマンスを強化 ([#48782](https://github.com/apache/doris/pull/48782))
- `tvf mv_infos`のパフォーマンスを最適化 ([#47415](https://github.com/apache/doris/pull/47415))
- 外部テーブルベースのMV構築中のカタログメタデータリフレッシュを無効化してメモリ使用量を削減 ([#48767](https://github.com/apache/doris/pull/48767))

### クエリオプティマイザー

- キー列およびパーティション列の統計収集パフォーマンスを向上 ([#46534](https://github.com/apache/doris/pull/46534))
- クエリ結果エイリアスがユーザー入力と厳密に一致するよう改善 ([#47093](https://github.com/apache/doris/pull/47093))
- 集約演算子での共通部分式抽出後のカラムプルーニングを強化 ([#46627](https://github.com/apache/doris/pull/46627))
- 関数バインド失敗および未サポートサブクエリのエラーメッセージを改善 ([#47919](https://github.com/apache/doris/pull/47919) [#47985](https://github.com/apache/doris/pull/47985))

### 半構造化データ管理

- `json_object`関数で複合型パラメータをサポート ([#47779](https://github.com/apache/doris/pull/47779))
- IPv6型へのUInt128書き込みサポートを追加 ([#48802](https://github.com/apache/doris/pull/48802))
- VARIANT型のARRAYフィールドでの転置インデックスサポートを有効化 ([#47688](https://github.com/apache/doris/pull/47688) [#48117](https://github.com/apache/doris/pull/48117))

### セキュリティ

- Ranger認可パフォーマンスを改善 ([#49352](https://github.com/apache/doris/pull/49352))

### その他

- JVM Metricsインターフェースのパフォーマンスを最適化 ([#49380](https://github.com/apache/doris/pull/49380))

## バグ修正

### ストレージ

- いくつかのエッジケースでのデータ正確性問題を修正 ([#48056](https://github.com/apache/doris/pull/48056) [#48399](https://github.com/apache/doris/pull/48399) [#48400](https://github.com/apache/doris/pull/48400) [#48748](https://github.com/apache/doris/pull/48748) [#48775](https://github.com/apache/doris/pull/48775) [#48867](https://github.com/apache/doris/pull/48867) [#49165](https://github.com/apache/doris/pull/49165) [#49193](https://github.com/apache/doris/pull/49193) [#49350](https://github.com/apache/doris/pull/49350) [#49710](https://github.com/apache/doris/pull/49710) [#49825](https://github.com/apache/doris/pull/49825))
- 完了したトランザクションの不適切なクリーンアップを修正 ([#49564](https://github.com/apache/doris/pull/49564))
- 部分カラム更新でJSONBデフォルト値を`{}`に変更 ([#49066](https://github.com/apache/doris/pull/49066))
- ストレージ・コンピュート分離モデルでのdelete bitmapアップデートロック解放問題を修正 ([#47766](https://github.com/apache/doris/pull/47766))
- ARMアーキテクチャでのStream Loadでのデータ損失を修正 ([#49666](https://github.com/apache/doris/pull/49666))
- Insert Into Selectでのデータ品質問題に対するエラーURL返却の欠如を修正 ([#49687](https://github.com/apache/doris/pull/49687))
- マルチテーブルRoutine Loadデータ品質問題のエラーURL報告を修正 ([#49130](https://github.com/apache/doris/pull/49130))
- Schema Change中のInsert Into Values使用時の不正確な結果を修正 ([#49338](https://github.com/apache/doris/pull/49338))
- tabletコミット情報報告によるcore dumpを修正 ([#48732](https://github.com/apache/doris/pull/48732))
- S3 Load用のAzure China地域サポートを追加 ([#48642](https://github.com/apache/doris/pull/48642))
- K8s環境での「get image failed」エラーを修正 ([#49072](https://github.com/apache/doris/pull/49072))
- 動的パーティションスケジューリングでのCPU消費を削減 ([#48577](https://github.com/apache/doris/pull/48577))
- マテリアライズドビューリネーム後のカラム例外を修正 ([#48328](https://github.com/apache/doris/pull/48328))
- Schema Change失敗後のメモリおよびファイルキャッシュリークを修正 ([#48426](https://github.com/apache/doris/pull/48426))
- 空のパーティションを持つテーブルでのbase compaction失敗を修正 ([#49062](https://github.com/apache/doris/pull/49062))
- 複合型変更でのデータ正確性問題を修正 ([#49452](https://github.com/apache/doris/pull/49452))
- cold compactionでのcore dumpを修正 ([#48329](https://github.com/apache/doris/pull/48329))
- delete操作でのcumulative point停滞を修正 ([#47282](https://github.com/apache/doris/pull/47282))
- 大規模full compactionでのメモリ不足を修正 ([#48958](https://github.com/apache/doris/pull/48958))

### コンピュート・ストレージ分離

- K8s環境でのファイルキャッシュクリーンアップ失敗を修正 ([#49199](https://github.com/apache/doris/pull/49199))
- 高頻度取り込み中の読み書きロックによるFE CPUスパイクを修正 ([#48564](https://github.com/apache/doris/pull/48564))

### Lakehouse

**データレイク**

- Hive/Icebergテーブルへの同時書き込み中のBE core dumpを修正 ([#49842](https://github.com/apache/doris/pull/49842))
- AWS S3上のHive/Icebergテーブルへの書き込み失敗を修正 ([#47162](https://github.com/apache/doris/pull/47162))
- 不正確なIceberg Position Deletion読み取りを修正 ([#47977](https://github.com/apache/doris/pull/47977))
- Icebergテーブル作成用のTencent Cloud COSサポートを追加 ([#49885](https://github.com/apache/doris/pull/49885))
- HDFS上のPaimonデータのKerberos認証を修正 ([#47192](https://github.com/apache/doris/pull/47192))
- Hudi Jni Scannerでのメモリリークを修正 ([#48955](https://github.com/apache/doris/pull/48955))
- MaxCompute Catalogでのマルチパーティションリスト読み取りを修正 ([#48325](https://github.com/apache/doris/pull/48325))

**JDBC**

- JDBC Catalogからの行数取得時のNPEを修正 ([#49442](https://github.com/apache/doris/pull/49442))
- OceanBase Oracleモード接続テストを修正 ([#49442](https://github.com/apache/doris/pull/49442))
- 同時JDBC Catalogアクセスでのカラム型長の不一致を修正 ([#48541](https://github.com/apache/doris/pull/48541))
- JDBC Catalog BEでのClassloaderリークを修正 ([#46912](https://github.com/apache/doris/pull/46912))
- PostgreSQL JDBC Catalogでの接続スレッドリークを修正 ([#49568](https://github.com/apache/doris/pull/49568))

**エクスポート**

- EXPORTING状態で停止するEXPORTジョブを修正 ([#47974](https://github.com/apache/doris/pull/47974))
- 重複ファイルを防ぐためOUTFILE自動再試行を無効化 ([#48095](https://github.com/apache/doris/pull/48095))

**その他**

- FE WebUI経由でのTVFクエリ実行時のNPEを修正 ([#49213](https://github.com/apache/doris/pull/49213))
- Hadoop Libhdfsスレッドローカルnull pointer例外を修正 ([#48280](https://github.com/apache/doris/pull/48280))
- FE Hadoopアクセスでの「Filesystem already closed」エラーを修正 ([#48351](https://github.com/apache/doris/pull/48351))
- Catalogコメント永続化問題を修正 ([#46946](https://github.com/apache/doris/pull/46946))
- Parquet複合型読み取りエラーを修正 ([#47734](https://github.com/apache/doris/pull/47734))

### 非同期マテリアライズドビュー

- 極端なシナリオでのMV構築の遅さを修正 ([#48074](https://github.com/apache/doris/pull/48074))
- ネストしたMVの透過的リライト失敗を修正 ([#48222](https://github.com/apache/doris/pull/48222))

### クエリオプティマイザー

- 定数折り畳み計算エラーを修正 ([#49225](https://github.com/apache/doris/pull/49225) [#47966](https://github.com/apache/doris/pull/47966) [#49416](https://github.com/apache/doris/pull/49416) [#49087](https://github.com/apache/doris/pull/49087) [#49033](https://github.com/apache/doris/pull/49033) [#49061](https://github.com/apache/doris/pull/49061) [#48895](https://github.com/apache/doris/pull/48895) [#48957](https://github.com/apache/doris/pull/48957) [#47288](https://github.com/apache/doris/pull/47288) [#48641](https://github.com/apache/doris/pull/48641) [#49413](https://github.com/apache/doris/pull/49413) [#48783](https://github.com/apache/doris/pull/48783))
- ネストしたウィンドウ関数でのORDER BYによる予期しないエラーを修正 ([#48492](https://github.com/apache/doris/pull/48492))

### クエリ実行

- パイプラインタスクスケジューリングのデッドロック/パフォーマンス問題を修正 ([#49976](https://github.com/apache/doris/pull/49976) [#49007](https://github.com/apache/doris/pull/49007))
- FE接続失敗時のメモリ破損を修正 ([#48370](https://github.com/apache/doris/pull/48370) [#48313](https://github.com/apache/doris/pull/48313))
- lambdaおよび配列関数でのメモリ破損を修正 ([#49140](https://github.com/apache/doris/pull/49140))
- null文字列からJSONB変換によるBE coreを修正 ([#49810](https://github.com/apache/doris/pull/49810))
- `parse_url`での未定義動作を標準化 ([#49149](https://github.com/apache/doris/pull/49149))
- `array_overlap`のnull処理を修正 ([#49403](https://github.com/apache/doris/pull/49403))
- 非ASCII文字での大文字小文字変換エラーを修正 ([#49763](https://github.com/apache/doris/pull/49763))
- `percentile`関数でのBE coreを修正 ([#48563](https://github.com/apache/doris/pull/48563))
- 複数のメモリ破損問題を修正 ([#48288](https://github.com/apache/doris/pull/48288) [#49737](https://github.com/apache/doris/pull/49737) [#48018](https://github.com/apache/doris/pull/48018) [#47964](https://github.com/apache/doris/pull/47964))
- SET演算子の不正確な結果を修正 ([#48001](https://github.com/apache/doris/pull/48001))
- FD枯渇を防ぐためデフォルトArrow Flightスレッドプールサイズを削減 ([#48530](https://github.com/apache/doris/pull/48530))
- ウィンドウ関数のメモリ破損を修正 ([#48458](https://github.com/apache/doris/pull/48458))

### 半構造化データ管理

- チャンク化Stream Load JSONインポートを修正 ([#48474](https://github.com/apache/doris/pull/48474))
- JSONBフォーマット検証を強化 ([#48731](https://github.com/apache/doris/pull/48731))
- 大きなSTRUCTフィールドでのクラッシュを修正 ([#49552](https://github.com/apache/doris/pull/49552))
- 複合型でのVARCHAR長サポートを拡張 ([#48025](https://github.com/apache/doris/pull/48025))
- 特定のパラメータでの`array_avg`クラッシュを修正 ([#48691](https://github.com/apache/doris/pull/48691))
- VARIANT型での`ColumnObject::pop_back`クラッシュを修正 ([#48935](https://github.com/apache/doris/pull/48935) [#48978](https://github.com/apache/doris/pull/48978))
- VARIANT型でのインデックス構築を無効化 ([#49844](https://github.com/apache/doris/pull/49844))
- VARIANT型での転置インデックスv1フォーマットを無効化 ([#49890](https://github.com/apache/doris/pull/49890))
- VARIANT型での多層CASTエラーを修正 ([#47954](https://github.com/apache/doris/pull/47954))
- 多くのサブカラムを持つVARIANTの転置インデックスメタデータ検索を最適化 ([#48153](https://github.com/apache/doris/pull/48153))
- ストレージ・コンピュート分離モードでのVARIANTスキーマメモリ消費を削減 ([#47629](https://github.com/apache/doris/pull/47629) [#48463](https://github.com/apache/doris/pull/48463))
- PreparedStatement IDオーバーフローを修正 ([#48116](https://github.com/apache/doris/pull/48116))
- DELETE操作での行ストレージを修正 ([#49609](https://github.com/apache/doris/pull/49609))

### 転置インデックス

- ARRAY型nullビットマップ処理を修正 ([#48052](https://github.com/apache/doris/pull/48052))
- Date/Datetimev1 Bloomfilter比較を修正 ([#47005](https://github.com/apache/doris/pull/47005))
- UTF-8 4バイト文字の切り捨てを修正 ([#48792](https://github.com/apache/doris/pull/48792))
- カラム追加直後のインデックス損失を修正 ([#48547](https://github.com/apache/doris/pull/48547))
- ARRAY転置インデックスでの空データ処理を修正 ([#48264](https://github.com/apache/doris/pull/48264))
- FEメタデータアップグレード互換性を改善 ([#49283](https://github.com/apache/doris/pull/49283))
- `match_phrase_prefix`キャッシュエラーを修正 ([#46517](https://github.com/apache/doris/pull/46517))
- compaction後のファイルキャッシュクリーンアップを修正 ([#49738](https://github.com/apache/doris/pull/49738))

### セキュリティ

- DELETE操作でのSelect_Privチェックを削除 ([#49239](https://github.com/apache/doris/pull/49239))
- 非rootユーザーがroot権限を変更することを防止 ([#48752](https://github.com/apache/doris/pull/48752))
- 間欠的なLDAP PartialResultExceptionを修正 ([#47858](https://github.com/apache/doris/pull/47858))

### その他

- JAVA_OPTS_FOR_JDK_17認識を修正 ([#48170](https://github.com/apache/doris/pull/48170))
- InterruptExceptionによるBDBメタデータ書き込み失敗を修正 ([#47874](https://github.com/apache/doris/pull/47874))
- マルチステートメント要求のSQLハッシュ生成を改善 ([#48242](https://github.com/apache/doris/pull/48242))
- ユーザー属性変数がセッション変数をオーバーライドするよう修正 ([#48548](https://github.com/apache/doris/pull/48548))
