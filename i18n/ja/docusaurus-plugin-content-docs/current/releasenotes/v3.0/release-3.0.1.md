---
{
  "title": "リリース 3.0.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.1バージョンは2024年8月23日に正式リリースされました。"
}
---
コミュニティメンバーの皆様へ、Apache Doris 3.0.1バージョンが2024年8月23日に正式リリースされました。このバージョンでは、コンピュート・ストレージ分離、レイクハウス、半構造化データ分析、非同期マテリアライズドビューなどの機能において更新と改善が行われています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

### クエリオプティマイザ

- `CREATE TABLE AS SELECT`（CTAS）操作実行時のVARCHAR型の長さ動作を制御する変数`use_max_length_of_varchar_in_ctas`を追加しました。[#37069](https://github.com/apache/doris/pull/37069)
  
  - この変数はデフォルトでtrueに設定されています。
  
  - trueに設定された場合、VARCHAR型カラムがテーブルに由来する場合は導出された長さが使用され、そうでなければ最大長が使用されます。
  
  - falseに設定された場合、VARCHAR型は常に導出された長さを使用します。

- すべてのデータ型がMySQL形式との互換性を維持するため小文字で表示されるようになりました。[#38012](https://github.com/apache/doris/pull/38012)

- 同一クエリリクエスト内の複数のクエリステートメントは、セミコロンで区切る必要があります。[#38670](https://github.com/apache/doris/pull/38670)

### クエリ実行

- クラスター内のshuffle操作後の並列タスクのデフォルト数を100に設定しました。これにより大規模クラスターでのクエリ安定性と並行処理能力が向上します。[#38196](https://github.com/apache/doris/pull/38196)

### ストレージ

- `trash_file_expire_time_sec`のデフォルト値を86400秒から0秒に変更しました。これは、ファイルが誤って削除され、FEのゴミ箱がクリアされた場合、データを復旧できないことを意味します。

- テーブル属性`enable_mow_delete_on_delete_predicate`（バージョン3.0.0で導入）を`enable_mow_light_delete`に変更しました。

- 書き込まれたデータを含むテーブルでの明示的なトランザクションによる削除操作は禁止されました。

- 自動増分フィールドを持つテーブルでのHeavyスキーマ変更操作は禁止されました。



## 新機能

### ジョブスケジューリング

- 内部スケジューリングジョブの実行ロジックを最適化し、開始時間と即座実行パラメータ間の強い関連を分離しました。これにより、指定開始時間でのタスク作成または即座実行選択が競合することなく可能になり、スケジューリングの柔軟性が向上しました。[#36805](https://github.com/apache/doris/pull/36805)

### コンピュート・ストレージ分離

- ファイルキャッシュ使用量の上限の動的変更をサポートしました。[#37484](https://github.com/apache/doris/pull/37484)

- Recyclerがオブジェクトストレージレート制限とサーバーサイドレート制限のリトライ機能をサポートしました。[#37663](https://github.com/apache/doris/pull/37663) [#37680](https://github.com/apache/doris/pull/37680)

### レイクハウス

- 複合型の出力形式を設定するセッション変数`serde_dialect`を追加しました。[#37039](https://github.com/apache/doris/pull/37039)

- SQLインターセプトが外部テーブルをサポートしました。

  - 詳細については、[SQLインターセプション](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception)のドキュメントを参照してください。

- Insert overwriteがIcebergテーブルをサポートしました。[#37191](https://github.com/apache/doris/pull/37191)

### 非同期マテリアライズドビュー

- 時間単位でのパーティションロールアップと構築をサポートしました。[#37678](https://github.com/apache/doris/pull/37678)

- 非同期マテリアライズドビュー定義ステートメントのアトミック置換をサポートしました。[#36749](https://github.com/apache/doris/pull/36749)

- 透過リライトがInsertステートメントをサポートしました。[#38115](https://github.com/apache/doris/pull/38115)

- 透過リライトがVARIANT型をサポートしました。[#37929](https://github.com/apache/doris/pull/37929)

### クエリ実行

- group concat関数がDISTINCTとORDER BYオプションをサポートしました。[#38744](https://github.com/apache/doris/pull/38744)

### 半構造化データ管理

- ES カタログがElasticsearchの`nested`または`object`型をDorisのJSON型にマップするようになりました。[#37101](https://github.com/apache/doris/pull/37101)

- 複数フィールド間でのキーワードマッチングをサポートし、転置インデックスを活用して検索を高速化できる`MULTI_MATCH`関数を追加しました。[#37722](https://github.com/apache/doris/pull/37722)

- JSONデータ内のオブジェクトを複数行に展開できる`explode_json_object`関数を追加しました。[#36887](https://github.com/apache/doris/pull/36887)

- 転置インデックスがmemtable前進をサポートし、マルチレプリカ書き込み時にインデックス構築を一度だけ行えば済むようになり、CPU消費量を削減し、パフォーマンスが向上しました。[#35891](https://github.com/apache/doris/pull/35891)

- 正のslopをサポートする`MATCH_PHRASE`を追加しました。例えば、`msg MATCH_PHRASE 'a b 2+'`は最大2のslopでaとbの単語を含み、bが前に来るインスタンスにマッチできます。最後に`+`がない通常のslopではこの順序は保証されません。[#36356](https://github.com/apache/doris/pull/36356)

### その他

- この設定で指定されたユーザー操作が監査ログに記録されないFEパラメータ`skip_audit_user_list`を追加しました。[#38310](https://github.com/apache/doris/pull/38310)

  - 詳細については、[監査プラグイン](https://doris.apache.org/docs/admin-manual/audit-plugin/)のドキュメントを参照してください。



## 改善

### ストレージ

- 単一BE内でのディスクバランシングによる書き込み失敗の可能性を低減しました。[#38000](https://github.com/apache/doris/pull/38000)

- memtableリミッターのメモリ消費量を削減しました。[#37511](https://github.com/apache/doris/pull/37511)

- パーティション置換操作中に古いパーティションをFEゴミ箱に移動するようになりました。[#36361](https://github.com/apache/doris/pull/36361)

- compaction中のメモリ消費量を最適化しました。[#37099](https://github.com/apache/doris/pull/37099)

- JDBC PreparedStatementの監査ログを制御するセッション変数を追加し、デフォルト設定では出力しません。[#38419](https://github.com/apache/doris/pull/38419)

- グループコミットのBE選択ロジックを最適化しました。[#35558](https://github.com/apache/doris/pull/35558)

- カラム更新のパフォーマンスを向上しました。[#38487](https://github.com/apache/doris/pull/38487)

- `delete bitmap cache`の使用を最適化しました。[#38761](https://github.com/apache/doris/pull/38761)

- ホット・コールドティアリング中のクエリアフィニティを制御する設定を追加しました。[#37492](https://github.com/apache/doris/pull/37492)

### コンピュート・ストレージ分離

- オブジェクトストレージサーバーのレート制限に遭遇した際の自動リトライを実装しました。[#37199](https://github.com/apache/doris/pull/37199)

- コンピュート・ストレージ分離モードでmemtableフラッシュのスレッド数を調整しました。[#38789](https://github.com/apache/doris/pull/38789)

- Azureサポートなしの環境でのコンパイルをサポートするため、Azureをコンパイルオプションとして追加しました。

- オブジェクトストレージアクセスレート制限の可観測性を最適化しました。[#38294](https://github.com/apache/doris/pull/38294)

- ファイルキャッシュTTLキューでLRU削除を実行できるようにし、TTLキューの使いやすさを向上しました。[#37312](https://github.com/apache/doris/pull/37312)

- ストレージ・コンピュート分離モードでのbalance writeeditlog IO操作の回数を最適化しました。[#37787](https://github.com/apache/doris/pull/37787)

- タブレット作成リクエストをバッチで送信することで、ストレージ・コンピュート分離モードでのテーブル作成速度を向上しました。[#36786](https://github.com/apache/doris/pull/36786)

- バックオフリトライを通じて、ローカルファイルキャッシュの潜在的な不整合により生じる読み込み失敗を最適化しました。[#38645](https://github.com/apache/doris/pull/38645)

### レイクハウス

- Parquet/ORC形式の読み書き操作のメモリ統計を最適化しました。[#37234](https://github.com/apache/doris/pull/37234)

- Trino Connector カタログが述語プッシュダウンをサポートしました。[#37874](https://github.com/apache/doris/pull/37874)

- 外部テーブルの`count(*)`プッシュダウン最適化を有効にするかどうかを制御するセッション変数`enable_count_push_down_for_external_table`を追加しました。[#37046](https://github.com/apache/doris/pull/37046)

- Hudiスナップショット読み込みの読み込みロジックを最適化し、スナップショットが空の場合は空のセットを返すようにしました。これはSparkの動作と一致しています。[#37702](https://github.com/apache/doris/pull/37702)

- Hiveテーブルのパーティションカラムの読み込みパフォーマンスを向上しました。[#37377](https://github.com/apache/doris/pull/37377)

### 非同期マテリアライズドビュー

- 透過リライトプランの速度を20%向上しました。[#37197](https://github.com/apache/doris/pull/37197)

- グループキーがデータの一意性を満たす場合、よりよいネストマッチングのために透過リライト中のロールアップを排除しました。[#38387](https://github.com/apache/doris/pull/38387)

- 透過リライトがよりよい集約削除を実行し、ネストしたマテリアライズドビューのマッチング成功率を向上しました。[#36888](https://github.com/apache/doris/pull/36888)

### MySQL互換性

- MySQLプロトコルの結果カラムでデータベース名、テーブル名、元の名前を正しく入力するようになりました。[#38126](https://github.com/apache/doris/pull/38126)

- ヒント形式`/*+ func(value) */`をサポートしました。[#37720](https://github.com/apache/doris/pull/37720)

### クエリオプティマイザ

- 複雑なクエリのプラン速度を大幅に向上しました。[#38317](https://github.com/apache/doris/pull/38317)

- データバケット数に基づいてバケットshuffleを実行するかどうかを適応的に選択し、極端な場合のパフォーマンス低下を回避しました。[#36784](https://github.com/apache/doris/pull/36784)

- SEMI / ANTI JOINのコスト推定ロジックを最適化しました。[#37951](https://github.com/apache/doris/pull/37951) [#37060](https://github.com/apache/doris/pull/37060)

- パフォーマンス向上のため、集約の第一段階にLimitをプッシュダウンすることをサポートしました。[#34853](https://github.com/apache/doris/pull/34853)

- パーティションプルーニングが`date_trunc`または`date`関数を含むフィルター条件をサポートしました。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- SQLキャッシュがユーザー変数を含むクエリシナリオをサポートしました。[#37915](https://github.com/apache/doris/pull/37915)

- 無効な集約セマンティクスのエラーメッセージを最適化しました。[#38122](https://github.com/apache/doris/pull/38122)

### クエリ実行

- 2.1から3.xへのAggState互換性を適用し、Coredumpの問題を修正しました。[#37104](https://github.com/apache/doris/pull/37104)

- Join無しのローカルシャッフル戦略選択をリファクタリングしました。[#37282](https://github.com/apache/doris/pull/37282)

- 内部テーブルクエリ中の停滞を防ぐため、内部テーブルクエリ用のスキャナーを非同期に変更しました。[#38403](https://github.com/apache/doris/pull/38403)

- Join演算子のハッシュテーブル構築中のブロック結合プロセスを最適化しました。[#37471](https://github.com/apache/doris/pull/37471)

- MultiCastのロック保持時間を最適化しました。[#37462](https://github.com/apache/doris/pull/37462)

- gRPC keepAliveTimeを最適化し、リンク監視を追加してRPCエラーによるクエリ失敗の確率を低減しました。[#37304](https://github.com/apache/doris/pull/37304)

- メモリ制限を超えた場合にjemallocのすべてのダーティページをクリーンアップしました。[#37164](https://github.com/apache/doris/pull/37164)

- 定数型に対する`aes_encrypt`/`decrypt`関数の処理パフォーマンスを最適化しました。[#37194](https://github.com/apache/doris/pull/37194)

- 定数データに対する`json_extract`関数の処理パフォーマンスを最適化しました。[#36927](https://github.com/apache/doris/pull/36927)

- 定数データに対する`ParseUrl`関数の処理パフォーマンスを最適化しました。[#36882](https://github.com/apache/doris/pull/36882)

### 半構造化データ管理

- ビットマップインデックスがデフォルトで転置インデックスを使用するようになり、`enable_create_bitmap_index_as_inverted_index`がデフォルトでtrueに設定されました。[#36692](https://github.com/apache/doris/pull/36692)

- コンピュート・ストレージ分離モードで、DESCでVARIANT型のサブカラムを表示できるようになりました。[#38143](https://github.com/apache/doris/pull/38143)

- リモートストレージへのアクセス遅延を削減するため、転置インデックスクエリ中のファイル存在確認ステップを削除しました。[#36945](https://github.com/apache/doris/pull/36945)

- 複合型 ARRAY / MAP / STRUCT がAGGテーブルで`replace_if_not_null`をサポートしました。[#38304](https://github.com/apache/doris/pull/38304)

- JSONデータのエスケープ文字がサポートされました。[#37176](https://github.com/apache/doris/pull/37176) [#37251](https://github.com/apache/doris/pull/37251)

- 転置インデックスクエリがMOWテーブルとDUPテーブルで一貫した動作をするようになりました。[#37428](https://github.com/apache/doris/pull/37428)

- INクエリの転置インデックス加速のパフォーマンスを最適化しました。[#37395](https://github.com/apache/doris/pull/37395)

- TOPNクエリ中の不要なメモリ割り当てを削減し、パフォーマンスを向上しました。[#37429](https://github.com/apache/doris/pull/37429)

- トークン化による転置インデックス作成時、`match_phrase`シリーズの句検索を加速するため`support_phrase`オプションが自動的に有効になります。[#37949](https://github.com/apache/doris/pull/37949)

### その他

- 監査ログがSQL型を記録できるようになりました。[#37790](https://github.com/apache/doris/pull/37790)

- すべてのFEを表示する`information_schema.processlist`のサポートを追加しました。[#38701](https://github.com/apache/doris/pull/38701)

- クエリ効率を加速するためrangerの`atamask`と`rowpolicy`をキャッシュしました。[#37723](https://github.com/apache/doris/pull/37723)

- ジョブマネージャーのメタデータ管理を最適化し、メタデータ変更後にロックを即座に解放してロック保持時間を削減しました。[#38162](https://github.com/apache/doris/pull/38162)



## バグ修正

### アップグレード

- バージョン2.1からのアップグレード中に`mtmv load`が失敗する問題を修正しました。[#38799](https://github.com/apache/doris/pull/38799)

- バージョン2.1へのアップグレード中に`null_type`が見つからない問題を解決しました。[#39373](https://github.com/apache/doris/pull/39373)

- バージョン2.1から3.0へのアップグレード中の権限持続性の互換性問題を解決しました。[#39288](https://github.com/apache/doris/pull/39288)

### ロード

- CSV形式解析で改行文字が区切り文字に囲まれている場合の解析失敗問題を修正しました。[#38347](https://github.com/apache/doris/pull/38347)
- FEのグループコミット転送時の潜在的例外問題を解決しました。[#38228](https://github.com/apache/doris/pull/38228) [#38265](https://github.com/apache/doris/pull/38265)

- グループコミットが新しいオプティマイザをサポートしました。[#37002](https://github.com/apache/doris/pull/37002)

- JDBC setNullを使用した際にグループコミットがデータエラーを報告する問題を修正しました。[#38262](https://github.com/apache/doris/pull/38262)

- `delete bitmap lock`エラーに遭遇した際のグループコミットのリトライロジックを最適化しました。[#37600](https://github.com/apache/doris/pull/37600)

- ルーチンロードがCSVデリミタとエスケープ文字を使用できない問題を解決しました。[#38402](https://github.com/apache/doris/pull/38402)

- 大文字小文字が混在するルーチンロードジョブ名が表示できない問題を修正しました。[#38523](https://github.com/apache/doris/pull/38523)

- FEマスター・スレーブ切り替え時のルーチンロードのアクティブ復旧ロジックを最適化しました。[#37876](https://github.com/apache/doris/pull/37876)

- Kafkaのすべてのデータが期限切れになった際にルーチンロードが一時停止する問題を解決しました。[#37288](https://github.com/apache/doris/pull/37288)

- `show routine load`が空の結果を返す問題を修正しました。[#38199](https://github.com/apache/doris/pull/38199)

- ルーチンロードでのマルチテーブルストリームインポート中のメモリリーク問題を解決しました。[#38255](https://github.com/apache/doris/pull/38255)

- ストリームロードがエラーURLを返さない問題を修正しました。[#38325](https://github.com/apache/doris/pull/38325)

- 潜在的なロードチャネルリーク問題を解決しました。[#38031](https://github.com/apache/doris/pull/38031) [#37500](https://github.com/apache/doris/pull/37500)

- 期待値より少ないセグメントをインポートした際にエラーが報告されない可能性がある問題を修正しました。[#36753](https://github.com/apache/doris/pull/36753)

- ロードストリームリーク問題を解決しました。[#38912](https://github.com/apache/doris/pull/38912)

- オフラインノードがインポート操作に与える影響を最適化しました。[#38198](https://github.com/apache/doris/pull/38198)

- 空のデータを挿入した際にトランザクションが終了しない問題を修正しました。[#38991](https://github.com/apache/doris/pull/38991)

### ストレージ

**01 バックアップと復元**

- バックアップと復元後にテーブルが書き込めない問題を修正しました。[#37089](https://github.com/apache/doris/pull/37089)

- バックアップと復元後にビューデータベース名が間違っている問題を解決しました。[#37412](https://github.com/apache/doris/pull/37412)

**02 Compaction**

- 順序データ圧縮中にcumu compactionが削除エラーを正しく処理しない問題を修正しました。[#38742](https://github.com/apache/doris/pull/38742)

- 順次圧縮最適化により引き起こされる集約テーブルでの重複キー問題を解決しました。[#38224](https://github.com/apache/doris/pull/38224)

- 大規模な幅広テーブルで圧縮操作がcoredumpを引き起こす問題を修正しました。[#37960](https://github.com/apache/doris/pull/37960)

- 圧縮タスクの不正確な同時統計により引き起こされる圧縮餓死問題を解決しました。[#37318](https://github.com/apache/doris/pull/37318)

**03 MOW Unique Key**

- delete signの累積圧縮削除により引き起こされるレプリカ間データ不整合問題を解決しました。[#37950](https://github.com/apache/doris/pull/37950)

- MOW deleteが新しいオプティマイザで部分カラム更新を使用するようになりました。[#38751](https://github.com/apache/doris/pull/38751)

- コンピュート・ストレージ分離下でのMOWテーブルの潜在的重複キー問題を修正しました。[#39018](https://github.com/apache/doris/pull/39018)

- MOW uniqueテーブルとduplicateテーブルがカラム順序を変更できない問題を解決しました。[#37067](https://github.com/apache/doris/pull/37067)

- segcompactionにより引き起こされる潜在的データ正確性問題を修正しました。[#37760](https://github.com/apache/doris/pull/37760)

- カラム更新中の潜在的メモリリーク問題を解決しました。[#37706](https://github.com/apache/doris/pull/37706)

**04 その他**

- TOPNクエリでの低確率例外を修正しました。[#39119](https://github.com/apache/doris/pull/39119) [#39199](https://github.com/apache/doris/pull/39199)

- FE再起動時に自動増分IDが重複する可能性がある問題を解決しました。[#37306](https://github.com/apache/doris/pull/37306)

- 削除操作の優先キューでの潜在的キューイング問題を修正しました。[#37169](https://github.com/apache/doris/pull/37169)

- 削除リトライロジックを最適化しました。[#37363](https://github.com/apache/doris/pull/37363)

- 新しいオプティマイザ下でのテーブル作成ステートメントの`bucket = 0`問題を解決しました。[#38971](https://github.com/apache/doris/pull/38971)

- イメージ生成失敗時にFEが成功を間違って報告する問題を修正しました。[#37508](https://github.com/apache/doris/pull/37508)

- FEオフラインノード時の間違ったnodename使用によりFEメンバーの不整合を引き起こす可能性がある問題を解決しました。[#37987](https://github.com/apache/doris/pull/37987)

- CCRパーティション追加が失敗する可能性がある問題を修正しました。[#37295](https://github.com/apache/doris/pull/37295)

- 転置インデックスファイルの`int32`オーバーフロー問題を解決しました。[#38891](https://github.com/apache/doris/pull/38891)

- TRUNCATE TABLE失敗によりBEがオフラインにできなくなる問題を修正しました。[#37334](https://github.com/apache/doris/pull/37334)

- nullポインターによりpublishが継続できない問題を解決しました。[#37724](https://github.com/apache/doris/pull/37724) [#37531](https://github.com/apache/doris/pull/37531)

- 手動でディスク移行をトリガーした際の潜在的coredump問題を修正しました。[#37712](https://github.com/apache/doris/pull/37712)

### コンピュート・ストレージ分離

- `show create table`で`file_cache_ttl_seconds`属性が2回表示される可能性がある問題を修正しました。[#38052](https://github.com/apache/doris/pull/38052)

- ファイルキャッシュ
