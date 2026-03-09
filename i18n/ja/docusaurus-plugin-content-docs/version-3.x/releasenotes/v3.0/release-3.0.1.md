---
{
  "title": "リリース 3.0.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.1版は2024年8月23日に正式にリリースされました、"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.1 バージョンが2024年8月23日に正式にリリースされました。このバージョンでは、compute-storage decoupling、lakehouse、半構造化データ分析、非同期マテリアライズドビューなどの機能でアップデートと改善が行われています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

### Query Optimizer

- `CREATE TABLE AS SELECT`（CTAS）操作実行時のVARCHAR型の長さ動作を制御する変数`use_max_length_of_varchar_in_ctas`を追加しました。[#37069](https://github.com/apache/doris/pull/37069)
  
  - この変数はデフォルトでtrueに設定されています。
  
  - trueに設定した場合、VARCHAR型カラムがテーブル由来の場合は派生した長さを使用し、そうでない場合は最大長を使用します。
  
  - falseに設定した場合、VARCHAR型は常に派生した長さを使用します。

- MySQLフォーマットとの互換性を維持するため、全てのデータ型が小文字で表示されるようになりました。[#38012](https://github.com/apache/doris/pull/38012)

- 同一クエリリクエスト内の複数のクエリ文は、セミコロンで区切る必要があります。[#38670](https://github.com/apache/doris/pull/38670)

### Query Execution

- クラスター内のshuffle操作後のデフォルト並列タスク数を100に設定しました。これにより大規模クラスターでのクエリ安定性と並行処理能力が向上します。[#38196](https://github.com/apache/doris/pull/38196)

### Storage

- `trash_file_expire_time_sec`のデフォルト値を86400秒から0秒に変更しました。これにより、誤ってファイルが削除されFEのtrashがクリアされた場合、データを復旧できなくなります。

- テーブル属性`enable_mow_delete_on_delete_predicate`（バージョン3.0.0で導入）を`enable_mow_light_delete`に名称変更しました。

- 明示的トランザクションでは、データが書き込まれたテーブルでの削除操作が禁止されました。

- 自動インクリメントフィールドを持つテーブルでの重いスキーマ変更操作が禁止されました。



## 新機能

### Job Scheduling

- 内部スケジューリングジョブの実行ロジックを最適化し、開始時間と即座実行パラメータの強い関連付けを分離しました。現在、タスクは指定した開始時間で作成することも、即座実行を選択することも可能で、競合することなくスケジューリングの柔軟性が向上しました。[#36805](https://github.com/apache/doris/pull/36805)

### Compute-Storage Decoupled

- ファイルキャッシュ使用量の上限の動的変更をサポートしました。[#37484](https://github.com/apache/doris/pull/37484)

- Recyclerでオブジェクトストレージのレート制限とサーバサイドのレート制限再試行機能をサポートしました。[#37663](https://github.com/apache/doris/pull/37663) [#37680](https://github.com/apache/doris/pull/37680)

### Lakehouse

- 複雑型の出力フォーマットを設定するセッション変数`serde_dialect`を追加しました。[#37039](https://github.com/apache/doris/pull/37039)

- SQL傍受が外部テーブルをサポートするようになりました。

  - 詳細については、[SQL Interception](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception)のドキュメントを参照してください。

- Insert overwriteでIcebergテーブルをサポートしました。[#37191](https://github.com/apache/doris/pull/37191)

### Asynchronous Materialized Views

- 時間単位でのパーティションロールアップと構築をサポートしました。[#37678](https://github.com/apache/doris/pull/37678)

- 非同期マテリアライズドビュー定義文のアトミック置換をサポートしました。[#36749](https://github.com/apache/doris/pull/36749)

- 透過的書き換えでInsert文をサポートしました。[#38115](https://github.com/apache/doris/pull/38115)

- 透過的書き換えでVARIANT型をサポートしました。[#37929](https://github.com/apache/doris/pull/37929)

### Query Execution

- group concat関数でDISTINCTとORDER BYオプションをサポートしました。[#38744](https://github.com/apache/doris/pull/38744)

### Semi-Structured Data Management

- ES CatalogでElasticsearchの`nested`または`object`型をDorisのJSON型にマッピングするようになりました。[#37101](https://github.com/apache/doris/pull/37101)

- 複数フィールドでキーワードマッチングをサポートし、転置インデックスを活用して検索を高速化する`MULTI_MATCH`関数を追加しました。[#37722](https://github.com/apache/doris/pull/37722)

- JSONデータ内のオブジェクトを複数の行に展開する`explode_json_object`関数を追加しました。[#36887](https://github.com/apache/doris/pull/36887)

- 転置インデックスでmemtableアドバンスメントをサポートし、マルチレプリカ書き込み時のインデックス構築を一度だけ行うようになり、CPU消費量が削減され、パフォーマンスが向上しました。[#35891](https://github.com/apache/doris/pull/35891)

- 正のスロップに対する`MATCH_PHRASE`サポートを追加しました。例えば、`msg MATCH_PHRASE 'a b 2+'`は、単語aとbを含み、スロップが2以下でbがaより前にあるインスタンスにマッチします。最後の`+`がない通常のスロップではこの順序は保証されません。[#36356](https://github.com/apache/doris/pull/36356)

### Other

- この設定で指定されたユーザー操作が監査ログに記録されなくなるFEパラメータ`skip_audit_user_list`を追加しました。[#38310](https://github.com/apache/doris/pull/38310)

  - 詳細については、[Audit Plugin](https://doris.apache.org/docs/admin-manual/audit-plugin/)のドキュメントを参照してください。



## 改善

### Storage

- 単一BE内のディスクバランシングによる書き込み失敗の可能性を削減しました。[#38000](https://github.com/apache/doris/pull/38000)

- memtable limiterのメモリ消費量を削減しました。[#37511](https://github.com/apache/doris/pull/37511)

- パーティション置換操作中に古いパーティションをFE trashに移動するようになりました。[#36361](https://github.com/apache/doris/pull/36361)

- 圧縮中のメモリ消費量を最適化しました。[#37099](https://github.com/apache/doris/pull/37099)

- JDBC PreparedStatementの監査ログを制御するセッション変数を追加し、デフォルトでは出力しない設定としました。[#38419](https://github.com/apache/doris/pull/38419)

- グループコミット用のBE選択ロジックを最適化しました。[#35558](https://github.com/apache/doris/pull/35558)

- カラム更新のパフォーマンスを向上させました。[#38487](https://github.com/apache/doris/pull/38487)

- `delete bitmap cache`の使用を最適化しました。[#38761](https://github.com/apache/doris/pull/38761)

- ホット・コールド階層化中のクエリアフィニティを制御する設定を追加しました。[#37492](https://github.com/apache/doris/pull/37492)

### Compute-Storage Decoupled

- オブジェクトストレージサーバーのレート制限に遭遇した際の自動再試行を実装しました。[#37199](https://github.com/apache/doris/pull/37199)

- compute-storage decoupledモードでmemtable flushのスレッド数を適応させました。[#38789](https://github.com/apache/doris/pull/38789)

- Azureサポートなしの環境でのコンパイルをサポートするため、Azureをコンパイルオプションとして追加しました。

- オブジェクトストレージアクセスレート制限の可観測性を最適化しました。[#38294](https://github.com/apache/doris/pull/38294)

- ファイルキャッシュTTLキューでLRU追い出しを実行できるようにし、TTLキューの可用性を向上させました。[#37312](https://github.com/apache/doris/pull/37312)

- storage and compute separationモードでbalance writeeditlog IO操作の数を最適化しました。[#37787](https://github.com/apache/doris/pull/37787)

- タブレット作成リクエストをバッチで送信することで、storage and compute separationモードでのテーブル作成速度を向上させました。[#36786](https://github.com/apache/doris/pull/36786)

- バックオフ再試行によりローカルファイルキャッシュの潜在的な不整合が原因の読み取り失敗を最適化しました。[#38645](https://github.com/apache/doris/pull/38645)

### Lakehouse

- Parquet/ORCフォーマットの読み書き操作のメモリ統計を最適化しました。[#37234](https://github.com/apache/doris/pull/37234)

- Trino Connector Catalogで述語プッシュダウンをサポートしました。[#37874](https://github.com/apache/doris/pull/37874)

- 外部テーブルの`count(*)`プッシュダウン最適化を有効にするかどうかを制御するセッション変数`enable_count_push_down_for_external_table`を追加しました。[#37046](https://github.com/apache/doris/pull/37046)

- Hudiスナップショット読み取りの読み取りロジックを最適化し、スナップショットが空の場合は空のセットを返すようになり、Sparkの動作と一致しました。[#37702](https://github.com/apache/doris/pull/37702)

- HiveテーブルのパーティションカラムRead performanceを向上させました。[#37377](https://github.com/apache/doris/pull/37377)

### Asynchronous Materialized Views

- 透過的書き換えプラン速度を20%向上させました。[#37197](https://github.com/apache/doris/pull/37197)

- グループキーがデータ一意性を満たす場合、透過的書き換え時のロールアップを排除し、より良いネスト化マッチングを実現しました。[#38387](https://github.com/apache/doris/pull/38387)

- ネストマテリアライズドビューのマッチング成功率を向上させるため、透過的書き換えでより良い集約除去を実行するようになりました。[#36888](https://github.com/apache/doris/pull/36888)

### MySQL Compatibility

- MySQLプロトコルの結果カラムでデータベース名、テーブル名、元の名前を正しく設定するようになりました。[#38126](https://github.com/apache/doris/pull/38126)

- ヒントフォーマット`/*+ func(value) */`をサポートしました。[#37720](https://github.com/apache/doris/pull/37720)

### Query Optimizer

- 複雑なクエリのプラン速度を大幅に向上させました。[#38317](https://github.com/apache/doris/pull/38317)

- データバケット数に基づいてbucket shuffleの実行を適応的に選択し、極端なケースでのパフォーマンス劣化を回避しました。[#36784](https://github.com/apache/doris/pull/36784)

- SEMI / ANTI JOINのコスト推定ロジックを最適化しました。[#37951](https://github.com/apache/doris/pull/37951) [#37060](https://github.com/apache/doris/pull/37060)

- パフォーマンス向上のため、集約の第一段階へのLimit押し下げをサポートしました。[#34853](https://github.com/apache/doris/pull/34853)

- パーティションプルーニングで`date_trunc`または`date`関数を含むフィルタ条件をサポートしました。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- SQLキャッシュでユーザー変数を含むクエリシナリオをサポートしました。[#37915](https://github.com/apache/doris/pull/37915)

- 無効な集約セマンティクスのエラーメッセージを最適化しました。[#38122](https://github.com/apache/doris/pull/38122)

### Query Execution

- 2.1から3.xまでのAggState互換性を適応させ、Coredumpの問題を修正しました。[#37104](https://github.com/apache/doris/pull/37104)

- Join なしのローカルシャッフルの戦略選択をリファクタリングしました。[#37282](https://github.com/apache/doris/pull/37282)

- 内部テーブルクエリのスキャナを非同期に変更し、そのようなクエリ中のストールを防ぎました。[#38403](https://github.com/apache/doris/pull/38403)

- Join演算子のハッシュテーブル構築中のブロックマージプロセスを最適化しました。[#37471](https://github.com/apache/doris/pull/37471)

- MultiCastのロック保持時間を最適化しました。[#37462](https://github.com/apache/doris/pull/37462)

- gRPC keepAliveTimeを最適化し、リンク監視を追加してRPCエラーによるクエリ失敗の可能性を削減しました。[#37304](https://github.com/apache/doris/pull/37304)

- メモリ制限を超えた際にjemallocの全てのダーティページをクリーンアップしました。[#37164](https://github.com/apache/doris/pull/37164)

- 定数型の`aes_encrypt`/`decrypt`関数の処理パフォーマンスを最適化しました。[#37194](https://github.com/apache/doris/pull/37194)

- 定数データの`json_extract`関数の処理パフォーマンスを最適化しました。[#36927](https://github.com/apache/doris/pull/36927)

- 定数データの`ParseUrl`関数の処理パフォーマンスを最適化しました。[#36882](https://github.com/apache/doris/pull/36882)

### Semi-Structured Data Management

- ビットマップインデックスがデフォルトで転置インデックスを使用するようになり、`enable_create_bitmap_index_as_inverted_index`がデフォルトでtrueに設定されました。[#36692](https://github.com/apache/doris/pull/36692)

- compute-storage decoupledモードで、DESCによりVARIANT型のサブカラムを表示できるようになりました。[#38143](https://github.com/apache/doris/pull/38143)

- リモートストレージへのアクセス遅延を削減するため、転置インデックスクエリ中のファイル存在チェックステップを除去しました。[#36945](https://github.com/apache/doris/pull/36945)

- 複雑型ARRAY / MAP / STRUCTで、AGGテーブルの`replace_if_not_null`をサポートしました。[#38304](https://github.com/apache/doris/pull/38304)

- JSONデータのエスケープ文字をサポートしました。[#37176](https://github.com/apache/doris/pull/37176) [#37251](https://github.com/apache/doris/pull/37251)

- 転置インデックスクエリがMOWテーブルとDUPテーブルで一致した動作をするようになりました。[#37428](https://github.com/apache/doris/pull/37428)

- INクエリの転置インデックス高速化のパフォーマンスを最適化しました。[#37395](https://github.com/apache/doris/pull/37395)

- TOPNクエリ中の不要なメモリ割り当てを削減し、パフォーマンスを向上させました。[#37429](https://github.com/apache/doris/pull/37429)

- トークン化による転置インデックス作成時に、`match_phrase`シリーズの句クエリを高速化するため`support_phrase`オプションが自動的に有効になりました。[#37949](https://github.com/apache/doris/pull/37949)

### Other

- 監査ログでSQL型を記録できるようになりました。[#37790](https://github.com/apache/doris/pull/37790)

- 全てのFEを表示する`information_schema.processlist`のサポートを追加しました。[#38701](https://github.com/apache/doris/pull/38701)

- クエリ効率を高速化するため、rangerの`atamask`と`rowpolicy`をキャッシュしました。[#37723](https://github.com/apache/doris/pull/37723)

- job managerのメタデータ管理を最適化し、メタデータ変更後すぐにロックを解放し、ロック保持時間を削減しました。[#38162](https://github.com/apache/doris/pull/38162)



## バグ修正

### Upgrade

- バージョン2.1からのアップグレード中に`mtmv load`が失敗する問題を修正しました。[#38799](https://github.com/apache/doris/pull/38799)

- バージョン2.1へのアップグレード中に`null_type`が見つからない問題を解決しました。[#39373](https://github.com/apache/doris/pull/39373)

- バージョン2.1から3.0へのアップグレード中の権限永続化の互換性問題を解決しました。[#39288](https://github.com/apache/doris/pull/39288)

### Load

- CSVフォーマット解析で改行文字が区切り文字で囲まれている際の解析失敗問題を修正しました。[#38347](https://github.com/apache/doris/pull/38347)
- FEがグループコミットを転送する際の潜在的例外問題を解決しました。[#38228](https://github.com/apache/doris/pull/38228) [#38265](https://github.com/apache/doris/pull/38265)

- グループコミットで新しいオプティマイザーをサポートしました。[#37002](https://github.com/apache/doris/pull/37002)

- JDBC setNullを使用する際のグループコミットでのデータエラー問題を修正しました。[#38262](https://github.com/apache/doris/pull/38262)

- `delete bitmap lock`エラー遭遇時のグループコミットの再試行ロジックを最適化しました。[#37600](https://github.com/apache/doris/pull/37600)

- ルーチンロードでCSV区切り文字とエスケープ文字を使用できない問題を解決しました。[#38402](https://github.com/apache/doris/pull/38402)

- 大文字小文字混在のルーチンロードジョブ名を表示できない問題を修正しました。[#38523](https://github.com/apache/doris/pull/38523)

- FEマスター・スレーブ切り替え中のルーチンロードの能動的回復ロジックを最適化しました。[#37876](https://github.com/apache/doris/pull/37876)

- Kafka内の全データが期限切れの際にルーチンロードが一時停止する問題を解決しました。[#37288](https://github.com/apache/doris/pull/37288)

- `show routine load`が空の結果を返す問題を修正しました。[#38199](https://github.com/apache/doris/pull/38199)

- ルーチンロードでのマルチテーブルストリームインポート中のメモリリーク問題を解決しました。[#38255](https://github.com/apache/doris/pull/38255)

- ストリームロードでエラーURLを返さない問題を修正しました。[#38325](https://github.com/apache/doris/pull/38325)

- 潜在的なロードチャネルリーク問題を解決しました。[#38031](https://github.com/apache/doris/pull/38031) [#37500](https://github.com/apache/doris/pull/37500)

- 期待されるセグメント数より少なくインポートする際にエラーが報告されない場合がある問題を修正しました。[#36753](https://github.com/apache/doris/pull/36753)

- ロードストリームリーク問題を解決しました。[#38912](https://github.com/apache/doris/pull/38912)

- オフラインノードのインポート操作への影響を最適化しました。[#38198](https://github.com/apache/doris/pull/38198)

- 空データへの挿入時にトランザクションが終了しない問題を修正しました。[#38991](https://github.com/apache/doris/pull/38991)

### Storage

**01 Backup and Restoration**

- バックアップと復元後にテーブルに書き込みができない問題を修正しました。[#37089](https://github.com/apache/doris/pull/37089)

- バックアップと復元後にビューデータベース名が正しくない問題を解決しました。[#37412](https://github.com/apache/doris/pull/37412)

**02 Compaction**

- 順序データ圧縮中にcumu compactionが削除エラーを正しく処理しない問題を修正しました。[#38742](https://github.com/apache/doris/pull/38742)

- 順次圧縮最適化により集約テーブルで重複キーが発生する問題を解決しました。[#38224](https://github.com/apache/doris/pull/38224)

- 大規模ワイドテーブルで圧縮操作がcoredumpを引き起こす問題を修正しました。[#37960](https://github.com/apache/doris/pull/37960)

- 圧縮タスクの不正確な並行統計により引き起こされる圧縮飢餓問題を解決しました。[#37318](https://github.com/apache/doris/pull/37318)

**03 MOW Unique Key**

- delete signの累積圧縮削除によりレプリカ間でデータの不整合が発生する問題を解決しました。[#37950](https://github.com/apache/doris/pull/37950)

- MOW deleteが新しいオプティマイザーで部分カラム更新を使用するようになりました。[#38751](https://github.com/apache/doris/pull/38751)

- compute-storage decoupled下でのMOWテーブルの潜在的重複キー問題を修正しました。[#39018](https://github.com/apache/doris/pull/39018)

- MOWユニークテーブルと重複テーブルでカラムの順序を変更できない問題を解決しました。[#37067](https://github.com/apache/doris/pull/37067)

- segcompactionによる潜在的データ正確性問題を修正しました。[#37760](https://github.com/apache/doris/pull/37760)

- カラム更新中の潜在的メモリリーク問題を解決しました。[#37706](https://github.com/apache/doris/pull/37706)

**04 Other**

- TOPNクエリで小さな確率で例外が発生する問題を修正しました。[#39119](https://github.com/apache/doris/pull/39119) [#39199](https://github.com/apache/doris/pull/39199)

- FE再起動時に自動インクリメントIDが重複する可能性がある問題を解決しました。[#37306](https://github.com/apache/doris/pull/37306)

- 削除操作の優先度キューでの潜在的キューイング問題を修正しました。[#37169](https://github.com/apache/doris/pull/37169)

- 削除再試行ロジックを最適化しました。[#37363](https://github.com/apache/doris/pull/37363)

- 新しいオプティマイザー下でのテーブル作成文での`bucket = 0`問題を解決しました。[#38971](https://github.com/apache/doris/pull/38971)

- イメージ生成失敗時にFEが成功を誤って報告する問題を修正しました。[#37508](https://github.com/apache/doris/pull/37508)

- FEオフラインノード時に間違ったnodenameを使用することでFEメンバーの不整合が発生する可能性がある問題を解決しました。[#37987](https://github.com/apache/doris/pull/37987)

- CCRパーティション追加が失敗する可能性がある問題を修正しました。[#37295](https://github.com/apache/doris/pull/37295)

- 転置インデックスファイルでの`int32`オーバーフロー問題を解決しました。[#38891](https://github.com/apache/doris/pull/38891)

- TRUNCATE TABLE失敗がBEのオフライン失敗を引き起こす可能性がある問題を修正しました。[#37334](https://github.com/apache/doris/pull/37334)

- nullポインターによりpublishが継続できない問題を解決しました。[#37724](https://github.com/apache/doris/pull/37724) [#37531](https://github.com/apache/doris/pull/37531)

- ディスク移行を手動でトリガーする際の潜在的coredump問題を修正しました。[#37712](https://github.com/apache/doris/pull/37712)

### Compute-Storage Decoupled

- `show create table`で`file_cache_ttl_seconds`属性が2回表示される可能性がある問題を修正しました。[#38052](https://github.com/apache/doris/pull/38052)

- ファイルキャッシュTTL設定後にsegment Footer TTLが正しく設定されない問題を修正しました。[#37485](https://github.com/apache/doris/pull/37485)

- ファイルキャッシュでキャッシュ型の大量変換によりcoredumpが発生する可能性がある問題を修正しました。[#38518](https://github.com/apache/doris/pull/38518)

- ファイルキャッシュでの潜在的ファイルディスクリプタ（fd）リークを修正
