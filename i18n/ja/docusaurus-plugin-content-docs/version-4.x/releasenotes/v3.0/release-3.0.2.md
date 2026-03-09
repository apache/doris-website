---
{
  "title": "リリース 3.0.2",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.2バージョンが2024年10月15日に正式リリースされました。"
}
---
コミュニティの皆様、Apache Doris 3.0.2バージョンが2024年10月15日に正式リリースされました。このバージョンでは、コンピューティング・ストレージ分離、データストレージ、lakehouse、クエリオプティマイザー、クエリ実行などの分野でアップデートと改善が行われています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHubリリース:** https://github.com/apache/doris/releases

## 動作変更

### Storage

- FEメモリオーバーフローを防ぐため、単一バックアップタスクのタブレット数を制限しました。[#40518](https://github.com/apache/doris/pull/40518)  
- `SHOW PARTITIONS`コマンドがパーティションの`CommittedVersion`を表示するようになりました。[#28274](https://github.com/apache/doris/pull/28274)  

### Other

- `fe.log`のデフォルトの印刷モード（非同期）にファイル行番号情報が含まれるようになりました。行番号出力によるパフォーマンス問題が発生する場合は、BRIEFモードに切り替えてください。[#39419](https://github.com/apache/doris/pull/39419)  
- セッション変数`ENABLE_PREPARED_STMT_AUDIT_LOG`のデフォルト値が`true`から`false`に変更され、prepare文の監査ログが出力されなくなりました。[#38865](https://github.com/apache/doris/pull/38865)  
- セッション変数`max_allowed_packet`のデフォルト値がMySQL 8.4に合わせて1MBから16MBに調整されました。[#38697](https://github.com/apache/doris/pull/38697)  
- FEとBEのJVMがデフォルトでUTF-8文字セットを使用するようになりました。[#39521](https://github.com/apache/doris/pull/39521)  

## 新機能

### Storage

- バックアップとリカバリで、バックアップに含まれないテーブルやパーティションのクリアがサポートされました。[#39028](https://github.com/apache/doris/pull/39028)  

### Compute-Storage Decoupled

- 複数のタブレットでの期限切れデータの並列回収をサポートしました。[#37630](https://github.com/apache/doris/pull/37630)  
- `ALTER`文によるstorage vaultの変更をサポートしました。[#38685](https://github.com/apache/doris/pull/38685)  [#37606](https://github.com/apache/doris/pull/37606)  
- 単一トランザクションでの大量のタブレット（5000+）のインポートをサポートしました（実験的機能）。[#38243](https://github.com/apache/doris/pull/38243)  
- ノード再起動などの原因によるペンディングトランザクションの自動中止をサポートし、ペンディングトランザクションがdecommissionやスキーマ変更をブロックする問題を解決しました。[#37669](https://github.com/apache/doris/pull/37669)  
- クエリ時のsegment cacheの使用を制御する新しいセッション変数`enable_segment_cache`が追加されました（デフォルト値は`true`）。[#37141](https://github.com/apache/doris/pull/37141)  
- コンピューティング・ストレージ分離モードでのスキーマ変更中に大量データをインポートできない問題を解決しました。[#39558](https://github.com/apache/doris/pull/39558)  
- コンピューティング・ストレージ分離モードでのFEの複数followerロールの追加をサポートしました。[#38388](https://github.com/apache/doris/pull/38388)  
- ディスクがない環境や低性能HDDの環境でクエリを高速化するため、メモリをfile cacheとして使用することをサポートしました。[#38811](https://github.com/apache/doris/pull/38811)  

### Lakehouse

- 新しいLakesoul Catalogが追加されました。
- 外部catalogの各種メタデータキャッシュの使用状況を確認するための新しいシステムテーブル`catalog_meta_cache_statistics`が追加されました。[#40155](https://github.com/apache/doris/pull/40155)  

### Query Optimizer

- `is [not] true/false`式をサポートしました。[#38623](https://github.com/apache/doris/pull/38623)  

### Query Execution

- 新しいCRC32関数が追加されました。[#38204](https://github.com/apache/doris/pull/38204)  
- 新しい集約関数skewとkurtが追加されました。[#41277](https://github.com/apache/doris/pull/41277)  
- ProfileがFEのディスクに永続化され、より多くのプロファイルが保持されるようになりました。[#33690](https://github.com/apache/doris/pull/33690)  
- workload groupに関連する権限情報を表示する新しいシステムテーブル`workload_group_privileges`が追加されました。[#38436](https://github.com/apache/doris/pull/38436)  
- workload groupのリソース統計を監視する新しいシステムテーブル`workload_group_resource_usage`が追加されました。[#39177](https://github.com/apache/doris/pull/39177)  
- workload groupがlocal IOとremote IOの読み取り制限をサポートするようになりました。[#39012](https://github.com/apache/doris/pull/39012)  
- workload groupがcgroupv2によるCPU使用量制限をサポートするようになりました。[#39374](https://github.com/apache/doris/pull/39374)  
- 一部のテーブル作成属性を表示する新しいシステムテーブル`information_schema.partitions`が追加されました。[#40636](https://github.com/apache/doris/pull/40636)  

### Other

- `SHOW BACKEND CONFIG LIKE ${pattern}`などの`SHOW`文を使用してBEの設定情報を表示することをサポートしました。[#36525](https://github.com/apache/doris/pull/36525)  

## 改善

### Load

- KafkaからのEOFが頻発する際のroutine loadのインポート効率を改善しました。[#39975](https://github.com/apache/doris/pull/39975)  
- stream loadの結果にHTTPデータの読み取り時間`ReceiveDataTimeMs`が含まれるようになり、ネットワーク要因による低速stream loadの問題を素早く判断できます。[#40735](https://github.com/apache/doris/pull/40735)  
- inverted indexとmow書き込み中の頻繁なタイムアウトを回避するため、routine loadのタイムアウトロジックを最適化しました。[#40818](https://github.com/apache/doris/pull/40818)  

### Storage

- パーティションの一括追加をサポートしました。[#37114](https://github.com/apache/doris/pull/37114)  

### Compute-Storage Decoupled

- FDBのKV分散統計を容易にするため、meta-service HTTP インターフェース`/MetaService/http/show_meta_ranges`が追加されました。[#39208](https://github.com/apache/doris/pull/39208)  
- meta-service/recyclerの停止スクリプトが、プロセスが完全に終了してから戻るようになりました。[#40218](https://github.com/apache/doris/pull/40218)  
- セッション変数`version_comment`（Cloud Mode）を使用して現在のデプロイメントモードをコンピューティング・ストレージ分離として表示することをサポートしました。[#38269](https://github.com/apache/doris/pull/38269)  
- トランザクション送信失敗時に返される詳細メッセージが修正されました。[#40584](https://github.com/apache/doris/pull/40584)  
- 1つのmeta-serviceプロセスでメタデータサービスとデータリサイクルサービスの両方を提供することをサポートしました。[#40223](https://github.com/apache/doris/pull/40223)  
- 未設定時の潜在的問題を回避するため、file_cacheのデフォルト設定が最適化されました。[#41421](https://github.com/apache/doris/pull/41421)  [#41507](https://github.com/apache/doris/pull/41507)  
- 複数パーティションのバージョンをバッチ取得することでクエリ性能を向上させました。[#38949](https://github.com/apache/doris/pull/38949)  
- 一時的なネットワーク変動によるクエリ性能問題を回避するため、タブレットの再配分を遅延させました。[#40371](https://github.com/apache/doris/pull/40371)  
- balanceの読み書きロックロジックが最適化されました。[#40633](https://github.com/apache/doris/pull/40633)  
- 再起動/クラッシュ時のTTLファイル名処理におけるfile cacheの堅牢性が強化されました。[#40226](https://github.com/apache/doris/pull/40226)  
- ディスク上のsegmentファイルのハッシュファイル名計算を容易にするため、BE HTTP インターフェース`/api/file_cache?op=hash`が追加されました。[#40831](https://github.com/apache/doris/pull/40831)  
- BEグループ（元のcloud cluster）を表すcompute groupの使用と互換性があるよう、統一命名が最適化されました。[#40767](https://github.com/apache/doris/pull/40767)  
- プライマリキーテーブルでのdelete bitmap計算時のロック取得待機時間が最適化されました。[#40341](https://github.com/apache/doris/pull/40341)
- プライマリキーテーブルにdelete bitmapが多数ある場合、複数のdelete bitmapを事前マージしてクエリ時の高CPU消費を最適化しました。[#40204](https://github.com/apache/doris/pull/40204)  
- SQL文によるコンピューティング・ストレージ分離モードでのFE/BEノード管理をサポートし、コンピューティング・ストレージ分離モードでのデプロイ時にmeta-serviceとの直接やり取りのロジックを隠蔽しました。[#40264](https://github.com/apache/doris/pull/40264)  
- FDBの迅速デプロイメント用スクリプトが追加されました。[#39803](https://github.com/apache/doris/pull/39803)  
- `SHOW CACHE HOTSPOT`の出力が他の`SHOW`文と統一された列名スタイルになるよう最適化されました。[#41322](https://github.com/apache/doris/pull/41322)  
- storage vaultをストレージバックエンドとして使用する際、異なるストレージバックエンドを同じテーブルにバインドするのを避けるため`latest_fs()`の使用を禁止しました。[#40516](https://github.com/apache/doris/pull/40516)  
- mowテーブルのインポート時のdelete bitmap計算のタイムアウト戦略が最適化されました。[#40562](https://github.com/apache/doris/pull/40562)  [#40333](https://github.com/apache/doris/pull/40333)  
- be.confのenable_file_cacheがコンピューティング・ストレージ分離モードでデフォルトで有効になりました。[#41502](https://github.com/apache/doris/pull/41502)  

### Lakehouse

- CSV形式のテーブル読み取り時、`\r`記号の読み取り動作を制御するセッション設定`keep_carriage_return`をサポートしました。[#39980](https://github.com/apache/doris/pull/39980)  
- BEのJVMのデフォルト最大メモリが2GBに調整されました（新規デプロイメントのみ影響）。[#41403](https://github.com/apache/doris/pull/41403)  
- Hive Catalogに`hive.recursive_directories_table`と`hive.ignore_absent_partitions`プロパティが追加され、データディレクトリの再帰的走査の可否と欠落パーティションの無視可否を指定できます。[#39494](https://github.com/apache/doris/pull/39494)  
- リフレッシュ時に大量の接続が生成されないよう、Catalogリフレッシュロジックが最適化されました。[#39205](https://github.com/apache/doris/pull/39205)  
- 外部データソースの`SHOW CREATE DATABASE`と`SHOW CREATE TABLE`でlocation情報が表示されるようになりました。[#39179](https://github.com/apache/doris/pull/39179)  
- 新しいオプティマイザーが`INSERT INTO`文を使用したJDBC外部テーブルへのデータ挿入をサポートしました。[#41511](https://github.com/apache/doris/pull/41511)  
- MaxCompute Catalogで複合データ型がサポートされました。[#39259](https://github.com/apache/doris/pull/39259)  
- 外部テーブルのデータシャード読み取りとマージのロジックが最適化されました。[#38311](https://github.com/apache/doris/pull/38311)  
- 外部テーブルのメタデータキャッシュのリフレッシュ戦略が最適化されました。[#38506](https://github.com/apache/doris/pull/38506)  
- PaimonテーブルでIN/NOT IN述語のプッシュダウンがサポートされました。[#38390](https://github.com/apache/doris/pull/38390)  
- Paimonバージョン0.9でParquet形式で作成されたテーブルと互換性があります。[#41020](https://github.com/apache/doris/pull/41020)  

### Asynchronous Materialized Views

- 非同期マテリアライズドビューの構築でimmediateとstarttimeの両方の使用がサポートされました。[#39573](https://github.com/apache/doris/pull/39573)  
- 外部テーブルベースの非同期マテリアライズドビューは、マテリアライズドビューをリフレッシュする前に外部テーブルのメタデータキャッシュをリフレッシュし、最新の外部テーブルデータに基づく構築を保証します。[#38212](https://github.com/apache/doris/pull/38212)  
- パーティション増分構築で週次および四半期粒度でのロールアップがサポートされました。[#39286](https://github.com/apache/doris/pull/39286)  

### Query Optimizer

- 集約関数`GROUP_CONCAT`で`DISTINCT`と`ORDER BY`の両方の使用がサポートされました。[#38080](https://github.com/apache/doris/pull/38080)  
- 統計情報の収集と使用、行数推定とコスト計算のロジックが最適化され、より効率的で安定した実行プランが生成されます。
- ウィンドウ関数パーティションデータの事前フィルタリングで複数のウィンドウ関数を含むケースがサポートされました。[#38393](https://github.com/apache/doris/pull/38393)  

### Query Execution

- prepareパイプラインタスクの並列実行によりクエリ遅延が削減されました。[#40874](https://github.com/apache/doris/pull/40874)  
- ProfileにCatalog情報が表示されます。[#38283](https://github.com/apache/doris/pull/38283)  
- `IN`フィルタリング条件の計算性能が最適化されました。[#40917](https://github.com/apache/doris/pull/40917)  
- K8SでDorisのメモリ使用量を制限するcgroupv2がサポートされました。[#39256](https://github.com/apache/doris/pull/39256)  
- 文字列からdatetime型への変換性能が最適化されました。[#38385](https://github.com/apache/doris/pull/38385)  
- `string`が小数の場合の`int`へのキャストがサポートされ、MySQLの特定の動作とより互換性があります。[#38847](https://github.com/apache/doris/pull/38847)  

### Semi-Structured Data Management

- inverted indexマッチングの性能が最適化されました。[#41122](https://github.com/apache/doris/pull/41122)  
- 配列でのトークン化によるinverted indexの作成を一時的に禁止しました。[#39062](https://github.com/apache/doris/pull/39062)  
- `explode_json_array`でバイナリJSON型がサポートされました。[#37278](https://github.com/apache/doris/pull/37278)  
- IPデータ型でbloomfilterインデックスがサポートされました。[#39253](https://github.com/apache/doris/pull/39253)  
- IPデータ型で行ストレージがサポートされました。[#39258](https://github.com/apache/doris/pull/39258)  
- ARRAY、MAP、STRUCTなどのネストしたデータ型でスキーマ変更がサポートされました。[#39210](https://github.com/apache/doris/pull/39210)  
- MTMV作成時、VARIANT データ型で遭遇したKEYsを自動的に切り捨てます。[#39988](https://github.com/apache/doris/pull/39988)  
- クエリ時のinverted indexの遅延ロードによりパフォーマンスが向上しました。[#38979](https://github.com/apache/doris/pull/38979)  
- `add inverted index file size for open file`。[#37482](https://github.com/apache/doris/pull/37482)  
- compaction中のオブジェクトストレージインターフェースへのアクセスを削減し、パフォーマンスが向上しました。[#41079](https://github.com/apache/doris/pull/41079)  
- inverted indexに関連する3つの新しいクエリプロファイルメトリクスが追加されました。[#36696](https://github.com/apache/doris/pull/36696)  
- 非PreparedStatement SQLのキャッシュオーバーヘッドを削減し、パフォーマンスが向上しました。[#40910](https://github.com/apache/doris/pull/40910)  
- プレウォーミングキャッシュでinverted indexがサポートされました。[#38986](https://github.com/apache/doris/pull/38986)  
- inverted indexが書き込み後すぐにキャッシュされるようになりました。[#39076](https://github.com/apache/doris/pull/39076)  

### Compatibility

- masterのbranch-2.1とのThrift ID非互換性の問題が修正されました。[#41057](https://github.com/apache/doris/pull/41057)  

### Other

- BE HTTP APIで認証がサポートされました。認証が必要な場合はconfig::enable_all_http_authをtrue（デフォルトはfalse）に設定してください。[#39577](https://github.com/apache/doris/pull/39577)  
- REFRESH操作に必要なユーザー権限が最適化されました。権限がALTERからSHOWに緩和されました。[#39008](https://github.com/apache/doris/pull/39008)  
- advanceNextId()呼び出し時のnextIdの範囲が削減されました。[#40160](https://github.com/apache/doris/pull/40160)  
- Java UDFのキャッシュメカニズムが最適化されました。[#40404](https://github.com/apache/doris/pull/40404)  

## バグ修正

### Load

- `abortTransaction`がリターンコードを処理しない問題を修正しました。[#41275](https://github.com/apache/doris/pull/41275)  
- コンピューティング・ストレージ分離モードでトランザクションのコミットまたはアボート時に`afterCommit/afterAbort`を呼び出さない問題を修正しました。[#41267](https://github.com/apache/doris/pull/41267)  
- コンピューティング・ストレージ分離モードでコンシューマーオフセット変更時にRoutine Loadが正常に動作しない問題を修正しました。[#39159](https://github.com/apache/doris/pull/39159)  
- エラーログファイルパス取得時のファイルハンドルの重複クローズ問題を修正しました。[#41320](https://github.com/apache/doris/pull/41320)  
- コンピューティング・ストレージ分離モードでRoutine Loadのジョブ進行状況キャッシュが不正確な問題を修正しました。[#39313](https://github.com/apache/doris/pull/39313)  
- コンピューティング・ストレージ分離モードでトランザクションコミット失敗時にRoutine Loadがスタックする問題を修正しました。[#40539](https://github.com/apache/doris/pull/40539)  
- コンピューティング・ストレージ分離モードでRoutine Loadがデータ品質チェックエラーを継続して報告する問題を修正しました。[#39790](https://github.com/apache/doris/pull/39790)  
- コンピューティング・ストレージ分離モードでRoutine Loadがコミット前にトランザクションをチェックしない問題を修正しました。[#39775](https://github.com/apache/doris/pull/39775)  
- コンピューティング・ストレージ分離モードでRoutine Loadがアボート前にトランザクションをチェックしない問題を修正しました。[#40463](https://github.com/apache/doris/pull/40463)  
- cluster keyが特定のデータ型をサポートしない問題を修正しました。[#38966](https://github.com/apache/doris/pull/38966)  
- トランザクションが重複してコミットされる問題を修正しました。[#39786](https://github.com/apache/doris/pull/39786)  
- BE終了時のWALでのuse after freeの問題を修正しました。[#33131](https://github.com/apache/doris/pull/33131)  
- コンピューティング・ストレージ分離モードでWAL再生が完了したインポートトランザクションをスキップしない問題を修正しました。[#41262](https://github.com/apache/doris/pull/41262)  
- コンピューティング・ストレージ分離モードでgroup commitのBE選択ロジックを修正しました。[#39986](https://github.com/apache/doris/pull/39986)  [#38644](https://github.com/apache/doris/pull/38644)  
- insert intoでgroup commit有効時にBEがクラッシュする可能性がある問題を修正しました。[#39339](https://github.com/apache/doris/pull/39339)  
- group commit有効なinsert intoがスタックする可能性がある問題を修正しました。[#39391](https://github.com/apache/doris/pull/39391)  
- インポート時にgroup commitオプションを有効にしないとテーブルが見つからないエラーが発生する可能性がある問題を修正しました。[#39731](https://github.com/apache/doris/pull/39731)  
- タブレット数が多すぎることによるトランザクション送信タイムアウトの問題を修正しました。[#40031](https://github.com/apache/doris/pull/40031)  
- Auto Partitionでの並行オープンの問題を修正しました。[#38605](https://github.com/apache/doris/pull/38605)  
- インポートロック粒度が大きすぎる問題を修正しました。[#40134](https://github.com/apache/doris/pull/40134)  
- 長さ0のvarcharによるcoredumpの問題を修正しました。[#40940](https://github.com/apache/doris/pull/40940)  
- ログ出力でのindex Id値が不正確な問題を修正しました。[#38790](https://github.com/apache/doris/pull/38790)  
- memtableシフト時にBRPC streamingを閉じない問題を修正しました。[#40105](https://github.com/apache/doris/pull/40105)  
- memtableシフト中のbvar統計が不正確な問題を修正しました。[#39075](https://github.com/apache/doris/pull/39075)  
- memtableシフト中の多重レプリケーション障害許容の問題を修正しました。[#38003](https://github.com/apache/doris/pull/38003)  
- Routine Loadで1つのストリームに複数テーブルがある場合のメッセージ長計算が不正確な問題を修正しました。[#40367](https://github.com/apache/doris/pull/40367)  
- Broker Loadの進行状況報告が不正確な問題を修正しました。[#40325](https://github.com/apache/doris/pull/40325)  
- Broker Loadのデータスキャンボリューム報告が不正確な問題を修正しました。[#40694](https://github.com/apache/doris/pull/40694)  
- コンピューティング・ストレージ分離モードでのRoutine Loadの並行性問題を修正しました。[#39242](https://github.com/apache/doris/pull/39242)  
- コンピューティング・ストレージ分離モードでRoutine Loadジョブがキャンセルされる問題を修正しました。[#39514](https://github.com/apache/doris/pull/39514)  
- Kafkaトピック削除時に進行状況がリセットされない問題を修正しました。[#38474](https://github.com/apache/doris/pull/38474)  
- Routine Loadでのトランザクション状態遷移中の進行状況更新問題を修正しました。[#39311](https://github.com/apache/doris/pull/39311)  
- Routine Loadが一時停止状態から一時停止状態に切り替わる問題を修正しました。[#40728](https://github.com/apache/doris/pull/40728)  
- データベース削除によりStream Loadレコードが欠落する問題を修正しました。[#39360](https://github.com/apache/doris/pull/39360)  

### Storage

- storage policyが欠落する問題を修正しました。[#38700](https://github.com/apache/doris/pull/38700)  
- クロスバージョンバックアップ・リカバリ中のエラー問題を修正しました。[#38370](https://github.com/apache/doris/pull/38370)  
- ccr binlogのNPE問題を修正しました。[#39909](https://github.com/apache/doris/pull/39909)  
- mowでのキー重複の潜在的問題を修正しました。[#41309](https://github.com/apache/doris/pull/41309)  [#39791](https://github.com/apache/doris/pull/39791)  [#39958](https://github.com/apache
