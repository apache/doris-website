---
{
  "title": "リリース 3.0.2",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.2バージョンが2024年10月15日に正式リリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.2バージョンが2024年10月15日に正式にリリースされました。このバージョンでは、compute-storage decoupling、データストレージ、lakehouse、クエリオプティマイザー、クエリ実行などの更新と改善が含まれています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作の変更

### Storage

- FEメモリオーバーフローを防ぐため、単一バックアップタスクのタブレット数を制限しました。[#40518](https://github.com/apache/doris/pull/40518)
- `SHOW PARTITIONS`コマンドでパーティションの`CommittedVersion`が表示されるようになりました。[#28274](https://github.com/apache/doris/pull/28274)

### その他

- `fe.log`のデフォルト印刷モード（非同期）にファイル行番号情報が含まれるようになりました。行番号出力によりパフォーマンスの問題が発生する場合は、BRIEFモードに切り替えてください。[#39419](https://github.com/apache/doris/pull/39419)
- セッション変数`ENABLE_PREPARED_STMT_AUDIT_LOG`のデフォルト値が`true`から`false`に変更され、prepare文の監査ログが印刷されなくなりました。[#38865](https://github.com/apache/doris/pull/38865)
- セッション変数`max_allowed_packet`のデフォルト値がMySQLSQL 8.4に合わせて1MBから16MBに調整されました。[#38697](https://github.com/apache/doris/pull/38697)
- FEとBEのJVMでデフォルトでUTF-8文字セットを使用するようになりました。[#39521](https://github.com/apache/doris/pull/39521)

## 新機能

### Storage

- バックアップとリカバリで、バックアップに含まれていないテーブルやパーティションのクリアがサポートされました。[#39028](https://github.com/apache/doris/pull/39028)

### Compute-Storage Decoupled

- 複数のタブレット上で期限切れデータの並列リサイクリングがサポートされました。[#37630](https://github.com/apache/doris/pull/37630)
- `ALTER`文によるstorage vaultの変更がサポートされました。[#38685](https://github.com/apache/doris/pull/38685) [#37606](https://github.com/apache/doris/pull/37606)
- 単一トランザクションでの大量のタブレット（5000+）のインポートがサポートされました（実験的機能）。[#38243](https://github.com/apache/doris/pull/38243)
- ノード再起動などの理由による保留中のトランザクションの自動中断がサポートされ、保留中のトランザクションがdecommissionやスキーマ変更をブロックする問題が解決されました。[#37669](https://github.com/apache/doris/pull/37669)
- クエリ中にsegment cacheを使用するかどうかを制御する新しいセッション変数`enable_segment_cache`が追加されました（デフォルトは`true`）。[#37141](https://github.com/apache/doris/pull/37141)
- compute-storage decoupledモードでスキーマ変更中に大量のデータをインポートできない問題が解決されました。[#39558](https://github.com/apache/doris/pull/39558)
- compute-storage decoupledモードで複数のfollower FEロールの追加がサポートされました。[#38388](https://github.com/apache/doris/pull/38388)
- ディスクがない環境や低性能HDDの環境でクエリを高速化するため、メモリをファイルキャッシュとして使用することがサポートされました。[#38811](https://github.com/apache/doris/pull/38811)

### レイクハウス

- 新しいLakesoul カタログが追加されました。
- external catalogの各種メタデータキャッシュの使用状況を確認するための新しいシステムテーブル`catalog_meta_cache_statistics`が追加されました。[#40155](https://github.com/apache/doris/pull/40155)

### Query Optimizer

- `is [not] true/false`式がサポートされました。[#38623](https://github.com/apache/doris/pull/38623)

### Query Execution

- 新しいCRC32関数が追加されました。[#38204](https://github.com/apache/doris/pull/38204)
- 新しい集約関数skewとkurtが追加されました。[#41277](https://github.com/apache/doris/pull/41277)
- Profileがより多くのプロファイルを保持するためにFEのディスクに永続化されるようになりました。[#33690](https://github.com/apache/doris/pull/33690)
- workload groupに関連する権限情報を確認するための新しいシステムテーブル`workload_group_privileges`が追加されました。[#38436](https://github.com/apache/doris/pull/38436)
- workload groupのリソース統計を監視するための新しいシステムテーブル`workload_group_resource_usage`が追加されました。[#39177](https://github.com/apache/doris/pull/39177)
- workload groupでローカルIOとリモートIOの読み取り制限がサポートされました。[#39012](https://github.com/apache/doris/pull/39012)
- workload groupでCPU使用率を制限するためのcgroupv2がサポートされました。[#39374](https://github.com/apache/doris/pull/39374)
- いくつかのテーブル作成属性を確認するための新しいシステムテーブル`information_schema.partitions`が追加されました。[#40636](https://github.com/apache/doris/pull/40636)

### その他

- `SHOW BACKEND CONFIG LIKE ${pattern}`などの`SHOW`文を使用してBEの設定情報を表示することがサポートされました。[#36525](https://github.com/apache/doris/pull/36525)

## 改善

### Load

- KafkaからのEOFが頻発する際のroutine loadのインポート効率が改善されました。[#39975](https://github.com/apache/doris/pull/39975)
- stream loadの結果に、HTTPデータの読み取りにかかった時間である`ReceiveDataTimeMs`が含まれるようになり、ネットワークが原因で遅いstream loadの問題をすばやく判定できます。[#40735](https://github.com/apache/doris/pull/40735)
- inverted indexやmow書き込み中の頻繁なタイムアウトを避けるため、routine loadのタイムアウトロジックが最適化されました。[#40818](https://github.com/apache/doris/pull/40818)

### Storage

- パーティションの一括追加がサポートされました。[#37114](https://github.com/apache/doris/pull/37114)

### Compute-Storage Decoupled

- FDBでのKV分布の統計を容易にするmeta-service HTTPインターフェース`/MetaService/http/show_meta_ranges`が追加されました。[#39208](https://github.com/apache/doris/pull/39208)
- meta-service/recycler停止スクリプトがプロセスの完全終了を確認してから戻るようになりました。[#40218](https://github.com/apache/doris/pull/40218)
- セッション変数`version_comment` (Cloud Mode)を使用して現在のデプロイメントモードをcompute-storage decoupledとして表示することがサポートされました。[#38269](https://github.com/apache/doris/pull/38269)
- トランザクション送信が失敗した際の詳細メッセージが修正されました。[#40584](https://github.com/apache/doris/pull/40584)
- 1つのmeta-serviceプロセスでメタデータサービスとデータリサイクリングサービスの両方を提供することがサポートされました。[#40223](https://github.com/apache/doris/pull/40223)
- 設定されていない場合の潜在的な問題を回避するため、file_cacheのデフォルト設定が最適化されました。[#41421](https://github.com/apache/doris/pull/41421) [#41507](https://github.com/apache/doris/pull/41507)
- 複数のパーティションのバージョンを一括取得することでクエリパフォーマンスが向上しました。[#38949](https://github.com/apache/doris/pull/38949)
- 一時的なネットワーク変動によるクエリパフォーマンスの問題を避けるため、タブレットの再配布が遅延されました。[#40371](https://github.com/apache/doris/pull/40371)
- balanceでの読み書きロックロジックが最適化されました。[#40633](https://github.com/apache/doris/pull/40633)
- 再起動/クラッシュ時のTTLファイル名の処理におけるfile cacheの堅牢性が強化されました。[#40226](https://github.com/apache/doris/pull/40226)
- ディスク上のsegmentファイルのハッシュファイル名の計算を容易にするBE HTTPインターフェース`/api/file_cache?op=hash`が追加されました。[#40831](https://github.com/apache/doris/pull/40831)
- BEグループ（元のcloud cluster）を表すためにcompute groupの使用と互換性があるよう、統一命名が最適化されました。[#40767](https://github.com/apache/doris/pull/40767)
- primary keyテーブルでdelete bitmapを計算する際のロック取得の待機時間が最適化されました。[#40341](https://github.com/apache/doris/pull/40341)
- primary keyテーブルでdelete bitmapが多数ある場合、複数のdelete bitmapの事前マージによりクエリ中の高CPU消費が最適化されました。[#40204](https://github.com/apache/doris/pull/40204)
- compute-storage decoupledモードでSQL文によるFE/BEノードの管理がサポートされ、compute-storage decoupledモードでの展開時にmeta-serviceとの直接対話ロジックが隠されました。[#40264](https://github.com/apache/doris/pull/40264)
- FDBの高速デプロイメント用のスクリプトが追加されました。[#39803](https://github.com/apache/doris/pull/39803)
- 他の`SHOW`文とのカラム名スタイルを統一するため、`SHOW CACHE HOTSPOT`の出力が最適化されました。[#41322](https://github.com/apache/doris/pull/41322)
- storage vaultをストレージバックエンドとして使用する場合、同じテーブルに異なるストレージバックエンドをバインドすることを避けるため、`latest_fs()`の使用が禁止されました。[#40516](https://github.com/apache/doris/pull/40516)
- mowテーブルインポート時のdelete bitmap計算のタイムアウト戦略が最適化されました。[#40562](https://github.com/apache/doris/pull/40562) [#40333](https://github.com/apache/doris/pull/40333)
- be.confのenable_file_cacheがcompute-storage decoupledモードでデフォルトで有効になりました。[#41502](https://github.com/apache/doris/pull/41502)

### レイクハウス

- CSV形式のテーブルを読み取る際に、`\r`記号の読み取り動作を制御するセッション`keep_carriage_return`設定がサポートされました。[#39980](https://github.com/apache/doris/pull/39980)
- BEのJVMのデフォルト最大メモリが2GBに調整されました（新規デプロイメントのみに影響）。[#41403](https://github.com/apache/doris/pull/41403)
- Hive カタログに`hive.recursive_directories_table`と`hive.ignore_absent_partitions`プロパティが追加され、データディレクトリを再帰的にトラバースするかどうか、および存在しないパーティションを無視するかどうかを指定できます。[#39494](https://github.com/apache/doris/pull/39494)
- リフレッシュ中の大量の接続生成を避けるため、カタログリフレッシュロジックが最適化されました。[#39205](https://github.com/apache/doris/pull/39205)
- 外部データソース用の`SHOW CREATE DATABASE`と`SHOW CREATE TABLE`でロケーション情報が表示されるようになりました。[#39179](https://github.com/apache/doris/pull/39179)
- 新しいオプティマイザーが`INSERT INTO`文を使用したJDBC外部テーブルへのデータ挿入をサポートしました。[#41511](https://github.com/apache/doris/pull/41511)
- MaxCompute カタログが複雑なデータ型をサポートしました。[#39259](https://github.com/apache/doris/pull/39259)
- 外部テーブルのデータシャードの読み取りとマージロジックが最適化されました。[#38311](https://github.com/apache/doris/pull/38311)
- 外部テーブルのメタデータキャッシュのリフレッシュ戦略の一部が最適化されました。[#38506](https://github.com/apache/doris/pull/38506)
- Paimonテーブルで`IN/NOT IN`述語のプッシュダウンがサポートされました。[#38390](https://github.com/apache/doris/pull/38390)
- Paimonバージョン0.9で作成されたParquet形式のテーブルとの互換性を追加しました。[#41020](https://github.com/apache/doris/pull/41020)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューの構築でimmediateとstarttimeの両方の使用がサポートされました。[#39573](https://github.com/apache/doris/pull/39573)
- 外部テーブルに基づく非同期マテリアライズドビューは、マテリアライズドビューをリフレッシュする前に外部テーブルのメタデータキャッシュをリフレッシュし、最新の外部テーブルデータに基づく構築を保証します。[#38212](https://github.com/apache/doris/pull/38212)
- パーティション増分構築で週次および四半期単位でのロールアップがサポートされました。[#39286](https://github.com/apache/doris/pull/39286)

### Query Optimizer

- 集約関数`GROUP_CONCAT`で`DISTINCT`と`ORDER BY`の両方の使用がサポートされました。[#38080](https://github.com/apache/doris/pull/38080)
- より効率的で安定した実行プランを生成するため、統計情報の収集と使用、行数推定とコスト計算のロジックが最適化されました。
- Window function partition dataの事前フィルタリングで複数のwindow functionを含むケースがサポートされました。[#38393](https://github.com/apache/doris/pull/38393)

### Query Execution

- prepare pipelineタスクを並列実行することでクエリレイテンシが削減されました。[#40874](https://github.com/apache/doris/pull/40874)
- Profileでカタログ情報が表示されるようになりました。[#38283](https://github.com/apache/doris/pull/38283)
- `IN`フィルタリング条件の計算パフォーマンスが最適化されました。[#40917](https://github.com/apache/doris/pull/40917)
- K8SでDorisのメモリ使用量を制限するためのcgroupv2がサポートされました。[#39256](https://github.com/apache/doris/pull/39256)
- 文字列からdatetime型への変換パフォーマンスが最適化されました。[#38385](https://github.com/apache/doris/pull/38385)
- `string`が10進数である場合の`int`へのキャストがサポートされ、MySQLの特定の動作との互換性が向上しました。[#38847](https://github.com/apache/doris/pull/38847)

### 半構造化データ管理

- inverted indexマッチングのパフォーマンスが最適化されました。[#41122](https://github.com/apache/doris/pull/41122)
- 配列上でのトークン化を伴うinverted indexの作成が一時的に禁止されました。[#39062](https://github.com/apache/doris/pull/39062)
- `explode_json_array`でバイナリJSON型がサポートされました。[#37278](https://github.com/apache/doris/pull/37278)
- IPデータ型でbloomfilterインデックスがサポートされました。[#39253](https://github.com/apache/doris/pull/39253)
- IPデータ型で行ストレージがサポートされました。[#39258](https://github.com/apache/doris/pull/39258)
- ARRAY、MAP、STRUCTなどのネストされたデータ型でスキーマ変更がサポートされました。[#39210](https://github.com/apache/doris/pull/39210)
- MTMV作成時にVARIANTデータ型で遭遇するKEYの自動切り詰めが行われるようになりました。[#39988](https://github.com/apache/doris/pull/39988)
- パフォーマンス向上のためクエリ中のinverted indexの遅延ロードがサポートされました。[#38979](https://github.com/apache/doris/pull/38979)
- `add inverted index file size for open file`。[#37482](https://github.com/apache/doris/pull/37482)
- パフォーマンス向上のためcompaction中のオブジェクトストレージインターフェースへのアクセスが削減されました。[#41079](https://github.com/apache/doris/pull/41079)
- inverted indexに関連する3つの新しいクエリprofileメトリクスが追加されました。[#36696](https://github.com/apache/doris/pull/36696)
- パフォーマンス向上のため非PreparedStatement SQLのキャッシュオーバーヘッドが削減されました。[#40910](https://github.com/apache/doris/pull/40910)
- プリウォーミングキャッシュでinverted indexがサポートされました。[#38986](https://github.com/apache/doris/pull/38986)
- inverted indexが書き込み後すぐにキャッシュされるようになりました。[#39076](https://github.com/apache/doris/pull/39076)

### 互換性

- マスターとbranch-2.1のThrift ID非互換性の問題が修正されました。[#41057](https://github.com/apache/doris/pull/41057)

### その他

- BE HTTP APIで認証がサポートされました。認証が必要な場合はconfig::enable_all_http_authをtrue（デフォルトはfalse）に設定してください。[#39577](https://github.com/apache/doris/pull/39577)
- REFRESH操作に必要なユーザー権限が最適化されました。権限がALTERからSHOWに緩和されました。[#39008](https://github.com/apache/doris/pull/39008)
- advanceNextId()呼び出し時のnextIdの範囲が削減されました。[#40160](https://github.com/apache/doris/pull/40160)
- Java UDFのキャッシュメカニズムが最適化されました。[#40404](https://github.com/apache/doris/pull/40404)

## バグ修正

### Load

- `abortTransaction`がリターンコードを処理しない問題が修正されました。[#41275](https://github.com/apache/doris/pull/41275)
- compute-storage decoupledモードでトランザクションのコミットまたは中断が失敗し、`afterCommit/afterAbort`が呼ばれない問題が修正されました。[#41267](https://github.com/apache/doris/pull/41267)
- compute-storage decoupledモードでconsumerオフセットを変更した際にRoutine Loadが正常に動作しない問題が修正されました。[#39159](https://github.com/apache/doris/pull/39159)
- エラーログファイルパスを取得する際のファイルハンドルの重複クローズ問題が修正されました。[#41320](https://github.com/apache/doris/pull/41320)
- compute-storage decoupledモードでのRoutine Loadの不正なジョブ進行状況キャッシュの問題が修正されました。[#39313](https://github.com/apache/doris/pull/39313)
- compute-storage decoupledモードでトランザクションのコミットに失敗した際にRoutine Loadがスタックする問題が修正されました。[#40539](https://github.com/apache/doris/pull/40539)
- compute-storage decoupledモードでRoutine Loadがデータ品質チェックエラーを継続的に報告する問題が修正されました。[#39790](https://github.com/apache/doris/pull/39790)
- compute-storage decoupledモードでRoutine Loadがコミット前にトランザクションをチェックしない問題が修正されました。[#39775](https://github.com/apache/doris/pull/39775)
- compute-storage decoupledモードでRoutine Loadが中断前にトランザクションをチェックしない問題が修正されました。[#40463](https://github.com/apache/doris/pull/40463)
- cluster keyが特定のデータ型をサポートしない問題が修正されました。[#38966](https://github.com/apache/doris/pull/38966)
- トランザクションの重複コミット問題が修正されました。[#39786](https://github.com/apache/doris/pull/39786)
- BE終了時のWALのuse after free問題が修正されました。[#33131](https://github.com/apache/doris/pull/33131)
- compute-storage decoupledモードでWAL再生が完了したインポートトランザクションをスキップしない問題が修正されました。[#41262](https://github.com/apache/doris/pull/41262)
- compute-storage decoupledモードでgroup commitのBE選択ロジックが修正されました。[#39986](https://github.com/apache/doris/pull/39986) [#38644](https://github.com/apache/doris/pull/38644)
- insert intoでgroup commitが有効な場合にBEがクラッシュする可能性がある問題が修正されました。[#39339](https://github.com/apache/doris/pull/39339)
- group commitが有効なinsert intoがスタックする可能性がある問題が修正されました。[#39391](https://github.com/apache/doris/pull/39391)
- インポート時にgroup commitオプションを有効にしないとテーブルが見つからないエラーが発生する可能性がある問題が修正されました。[#39731](https://github.com/apache/doris/pull/39731)
- タブレット数が多すぎることによるトランザクション送信タイムアウトの問題が修正されました。[#40031](https://github.com/apache/doris/pull/40031)
- Auto パーティションでの同時オープンの問題が修正されました。[#38605](https://github.com/apache/doris/pull/38605)
- インポートロック粒度が大きすぎる問題が修正されました。[#40134](https://github.com/apache/doris/pull/40134)
- 長さゼロのvarcharによるcoredumpの問題が修正されました。[#40940](https://github.com/apache/doris/pull/40940)
- ログ印刷での不正なindex Id値の問題が修正されました。[#38790](https://github.com/apache/doris/pull/38790)
- memtable shiftingでBRPCストリーミングがクローズされない問題が修正されました。[#40105](https://github.com/apache/doris/pull/40105)
- memtable shifting時の不正確なbvar統計の問題が修正されました。[#39075](https://github.com/apache/doris/pull/39075)
- memtable shifting時の複数レプリケーション障害許容の問題が修正されました。[#38003](https://github.com/apache/doris/pull/38003)
- 1つのストリームで複数テーブルのRoutine Loadでの不正なメッセージ長計算の問題が修正されました。[#40367](https://github.com/apache/doris/pull/40367)
- Broker Loadの不正確な進行状況レポートの問題が修正されました。[#40325](https://github.com/apache/doris/pull/40325)
- Broker Loadの不正確なデータスキャンボリュームレポートの問題が修正されました。[#40694](https://github.com/apache/doris/pull/40694)
- compute-storage decoupledモードでのRoutine Loadの同時実行問題が修正されました。[#39242](https://github.com/apache/doris/pull/39242)
- compute-storage decoupledモードでRoutine Loadジョブがキャンセルされる問題が修正されました。[#39514](https://github.com/apache/doris/pull/39514)
- Kafkaトピック削除時の進行状況がリセットされない問題が修正されました。[#38474](https://github.com/apache/doris/pull/38474)
- Routine Loadでトランザクション状態遷移時の進行状況更新問題が修正されました。[#39311](https://github.com/apache/doris/pull/39311)
- Routine Loadが一時停止状態から一時停止状態に切り替わる問題が修正されました。[#40728](https://github.com/apache/doris/pull/40728)
- データベース削除によるStream Loadレコードの欠落問題が修正されました。[#39360](https://github.com/apache/doris/pull/39360)

### Storage

- storage policyが見つからない問題が修正されました。[#38700](https://github.com/apache/doris/pull/38700)
- クロスバージョンバックアップおよびリカバリ時のエラー問題が修正されました。[#38370](https://github.com/apache/doris/pull/38370)
- ccr binlogのNPE問題が修正されました。[#39909](https://github.com/apache/doris/pull/39909)
- mowでの重複キーの潜在的問題が修正されました。[#41309](https://github.com/apache/doris/pull/41309) [#39791](https://github.com/apache/doris/pull/39791) [#39958](https://github.com/apache/doris/pull/39958) [#38369](https://github.com/apache/doris/pull/38369) [#38331](https://github.com/apache/doris/pull/38331)
- 高頻度書き込みシナリオでバックアップとリカバリ後に書き込みできない問題が修正されました。[#40118](https://github.com/apache/doris/pull/40118) [#38321](https://github.com/apache/doris/pull/38321)
- 空文字列削除とスキーマ変更によるデータエラーの可能性が修正されました。[#41064](https://
