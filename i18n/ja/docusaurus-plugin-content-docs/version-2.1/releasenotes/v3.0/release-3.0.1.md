---
{
  "title": "リリース 3.0.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.1バージョンは2024年8月23日に正式にリリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.1バージョンが2024年8月23日に正式にリリースされました。このバージョンでは、コンピュート・ストレージ分離、レイクハウス、半構造化データ分析、非同期マテリアライズドビュー等の機能において更新と改善が行われています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

### クエリオプティマイザー

- `CREATE TABLE AS SELECT`（CTAS）操作を実行する際のVARCHAR型の長さ動作を制御するための変数`use_max_length_of_varchar_in_ctas`が追加されました。[#37069](https://github.com/apache/doris/pull/37069)
  
  - この変数はデフォルトでtrueに設定されています。
  
  - trueに設定すると、VARCHAR型カラムがテーブル由来の場合は導出された長さが使用され、そうでなければ最大長が使用されます。
  
  - falseに設定すると、VARCHAR型は常に導出された長さを使用します。

- MySQL形式との互換性を保つため、すべてのデータ型が小文字で表示されるようになりました。[#38012](https://github.com/apache/doris/pull/38012)

- 同一クエリリクエスト内の複数のクエリステートメントは、セミコロンで区切る必要があります。[#38670](https://github.com/apache/doris/pull/38670)

### クエリ実行

- クラスタ内のshuffle操作後のデフォルト並列タスク数が100に設定され、大規模クラスタでのクエリ安定性と並行処理能力が向上しました。[#38196](https://github.com/apache/doris/pull/38196)

### ストレージ

- `trash_file_expire_time_sec`のデフォルト値が86400秒から0秒に変更されました。これは、ファイルが誤って削除されFEトラッシュがクリアされた場合、データが回復できないことを意味します。

- テーブル属性`enable_mow_delete_on_delete_predicate`（バージョン3.0.0で導入）が`enable_mow_light_delete`に名前変更されました。

- 明示的なトランザクションでは、データが書き込まれたテーブルに対する削除操作が禁止されました。

- 自動増分フィールドを持つテーブルでの重いスキーマ変更操作が禁止されました。

## 新機能

### ジョブスケジューリング

- 内部スケジューリングジョブの実行ロジックが最適化され、開始時間と即座実行パラメーターとの強い関連性が分離されました。現在、指定された開始時間でのタスク作成や即座実行の選択が競合なく実行でき、スケジューリングの柔軟性が向上しました。[#36805](https://github.com/apache/doris/pull/36805)

### コンピュート・ストレージ分離

- ファイルキャッシュ使用量の上限の動的変更をサポートしました。[#37484](https://github.com/apache/doris/pull/37484)

- Recyclerがオブジェクトストレージのレート制限とサーバーサイドレート制限リトライ機能をサポートしました。[#37663](https://github.com/apache/doris/pull/37663) [#37680](https://github.com/apache/doris/pull/37680)

### レイクハウス

- 複合型の出力形式を設定するためのセッション変数`serde_dialect`が追加されました。[#37039](https://github.com/apache/doris/pull/37039)

- SQLインターセプションが外部テーブルをサポートしました。

  - 詳細については、[SQL Interception](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception)のドキュメントを参照してください。

- Insert overwriteがIcebergテーブルをサポートしました。[#37191](https://github.com/apache/doris/pull/37191)

### 非同期マテリアライズドビュー

- 時間レベルでのパーティションロールアップと構築をサポートしました。[#37678](https://github.com/apache/doris/pull/37678)

- 非同期マテリアライズドビュー定義文のアトミック置換をサポートしました。[#36749](https://github.com/apache/doris/pull/36749)

- 透過的リライティングがInsert文をサポートしました。[#38115](https://github.com/apache/doris/pull/38115)

- 透過的リライティングがVARIANT型をサポートしました。[#37929](https://github.com/apache/doris/pull/37929)

### クエリ実行

- group concat関数がDISTINCTとORDER BYオプションをサポートしました。[#38744](https://github.com/apache/doris/pull/38744)

### 半構造化データ管理

- ES CatalogがElasticsearchの`nested`または`object`型をDorisのJSON型にマッピングするようになりました。[#37101](https://github.com/apache/doris/pull/37101)

- 複数フィールド間でのキーワードマッチングをサポートし、転置インデックスを活用して検索を高速化する`MULTI_MATCH`関数が追加されました。[#37722](https://github.com/apache/doris/pull/37722)

- JSONデータ内のオブジェクトを複数の行に展開する`explode_json_object`関数が追加されました。[#36887](https://github.com/apache/doris/pull/36887)

- 転置インデックスがmemtable促進をサポートし、マルチレプリカ書き込み時にインデックス構築を一度だけ実行することでCPU消費を削減し、パフォーマンスを向上させました。[#35891](https://github.com/apache/doris/pull/35891)

- 正のスロープに対する`MATCH_PHRASE`サポートが追加されました。例：`msg MATCH_PHRASE 'a b 2+'`は、スロープが2以下でaとbの単語を含み、bが前に来るインスタンスにマッチします。最後の`+`がない通常のスロープはこの順序を保証しません。[#36356](https://github.com/apache/doris/pull/36356)

### その他

- この設定で指定されたユーザー操作が監査ログに記録されないFEパラメーター`skip_audit_user_list`が追加されました。[#38310](https://github.com/apache/doris/pull/38310)

  - 詳細については、[Audit Plugin](https://doris.apache.org/docs/admin-manual/audit-plugin/)のドキュメントを参照してください。

## 改善

### ストレージ

- 単一BE内でのディスクバランシングによる書き込み失敗の可能性を減らしました。[#38000](https://github.com/apache/doris/pull/38000)

- memtable limiterのメモリ消費を削減しました。[#37511](https://github.com/apache/doris/pull/37511)

- パーティション置換操作時に古いパーティションをFEトラッシュに移動しました。[#36361](https://github.com/apache/doris/pull/36361)

- コンパクション時のメモリ消費を最適化しました。[#37099](https://github.com/apache/doris/pull/37099)

- JDBC PreparedStatementの監査ログを制御するセッション変数を追加し、デフォルトで出力しない設定にしました。[#38419](https://github.com/apache/doris/pull/38419)

- グループコミット用のBE選択ロジックを最適化しました。[#35558](https://github.com/apache/doris/pull/35558)

- カラム更新のパフォーマンスを向上させました。[#38487](https://github.com/apache/doris/pull/38487)

- `delete bitmap cache`の使用を最適化しました。[#38761](https://github.com/apache/doris/pull/38761)

- ホットコールド階層化時のクエリアフィニティを制御する設定を追加しました。[#37492](https://github.com/apache/doris/pull/37492)

### コンピュート・ストレージ分離

- オブジェクトストレージサーバーのレート制限に遭遇した際の自動リトライを実装しました。[#37199](https://github.com/apache/doris/pull/37199)

- コンピュート・ストレージ分離モードでmemtable flushのスレッド数を適応させました。[#38789](https://github.com/apache/doris/pull/38789)

- Azureサポートなしの環境でのコンパイルをサポートするため、Azureをコンパイルオプションとして追加しました。

- オブジェクトストレージアクセスレート制限の可観測性を最適化しました。[#38294](https://github.com/apache/doris/pull/38294)

- ファイルキャッシュTTLキューがLRU削除を実行できるようになり、TTLキューの使いやすさが向上しました。[#37312](https://github.com/apache/doris/pull/37312)

- ストレージ・コンピュート分離モードでのbalance writeeditlog IO操作数を最適化しました。[#37787](https://github.com/apache/doris/pull/37787)

- タブレット作成リクエストを一括送信することで、ストレージ・コンピュート分離モードでのテーブル作成速度を向上させました。[#36786](https://github.com/apache/doris/pull/36786)

- バックオフリトライにより、ローカルファイルキャッシュの潜在的な不整合による読み取り失敗を最適化しました。[#38645](https://github.com/apache/doris/pull/38645)

### レイクハウス

- Parquet/ORC形式の読み書き操作のメモリ統計を最適化しました。[#37234](https://github.com/apache/doris/pull/37234)

- Trino Connector Catalogが述語プッシュダウンをサポートしました。[#37874](https://github.com/apache/doris/pull/37874)

- 外部テーブルの`count(*)`プッシュダウン最適化を有効にするかを制御するセッション変数`enable_count_push_down_for_external_table`が追加されました。[#37046](https://github.com/apache/doris/pull/37046)

- Hudiスナップショット読み取りの読み取りロジックを最適化し、スナップショットが空の場合に空集合を返すようにし、Sparkの動作と一致させました。[#37702](https://github.com/apache/doris/pull/37702)

- Hiveテーブルのパーティションカラムの読み取りパフォーマンスを向上させました。[#37377](https://github.com/apache/doris/pull/37377)

### 非同期マテリアライズドビュー

- 透過的リライトプランの速度を20%向上させました。[#37197](https://github.com/apache/doris/pull/37197)

- より良いネストマッチングのため、グループキーがデータの一意性を満たす場合は透過的リライト時のロールアップを除去しました。[#38387](https://github.com/apache/doris/pull/38387)

- ネストしたマテリアライズドビューのマッチング成功率を向上させるため、透過的リライトでより良い集約除去を実行するようになりました。[#36888](https://github.com/apache/doris/pull/36888)

### MySQL互換性

- MySQL プロトコル結果カラムでデータベース名、テーブル名、元の名前を正しく設定するようになりました。[#38126](https://github.com/apache/doris/pull/38126)

- ヒント形式`/*+ func(value) */`をサポートしました。[#37720](https://github.com/apache/doris/pull/37720)

### クエリオプティマイザー

- 複雑なクエリのプラン速度を大幅に向上させました。[#38317](https://github.com/apache/doris/pull/38317)

- 極端なケースでのパフォーマンス劣化を避けるため、データバケット数に基づいてbucket shuffleを実行するかどうかを適応的に選択するようになりました。[#36784](https://github.com/apache/doris/pull/36784)

- SEMI / ANTI JOINのコスト推定ロジックを最適化しました。[#37951](https://github.com/apache/doris/pull/37951) [#37060](https://github.com/apache/doris/pull/37060)

- パフォーマンスを向上させるため、集約の第一段階にLimitをプッシュダウンすることをサポートしました。[#34853](https://github.com/apache/doris/pull/34853)

- パーティション プルーニングが`date_trunc`や`date`関数を含むフィルター条件をサポートしました。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- SQLキャッシュがユーザー変数を含むクエリシナリオをサポートしました。[#37915](https://github.com/apache/doris/pull/37915)

- 無効な集約セマンティクスのエラーメッセージを最適化しました。[#38122](https://github.com/apache/doris/pull/38122)

### クエリ実行

- 2.1から3.xへのAggState互換性を適応し、Coredump問題を修正しました。[#37104](https://github.com/apache/doris/pull/37104)

- Joinなしのローカルシャッフルの戦略選択をリファクタリングしました。[#37282](https://github.com/apache/doris/pull/37282)

- 内部テーブルクエリ中の停止を防ぐため、内部テーブルクエリのスキャナーを非同期に変更しました。[#38403](https://github.com/apache/doris/pull/38403)

- Join演算子のHashテーブル構築時のブロックマージプロセスを最適化しました。[#37471](https://github.com/apache/doris/pull/37471)

- MultiCastのロック保持時間を最適化しました。[#37462](https://github.com/apache/doris/pull/37462)

- gRPC keepAliveTimeを最適化し、リンク監視を追加してRPCエラーによるクエリ失敗確率を削減しました。[#37304](https://github.com/apache/doris/pull/37304)

- メモリ制限を超えた際にjemallocの全汚れページをクリーンアップしました。[#37164](https://github.com/apache/doris/pull/37164)

- 定数型の`aes_encrypt`/`decrypt`関数の処理パフォーマンスを最適化しました。[#37194](https://github.com/apache/doris/pull/37194)

- 定数データの`json_extract`関数の処理パフォーマンスを最適化しました。[#36927](https://github.com/apache/doris/pull/36927)

- 定数データの`ParseUrl`関数の処理パフォーマンスを最適化しました。[#36882](https://github.com/apache/doris/pull/36882)

### 半構造化データ管理

- Bitmapインデックスがデフォルトで転置インデックスを使用するようになり、`enable_create_bitmap_index_as_inverted_index`がデフォルトでtrueに設定されました。[#36692](https://github.com/apache/doris/pull/36692)

- コンピュート・ストレージ分離モードで、DESCがVARIANT型のサブカラムを表示できるようになりました。[#38143](https://github.com/apache/doris/pull/38143)

- リモートストレージへのアクセス遅延を削減するため、転置インデックスクエリ時のファイル存在確認ステップを削除しました。[#36945](https://github.com/apache/doris/pull/36945)

- 複合型ARRAY / MAP / STRUCTがAGGテーブルの`replace_if_not_null`をサポートしました。[#38304](https://github.com/apache/doris/pull/38304)

- JSONデータのエスケープ文字をサポートしました。[#37176](https://github.com/apache/doris/pull/37176) [#37251](https://github.com/apache/doris/pull/37251)

- 転置インデックスクエリがMOWテーブルとDUPテーブルで一貫した動作をするようになりました。[#37428](https://github.com/apache/doris/pull/37428)

- INクエリの転置インデックス高速化のパフォーマンスを最適化しました。[#37395](https://github.com/apache/doris/pull/37395)

- パフォーマンスを向上させるため、TOPNクエリ時の不要なメモリ割り当てを削減しました。[#37429](https://github.com/apache/doris/pull/37429)

- トークン化を伴う転置インデックスを作成する際、`match_phrase`シリーズのフレーズクエリを高速化するため、`support_phrase`オプションが自動で有効になりました。[#37949](https://github.com/apache/doris/pull/37949)

### その他

- 監査ログがSQL タイプを記録できるようになりました。[#37790](https://github.com/apache/doris/pull/37790)

- 全FEを表示する`information_schema.processlist`のサポートを追加しました。[#38701](https://github.com/apache/doris/pull/38701)

- クエリ効率を高速化するため、rangerの`atamask`と`rowpolicy`をキャッシュしました。[#37723](https://github.com/apache/doris/pull/37723)

- ジョブマネージャーでのメタデータ管理を最適化し、メタデータ変更後は即座にロックを解放してロック保持時間を削減しました。[#38162](https://github.com/apache/doris/pull/38162)

## バグ修正

### アップグレード

- バージョン2.1からのアップグレード時に`mtmv load`が失敗する問題を修正しました。[#38799](https://github.com/apache/doris/pull/38799)

- バージョン2.1へのアップグレード時に`null_type`が見つからない問題を解決しました。[#39373](https://github.com/apache/doris/pull/39373)

- バージョン2.1から3.0へのアップグレード時の権限永続化の互換性問題を対処しました。[#39288](https://github.com/apache/doris/pull/39288)

### ロード

- CSV形式解析で改行文字が区切り文字に囲まれている場合の解析失敗問題を修正しました。[#38347](https://github.com/apache/doris/pull/38347)
- FEがグループコミットを転送する際の潜在的例外問題を解決しました。[#38228](https://github.com/apache/doris/pull/38228) [#38265](https://github.com/apache/doris/pull/38265)

- グループコミットが新しいオプティマイザーをサポートしました。[#37002](https://github.com/apache/doris/pull/37002)

- JDBC setNullを使用した際にグループコミットがデータエラーを報告する問題を修正しました。[#38262](https://github.com/apache/doris/pull/38262)

- `delete bitmap lock`エラーに遭遇した際のグループコミットのリトライロジックを最適化しました。[#37600](https://github.com/apache/doris/pull/37600)

- routine loadがCSV区切り文字とエスケープ文字を使用できない問題を解決しました。[#38402](https://github.com/apache/doris/pull/38402)

- 大文字小文字混合のroutine loadジョブ名が表示できない問題を修正しました。[#38523](https://github.com/apache/doris/pull/38523)

- FEマスター・スレーブ切り替え時のroutine load積極的回復ロジックを最適化しました。[#37876](https://github.com/apache/doris/pull/37876)

- Kafka内のすべてのデータが期限切れの場合にroutine loadが一時停止する問題を解決しました。[#37288](https://github.com/apache/doris/pull/37288)

- `show routine load`が空の結果を返す問題を修正しました。[#38199](https://github.com/apache/doris/pull/38199)

- routine loadでのマルチテーブルストリームインポート時のメモリリーク問題を解決しました。[#38255](https://github.com/apache/doris/pull/38255)

- stream loadがエラーURLを返さない問題を修正しました。[#38325](https://github.com/apache/doris/pull/38325)

- 潜在的なロードチャネルリーク問題を解決しました。[#38031](https://github.com/apache/doris/pull/38031) [#37500](https://github.com/apache/doris/pull/37500)

- 期待よりも少ないセグメントをインポートした際にエラーが報告されない可能性がある問題を修正しました。[#36753](https://github.com/apache/doris/pull/36753)

- ロードストリームリーク問題を解決しました。[#38912](https://github.com/apache/doris/pull/38912)

- オフラインノードのインポート操作への影響を最適化しました。[#38198](https://github.com/apache/doris/pull/38198)

- 空データを挿入した際にトランザクションが終了しない問題を修正しました。[#38991](https://github.com/apache/doris/pull/38991)

### ストレージ

**01 バックアップと復元**

- バックアップと復元後にテーブルへの書き込みができない問題を修正しました。[#37089](https://github.com/apache/doris/pull/37089)

- バックアップと復元後にビューのデータベース名が正しくない問題を解決しました。[#37412](https://github.com/apache/doris/pull/37412)

**02 コンパクション**

- 順序データ圧縮時にcumu compactionが削除エラーを正しく処理しない問題を修正しました。[#38742](https://github.com/apache/doris/pull/38742)

- 順次圧縮最適化による集約テーブルの重複キー問題を解決しました。[#38224](https://github.com/apache/doris/pull/38224)

- 大規模ワイドテーブルで圧縮操作がcoredumpを引き起こす問題を修正しました。[#37960](https://github.com/apache/doris/pull/37960)

- 圧縮タスクの同時統計の不正確さによる圧縮飢餓問題を解決しました。[#37318](https://github.com/apache/doris/pull/37318)

**03 MOW Unique Key**

- delete signの累積圧縮削除によるレプリカ間のデータ不整合問題を解決しました。[#37950](https://github.com/apache/doris/pull/37950)

- MOW deleteが新しいオプティマイザーで部分カラム更新を使用するようになりました。[#38751](https://github.com/apache/doris/pull/38751)

- コンピュート・ストレージ分離下でMOWテーブルの潜在的重複キー問題を修正しました。[#39018](https://github.com/apache/doris/pull/39018)

- MOW uniqueと重複テーブルでカラム順序を変更できない問題を解決しました。[#37067](https://github.com/apache/doris/pull/37067)

- segcompactionによる潜在的データ正確性問題を修正しました。[#37760](https://github.com/apache/doris/pull/37760)

- カラム更新時の潜在的メモリリーク問題を解決しました。[#37706](https://github.com/apache/doris/pull/37706)

**04 その他**

- TOPNクエリでの稀な例外を修正しました。[#39119](https://github.com/apache/doris/pull/39119) [#39199](https://github.com/apache/doris/pull/39199)

- FE再起動時に自動増分IDが重複する可能性がある問題を解決しました。[#37306](https://github.com/apache/doris/pull/37306)

- 削除操作優先度キューでの潜在的キューイング問題を修正しました。[#37169](https://github.com/apache/doris/pull/37169)

- 削除リトライロジックを最適化しました。[#37363](https://github.com/apache/doris/pull/37363)

- 新しいオプティマイザー下でテーブル作成文の`bucket = 0`問題を解決しました。[#38971](https://github.com/apache/doris/pull/38971)

- image生成が失敗した際にFEが誤って成功を報告する問題を修正しました。[#37508](https://github.com/apache/doris/pull/37508)

- FEオフラインノード時の誤ったnodename使用がFEメンバーの不整合を引き起こす可能性がある問題を解決しました。[#37987](https://github.com/apache/doris/pull/37987)

- CCRパーティション追加が失敗する可能性がある問題を修正しました。[#37295](https://github.com/apache/doris/pull/37295)

- 転置インデックスファイルの`int32`オーバーフロー問題を解決しました。[#38891](https://github.com/apache/doris/pull/38891)

- TRUNCATE TABLE失敗がBEのオフライン失敗を引き起こす可能性がある問題を修正しました。[#37334](https://github.com/apache/doris/pull/37334)

- null pointerによりpublishが継続できない問題を解決しました。[#37724](https://github.com/apache/doris/pull/37724) [#37531](https://github.com/apache/doris/pull/37531)

- 手動ディスク移行トリガー時の潜在的coredump問題を修正しました。[#37712](https://github.com/apache/doris/pull/37712)

### コンピュート・ストレージ分離

- `show create table`が`file_cache_ttl_seconds`属性を二重表示する可能性がある問題を修正しました。[#38052](https://github.com/apache/doris/pull/38052)

- ファイルキャッシュTTL設定後にセグメントFooter TTLが正しく設定されない問題を修正しました。[#37485](https://github.com/apache/doris/pull/37485)

- キャッシュタイプの大量変換によりファ
