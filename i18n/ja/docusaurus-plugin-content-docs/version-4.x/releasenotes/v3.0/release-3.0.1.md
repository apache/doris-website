---
{
  "title": "リリース 3.0.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.1バージョンが2024年8月23日に正式リリースされました。"
}
---
コミュニティメンバーの皆様へ、Apache Doris 3.0.1バージョンが2024年8月23日に正式リリースされました。このバージョンでは、コンピュート・ストレージ分離、レイクハウス、半構造化データ解析、非同期マテリアライズドビューなどの機能が更新・改善されています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHubリリース:** https://github.com/apache/doris/releases

## 動作変更

### クエリオプティマイザ

- `CREATE TABLE AS SELECT`（CTAS）操作実行時のVARCHAR型の長さの動作を制御する変数`use_max_length_of_varchar_in_ctas`を追加。[#37069](https://github.com/apache/doris/pull/37069)
  
  - この変数はデフォルトでtrueに設定されています。
  
  - trueに設定されている場合、VARCHAR型カラムがテーブルから派生した場合は派生長が使用され、そうでない場合は最大長が使用されます。
  
  - falseに設定されている場合、VARCHAR型は常に派生長を使用します。

- すべてのデータ型がMySQLフォーマットとの互換性を維持するため小文字で表示されるようになりました。[#38012](https://github.com/apache/doris/pull/38012)

- 同一クエリリクエスト内の複数のクエリステートメントはセミコロンで区切る必要があります。[#38670](https://github.com/apache/doris/pull/38670)

### クエリ実行

- クラスタ内のシャッフル操作後のデフォルト並列タスク数が100に設定され、大規模クラスタでのクエリ安定性と並行処理能力が向上します。[#38196](https://github.com/apache/doris/pull/38196)

### ストレージ

- `trash_file_expire_time_sec`のデフォルト値が86400秒から0秒に変更されました。これにより、ファイルが誤って削除されFEトラッシュがクリアされた場合、データの復旧ができなくなります。

- テーブル属性`enable_mow_delete_on_delete_predicate`（バージョン3.0.0で導入）が`enable_mow_light_delete`に名前変更されました。

- 明示的なトランザクションで、データが書き込まれたテーブルに対する削除操作が禁止されました。

- 自動インクリメントフィールドを持つテーブルでのヘビースキーマ変更操作が禁止されました。



## 新機能

### ジョブスケジューリング

- 内部スケジューリングジョブの実行ロジックを最適化し、開始時間と即座実行パラメータ間の強い関連性を分離。これにより、タスクは指定された開始時間で作成することも即座実行用に選択することもでき、競合することなくスケジューリングの柔軟性が向上します。[#36805](https://github.com/apache/doris/pull/36805)

### コンピュート・ストレージ分離

- ファイルキャッシュ使用量の上限の動的変更をサポート。[#37484](https://github.com/apache/doris/pull/37484)

- Recyclerでオブジェクトストレージレート制限とサーバーサイドレート制限リトライ機能をサポート。[#37663](https://github.com/apache/doris/pull/37663) [#37680](https://github.com/apache/doris/pull/37680)

### レイクハウス

- 複合型の出力フォーマットを設定するセッション変数`serde_dialect`を追加。[#37039](https://github.com/apache/doris/pull/37039)

- SQL インターセプションで外部テーブルをサポート。

  - 詳細については、[SQL Interception](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception)のドキュメントを参照してください。

- Insert overwriteでIcebergテーブルをサポート。[#37191](https://github.com/apache/doris/pull/37191)

### 非同期マテリアライズドビュー

- 時間レベルでのパーティションロールアップと構築をサポート。[#37678](https://github.com/apache/doris/pull/37678)

- 非同期マテリアライズドビュー定義ステートメントの原子的な置き換えをサポート。[#36749](https://github.com/apache/doris/pull/36749)

- 透過的リライトでInsertステートメントをサポート。[#38115](https://github.com/apache/doris/pull/38115)

- 透過的リライトでVARIANT型をサポート。[#37929](https://github.com/apache/doris/pull/37929)

### クエリ実行

- group concat関数でDISTINCTとORDER BYオプションをサポート。[#38744](https://github.com/apache/doris/pull/38744)

### 半構造化データ管理

- ES CatalogでElasticsearchの`nested`または`object`型をDorisのJSON型にマッピング。[#37101](https://github.com/apache/doris/pull/37101)

- 複数フィールドでのキーワードマッチをサポートし、転置インデックスを活用して検索を高速化する`MULTI_MATCH`関数を追加。[#37722](https://github.com/apache/doris/pull/37722)

- JSONデータ内のオブジェクトを複数行に展開できる`explode_json_object`関数を追加。[#36887](https://github.com/apache/doris/pull/36887)

- 転置インデックスでmemtable advancement をサポートし、マルチレプリカ書き込み時にインデックス構築を一度だけ実行することで、CPU消費を削減し、パフォーマンスを向上。[#35891](https://github.com/apache/doris/pull/35891)

- `MATCH_PHRASE`で正のslopサポートを追加。例：`msg MATCH_PHRASE 'a b 2+'`は、単語aとbを含み、slopが2以下で、aがbに先行するインスタンスにマッチ可能。最後の`+`のない通常のslopはこの順序を保証しません。[#36356](https://github.com/apache/doris/pull/36356)

### その他

- この設定で指定されたユーザー操作は監査ログに記録されないFEパラメータ`skip_audit_user_list`を追加。[#38310](https://github.com/apache/doris/pull/38310)

  - 詳細については、[Audit Plugin](https://doris.apache.org/docs/admin-manual/audit-plugin/)のドキュメントを参照してください。



## 改善

### ストレージ

- 単一BE内のディスクバランシングによる書き込み失敗の可能性を削減。[#38000](https://github.com/apache/doris/pull/38000)

- memtable limiterによるメモリ消費を削減。[#37511](https://github.com/apache/doris/pull/37511)

- パーティション置換操作中に古いパーティションをFEトラッシュに移動。[#36361](https://github.com/apache/doris/pull/36361)

- compaction中のメモリ消費を最適化。[#37099](https://github.com/apache/doris/pull/37099)

- JDBC PreparedStatementの監査ログを制御するセッション変数を追加、デフォルトで非出力に設定。[#38419](https://github.com/apache/doris/pull/38419)

- グループコミット用のBE選択ロジックを最適化。[#35558](https://github.com/apache/doris/pull/35558)

- カラム更新のパフォーマンスを改善。[#38487](https://github.com/apache/doris/pull/38487)

- `delete bitmap cache`の使用を最適化。[#38761](https://github.com/apache/doris/pull/38761)

- ホット・コールド階層化時のクエリアフィニティを制御する設定を追加。[#37492](https://github.com/apache/doris/pull/37492)

### コンピュート・ストレージ分離

- オブジェクトストレージサーバーのレート制限に遭遇した際の自動リトライを実装。[#37199](https://github.com/apache/doris/pull/37199)

- コンピュート・ストレージ分離モードでmemtable flushのスレッド数を調整。[#38789](https://github.com/apache/doris/pull/38789)

- Azureサポートなしの環境でのコンパイルをサポートするため、Azureをコンパイルオプションとして追加。

- オブジェクトストレージアクセスレート制限の可観測性を最適化。[#38294](https://github.com/apache/doris/pull/38294)

- ファイルキャッシュTTLキューでLRU evictionを実行できるように、TTLキューの使いやすさを向上。[#37312](https://github.com/apache/doris/pull/37312)

- ストレージ・コンピュート分離モードでbalance writeeditlog IO操作数を最適化。[#37787](https://github.com/apache/doris/pull/37787)

- タブレット作成リクエストを一括送信することで、ストレージ・コンピュート分離モードでのテーブル作成速度を向上。[#36786](https://github.com/apache/doris/pull/36786)

- バックオフリトライを通じてローカルファイルキャッシュの潜在的な不整合による読み取り失敗を最適化。[#38645](https://github.com/apache/doris/pull/38645)

### レイクハウス

- Parquet/ORC形式の読み書き操作のメモリ統計を最適化。[#37234](https://github.com/apache/doris/pull/37234)

- Trino Connector Catalogでpredicateプッシュダウンをサポート。[#37874](https://github.com/apache/doris/pull/37874)

- 外部テーブルの`count(*)`プッシュダウン最適化を有効にするかどうかを制御するセッション変数`enable_count_push_down_for_external_table`を追加。[#37046](https://github.com/apache/doris/pull/37046)

- Hudiスナップショット読み取りの読み取りロジックを最適化し、スナップショットが空の場合は空のセットを返し、Sparkの動作と一致。[#37702](https://github.com/apache/doris/pull/37702)

- Hiveテーブルのパーティションカラムの読み取りパフォーマンスを改善。[#37377](https://github.com/apache/doris/pull/37377)

### 非同期マテリアライズドビュー

- 透過的リライトプランの速度を20%向上。[#37197](https://github.com/apache/doris/pull/37197)

- より良いネストマッチのため、グループキーがデータの一意性を満たす場合、透過的リライト中のロールアップを排除。[#38387](https://github.com/apache/doris/pull/38387)

- ネストしたマテリアライズドビューのマッチング成功率を向上させるため、透過的リライトでより良い集約排除を実行。[#36888](https://github.com/apache/doris/pull/36888)

### MySQL互換性

- MySQLプロトコル結果列にデータベース名、テーブル名、元の名前を正しく入力。[#38126](https://github.com/apache/doris/pull/38126)

- ヒント形式`/*+ func(value) */`をサポート。[#37720](https://github.com/apache/doris/pull/37720)

### クエリオプティマイザ

- 複雑なクエリのプラン速度を大幅に向上。[#38317](https://github.com/apache/doris/pull/38317)

- データバケット数に基づいてbucket shuffleを実行するかどうかを適応的に選択し、極端なケースでのパフォーマンス低下を回避。[#36784](https://github.com/apache/doris/pull/36784)

- SEMI / ANTI JOINのコスト推定ロジックを最適化。[#37951](https://github.com/apache/doris/pull/37951) [#37060](https://github.com/apache/doris/pull/37060)

- パフォーマンス向上のため、Limitを集約の第1段階にプッシュダウンすることをサポート。[#34853](https://github.com/apache/doris/pull/34853)

- パーティションプルーニングで`date_trunc`または`date`関数を含むフィルタ条件をサポート。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- SQLキャッシュでユーザー変数を含むクエリシナリオをサポート。[#37915](https://github.com/apache/doris/pull/37915)

- 無効な集約セマンティクスのエラーメッセージを最適化。[#38122](https://github.com/apache/doris/pull/38122)

### クエリ実行

- 2.1から3.xへのAggState互換性を調整し、Coredumpの問題を修正。[#37104](https://github.com/apache/doris/pull/37104)

- Joinなしのローカルシャッフルの戦略選択をリファクタリング。[#37282](https://github.com/apache/doris/pull/37282)

- 内部テーブルクエリのスキャナーを非同期化し、そのようなクエリ中のストールを防止。[#38403](https://github.com/apache/doris/pull/38403)

- Join演算子のハッシュテーブル構築時のブロックマージプロセスを最適化。[#37471](https://github.com/apache/doris/pull/37471)

- MultiCastのロック保持期間を最適化。[#37462](https://github.com/apache/doris/pull/37462)

- gRPC keepAliveTimeを最適化し、リンク監視を追加してRPCエラーによるクエリ失敗の確率を削減。[#37304](https://github.com/apache/doris/pull/37304)

- メモリ制限を超えた際にjemallocのすべてのダーティページをクリーンアップ。[#37164](https://github.com/apache/doris/pull/37164)

- 定数型の`aes_encrypt`/`decrypt`関数の処理パフォーマンスを最適化。[#37194](https://github.com/apache/doris/pull/37194)

- 定数データの`json_extract`関数の処理パフォーマンスを最適化。[#36927](https://github.com/apache/doris/pull/36927)

- 定数データの`ParseUrl`関数の処理パフォーマンスを最適化。[#36882](https://github.com/apache/doris/pull/36882)

### 半構造化データ管理

- Bitmapインデックスがデフォルトで転置インデックスを使用するように、`enable_create_bitmap_index_as_inverted_index`をデフォルトでtrueに設定。[#36692](https://github.com/apache/doris/pull/36692)

- コンピュート・ストレージ分離モードで、DESCでVARIANT型のサブカラムを表示可能。[#38143](https://github.com/apache/doris/pull/38143)

- リモートストレージへのアクセス遅延を削減するため、転置インデックスクエリ中のファイル存在チェックステップを除去。[#36945](https://github.com/apache/doris/pull/36945)

- 複合型ARRAY / MAP / STRUCTでAGGテーブルの`replace_if_not_null`をサポート。[#38304](https://github.com/apache/doris/pull/38304)

- JSONデータのエスケープ文字をサポート。[#37176](https://github.com/apache/doris/pull/37176) [#37251](https://github.com/apache/doris/pull/37251)

- 転置インデックスクエリがMOWテーブルとDUPテーブルで一貫した動作をするように。[#37428](https://github.com/apache/doris/pull/37428)

- INクエリの転置インデックス高速化のパフォーマンスを最適化。[#37395](https://github.com/apache/doris/pull/37395)

- TOPNクエリ中の不要なメモリ割り当てを削減してパフォーマンスを向上。[#37429](https://github.com/apache/doris/pull/37429)

- トークン化付きの転置インデックス作成時に、`match_phrase`シリーズのフレーズクエリを高速化するため`support_phrase`オプションが自動的に有効化。[#37949](https://github.com/apache/doris/pull/37949)

### その他

- 監査ログでSQL型の記録が可能に。[#37790](https://github.com/apache/doris/pull/37790)

- すべてのFEを表示する`information_schema.processlist`のサポートを追加。[#38701](https://github.com/apache/doris/pull/38701)

- クエリ効率を高速化するためrangerの`atamask`と`rowpolicy`をキャッシュ。[#37723](https://github.com/apache/doris/pull/37723)

- ジョブマネージャーのメタデータ管理を最適化し、メタデータ変更後に即座にロックを解放することでロック保持時間を削減。[#38162](https://github.com/apache/doris/pull/38162)



## バグ修正

### アップグレード

- バージョン2.1からのアップグレード時に`mtmv load`が失敗する問題を修正。[#38799](https://github.com/apache/doris/pull/38799)

- バージョン2.1へのアップグレード時に`null_type`が見つからない問題を解決。[#39373](https://github.com/apache/doris/pull/39373)

- バージョン2.1から3.0へのアップグレード時の権限永続化の互換性問題を対処。[#39288](https://github.com/apache/doris/pull/39288)

### ロード

- CSV形式解析で区切り文字に囲まれた改行文字の解析が失敗する問題を修正。[#38347](https://github.com/apache/doris/pull/38347)
- FEがグループコミットを転送する際の潜在的例外問題を解決。[#38228](https://github.com/apache/doris/pull/38228) [#38265](https://github.com/apache/doris/pull/38265)

- グループコミットで新しいオプティマイザをサポート。[#37002](https://github.com/apache/doris/pull/37002)

- JDBC setNullが使用された際のグループコミットでデータエラーが報告される問題を修正。[#38262](https://github.com/apache/doris/pull/38262)

- `delete bitmap lock`エラーに遭遇した際のグループコミットのリトライロジックを最適化。[#37600](https://github.com/apache/doris/pull/37600)

- ルーチンロードでCSV区切り文字とエスケープ文字が使用できない問題を解決。[#38402](https://github.com/apache/doris/pull/38402)

- 大文字小文字が混在するルーチンロードジョブ名が表示できない問題を修正。[#38523](https://github.com/apache/doris/pull/38523)

- FEマスタースレーブ切り替え時のルーチンロードの積極的復旧ロジックを最適化。[#37876](https://github.com/apache/doris/pull/37876)

- Kafkaのすべてのデータが期限切れになった際にルーチンロードが一時停止する問題を解決。[#37288](https://github.com/apache/doris/pull/37288)

- `show routine load`が空の結果を返す問題を修正。[#38199](https://github.com/apache/doris/pull/38199)

- ルーチンロードでのマルチテーブルストリームインポート時のメモリリーク問題を解決。[#38255](https://github.com/apache/doris/pull/38255)

- ストリームロードがエラーURLを返さない問題を修正。[#38325](https://github.com/apache/doris/pull/38325)

- 潜在的なロードチャネルリーク問題を解決。[#38031](https://github.com/apache/doris/pull/38031) [#37500](https://github.com/apache/doris/pull/37500)

- 期待されるより少ないセグメントをインポートした際にエラーが報告されない可能性がある問題を修正。[#36753](https://github.com/apache/doris/pull/36753)

- ロードストリームリーク問題を解決。[#38912](https://github.com/apache/doris/pull/38912)

- オフラインノードがインポート操作に与える影響を最適化。[#38198](https://github.com/apache/doris/pull/38198)

- 空のデータを挿入する際にトランザクションが終了しない問題を修正。[#38991](https://github.com/apache/doris/pull/38991)

### ストレージ

**01 バックアップと復元**

- バックアップと復元後にテーブルに書き込みできない問題を修正。[#37089](https://github.com/apache/doris/pull/37089)

- バックアップと復元後にビューのデータベース名が不正になる問題を解決。[#37412](https://github.com/apache/doris/pull/37412)

**02 コンパクション**

- 順序データ圧縮時にcumu compactionが削除エラーを正しく処理しない問題を修正。[#38742](https://github.com/apache/doris/pull/38742)

- 順次圧縮最適化による集約テーブルでの重複キー問題を解決。[#38224](https://github.com/apache/doris/pull/38224)

- 大きなワイドテーブルで圧縮操作がcoredumpを引き起こす問題を修正。[#37960](https://github.com/apache/doris/pull/37960)

- 圧縮タスクの不正確な並行統計による圧縮餓死問題を解決。[#37318](https://github.com/apache/doris/pull/37318)

**03 MOW Unique Key**

- delete signの累積圧縮削除によるレプリカ間のデータ不整合問題を解決。[#37950](https://github.com/apache/doris/pull/37950)

- MOW deleteで新しいオプティマイザと部分列更新を使用。[#38751](https://github.com/apache/doris/pull/38751)

- コンピュート・ストレージ分離下でのMOWテーブルの潜在的重複キー問題を修正。[#39018](https://github.com/apache/doris/pull/39018)

- MOW uniqueとduplicateテーブルでカラムの順序を変更できない問題を解決。[#37067](https://github.com/apache/doris/pull/37067)

- segcompactionが引き起こす潜在的なデータ正確性問題を修正。[#37760](https://github.com/apache/doris/pull/37760)

- カラム更新時の潜在的メモリリーク問題を解決。[#37706](https://github.com/apache/doris/pull/37706)

**04 その他**

- TOPNクエリで小確率の例外問題を修正。[#39119](https://github.com/apache/doris/pull/39119) [#39199](https://github.com/apache/doris/pull/39199)

- FE再起動時に自動インクリメントIDが重複する可能性がある問題を解決。[#37306](https://github.com/apache/doris/pull/37306)

- 削除操作優先キューの潜在的キューイング問題を修正。[#37169](https://github.com/apache/doris/pull/37169)

- 削除リトライロジックを最適化。[#37363](https://github.com/apache/doris/pull/37363)

- 新しいオプティマイザ下でテーブル作成文での`bucket = 0`問題を解決。[#38971](https://github.com/apache/doris/pull/38971)

- image生成失敗時にFEが誤って成功を報告する問題を修正。[#37508](https://github.com/apache/doris/pull/37508)

- FEオフラインノード時に間違ったnodenameを使用することでFEメンバーが不整合になる可能性がある問題を解決。[#37987](https://github.com/apache/doris/pull/37987)

- CCRパーティション追加が失敗する可能性がある問題を修正。[#37295](https://github.com/apache/doris/pull/37295)

- 転置インデックスファイルの`int32`オーバーフロー問題を解決。[#38891](https://github.com/apache/doris/pull/38891)

- TRUNCATE TABLE失敗でBEがオフラインできなくなる可能性がある問題を修正。[#37334](https://github.com/apache/doris/pull/37334)

- nullポインタによりpublishが続行できない問題を解決。[#37724](https://github.com/apache/doris/pull/37724) [#37531](https://github.com/apache/doris/pull/37531)

- ディスク移行を手動でトリガーした際の潜在的coredump問題を修正。[#37712](https://github.com/apache/doris/pull/37712)

### コンピュート・ストレージ分離

- `show create table`で`file_cache_ttl_seconds`属性が2回表示される可能性がある問題を修正。[#38052](https://github.com/apache/doris/pull/38052)

- ファイルキャッシュTTL設定後にセグメントFooter TTLが正しく設定されない問題を修正。[#37485](https://github.com/apache/doris/pull/37485)

- キャッシュタイプの大量変換によりファイルキャッシュがcoredumpを引き起こす可能性がある問題を修正。[#38518](https://github.com/apache/doris/pull/38518)

- ファイルキャッシュの潜在的ファイルディスクリプタ（fd）リークを修正。[#38051](https://github.com/apache/doris/pull/38051)

- スキーマ変更JobがコンパクションJobを上書きしてベースタブレットコンパクションが正常完了できない問題を修正。[#38210](https://github.com/apache/doris/pull/38210)

- データ競合による base compaction スコアの潜在的不正確性を修正。[#38006](https://github.com/apache/doris/pull/38006)

- インポートからのエラーメッセージが
