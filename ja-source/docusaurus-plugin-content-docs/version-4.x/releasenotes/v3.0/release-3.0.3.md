---
{
  "title": "リリース 3.0.3",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.3バージョンが2024年12月02日に正式リリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.3バージョンが2024年12月02日に正式リリースされました。このバージョンでは、システムの性能と安定性がさらに向上しています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- 同期マテリアライズドビューを持つMOWテーブルでの列更新を禁止しました。[#40190](https://github.com/apache/doris/pull/40190)
- RoutineLoadのデフォルトパラメータを調整し、インポート効率を改善しました。[#42968](https://github.com/apache/doris/pull/42968)
- StreamLoadが失敗した際のLoadedRowsの戻り値を0に調整しました。[#41946](https://github.com/apache/doris/pull/41946) [#42291](https://github.com/apache/doris/pull/42291)
- Segment cacheのデフォルトメモリ制限を5%に調整しました。[#42308](https://github.com/apache/doris/pull/42308) [#42436](https://github.com/apache/doris/pull/42436)

## 新機能

- コールドホット階層化レプリカのアフィニティを制御するセッション変数`enable_cooldown_replica_affinity`を導入しました。[#42677](https://github.com/apache/doris/pull/42677)

- Hiveテーブルのパーティション情報をクエリするための`table$partition`構文を追加しました。[#40774](https://github.com/apache/doris/pull/40774)
  
  - [ドキュメントを表示](../../lakehouse/catalogs/hive-catalog)

- Textフォーマットでのhiveテーブルの作成をサポートしました。[#41860](https://github.com/apache/doris/pull/41860) [#42175](https://github.com/apache/doris/pull/42175)

  - [ドキュメントを表示](../../lakehouse/catalogs/hive-catalog)

### 非同期マテリアライズドビュー

- 新しいマテリアライズドビュー属性`use_for_rewrite`を導入しました。`use_for_rewrite`がfalseに設定されている場合、マテリアライズドビューは透過的な書き換えに参加しません。[#40332](https://github.com/apache/doris/pull/40332)

### Query Optimizer

- 相関非集約サブクエリをサポートしました。[#42236](https://github.com/apache/doris/pull/42236)

### Query Execution

- 関数`ngram_search`、`normal_cdf`、`to_iso8601`、`from_iso8601_date`、`SESSION_USER()`、`last_query_id`を追加しました。[#38226](https://github.com/apache/doris/pull/38226) [#40695](https://github.com/apache/doris/pull/40695) [#41075](https://github.com/apache/doris/pull/41075) [#41600](https://github.com/apache/doris/pull/41600) [#39575](https://github.com/apache/doris/pull/39575) [#40739](https://github.com/apache/doris/pull/40739)
- `aes_encrypt`および`aes_decrypt`関数でGCMモードをサポートしました。[#40004](https://github.com/apache/doris/pull/40004)
- Profileで変更されたセッション変数の値を出力するようになりました。[#41016](https://github.com/apache/doris/pull/41016) [#41318](https://github.com/apache/doris/pull/41318)

### 半構造化データ管理

- 配列関数`array_match_all`と`array_match_any`を追加しました。[#40605](https://github.com/apache/doris/pull/40605) [#43514](https://github.com/apache/doris/pull/43514)
- 配列関数`array_agg`でARRAY内でのARRAY/MAP/STRUCTのネストをサポートしました。[#42009](https://github.com/apache/doris/pull/42009)
- 近似集約統計関数`approx_top_k`と`approx_top_sum`を追加しました。[#44082](https://github.com/apache/doris/pull/44082)

## 改善

### Storage

- デフォルト値として`bitmap_empty`をサポートしました。[#40364](https://github.com/apache/doris/pull/40364)
- DELETE文のタイムアウトを制御するセッション変数`insert_timeout`を導入しました。[#41063](https://github.com/apache/doris/pull/41063)
- 一部のエラーメッセージのプロンプトを改善しました。[#41048](https://github.com/apache/doris/pull/41048) [#39631](https://github.com/apache/doris/pull/39631)
- レプリカ修復の優先度スケジューリングを改善しました。[#41076](https://github.com/apache/doris/pull/41076)
- テーブル作成時のタイムゾーン処理の堅牢性を強化しました。[#41926](https://github.com/apache/doris/pull/41926) [#42389](https://github.com/apache/doris/pull/42389)
- テーブル作成時のパーティション式の有効性をチェックするようになりました。[#40158](https://github.com/apache/doris/pull/40158)
- DELETE操作でUnicodeエンコードされた列名をサポートしました。[#39381](https://github.com/apache/doris/pull/39381)

### 計算ストレージ分離

- ストレージと計算分離モードでのARMアーキテクチャデプロイメントをサポートしました。[#42467](https://github.com/apache/doris/pull/42467) [#43377](https://github.com/apache/doris/pull/43377)
- ファイルキャッシュの退避戦略とロック競合を最適化し、ヒット率と高並行ポイントクエリパフォーマンスを向上させました。[#42451](https://github.com/apache/doris/pull/42451) [#43201](https://github.com/apache/doris/pull/43201) [#41818](https://github.com/apache/doris/pull/41818) [#43401](https://github.com/apache/doris/pull/43401)
- S3 storage vaultが`use_path_style`をサポートし、オブジェクトストレージでのカスタムドメイン名使用の問題を解決しました。[#43060](https://github.com/apache/doris/pull/43060) [#43343](https://github.com/apache/doris/pull/43343) [#43330](https://github.com/apache/doris/pull/43330)
- ストレージと計算分離の設定とデプロイメントを最適化し、異なるモードでの誤操作を防止しました。[#43381](https://github.com/apache/doris/pull/43381) [#43522](https://github.com/apache/doris/pull/43522) [#43434](https://github.com/apache/doris/pull/43434) [#40764](https://github.com/apache/doris/pull/40764) [#43891](https://github.com/apache/doris/pull/43891)
- オブザーバビリティを最適化し、指定されたsegmentファイルキャッシュを削除するインタフェースを提供しました。[#38489](https://github.com/apache/doris/pull/38489) [#42896](https://github.com/apache/doris/pull/42896) [#41037](https://github.com/apache/doris/pull/41037) [#43412](https://github.com/apache/doris/pull/43412)
- Meta-service運用保守インタフェースを最適化しました：RPC レート制限とtabletメタデータ修正。[#42413](https://github.com/apache/doris/pull/42413) [#43884](https://github.com/apache/doris/pull/43884) [#41782](https://github.com/apache/doris/pull/41782) [#43460](https://github.com/apache/doris/pull/43460)

### レイクハウス

- Paimon カタログでAlibaba Cloud DLFとOSS-HDFSストレージをサポートしました。[#41247](https://github.com/apache/doris/pull/41247) [#42585](https://github.com/apache/doris/pull/42585)
  
  - [ドキュメント](../../lakehouse/catalogs/paimon-catalog)を表示

- OpenCSVフォーマットでのHiveテーブル読み込みをサポートしました。[#42257](https://github.com/apache/doris/pull/42257) [#42942](https://github.com/apache/doris/pull/42942)
- External カタログでの`information_schema.columns`テーブルアクセスパフォーマンスを最適化しました。[#41659](https://github.com/apache/doris/pull/41659) [#41962](https://github.com/apache/doris/pull/41962)
- 新しいMaxComputeオープンストレージAPIを使用してMaxComputeデータソースにアクセスするようになりました。[#41614](https://github.com/apache/doris/pull/41614)
- PaimonテーブルのJNI部分のスケジューリングポリシーを最適化し、スキャンタスクをより均等にしました。[#43310](https://github.com/apache/doris/pull/43310)
- 小さなORCファイルの読み取りパフォーマンスを最適化しました。[#42004](https://github.com/apache/doris/pull/42004) [#43467](https://github.com/apache/doris/pull/43467)
- brotli圧縮フォーマットのparquetファイル読み込みをサポートしました。[#42177](https://github.com/apache/doris/pull/42177)
- `information_schema`ライブラリに`file_cache_statistics`テーブルを追加し、メタデータキャッシュ統計を表示できるようになりました。[#42160](https://github.com/apache/doris/pull/42160)

### Query Optimizer

- 最適化：クエリがコメントのみで異なる場合、同じSQL Cacheを再利用できるようになりました。[#40049](https://github.com/apache/doris/pull/40049)
- 最適化：データが頻繁に更新される際の統計情報の安定性を改善しました。[#43865](https://github.com/apache/doris/pull/43865) [#39788](https://github.com/apache/doris/pull/39788) [#43009](https://github.com/apache/doris/pull/43009) [#40457](https://github.com/apache/doris/pull/40457) [#42409](https://github.com/apache/doris/pull/42409) [#41894](https://github.com/apache/doris/pull/41894)
- 最適化：定数折りたたみの安定性を強化しました。[#42910](https://github.com/apache/doris/pull/42910) [#41164](https://github.com/apache/doris/pull/41164) [#39723](https://github.com/apache/doris/pull/39723) [#41394](https://github.com/apache/doris/pull/41394) [#42256](https://github.com/apache/doris/pull/42256) [#40441](https://github.com/apache/doris/pull/40441)
- 最適化：列プルーニングでより良い実行プランを生成できるようになりました。[#41719](https://github.com/apache/doris/pull/41719) [#41548](https://github.com/apache/doris/pull/41548)

### Query Execution

- ソートオペレータのメモリ使用量を最適化しました。[#39306](https://github.com/apache/doris/pull/39306)
- ARMでの計算パフォーマンスを最適化しました。[#38888](https://github.com/apache/doris/pull/38888) [#38759](https://github.com/apache/doris/pull/38759)
- 一連の関数の計算パフォーマンスを最適化しました。[#40366](https://github.com/apache/doris/pull/40366) [#40821](https://github.com/apache/doris/pull/40821) [#40670](https://github.com/apache/doris/pull/40670) [#41206](https://github.com/apache/doris/pull/41206) [#40162](https://github.com/apache/doris/pull/40162)
- SSE命令を使用して`match_ipv6_subnet`関数のパフォーマンスを最適化しました。[#38755](https://github.com/apache/doris/pull/38755)
- insert overwrite中の新しいパーティションの自動作成をサポートしました。[#38628](https://github.com/apache/doris/pull/38628) [#42645](https://github.com/apache/doris/pull/42645)
- ProfileでのPipelineTaskごとのステータスを追加しました。[#42981](https://github.com/apache/doris/pull/42981)
- IP型でruntime filterをサポートしました。[#39985](https://github.com/apache/doris/pull/39985)

### 半構造化データ管理

- 監査ログでprepared statementの実際のSQLを出力するようになりました。[#43321](https://github.com/apache/doris/pull/43321)
- filebeat doris output pluginで障害許容性と進捗レポートをサポートしました。[#36355](https://github.com/apache/doris/pull/36355)
- 転置インデックスクエリのパフォーマンスを最適化しました。[#41547](https://github.com/apache/doris/pull/41547) [#41585](https://github.com/apache/doris/pull/41585) [#41567](https://github.com/apache/doris/pull/41567) [#41577](https://github.com/apache/doris/pull/41577) [#42060](https://github.com/apache/doris/pull/42060) [#42372](https://github.com/apache/doris/pull/42372)
- 配列関数`array overlaps`で転置インデックスを使用した高速化をサポートしました。[#41571](https://github.com/apache/doris/pull/41571)
- IP関数`is_ip_address_in_range`で転置インデックスを使用した高速化をサポートしました。[#41571](https://github.com/apache/doris/pull/41571)
- VARIANTデータ型のCASTパフォーマンスを最適化しました。[#41775](https://github.com/apache/doris/pull/41775) [#42438](https://github.com/apache/doris/pull/42438) [#43320](https://github.com/apache/doris/pull/43320)
- Variantデータ型のCPUリソース消費を最適化しました。[#42856](https://github.com/apache/doris/pull/42856) [#43062](https://github.com/apache/doris/pull/43062) [#43634](https://github.com/apache/doris/pull/43634)
- Variantデータ型のメタデータと実行メモリリソース消費を最適化しました。[#42448](https://github.com/apache/doris/pull/42448) [#43326](https://github.com/apache/doris/pull/43326) [#41482](https://github.com/apache/doris/pull/41482) [#43093](https://github.com/apache/doris/pull/43093) [#43567](https://github.com/apache/doris/pull/43567) [#43620](https://github.com/apache/doris/pull/43620)

### 権限

- LDAPにカスタムグループフィルタリングのための新しい設定項目`ldap_group_filter`を追加しました。[#43292](https://github.com/apache/doris/pull/43292)

### その他

- FE監視項目でユーザー別接続数情報の表示をサポートしました。[#39200](https://github.com/apache/doris/pull/39200)

## バグ修正

### Storage

- IPv6ホスト名使用時の問題を修正しました。[#40074](https://github.com/apache/doris/pull/40074)
- broker/s3 load進捗の不正確な表示を修正しました。[#43535](https://github.com/apache/doris/pull/43535)
- FEからクエリがハングする可能性がある問題を修正しました。[#41303](https://github.com/apache/doris/pull/41303) [#42382](https://github.com/apache/doris/pull/42382)
- 例外的な状況下でのauto-increment IDの重複問題を修正しました。[#43774](https://github.com/apache/doris/pull/43774) [#43983](https://github.com/apache/doris/pull/43983)
- groupcommitでの時折発生するNPE問題を修正しました。[#43635](https://github.com/apache/doris/pull/43635)
- auto bucketの計算の不正確さを修正しました。[#41675](https://github.com/apache/doris/pull/41675) [#41835](https://github.com/apache/doris/pull/41835)
- FE再起動後にマルチテーブルフローが正しくプランされない可能性がある問題を修正しました。[#41677](https://github.com/apache/doris/pull/41677) [#42290](https://github.com/apache/doris/pull/42290)

### 計算ストレージ分離

- 大きな削除bitmapを持つMOW主キーテーブルでcoredumpが発生する可能性がある問題を修正しました。[#43088](https://github.com/apache/doris/pull/43088) [#43457](https://github.com/apache/doris/pull/43457) [#43479](https://github.com/apache/doris/pull/43479) [#43407](https://github.com/apache/doris/pull/43407) [#43297](https://github.com/apache/doris/pull/43297) [#43613](https://github.com/apache/doris/pull/43613) [#43615](https://github.com/apache/doris/pull/43615) [#43854](https://github.com/apache/doris/pull/43854) [#43968](https://github.com/apache/doris/pull/43968) [#44074](https://github.com/apache/doris/pull/44074) [#41793](https://github.com/apache/doris/pull/41793) [#42142](https://github.com/apache/doris/pull/42142)
- segmentファイルが5MBの倍数の場合にオブジェクトアップロードが失敗する問題を修正しました。[#43254](https://github.com/apache/doris/pull/43254)
- aws sdkのデフォルトリトライポリシーが有効にならない問題を修正しました。[#43575](https://github.com/apache/doris/pull/43575) [#43648](https://github.com/apache/doris/pull/43648)
- 間違ったタイプが指定されてもstorage vaultの変更が実行継続される問題を修正しました。[#43489](https://github.com/apache/doris/pull/43489) [#43352](https://github.com/apache/doris/pull/43352) [#43495](https://github.com/apache/doris/pull/43495)
- 大きなトランザクションの遅延コミット処理中にtablet_idが0になる可能性がある問題を修正しました。[#42043](https://github.com/apache/doris/pull/42043) [#42905](https://github.com/apache/doris/pull/42905)
- 定数折りたたみRCPとFE転送SQLが予期された計算グループで実行されない可能性がある問題を修正しました。[#43110](https://github.com/apache/doris/pull/43110) [#41819](https://github.com/apache/doris/pull/41819) [#41846](https://github.com/apache/doris/pull/41846)
- meta-serviceがRPC受信時にinstance_idを厳密にチェックしない問題を修正しました。[#43253](https://github.com/apache/doris/pull/43253) [#43832](https://github.com/apache/doris/pull/43832)
- FE followerのinformation_schemaバージョンが適時更新されない問題を修正しました。[#43496](https://github.com/apache/doris/pull/43496)
- ファイルキャッシュrenameでのアトミック性と不正確なメトリクスの問題を修正しました。[#42869](https://github.com/apache/doris/pull/42869) [#43504](https://github.com/apache/doris/pull/43504) [#43220](https://github.com/apache/doris/pull/43220)

### レイクハウス

- 暗黙的変換述語がJDBCデータソースにプッシュダウンされて一貫性のないクエリ結果になることを禁止しました。[#42102](https://github.com/apache/doris/pull/42102)
- 高バージョンHiveトランザクショナルテーブルでの一部読み込み問題を修正しました。[#42226](https://github.com/apache/doris/pull/42226)
- Exportコマンドでデッドロックが発生する可能性がある問題を修正しました。[#43083](https://github.com/apache/doris/pull/43083) [#43402](https://github.com/apache/doris/pull/43402)
- SparkによってHiveビューが作成されたが、クエリできない問題を修正しました。[#43552](https://github.com/apache/doris/pull/43552)
- 特殊文字を含むHiveパーティションパスで不正確なパーティションプルーニングが発生する問題を修正しました。[#42906](https://github.com/apache/doris/pull/42906)
- Iceberg カタログでAWS Glueが使用できない問題を修正しました。[#41084](https://github.com/apache/doris/pull/41084)

### 非同期マテリアライズドビュー

- ベーステーブルが再構築された後に非同期マテリアライズドビューがリフレッシュされない可能性がある問題を修正しました。[#41762](https://github.com/apache/doris/pull/41762)

### Query Optimizer

- マルチカラムレンジパーティショニング使用時にパーティションプルーニング結果が不正確になる可能性がある問題を修正しました。[#43332](https://github.com/apache/doris/pull/43332)
- 一部のlimit offsetシナリオで計算結果が不正確になる問題を修正しました。[#42576](https://github.com/apache/doris/pull/42576)

### Query Execution

- 4Gを超える配列型でhash joinがBE Coreを引き起こす可能性がある問題を修正しました。[#43861](https://github.com/apache/doris/pull/43861)
- 一部のシナリオでis null述語操作が不正確な結果を生成する可能性がある問題を修正しました。[#43619](https://github.com/apache/doris/pull/43619)
- hash joinでbitmap型が不正確な出力結果を生成する可能性がある問題を修正しました。[#43718](https://github.com/apache/doris/pull/43718)
- 関数結果が不正確に計算される問題を修正しました。[#40710](https://github.com/apache/doris/pull/40710) [#39358](https://github.com/apache/doris/pull/39358) [#40929](https://github.com/apache/doris/pull/40929) [#40869](https://github.com/apache/doris/pull/40869) [#40285](https://github.com/apache/doris/pull/40285) [#39891](https://github.com/apache/doris/pull/39891) [#40530](https://github.com/apache/doris/pull/40530) [#41948](https://github.com/apache/doris/pull/41948) [#43588](https://github.com/apache/doris/pull/43588)
- JSON型解析での一部の問題を修正しました。[#39937](https://github.com/apache/doris/pull/39937)
- runtime filter操作でのvarcharおよびchar型の問題を修正しました。[#43758](https://github.com/apache/doris/pull/43758) [#43919](https://github.com/apache/doris/pull/43919)
- スカラおよび集約関数でのdecimal256使用時の一部の問題を修正しました。[#42136](https://github.com/apache/doris/pull/42136) [#42356](https://github.com/apache/doris/pull/42356)
- arrow flight接続時に`Reach limit of connections`エラーが報告される問題を修正しました。[#39127](https://github.com/apache/doris/pull/39127)
- k8s環境でのBEメモリ使用統計の不正確さを修正しました。[#41123](https://github.com/apache/doris/pull/41123)

### 半構造化データ管理

- `segment_cache_fd_percentage`と`inverted_index_fd_number_limit_percent`のデフォルト値を調整しました。[#42224](https://github.com/apache/doris/pull/42224)
- logstashでgroup_commitをサポートしました。[#40450](https://github.com/apache/doris/pull/40450)
- インデックス構築時のcoredump問題を修正しました。[#43246](https://github.com/apache/doris/pull/43246) [#43298](https://github.com/apache/doris/pull/43298)
- variantインデックスの問題を修正しました。[#43375](https://github.com/apache/doris/pull/43375) [#43773](https://github.com/apache/doris/pull/43773)
- 異常なcompaction状況下での潜在的なfdとメモリリークを修正しました。[#42374](https://github.com/apache/doris/pull/42374)
- 転置インデックスmatch nullが正しくfalseではなくnullを返すようになりました。[#41786](https://github.com/apache/doris/pull/41786)
- ngram bloomfilterインデックスのbf_sizeが65536に設定された時のcoredump問題を修正しました。[#43645](https://github.com/apache/doris/pull/43645)
- 複雑なデータ型JOIN時の潜在的なcoredump問題を修正しました。[#40398](https://github.com/apache/doris/pull/40398)
- TVF JSONデータでのcoredump問題を修正しました。[#43187](https://github.com/apache/doris/pull/43187)
- 日時のbloom filter計算精度問題を修正しました。[#43612](https://github.com/apache/doris/pull/43612)
- IPv6型ストレージでのcoredump問題を修正しました。[#43251](https://github.com/apache/doris/pull/43251)
- light_schema_change無効時にVARIANT型でのcoredump問題を修正しました。[#40908](https://github.com/apache/doris/pull/40908)
- 高並行ポイントクエリのキャッシュパフォーマンスを向上させました。[#44077](https://github.com/apache/doris/pull/44077)
- 列削除時にbloom filterインデックスが同期されない問題を修正しました。[#43378](https://github.com/apache/doris/pull/43378)
- 混在配列とスカラデータなどの特殊な状況下でのes catalogの不安定性問題を修正しました。[#40314](https://github.com/apache/doris/pull/40314) [#40385](https://github.com/apache/doris/pull/40385) [
