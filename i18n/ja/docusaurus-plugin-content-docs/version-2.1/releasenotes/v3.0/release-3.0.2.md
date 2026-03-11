---
{
  "title": "リリース 3.0.2",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.2バージョンが2024年10月15日に正式にリリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.2 バージョンが2024年10月15日に正式リリースされました。このバージョンでは、コンピュート・ストレージ分離、データストレージ、レイクハウス、クエリオプティマイザ、クエリ実行などの更新と改善が含まれています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub リリース:** https://github.com/apache/doris/releases

## 動作変更

### Storage

- FEメモリオーバーフローを防ぐため、単一のバックアップタスクにおけるタブレット数を制限しました。[#40518](https://github.com/apache/doris/pull/40518)  
- `SHOW PARTITIONS`コマンドでパーティションの`CommittedVersion`が表示されるようになりました。[#28274](https://github.com/apache/doris/pull/28274)  

### その他

- `fe.log`のデフォルト印刷モード（非同期）にファイル行番号情報が含まれるようになりました。行番号出力によってパフォーマンスの問題が発生する場合は、BRIEFモードに切り替えてください。[#39419](https://github.com/apache/doris/pull/39419)  
- セッション変数`ENABLE_PREPARED_STMT_AUDIT_LOG`のデフォルト値が`true`から`false`に変更され、prepare文の監査ログは出力されなくなりました。[#38865](https://github.com/apache/doris/pull/38865)  
- セッション変数`max_allowed_packet`のデフォルト値がMySQL 8.4に合わせて1MBから16MBに調整されました。[#38697](https://github.com/apache/doris/pull/38697)  
- FEとBEのJVMは、デフォルトでUTF-8文字セットを使用するようになりました。[#39521](https://github.com/apache/doris/pull/39521)  

## 新機能

### Storage

- バックアップとリカバリで、バックアップに含まれていないテーブルやパーティションをクリアすることがサポートされました。[#39028](https://github.com/apache/doris/pull/39028)  

### コンピュート・ストレージ分離

- 複数タブレットの期限切れデータの並列リサイクルがサポートされました。[#37630](https://github.com/apache/doris/pull/37630)  
- `ALTER`文を通じたstorage vaultの変更がサポートされました。[#38685](https://github.com/apache/doris/pull/38685)  [#37606](https://github.com/apache/doris/pull/37606)  
- 単一トランザクションで大量のタブレット（5000+）のインポートがサポートされました（実験的機能）。[#38243](https://github.com/apache/doris/pull/38243)  
- ノード再起動などの理由で生じたpendingトランザクションの自動中止がサポートされ、pendingトランザクションがdecommissionやschema changeをブロックする問題が解決されました。[#37669](https://github.com/apache/doris/pull/37669)  
- クエリ時にsegment cacheを使用するかを制御する新しいセッション変数`enable_segment_cache`が追加されました（デフォルトは`true`）。[#37141](https://github.com/apache/doris/pull/37141)  
- コンピュート・ストレージ分離モードでのschema change中に大量データをインポートできない問題が解決されました。[#39558](https://github.com/apache/doris/pull/39558)  
- コンピュート・ストレージ分離モードで複数のFEのfollowerロールの追加がサポートされました。[#38388](https://github.com/apache/doris/pull/38388)  
- ディスクなしまたは低性能HDDの環境でクエリを高速化するため、メモリをfile cacheとして使用することがサポートされました。[#38811](https://github.com/apache/doris/pull/38811)  

### レイクハウス

- 新しいLakesoul カタログが追加されました。
- 外部catalogの各種メタデータキャッシュの使用状況を確認する新しいシステムテーブル`catalog_meta_cache_statistics`が追加されました。[#40155](https://github.com/apache/doris/pull/40155)  

### Query Optimizer

- `is [not] true/false`式がサポートされました。[#38623](https://github.com/apache/doris/pull/38623)  

### Query Execution

- 新しいCRC32関数が追加されました。[#38204](https://github.com/apache/doris/pull/38204)  
- 新しい集約関数skewとkurtが追加されました。[#41277](https://github.com/apache/doris/pull/41277)  
- より多くのProfileを保持するため、ProfileがFEのディスクに永続化されるようになりました。[#33690](https://github.com/apache/doris/pull/33690)  
- workloadグループ関連の権限情報を確認する新しいシステムテーブル`workload_group_privileges`が追加されました。[#38436](https://github.com/apache/doris/pull/38436)  
- workloadグループのリソース統計を監視する新しいシステムテーブル`workload_group_resource_usage`が追加されました。[#39177](https://github.com/apache/doris/pull/39177)  
- workloadグループでローカルIOとリモートIOの読み取り制限がサポートされました。[#39012](https://github.com/apache/doris/pull/39012)  
- workloadグループでCPU使用量を制限するためのcgroupv2がサポートされました。[#39374](https://github.com/apache/doris/pull/39374)  
- 一部のテーブル作成属性を確認する新しいシステムテーブル`information_schema.partitions`が追加されました。[#40636](https://github.com/apache/doris/pull/40636)  

### その他

- `SHOW BACKEND CONFIG LIKE ${pattern}`など、`SHOW`文を使用してBEの設定情報を表示することがサポートされました。[#36525](https://github.com/apache/doris/pull/36525)  

## 改善

### Load

- KafkaからのEOF頻発時のroutine loadのインポート効率が改善されました。[#39975](https://github.com/apache/doris/pull/39975)  
- stream load結果にHTTPデータ読み取り時間`ReceiveDataTimeMs`が含まれるようになり、ネットワーク要因によるstream loadの遅延問題を迅速に判定できます。[#40735](https://github.com/apache/doris/pull/40735)  
- 転置インデックスとmow書き込み中の頻繁なタイムアウトを回避するため、routine loadのタイムアウトロジックが最適化されました。[#40818](https://github.com/apache/doris/pull/40818)  

### Storage

- パーティションのバッチ追加がサポートされました。[#37114](https://github.com/apache/doris/pull/37114)  

### コンピュート・ストレージ分離

- FDBでのKV分散統計を容易にするため、meta-service HTTPインターフェース`/MetaService/http/show_meta_ranges`が追加されました。[#39208](https://github.com/apache/doris/pull/39208)  
- meta-service/recycler停止スクリプトで、プロセスが完全に終了してから戻ることが保証されます。[#40218](https://github.com/apache/doris/pull/40218)  
- セッション変数`version_comment`（Cloud Mode）を使用して現在のデプロイメントモードをコンピュート・ストレージ分離として表示することがサポートされました。[#38269](https://github.com/apache/doris/pull/38269)  
- トランザクション送信失敗時に返される詳細メッセージが修正されました。[#40584](https://github.com/apache/doris/pull/40584)  
- 1つのmeta-serviceプロセスでメタデータサービスとデータリサイクルサービスの両方を提供することがサポートされました。[#40223](https://github.com/apache/doris/pull/40223)  
- 設定されていない場合の潜在的な問題を回避するため、file_cacheのデフォルト設定が最適化されました。[#41421](https://github.com/apache/doris/pull/41421)  [#41507](https://github.com/apache/doris/pull/41507)  
- 複数パーティションのバージョンをバッチ取得することでクエリパフォーマンスが改善されました。[#38949](https://github.com/apache/doris/pull/38949)  
- 一時的なネットワーク変動によるクエリパフォーマンス問題を回避するため、タブレットの再分散が遅延されました。[#40371](https://github.com/apache/doris/pull/40371)  
- バランスでの読み書きロックロジックが最適化されました。[#40633](https://github.com/apache/doris/pull/40633)  
- 再起動/クラッシュ時のTTLファイル名処理におけるfile cacheの堅牢性が強化されました。[#40226](https://github.com/apache/doris/pull/40226)  
- ディスク上のsegmentファイルのハッシュファイル名計算を容易にするため、BE HTTPインターフェース`/api/file_cache?op=hash`が追加されました。[#40831](https://github.com/apache/doris/pull/40831)  
- BEグループ（元のcloud cluster）を表すcompute groupの使用と互換性を持つよう、統一命名が最適化されました。[#40767](https://github.com/apache/doris/pull/40767)  
- 主キーテーブルでのdelete bitmap計算時のロック取得待ち時間が最適化されました。[#40341](https://github.com/apache/doris/pull/40341)
- 主キーテーブルで多数のdelete bitmapがある場合、複数のdelete bitmapを事前マージすることでクエリ中の高CPU消費が最適化されました。[#40204](https://github.com/apache/doris/pull/40204)  
- コンピュート・ストレージ分離モードでSQL文を通じたFE/BEノード管理がサポートされ、コンピュート・ストレージ分離モードでのデプロイ時にmeta-serviceとの直接対話ロジックが隠蔽されました。[#40264](https://github.com/apache/doris/pull/40264)  
- FDBの迅速デプロイメント用スクリプトが追加されました。[#39803](https://github.com/apache/doris/pull/39803)  
- `SHOW CACHE HOTSPOT`の出力が最適化され、他の`SHOW`文と列名スタイルが統一されました。[#41322](https://github.com/apache/doris/pull/41322)  
- storage vaultをストレージバックエンドとして使用する場合、異なるストレージバックエンドを同一テーブルにバインドすることを避けるため`latest_fs()`の使用が禁止されました。[#40516](https://github.com/apache/doris/pull/40516)  
- mowテーブルインポート時のdelete bitmap計算のタイムアウト戦略が最適化されました。[#40562](https://github.com/apache/doris/pull/40562)  [#40333](https://github.com/apache/doris/pull/40333)  
- be.confのenable_file_cacheが、コンピュート・ストレージ分離モードでデフォルトで有効になりました。[#41502](https://github.com/apache/doris/pull/41502)  

### レイクハウス

- CSV形式のテーブル読み取り時、`\r`シンボルの読み取り動作を制御するセッション`keep_carriage_return`設定がサポートされました。[#39980](https://github.com/apache/doris/pull/39980)  
- BEのJVMのデフォルト最大メモリが2GBに調整されました（新規デプロイメントのみに影響）。[#41403](https://github.com/apache/doris/pull/41403)  
- Hive カタログに`hive.recursive_directories_table`と`hive.ignore_absent_partitions`プロパティが追加され、データディレクトリの再帰的走査と欠落パーティションの無視を指定できます。[#39494](https://github.com/apache/doris/pull/39494)  
- リフレッシュ中の大量接続生成を回避するため、カタログリフレッシュロジックが最適化されました。[#39205](https://github.com/apache/doris/pull/39205)  
- 外部データソースの`SHOW CREATE DATABASE`と`SHOW CREATE TABLE`でロケーション情報が表示されるようになりました。[#39179](https://github.com/apache/doris/pull/39179)  
- 新しいオプティマイザで`INSERT INTO`文を使用したJDBC外部テーブルへのデータ挿入がサポートされました。[#41511](https://github.com/apache/doris/pull/41511)  
- MaxCompute カタログで複合データ型がサポートされました。[#39259](https://github.com/apache/doris/pull/39259)  
- 外部テーブルのデータシャードの読み取りとマージロジックが最適化されました。[#38311](https://github.com/apache/doris/pull/38311)  
- 外部テーブルのメタデータキャッシュの一部リフレッシュ戦略が最適化されました。[#38506](https://github.com/apache/doris/pull/38506)  
- Paimonテーブルで`IN/NOT IN`述語のプッシュダウンがサポートされました。[#38390](https://github.com/apache/doris/pull/38390)  
- Paimonバージョン0.9でParquet形式で作成されたテーブルとの互換性が追加されました。[#41020](https://github.com/apache/doris/pull/41020)  

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューの構築でimmediateとstarttimeの両方の使用がサポートされました。[#39573](https://github.com/apache/doris/pull/39573)  
- 外部テーブルベースの非同期マテリアライズドビューは、マテリアライズドビューをリフレッシュする前に外部テーブルのメタデータキャッシュをリフレッシュし、最新の外部テーブルデータに基づく構築を保証します。[#38212](https://github.com/apache/doris/pull/38212)  
- パーティション増分構築で週次および四半期粒度での集約がサポートされました。[#39286](https://github.com/apache/doris/pull/39286)  

### Query Optimizer

- 集約関数`GROUP_CONCAT`で`DISTINCT`と`ORDER BY`の両方の使用がサポートされました。[#38080](https://github.com/apache/doris/pull/38080)  
- 統計情報の収集と使用、行数推定とコスト計算ロジックが最適化され、より効率的で安定した実行計画が生成されます。
- ウィンドウ関数のパーティションデータ事前フィルタリングで、複数のウィンドウ関数を含むケースがサポートされました。[#38393](https://github.com/apache/doris/pull/38393)  

### Query Execution

- prepareパイプラインタスクの並列実行によりクエリレイテンシが削減されました。[#40874](https://github.com/apache/doris/pull/40874)  
- Profileでカタログ情報が表示されるようになりました。[#38283](https://github.com/apache/doris/pull/38283)  
- `IN`フィルタリング条件の計算パフォーマンスが最適化されました。[#40917](https://github.com/apache/doris/pull/40917)  
- K8SでDorisのメモリ使用量を制限するcgroupv2がサポートされました。[#39256](https://github.com/apache/doris/pull/39256)  
- 文字列からdatetime型への変換パフォーマンスが最適化されました。[#38385](https://github.com/apache/doris/pull/38385)  
- `string`が10進数の場合、`int`へのキャストがサポートされ、MySQLの特定の動作との互換性が向上しました。[#38847](https://github.com/apache/doris/pull/38847)  

### 半構造化データ管理

- 転置インデックスマッチングのパフォーマンスが最適化されました。[#41122](https://github.com/apache/doris/pull/41122)  
- 配列でのトークン化を伴う転置インデックスの作成が一時的に禁止されました。[#39062](https://github.com/apache/doris/pull/39062)  
- `explode_json_array`でバイナリJSON型がサポートされました。[#37278](https://github.com/apache/doris/pull/37278)  
- IPデータ型でbloomfilterインデックスがサポートされました。[#39253](https://github.com/apache/doris/pull/39253)  
- IPデータ型で行ストレージがサポートされました。[#39258](https://github.com/apache/doris/pull/39258)  
- ARRAY、MAP、STRUCTなどのネストされたデータ型でschema changeがサポートされました。[#39210](https://github.com/apache/doris/pull/39210)  
- MTMV作成時、VARIANT データ型で遭遇したKEYsが自動的に切り詰められます。[#39988](https://github.com/apache/doris/pull/39988)  
- パフォーマンス向上のため、クエリ中の転置インデックスの遅延読み込みが追加されました。[#38979](https://github.com/apache/doris/pull/38979)  
- `add inverted index file size for open file`。[#37482](https://github.com/apache/doris/pull/37482)  
- パフォーマンス向上のため、compaction中のオブジェクトストレージインターフェースへのアクセスが削減されました。[#41079](https://github.com/apache/doris/pull/41079)  
- 転置インデックス関連の3つの新しいクエリprofileメトリクスが追加されました。[#36696](https://github.com/apache/doris/pull/36696)  
- パフォーマンス向上のため、非PreparedStatement SQLのキャッシュオーバーヘッドが削減されました。[#40910](https://github.com/apache/doris/pull/40910)  
- 事前ウォーミングキャッシュで転置インデックスがサポートされました。[#38986](https://github.com/apache/doris/pull/38986)  
- 転置インデックスが書き込み後即座にキャッシュされるようになりました。[#39076](https://github.com/apache/doris/pull/39076)  

### 互換性

- branch-2.1でのmasterのThrift ID非互換性の問題が修正されました。[#41057](https://github.com/apache/doris/pull/41057)  

### その他

- BE HTTP APIで認証がサポートされ、認証が必要な場合はconfig::enable_all_http_authをtrue（デフォルトはfalse）に設定します。[#39577](https://github.com/apache/doris/pull/39577)  
- REFRESH操作に必要なユーザー権限が最適化され、権限がALTERからSHOWに緩和されました。[#39008](https://github.com/apache/doris/pull/39008)  
- advanceNextId()呼び出し時のnextIdの範囲が削減されました。[#40160](https://github.com/apache/doris/pull/40160)  
- Java UDFのキャッシュメカニズムが最適化されました。[#40404](https://github.com/apache/doris/pull/40404)  

## バグ修正

### Load

- `abortTransaction`が戻りコードを処理しない問題が修正されました。[#41275](https://github.com/apache/doris/pull/41275)  
- コンピュート・ストレージ分離モードでトランザクションのコミットまたは中止が失敗し、`afterCommit/afterAbort`が呼ばれない問題が修正されました。[#41267](https://github.com/apache/doris/pull/41267)  
- コンピュート・ストレージ分離モードでコンシューマオフセットを変更した際にRoutine Loadが正常に動作しない問題が修正されました。[#39159](https://github.com/apache/doris/pull/39159)  
- エラーログファイルパス取得時のファイルハンドル重複クローズ問題が修正されました。[#41320](https://github.com/apache/doris/pull/41320)  
- コンピュート・ストレージ分離モードでのRoutine Loadの誤ったジョブ進行状況キャッシュ問題が修正されました。[#39313](https://github.com/apache/doris/pull/39313)  
- コンピュート・ストレージ分離モードでトランザクションコミット失敗時にRoutine Loadがスタックする問題が修正されました。[#40539](https://github.com/apache/doris/pull/40539)  
- コンピュート・ストレージ分離モードでRoutine Loadがデータ品質チェックエラーを継続報告する問題が修正されました。[#39790](https://github.com/apache/doris/pull/39790)  
- コンピュート・ストレージ分離モードでRoutine Loadがコミット前にトランザクションをチェックしない問題が修正されました。[#39775](https://github.com/apache/doris/pull/39775)  
- コンピュート・ストレージ分離モードでRoutine Loadが中止前にトランザクションをチェックしない問題が修正されました。[#40463](https://github.com/apache/doris/pull/40463)  
- cluster keyが特定のデータ型をサポートしない問題が修正されました。[#38966](https://github.com/apache/doris/pull/38966)  
- トランザクションが重複してコミットされる問題が修正されました。[#39786](https://github.com/apache/doris/pull/39786)  
- BE終了時のWALでのuse after free問題が修正されました。[#33131](https://github.com/apache/doris/pull/33131)  
- コンピュート・ストレージ分離モードでWAL再生が完了したインポートトランザクションをスキップしない問題が修正されました。[#41262](https://github.com/apache/doris/pull/41262)  
- コンピュート・ストレージ分離モードでのgroup commitのBE選択ロジックが修正されました。[#39986](https://github.com/apache/doris/pull/39986)  [#38644](https://github.com/apache/doris/pull/38644)  
- insert intoでgroup commitを有効にした際にBEがクラッシュする可能性がある問題が修正されました。[#39339](https://github.com/apache/doris/pull/39339)  
- group commitを有効にしたinsert intoがスタックする可能性がある問題が修正されました。[#39391](https://github.com/apache/doris/pull/39391)  
- インポート時にgroup commitオプションを有効にしない場合にテーブルが見つからないエラーが発生する可能性がある問題が修正されました。[#39731](https://github.com/apache/doris/pull/39731)  
- タブレット数が多すぎることによるトランザクション送信タイムアウト問題が修正されました。[#40031](https://github.com/apache/doris/pull/40031)  
- Auto パーティションとの同時オープン問題が修正されました。[#38605](https://github.com/apache/doris/pull/38605)  
- インポートロック粒度が大きすぎる問題が修正されました。[#40134](https://github.com/apache/doris/pull/40134)  
- 長さゼロのvarcharによるcoredump問題が修正されました。[#40940](https://github.com/apache/doris/pull/40940)  
- ログ出力での誤ったindex Id値問題が修正されました。[#38790](https://github.com/apache/doris/pull/38790)  
- memtableシフトがBRPCストリーミングをクローズしない問題が修正されました。[#40105](https://github.com/apache/doris/pull/40105)  
- memtableシフト中のbvar統計の不正確性問題が修正されました。[#39075](https://github.com/apache/doris/pull/39075)  
- memtableシフト中のマルチレプリケーション障害許容性問題が修正されました。[#38003](https://github.com/apache/doris/pull/38003)  
- Routine Loadで1つのストリームに複数テーブルがある場合のメッセージ長計算の誤り問題が修正されました。[#40367](https://github.com/apache/doris/pull/40367)  
- Broker Loadでの不正確な進行状況報告問題が修正されました。[#40325](https://github.com/apache/doris/pull/40325)  
- Broker Loadでの不正確なデータスキャン量報告問題が修正されました。[#40694](https://github.com/apache/doris/pull/40694)  
- コンピュート・ストレージ分離モードでのRoutine Loadの同時実行問題が修正されました。[#39242](https://github.com/apache/doris/pull/39242)  
- コンピュート・ストレージ分離モードでRoutine Loadジョブがキャンセルされる問題が修正されました。[#39514](https://github.com/apache/doris/pull/39514)  
- Kafkaトピック削除時に進行状況がリセットされない問題が修正されました。[#38474](https://github.com/apache/doris/pull/38474)  
- Routine Loadでのトランザクション状態変更中の進行状況更新問題が修正されました。[#39311](https://github.com/apache/doris/pull/39311)  
- Routine Loadが一時停止状態から一時停止状態に切り替わる問題が修正されました。[#40728](https://github.com/apache/doris/pull/40728)  
- データベース削除によるStream Loadレコードの欠落問題が修正されました。[#39360](https://github.com/apache/doris/pull/39360)  

### Storage

- ストレージポリシーの欠落問題が修正されました。[#38700](https://github.com/apache/doris/pull/38700)  
- クロスバージョンバックアップとリカバリ中のエラー問題が修正されました。[#38370](https://github.com/apache/doris/pull/38370)  
- ccr binlogでのNPE問題が修正されました。[#39909](https://github.com/apache/doris/pull/39909
