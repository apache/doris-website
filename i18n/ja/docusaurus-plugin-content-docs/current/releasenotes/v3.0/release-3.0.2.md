---
{
  "title": "リリース 3.0.2",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.2バージョンは2024年10月15日に正式にリリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.2バージョンが2024年10月15日に正式にリリースされました。このバージョンでは、コンピューティング・ストレージ分離、データストレージ、レイクハウス、クエリオプティマイザー、クエリ実行などの更新と改善が含まれています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHubリリース:** https://github.com/apache/doris/releases

## 動作変更

### ストレージ

- FEメモリオーバーフローを防ぐため、単一バックアップタスク内のタブレット数を制限しました。[#40518](https://github.com/apache/doris/pull/40518)  
- `SHOW PARTITIONS`コマンドでパーティションの`CommittedVersion`が表示されるようになりました。[#28274](https://github.com/apache/doris/pull/28274)  

### その他

- `fe.log`のデフォルトプリントモード（非同期）にファイル行番号情報が含まれるようになりました。行番号出力によるパフォーマンスの問題が発生した場合は、BRIEFモードに切り替えてください。[#39419](https://github.com/apache/doris/pull/39419)  
- セッション変数`ENABLE_PREPARED_STMT_AUDIT_LOG`のデフォルト値が`true`から`false`に変更され、prepare文の監査ログが出力されなくなりました。[#38865](https://github.com/apache/doris/pull/38865)  
- セッション変数`max_allowed_packet`のデフォルト値がMySQL 8.4に合わせて1MBから16MBに調整されました。[#38697](https://github.com/apache/doris/pull/38697)  
- FEとBEのJVMがデフォルトでUTF-8文字セットを使用するようになりました。[#39521](https://github.com/apache/doris/pull/39521)  

## 新機能

### ストレージ

- バックアップおよびリカバリで、バックアップに含まれていないテーブルやパーティションのクリアをサポートしました。[#39028](https://github.com/apache/doris/pull/39028)  

### コンピューティング・ストレージ分離

- 複数タブレットでの期限切れデータの並列リサイクルをサポートしました。[#37630](https://github.com/apache/doris/pull/37630)  
- `ALTER`文によるストレージボルトの変更をサポートしました。[#38685](https://github.com/apache/doris/pull/38685)  [#37606](https://github.com/apache/doris/pull/37606)  
- 単一トランザクション内での大量タブレット（5000+）のインポートをサポートしました（実験的機能）。[#38243](https://github.com/apache/doris/pull/38243)  
- ノード再起動などの原因による保留中トランザクションの自動中止をサポートし、保留中トランザクションがdecommissionやスキーマ変更をブロックする問題を解決しました。[#37669](https://github.com/apache/doris/pull/37669)  
- クエリ中にセグメントキャッシュを使用するかどうかを制御する新しいセッション変数`enable_segment_cache`を追加しました（デフォルトは`true`）。[#37141](https://github.com/apache/doris/pull/37141)  
- コンピューティング・ストレージ分離モードでスキーマ変更中に大量データをインポートできない問題を解決しました。[#39558](https://github.com/apache/doris/pull/39558)  
- コンピューティング・ストレージ分離モードで複数のフォロワーロールのFE追加をサポートしました。[#38388](https://github.com/apache/doris/pull/38388)  
- ディスクなしまたは低パフォーマンスHDD環境でメモリをファイルキャッシュとして使用してクエリを高速化することをサポートしました。[#38811](https://github.com/apache/doris/pull/38811)  

### レイクハウス

- 新しいLakesoul Catalogが追加されました。
- 外部カタログの各種メタデータキャッシュの使用状況を確認するための新しいシステムテーブル`catalog_meta_cache_statistics`が追加されました。[#40155](https://github.com/apache/doris/pull/40155)  

### クエリオプティマイザー

- `is [not] true/false`式をサポートしました。[#38623](https://github.com/apache/doris/pull/38623)  

### クエリ実行

- 新しいCRC32関数が追加されました。[#38204](https://github.com/apache/doris/pull/38204)  
- 新しい集約関数skewとkurtが追加されました。[#41277](https://github.com/apache/doris/pull/41277)  
- より多くのプロファイルを保持するため、プロファイルがFEのディスクに永続化されるようになりました。[#33690](https://github.com/apache/doris/pull/33690)  
- ワークロードグループ関連の権限情報を確認するための新しいシステムテーブル`workload_group_privileges`が追加されました。[#38436](https://github.com/apache/doris/pull/38436)  
- ワークロードグループのリソース統計を監視するための新しいシステムテーブル`workload_group_resource_usage`が追加されました。[#39177](https://github.com/apache/doris/pull/39177)  
- ワークロードグループでローカルIOとリモートIOの読み取り制限をサポートしました。[#39012](https://github.com/apache/doris/pull/39012)  
- ワークロードグループでCPU使用量を制限するcgroupv2をサポートしました。[#39374](https://github.com/apache/doris/pull/39374)  
- 一部のテーブル作成属性を確認するための新しいシステムテーブル`information_schema.partitions`が追加されました。[#40636](https://github.com/apache/doris/pull/40636)  

### その他

- `SHOW BACKEND CONFIG LIKE ${pattern}`など、`SHOW`文を使用してBEの設定情報を表示することをサポートしました。[#36525](https://github.com/apache/doris/pull/36525)  

## 改善

### ロード

- Kafkaから頻繁なEOFが発生する際のroutine loadのインポート効率を改善しました。[#39975](https://github.com/apache/doris/pull/39975)  
- stream loadの結果にHTTPデータ読み込み時間`ReceiveDataTimeMs`が含まれるようになり、ネットワーク原因によるstream loadの遅延問題を迅速に特定できます。[#40735](https://github.com/apache/doris/pull/40735)  
- 転置インデックスとmow書き込み中の頻繁なタイムアウトを回避するため、routine loadタイムアウトロジックを最適化しました。[#40818](https://github.com/apache/doris/pull/40818)  

### ストレージ

- パーティションのバッチ追加をサポートしました。[#37114](https://github.com/apache/doris/pull/37114)  

### コンピューティング・ストレージ分離

- FDB内のKV分布統計を容易にするため、meta-service HTTP インターフェース`/MetaService/http/show_meta_ranges`を追加しました。[#39208](https://github.com/apache/doris/pull/39208)  
- meta-service/recycler停止スクリプトが復帰前にプロセスが完全に終了することを保証するようになりました。[#40218](https://github.com/apache/doris/pull/40218)  
- 現在のデプロイメントモードをコンピューティング・ストレージ分離として表示するため、セッション変数`version_comment`（Cloud Mode）の使用をサポートしました。[#38269](https://github.com/apache/doris/pull/38269)  
- トランザクション送信失敗時に返される詳細メッセージを修正しました。[#40584](https://github.com/apache/doris/pull/40584)  
- 1つのmeta-serviceプロセスでメタデータサービスとデータリサイクルサービスの両方を提供することをサポートしました。[#40223](https://github.com/apache/doris/pull/40223)  
- 未設定時の潜在的問題を回避するため、file_cacheのデフォルト設定を最適化しました。[#41421](https://github.com/apache/doris/pull/41421)  [#41507](https://github.com/apache/doris/pull/41507)  
- 複数パーティションのバージョンをバッチ取得することでクエリパフォーマンスを改善しました。[#38949](https://github.com/apache/doris/pull/38949)  
- 一時的なネットワーク変動によるクエリパフォーマンス問題を回避するため、タブレットの再配布を遅延させました。[#40371](https://github.com/apache/doris/pull/40371)  
- バランス内の読み書きロックロジックを最適化しました。[#40633](https://github.com/apache/doris/pull/40633)  
- 再起動/クラッシュ時のTTLファイル名処理におけるファイルキャッシュの堅牢性を強化しました。[#40226](https://github.com/apache/doris/pull/40226)  
- ディスク上のセグメントファイルのハッシュファイル名計算を容易にするため、BE HTTP インターフェース`/api/file_cache?op=hash`を追加しました。[#40831](https://github.com/apache/doris/pull/40831)  
- BEグループを表すcompute groupの使用と互換性を持つよう統一命名を最適化しました（元のcloud cluster）。[#40767](https://github.com/apache/doris/pull/40767)  
- プライマリキーテーブルでdeleteビットマップ計算時のロック取得待機時間を最適化しました。[#40341](https://github.com/apache/doris/pull/40341) 
- プライマリキーテーブルに多くのdeleteビットマップがある場合、複数のdeleteビットマップを事前マージすることでクエリ中の高CPU消費を最適化しました。[#40204](https://github.com/apache/doris/pull/40204)  
- コンピューティング・ストレージ分離モードでのデプロイ時にmeta-serviceとの直接やり取りロジックを隠蔽し、SQL文によるFE/BEノード管理をサポートしました。[#40264](https://github.com/apache/doris/pull/40264)  
- FDBの迅速なデプロイ用スクリプトを追加しました。[#39803](https://github.com/apache/doris/pull/39803)  
- 他の`SHOW`文との列名スタイル統一のため、`SHOW CACHE HOTSPOT`の出力を最適化しました。[#41322](https://github.com/apache/doris/pull/41322)  
- ストレージボルトをストレージバックエンドとして使用する場合、同じテーブルに異なるストレージバックエンドをバインドすることを避けるため、`latest_fs()`の使用を禁止しました。[#40516](https://github.com/apache/doris/pull/40516)  
- mowテーブルインポート時のdeleteビットマップ計算のタイムアウト戦略を最適化しました。[#40562](https://github.com/apache/doris/pull/40562)  [#40333](https://github.com/apache/doris/pull/40333)  
- be.confのenable_file_cacheがコンピューティング・ストレージ分離モードでデフォルト有効になりました。[#41502](https://github.com/apache/doris/pull/41502)  

### レイクハウス

- CSV形式のテーブル読み込み時に、`\r`シンボルの読み込み動作を制御するセッション`keep_carriage_return`設定をサポートしました。[#39980](https://github.com/apache/doris/pull/39980)  
- BEのJVMのデフォルト最大メモリを2GBに調整しました（新規デプロイメントのみに影響）。[#41403](https://github.com/apache/doris/pull/41403)  
- Hive Catalogに`hive.recursive_directories_table`と`hive.ignore_absent_partitions`プロパティを追加し、データディレクトリの再帰的トラバーサルと欠損パーティションの無視を指定できるようになりました。[#39494](https://github.com/apache/doris/pull/39494)  
- リフレッシュ中の大量接続生成を回避するため、Catalogリフレッシュロジックを最適化しました。[#39205](https://github.com/apache/doris/pull/39205)  
- 外部データソースの`SHOW CREATE DATABASE`と`SHOW CREATE TABLE`でロケーション情報が表示されるようになりました。[#39179](https://github.com/apache/doris/pull/39179)  
- 新しいオプティマイザーで`INSERT INTO`文を使用したJDBC外部テーブルへのデータ挿入をサポートしました。[#41511](https://github.com/apache/doris/pull/41511)  
- MaxCompute Catalogで複合データタイプをサポートしました。[#39259](https://github.com/apache/doris/pull/39259)  
- 外部テーブルのデータシャード読み込みとマージロジックを最適化しました。[#38311](https://github.com/apache/doris/pull/38311)  
- 外部テーブルメタデータキャッシュの一部リフレッシュ戦略を最適化しました。[#38506](https://github.com/apache/doris/pull/38506)  
- Paimonテーブルで`IN/NOT IN`述語のプッシュダウンをサポートしました。[#38390](https://github.com/apache/doris/pull/38390)  
- Paimonバージョン0.9によってParquet形式で作成されたテーブルと互換性を持たせました。[#41020](https://github.com/apache/doris/pull/41020)  

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューの構築でimmediateとstarttimeの両方の使用をサポートしました。[#39573](https://github.com/apache/doris/pull/39573)  
- 外部テーブルベースの非同期マテリアライズドビューは、マテリアライズドビューをリフレッシュする前に外部テーブルのメタデータキャッシュをリフレッシュし、最新の外部テーブルデータに基づいた構築を保証します。[#38212](https://github.com/apache/doris/pull/38212)  
- パーティション増分構築で週次および四半期粒度でのロールアップをサポートしました。[#39286](https://github.com/apache/doris/pull/39286)  

### クエリオプティマイザー

- 集約関数`GROUP_CONCAT`で`DISTINCT`と`ORDER BY`の両方の使用をサポートしました。[#38080](https://github.com/apache/doris/pull/38080)  
- より効率的で安定した実行プランを生成するため、統計情報の収集と使用、行数推定とコスト計算のロジックを最適化しました。
- ウィンドウ関数パーティションデータの事前フィルタリングで複数のウィンドウ関数を含むケースをサポートしました。[#38393](https://github.com/apache/doris/pull/38393)  

### クエリ実行

- prepareパイプラインタスクを並列実行することでクエリ遅延を削減しました。[#40874](https://github.com/apache/doris/pull/40874)  
- Profileにカタログ情報を表示するようになりました。[#38283](https://github.com/apache/doris/pull/38283)  
- `IN`フィルタリング条件の計算性能を最適化しました。[#40917](https://github.com/apache/doris/pull/40917)  
- K8S環境でDorisのメモリ使用量を制限するcgroupv2をサポートしました。[#39256](https://github.com/apache/doris/pull/39256)  
- 文字列からdatetimeタイプへの変換性能を最適化しました。[#38385](https://github.com/apache/doris/pull/38385)  
- `string`が10進数の場合、MySQLの特定の動作とより互換性を持つよう`int`へのキャストをサポートしました。[#38847](https://github.com/apache/doris/pull/38847)  

### 半構造化データ管理

- 転置インデックスマッチングの性能を最適化しました。[#41122](https://github.com/apache/doris/pull/41122)  
- 配列でのトークン化を伴う転置インデックスの作成を一時的に禁止しました。[#39062](https://github.com/apache/doris/pull/39062)  
- `explode_json_array`でバイナリJSONタイプをサポートしました。[#37278](https://github.com/apache/doris/pull/37278)  
- IPデータタイプでbloomfilterインデックスをサポートしました。[#39253](https://github.com/apache/doris/pull/39253)  
- IPデータタイプで行ストレージをサポートしました。[#39258](https://github.com/apache/doris/pull/39258)  
- ARRAY、MAP、STRUCTなどのネストされたデータタイプでスキーマ変更をサポートしました。[#39210](https://github.com/apache/doris/pull/39210)  
- MTMV作成時にVARIANTデータタイプで遭遇するKEYsを自動的に切り詰めるようになりました。[#39988](https://github.com/apache/doris/pull/39988)  
- パフォーマンス向上のため、クエリ中の転置インデックスの遅延ロードを実装しました。[#38979](https://github.com/apache/doris/pull/38979)  
- `add inverted index file size for open file`。[#37482](https://github.com/apache/doris/pull/37482)  
- パフォーマンス向上のため、コンパクション中のオブジェクトストレージインターフェースへのアクセスを削減しました。[#41079](https://github.com/apache/doris/pull/41079)  
- 転置インデックス関連の3つの新しいクエリプロファイル指標を追加しました。[#36696](https://github.com/apache/doris/pull/36696)  
- パフォーマンス向上のため、PreparedStatement以外のSQLのキャッシュオーバーヘッドを削減しました。[#40910](https://github.com/apache/doris/pull/40910)  
- 事前ウォームアップキャッシュで転置インデックスをサポートしました。[#38986](https://github.com/apache/doris/pull/38986)  
- 書き込み後すぐに転置インデックスがキャッシュされるようになりました。[#39076](https://github.com/apache/doris/pull/39076)  

### 互換性

- masterでのbranch-2.1とのThrift ID非互換性問題を修正しました。[#41057](https://github.com/apache/doris/pull/41057)  

### その他

- BE HTTP APIで認証をサポートしました。認証が必要な場合はconfig::enable_all_http_authをtrue（デフォルトはfalse）に設定してください。[#39577](https://github.com/apache/doris/pull/39577)  
- REFRESH操作に必要なユーザー権限を最適化しました。権限がALTERからSHOWに緩和されました。[#39008](https://github.com/apache/doris/pull/39008)  
- advanceNextId()呼び出し時のnextIdの範囲を削減しました。[#40160](https://github.com/apache/doris/pull/40160)  
- Java UDFのキャッシュメカニズムを最適化しました。[#40404](https://github.com/apache/doris/pull/40404)  

## バグ修正

### ロード

- `abortTransaction`がリターンコードを処理しない問題を修正しました。[#41275](https://github.com/apache/doris/pull/41275)  
- コンピューティング・ストレージ分離モードでトランザクションのコミットまたは中止が失敗し、`afterCommit/afterAbort`が呼ばれない問題を修正しました。[#41267](https://github.com/apache/doris/pull/41267)  
- コンピューティング・ストレージ分離モードでコンシューマーオフセット変更時にRoutine Loadが正常に動作しない問題を修正しました。[#39159](https://github.com/apache/doris/pull/39159)  
- エラーログファイルパス取得時にファイルハンドルを繰り返し閉じる問題を修正しました。[#41320](https://github.com/apache/doris/pull/41320)  
- コンピューティング・ストレージ分離モードでRoutine Loadのジョブ進捗キャッシュが不正確な問題を修正しました。[#39313](https://github.com/apache/doris/pull/39313)  
- コンピューティング・ストレージ分離モードでトランザクションコミットに失敗した際にRoutine Loadが停止する問題を修正しました。[#40539](https://github.com/apache/doris/pull/40539)  
- コンピューティング・ストレージ分離モードでRoutine Loadがデータ品質チェックエラーを継続的に報告する問題を修正しました。[#39790](https://github.com/apache/doris/pull/39790)  
- コンピューティング・ストレージ分離モードでRoutine Loadがコミット前にトランザクションをチェックしない問題を修正しました。[#39775](https://github.com/apache/doris/pull/39775)  
- コンピューティング・ストレージ分離モードでRoutine Loadが中止前にトランザクションをチェックしない問題を修正しました。[#40463](https://github.com/apache/doris/pull/40463)  
- cluster keyが特定のデータタイプをサポートしない問題を修正しました。[#38966](https://github.com/apache/doris/pull/38966)  
- トランザクションが繰り返しコミットされる問題を修正しました。[#39786](https://github.com/apache/doris/pull/39786)  
- BE終了時のWALでuse after freeの問題を修正しました。[#33131](https://github.com/apache/doris/pull/33131)  
- コンピューティング・ストレージ分離モードでWAL再生が完了したインポートトランザクションをスキップしない問題を修正しました。[#41262](https://github.com/apache/doris/pull/41262)  
- コンピューティング・ストレージ分離モードでgroup commitのBE選択ロジックを修正しました。[#39986](https://github.com/apache/doris/pull/39986)  [#38644](https://github.com/apache/doris/pull/38644)  
- insert intoでgroup commitが有効な場合にBEがクラッシュする可能性がある問題を修正しました。[#39339](https://github.com/apache/doris/pull/39339)  
- group commitが有効なinsert intoが停止する可能性がある問題を修正しました。[#39391](https://github.com/apache/doris/pull/39391)  
- インポート時にgroup commitオプションを有効にしない場合にテーブルが見つからないエラーが発生する可能性がある問題を修正しました。[#39731](https://github.com/apache/doris/pull/39731)  
- タブレット数が多すぎることによるトランザクション送信タイムアウトの問題を修正しました。[#40031](https://github.com/apache/doris/pull/40031)  
- Auto Partitionでの同時オープンの問題を修正しました。[#38605](https://github.com/apache/doris/pull/38605)  
- インポートロック粒度が大きすぎる問題を修正しました。[#40134](https://github.com/apache/doris/pull/40134)  
- 長さゼロのvarcharによるcoredumpの問題を修正しました。[#40940](https://github.com/apache/doris/pull/40940)  
- ログ出力での不正確なインデックスId値の問題を修正しました。[#38790](https://github.com/apache/doris/pull/38790)  
- memtableシフト時にBRPCストリーミングを閉じない問題を修正しました。[#40105](https://github.com/apache/doris/pull/40105)  
- memtableシフト中の不正確なbvar統計の問題を修正しました。[#39075](https://github.com/apache/doris/pull/39075)  
- memtableシフト中の複製フォルトトレランスの問題を修正しました。[#38003](https://github.com/apache/doris/pull/38003)  
- 一つのストリーム内の複数テーブルRoutine Loadでメッセージ長計算が不正確な問題を修正しました。[#40367](https://github.com/apache/doris/pull/40367)  
- Broker Loadの進捗報告が不正確な問題を修正しました。[#40325](https://github.com/apache/doris/pull/40325)  
- Broker Loadのデータスキャン量報告が不正確な問題を修正しました。[#40694](https://github.com/apache/doris/pull/40694)  
- コンピューティング・ストレージ分離モードでRoutine Loadの並行性の問題を修正しました。[#39242](https://github.com/apache/doris/pull/39242)  
- コンピューティング・ストレージ分離モードでRoutine Loadジョブがキャンセルされる問題を修正しました。[#39514](https://github.com/apache/doris/pull/39514)  
- Kafkaトピック削除時に進捗がリセットされない問題を修正しました。[#38474](https://github.com/apache/doris/pull/38474)  
- Routine Loadでトランザクション状態遷移中の進捗更新の問題を修正しました。[#39311](https://github.com/apache/doris/pull/39311)  
- Routine Loadが一時停止状態から一時停止状態に切り替わる問題を修正しました。[#40728](https://github.com/apache/doris/pull/40728)  
- データベース削除によりStream Loadレコードが失われる問題を修正しました。[#39360](https://github.com/apache/doris/pull
