---
{
  "title": "リリース 3.1.1",
  "language": "ja",
  "description": "Apache Doris 3.1.1は、重要なバグ修正、パフォーマンス最適化、および安定性向上に焦点を当てたメンテナンスリリースです。"
}
---
## 概要

Apache Doris 3.1.1は、重要なバグ修正、パフォーマンス最適化、および安定性の向上に焦点を当てたメンテナンスリリースです。このリリースには、compaction、loading、クエリ処理、クラウド機能に関する多数の修正が含まれており、本番環境でのロバスト性が向上しています。

## 新機能

### 主要機能

- **`[feature](function)`** count_substrings関数のサポート ([#42055](https://github.com/apache/doris/pull/42055), [#55847](https://github.com/apache/doris/pull/55847))


### データ統合 & ストレージ

- **`[feat](hdfs)`** HDFS HA設定検証の追加 ([#55675](https://github.com/apache/doris/pull/55675), [#55764](https://github.com/apache/doris/pull/55764))
- **`[feat](checker)`** checkerのためのタブレット統計キー整合性チェックの追加 ([#54754](https://github.com/apache/doris/pull/54754), [#55663](https://github.com/apache/doris/pull/55663))
- **`[feat](outfile)`** outfileとexportでCSV形式の圧縮タイプをサポート ([#55392](https://github.com/apache/doris/pull/55392), [#55561](https://github.com/apache/doris/pull/55561))
- **`[feat](cloud)`** クラウドグループコミットstream load BE転送モードをサポート ([#55326](https://github.com/apache/doris/pull/55326), [#55527](https://github.com/apache/doris/pull/55527))


### パフォーマンス & 最適化

- **`[support](orc)`** ORCファイルメタキャッシュをサポート ([#54591](https://github.com/apache/doris/pull/54591), [#55584](https://github.com/apache/doris/pull/55584))
- **`[Exec](vec)`** SIMD KNN距離計算をサポート ([#55275](https://github.com/apache/doris/pull/55275))


## 改善

### パフォーマンス最適化

- **`[opt](cloud)`** meta serviceの空rowsetによる負荷を軽減 ([#54395](https://github.com/apache/doris/pull/54395), [#55171](https://github.com/apache/doris/pull/55171), [#55604](https://github.com/apache/doris/pull/55604), [#55742](https://github.com/apache/doris/pull/55742), [#55837](https://github.com/apache/doris/pull/55837), [#55934](https://github.com/apache/doris/pull/55934))
- **`[Opt](mow)`** MOWロードパフォーマンスとCPU使用量の最適化 ([#55073](https://github.com/apache/doris/pull/55073), [#55733](https://github.com/apache/doris/pull/55733), [#55771](https://github.com/apache/doris/pull/55771), [#55767](https://github.com/apache/doris/pull/55767))
- **`[opt](hive)`** hive.recursive_directoriesのデフォルト値をtrueに設定 ([#55737](https://github.com/apache/doris/pull/55737), [#55905](https://github.com/apache/doris/pull/55905))
- **`[opt](recycler)`** 多数の`Aws::Internal::GetEC2MetadataClient` HTTPコールの回避 ([#55546](https://github.com/apache/doris/pull/55546), [#55682](https://github.com/apache/doris/pull/55682))
- **`[opt](mow)`** CPU使用量を削減するためのスタックキャプチャを無効化 ([#55368](https://github.com/apache/doris/pull/55368), [#55526](https://github.com/apache/doris/pull/55526))
- **`[opt](txn lazy commit)`** 一時rowsets変換バッチをより適応的に変更 ([#55035](https://github.com/apache/doris/pull/55035), [#55573](https://github.com/apache/doris/pull/55573))
- **`[opt](nereids)`** 大きい文字列から複合型へのキャストのパフォーマンスを改善 ([#55476](https://github.com/apache/doris/pull/55476), [#55521](https://github.com/apache/doris/pull/55521))
- **`[opt](nereids)`** 文字列範囲の単純化をサポート ([#55378](https://github.com/apache/doris/pull/55378), [#55456](https://github.com/apache/doris/pull/55456))
- **`[opt](nereids)`** normalize windowの最適化 ([#54947](https://github.com/apache/doris/pull/54947), [#55046](https://github.com/apache/doris/pull/55046))
- **`[opt](nereids)`** OLAPテーブルに自動パーティションがある場合のinsertコマンドの並列処理を最適化 ([#54983](https://github.com/apache/doris/pull/54983), [#55030](https://github.com/apache/doris/pull/55030))


### システム強化

- **`[enhancement](Log)`** 一部のログをinfoからdebugに変更 ([#55808](https://github.com/apache/doris/pull/55808), [#55841](https://github.com/apache/doris/pull/55841))
- **`[enhancement](filecache)`** 複数のキャッシュインスタンス間の並列キャッシュクリア ([#55259](https://github.com/apache/doris/pull/55259), [#55437](https://github.com/apache/doris/pull/55437))
- **`[enhancement](sc)`** 隠されたカラムでのスキーマ変更を拒否 ([#53376](https://github.com/apache/doris/pull/53376), [#55385](https://github.com/apache/doris/pull/55385))
- **`[enhancement](backup)`** バックアップ中の削除されたテーブルとパーティションを処理 ([#52935](https://github.com/apache/doris/pull/52935), [#54989](https://github.com/apache/doris/pull/54989))
- **`[enhancement](cloud)`** Dorisバージョン2.1から3.1へのクラウド復元を修正 ([#55110](https://github.com/apache/doris/pull/55110))
- **`[enhancement](type)`** timeとdatetimeの間のキャストをサポート ([#53734](https://github.com/apache/doris/pull/53734), [#54985](https://github.com/apache/doris/pull/54985))


### インフラストラクチャ改善

- **`[refactor](credential)`** 統合アーキテクチャによるvended credentialsシステムのリファクタリング ([#55912](https://github.com/apache/doris/pull/55912))
- **`[refactor](cloud)`** クラウド復元のタブレット作成RPCを複数バッチに分離 ([#55691](https://github.com/apache/doris/pull/55691))
- **`[opt](editlog)`** FEが異常な場合に特定のeditlog例外をスキップする機能を追加 ([#54090](https://github.com/apache/doris/pull/54090), [#55204](https://github.com/apache/doris/pull/55204))


## 重要なバグ修正

### Compaction & Storage

- **`[fix](sc)`** alter_version以下のバージョンについて空rowsetバージョンホール埋めをスキップ ([#56209](https://github.com/apache/doris/pull/56209), [#56212](https://github.com/apache/doris/pull/56212))
- **`[fix](compaction)`** compaction後に入力rowsetが早期に排除されてクエリが失敗する問題を修正 ([#55382](https://github.com/apache/doris/pull/55382), [#55966](https://github.com/apache/doris/pull/55966))
- **`[fix](compaction)`** compactionジョブをべき等に保つためタブレット作成をべき等にする ([#56061](https://github.com/apache/doris/pull/56061), [#56108](https://github.com/apache/doris/pull/56108))
- **`[fix](compaction)`** segcompactionでrowset meta FSを使用し、RPCクライアント準備状況チェックを追加 ([#55951](https://github.com/apache/doris/pull/55951), [#55988](https://github.com/apache/doris/pull/55988))
- **`[fix](compaction)`** compaction中にcompactionスコア0のタブレットをスキップ ([#55550](https://github.com/apache/doris/pull/55550), [#55570](https://github.com/apache/doris/pull/55570))


### クエリ処理 & 関数

- **`[fix](fold constant)`** absの戻り値の型は引数の型であるべき ([#56190](https://github.com/apache/doris/pull/56190), [#56210](https://github.com/apache/doris/pull/56210))
- **`[fix](fold constant)`** float/doubleがNaNの場合はBE定数畳み込みを実行しない ([#55425](https://github.com/apache/doris/pull/55425), [#55874](https://github.com/apache/doris/pull/55874))
- **`[Fix](function)`** unix_timestampの小数点以下の桁数の誤りを修正 ([#55013](https://github.com/apache/doris/pull/55013), [#55962](https://github.com/apache/doris/pull/55962))
- **`[fix](nereids)`** 精度損失やnullキャストが原因で発生する比較述語の単純化を修正 ([#55884](https://github.com/apache/doris/pull/55884), [#56110](https://github.com/apache/doris/pull/56110))
- **`[fix](nereids)`** join reorder時にeq function not exist例外を投げる実行エラーを修正 ([#54953](https://github.com/apache/doris/pull/54953), [#55667](https://github.com/apache/doris/pull/55667))
- **`[fix](nereids)`** window式エイリアスのexpr idの再利用を修正 ([#55286](https://github.com/apache/doris/pull/55286), [#55486](https://github.com/apache/doris/pull/55486))
- **`[fix](nereids)`** count()集約関数との比較でintではなくbigintリテラルを使用 ([#55545](https://github.com/apache/doris/pull/55545), [#55590](https://github.com/apache/doris/pull/55590))
- **`[fix](nereids)`** 巨大な式生成時のプロジェクトマージを停止 ([#55293](https://github.com/apache/doris/pull/55293), [#55519](https://github.com/apache/doris/pull/55519))


### データロード & インポート

- **`[fix](load)`** S3ロードの接続チェック失敗を修正 ([#56123](https://github.com/apache/doris/pull/56123))
- **`[fix](load)`** 完了したロードでの不正な進捗を修正 ([#55509](https://github.com/apache/doris/pull/55509), [#55530](https://github.com/apache/doris/pull/55530))
- **`[fix](load)`** BEコアを引き起こすingestion loadエラーケースを修正 ([#55500](https://github.com/apache/doris/pull/55500))
- **`[fix](load)`** MEM_LIMIT_EXCEEDで失敗したroutine loadタスクが再スケジュールされない問題を修正 ([#55481](https://github.com/apache/doris/pull/55481), [#55616](https://github.com/apache/doris/pull/55616))


### クラウド & 分散機能

- **`[fix](cloud)`** replayUpdateCloudReplicaの不要なテーブルロックを削除 ([#55579](https://github.com/apache/doris/pull/55579), [#55955](https://github.com/apache/doris/pull/55955))
- **`[fix](cloud)`** `calc_sync_versions`はフルcompactionを考慮すべき ([#55630](https://github.com/apache/doris/pull/55630), [#55710](https://github.com/apache/doris/pull/55710))
- **`[fix](warmup)`** `CloudTablet::complete_rowset_segment_warmup`のコアダンプを修正 ([#55932](https://github.com/apache/doris/pull/55932))


### データベース操作

- **`[fix](database)`** データベース名前変更とテーブル作成の競合状態を修正 ([#55054](https://github.com/apache/doris/pull/55054), [#55991](https://github.com/apache/doris/pull/55991))
- **`[fix](create table)`** 同時データベース名前変更がテーブル作成とリプレイ失敗を引き起こす問題を修正 ([#54614](https://github.com/apache/doris/pull/54614), [#56039](https://github.com/apache/doris/pull/56039))
- **`[fix](table)`** drop editlogをテーブルロック内に移動 ([#55705](https://github.com/apache/doris/pull/55705), [#55947](https://github.com/apache/doris/pull/55947))
- **`[fix](schema change)`** light schema change有効化後にタブレットカラムが再構築されない問題を修正 ([#55909](https://github.com/apache/doris/pull/55909), [#55939](https://github.com/apache/doris/pull/55939))


### データ型 & シリアライゼーション

- **`[fix](variant)`** JSON文字列へのシリアライゼーション時のnull値処理を修正 ([#55876](https://github.com/apache/doris/pull/55876), [#56138](https://github.com/apache/doris/pull/56138))
- **`[fix](variant)`** スパースカラムが空の場合の互換性エラー ([#55817](https://github.com/apache/doris/pull/55817))
- **`[fix](variant)`** variantのmax_sparse_column_statistics_sizeを強化 ([#55124](https://github.com/apache/doris/pull/55124), [#55752](https://github.com/apache/doris/pull/55752))


### 外部データソース

- **`[fix](paimon)`** Paimonネイティブリーダーがlate materializationを使用しない問題を修正 ([#55894](https://github.com/apache/doris/pull/55894), [#55917](https://github.com/apache/doris/pull/55917))
- **`[fix](paimon)`** キャッシュキーにdlf.catalog.idを追加してPaimon DLFカタログキャッシュ問題を修正 ([#55875](https://github.com/apache/doris/pull/55875), [#55888](https://github.com/apache/doris/pull/55888))
- **`[fix](paimon)`** PaimonからDoris型マッピングで大きすぎるCHAR/VARCHARフィールドを処理 ([#55051](https://github.com/apache/doris/pull/55051), [#55531](https://github.com/apache/doris/pull/55531))
- **`[fix](maxcompute)`** MC述語プッシュダウン時に存在しないテーブルカラムが原因で発生するNereidsExceptionを修正 ([#55635](https://github.com/apache/doris/pull/55635), [#55746](https://github.com/apache/doris/pull/55746))
- **`[fix](maxcompute)`** MaxComputeカタログ国際ユーザーがアクセスできない問題を修正 ([#55256](https://github.com/apache/doris/pull/55256), [#55560](https://github.com/apache/doris/pull/55560))
- **`[fix](hudi)`** パーティションカラムのみ（データフィールドなし）が必要なHudi JNIテーブルクエリを修正 ([#55466](https://github.com/apache/doris/pull/55466), [#55662](https://github.com/apache/doris/pull/55662))
- **`[fix](hive)`** NULL DEFINED AS ''を持つHiveテキストテーブルクエリを修正 ([#55626](https://github.com/apache/doris/pull/55626), [#55661](https://github.com/apache/doris/pull/55661))
- **`[fix](iceberg)`** メタデータスキャナーに不足していたiceberg-aws依存関係を追加 ([#55741](https://github.com/apache/doris/pull/55741), [#55743](https://github.com/apache/doris/pull/55743))
- **`[fix](iceberg rest)`** Icebergデフォルト値を使用したOAuth2トークンリフレッシュ ([#55578](https://github.com/apache/doris/pull/55578), [#55624](https://github.com/apache/doris/pull/55624))


### メモリ & リソース管理

- **`[fix](memtracker)`** memtrackerによって消費されないメモリ ([#55796](https://github.com/apache/doris/pull/55796), [#55823](https://github.com/apache/doris/pull/55823))
- **`[fix](mow)`** `BaseTablet::get_rowset_by_ids()`でのMOWコアダンプを修正 ([#55539](https://github.com/apache/doris/pull/55539), [#55601](https://github.com/apache/doris/pull/55601))
- **`[fix](mow)`** MOW aggキャッシュバージョンチェックを修正 ([#55330](https://github.com/apache/doris/pull/55330), [#55475](https://github.com/apache/doris/pull/55475))
- **`[fix](move-memtable)`** 誤ってスキップされたセグメントのセグメント番号不一致を修正 ([#55092](https://github.com/apache/doris/pull/55092), [#55471](https://github.com/apache/doris/pull/55471))
- **`[fix](filecache)`** クラウドモード時のセグメントキャッシュのfd数制限なし ([#55610](https://github.com/apache/doris/pull/55610), [#55638](https://github.com/apache/doris/pull/55638))


### セキュリティ & 暗号化

- **`[fix](tde)`** 暗号化キーバージョン表示を修正 ([#56092](https://github.com/apache/doris/pull/56092), [#56068](https://github.com/apache/doris/pull/56068))
- **`[fix](tde)`** TDE関連の問題を修正 ([#55692](https://github.com/apache/doris/pull/55692))


### その他の修正

- **`[fix](mtmv)`** パーティションテーブルにパーティションがない場合にMTMVがリフレッシュできない問題を修正 ([#55468](https://github.com/apache/doris/pull/55468), [#56085](https://github.com/apache/doris/pull/56085))
- **`[fix](plugin)`** プラグインディレクトリ互換性問題を修正 ([#56060](https://github.com/apache/doris/pull/56060))
- **`[fix](http stream)`** SQL解析失敗時にHTTP streamが例外をスローすべき ([#55863](https://github.com/apache/doris/pull/55863), [#55891](https://github.com/apache/doris/pull/55891))
- **`[fix](backup)`** 2GBを超えるbackup meta/job infoをサポート ([#55608](https://github.com/apache/doris/pull/55608), [#55867](https://github.com/apache/doris/pull/55867))
- **`[fix](mysql protocol)`** マスターへの転送時にmore stmt existsフラグを正しく設定 ([#55711](https://github.com/apache/doris/pull/55711), [#55871](https://github.com/apache/doris/pull/55871))
- **`[fix](connection)`** タイムアウトによる接続切断時にセッション関連データがクリアされない問題を修正 ([#55008](https://github.com/apache/doris/pull/55008), [#55809](https://github.com/apache/doris/pull/55809), [#55396](https://github.com/apache/doris/pull/55396))
- **`[fix](wal)`** 実行失敗時のWAL abort txnリプレイ失敗 ([#55881](https://github.com/apache/doris/pull/55881), [#55924](https://github.com/apache/doris/pull/55924))
- **`[fix](restore)`** オーバーヘッドを減らすため復元されたテーブル/パーティション/リソースをクリア ([#55757](https://github.com/apache/doris/pull/55757), [#55784](https://github.com/apache/doris/pull/55784))
- **`[fix](index)`** 未使用のupdate indexを削除 ([#55514](https://github.com/apache/doris/pull/55514), [#55704](https://github.com/apache/doris/pull/55704))
- **`[fix](txn lazy commit)`** txn lazy commitとschema changeの競合を修正 ([#55349](https://github.com/apache/doris/pull/55349), [#55701](https://github.com/apache/doris/pull/55701))
- **`[fix](qe)`** SSLモードでのクエリエラーを修正 ([#53134](https://github.com/apache/doris/pull/53134), [#55628](https://github.com/apache/doris/pull/55628))
- **`[fix](catalog)`** 非負ID生成を保証するためMath.absをビット演算ANDに置換 ([#55183](https://github.com/apache/doris/pull/55183), [#55689](https://github.com/apache/doris/pull/55689))
- **`[fix](function)`** array_agg_foreachの間違った結果を修正 ([#55075](https://github.com/apache/doris/pull/55075), [#55420](https://github.com/apache/doris/pull/55420))


## インフラストラクチャ & 開発

### ビルド & 依存関係

- **`[chore](build)`** ビルドスクリプトの最適化 ([#56027](https://github.com/apache/doris/pull/56027), [#56028](https://github.com/apache/doris/pull/56028))
- **`[chore](thirdparty)`** aws-sdk-cppを1.11.119から1.11.219にアップグレード ([#54780](https://github.com/apache/doris/pull/54780), [#54971](https://github.com/apache/doris/pull/54971))
- **`[chore](build)`** opensslを含むlibevent依存関係を更新 ([#54652](https://github.com/apache/doris/pull/54652), [#54857](https://github.com/apache/doris/pull/54857))
- **`[chore](config)`** ASANを動作させるためのbrpc::usercode_in_pthreadの設定を追加 ([#54656](https://github.com/apache/doris/pull/54656), [#54829](https://github.com/apache/doris/pull/54829))


### テスト & 品質

- **`[chore](case)`** 一部の失敗ケースを修正 ([#56140](https://github.com/apache/doris/pull/56140), [#56167](https://github.com/apache/doris/pull/56167))
- **`[fix](case)`** 一部の失敗ケースを修正 ([#56019](https://github.com/apache/doris/pull/56019), [#56035](https://github.com/apache/doris/pull/56035))
- **`[fix](test)`** 安定性のため回帰テストを変更し、期待されるログレベルを変更 ([#55169](https://github.com/apache/doris/pull/55169), [#55898](https://github.com/apache/doris/pull/55898))
- **`[fix](case)`** 一部の失敗ケースを修正 ([#55739](https://github.com/apache/doris/pull/55739), [#55769](https://github.com/apache/doris/pull/55769))
- **`[fix](case)`** 回帰ケース: cse.groovyを修正 ([#53434](https://github.com/apache/doris/pull/53434), [#55897](https://github.com/apache/doris/pull/55897))
- **`[fix](cases)`** ケースtest_hudi_snapshotの失敗を修正 ([#55761](https://github.com/apache/doris/pull/55761), [#55791](https://github.com/apache/doris/pull/55791))
- **`[fix](case)`** 一部の失敗ケースを修正 ([#55811](https://github.com/apache/doris/pull/55811), [#55835](https://github.com/apache/doris/pull/55835))
- **`[fix](case)`** MVタスクの待機は最新のもののみを対象とすべき ([#55802](https://github.com/apache/doris/pull/55802), [#55830](https://github.com/apache/doris/pull/55830))
- **`[fix](case)`** ケース: variant build indexを修正 ([#55613](https://github.com/apache/doris/pull/55613), [#55648](https://github.com/apache/doris/pull/55648))
- **`[Fix](case)`** show data p2ケースを修正 ([#55449](https://github.com/apache/doris/pull/55449), [#55494](https://github.com/apache/doris/pull/55494))
- **`[fix](test)`** 非同期MVのshow create table失敗 ([#55278](https://github.com/apache/doris/pull/55278), [#55480](https://github.com/apache/doris/pull/55480))
- **`[fix](test)`** クラウドモードで一部のテストをスキップ ([#55448](https://github.com/apache/doris/pull/55448), [#55535](https://github.com/apache/doris/pull/55535))
- **`[Fix](case)`** 一部のケースを修正 ([#55606](https://github.com/apache/doris/pull/55606), [#55656](https://github.com/apache/doris/pull/55656))
- **`[test](export)`** export parallelism where exprケースを追加 ([#55636](https://github.com/apache/doris/pull/55636), [#55659](https://github.com/apache/doris/pull/55659))
- **`[test](iceberg)`** Polarisテストを追加 ([#55484](https://github.com/apache/doris/pull/55484), [#55557](https://github.com/apache/doris/pull/55557))
- **`[test](nereids)`** SQLキャッシュ/ソート済みパーティションキャッシュのUTを追加 ([#55520](https://github.com/apache/doris/pull/55520), [#55536](https://github.com/apache/doris/pull/55536))
- **`[test](docker)`** HMSとGCSでのPaimonに対応 ([#55473](https://github.com/apache/doris/pull/55473), [#55512](https://github.com/apache/doris/pull/55512))
- **`[test](warmup)`** 不安定な定期warmupケースを修正 ([#55365](https://github.com/apache/doris/pull/55365), [#55453](https://github.com/apache/doris/pull/55453))


### セキュリティ & 設定

- **`[chore](sk)`** セキュリティ向上のためログの`secret key`暗号化と`access key`非表示 ([#55241](https://github.com/apache/doris/pull/55241), [#55619](https://github.com/apache/doris/pull/55619))
- **`[chore](security)`** user_files_secure_pathは変更不可 ([#55395](https://github.com/apache/doris
