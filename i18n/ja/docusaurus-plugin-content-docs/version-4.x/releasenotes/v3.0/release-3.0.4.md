---
{
  "title": "リリース 3.0.4",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 3.0.4バージョンが2025年2月2日に正式リリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.4 バージョンが2025年2月2日に正式リリースされました。このバージョンでは、システムのパフォーマンスと安定性がさらに向上しています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- Auditログにおいて、`drop table`および`drop database`文で`force`フラグが保持されます。[#43227](https://github.com/apache/doris/pull/43227)

- Parquet/ORC形式へのデータエクスポート時、`bitmap`、`quantile_state`、`hll`タイプはBinary形式でエクスポートされます。また、`jsonb`と`variant`タイプのエクスポートサポートが追加され、これらは`string`としてエクスポートされます。[#44041](https://github.com/apache/doris/pull/44041)

  - 詳細については、ドキュメントを参照してください：[Export 概要 - Apache Doris](https://doris.apache.org/docs/3.0/data-operate/export/export-overview)

- External カタログを通じて、大文字小文字を区別しないテーブル名のデータソース（Hiveなど）をクエリする際、以前のバージョンでは任意の大文字小文字でテーブル名をクエリできましたが、バージョン3.0.4では、Doris自体のテーブル名大文字小文字区別ポリシーが厳密に適用されます。
- Hudi JNI ScannerがSpark APIからHadoop APIに置き換えられ、互換性が強化されました。ユーザーはセッション変数`set hudi_jni_scanner=spark/hadoop`で切り替えることができます。[#44396](https://github.com/apache/doris/pull/44396)
- Colocateテーブルでの`auto bucket`の使用が禁止されました。[#44396](https://github.com/apache/doris/pull/44396)
- Paimonキャッシュがカタログに追加され、リアルタイムデータクエリが除去されました。[#44911 ](https://github.com/apache/doris/pull/44911)
- Broker Loadによる大規模データインポートのパフォーマンスを向上させるため、`max_broker_concurrency`のデフォルト値が増加されました。[#44929](https://github.com/apache/doris/pull/44929)
- Auto パーティションパーティションの`storage medium`のデフォルト値が、システムのデフォルト値ではなく、現在のテーブルの`storage medium`属性値に変更されました。[#45955](https://github.com/apache/doris/pull/45955)
- Schema Change実行中のKeyカラムのカラム更新が禁止されました。[#46347](https://github.com/apache/doris/pull/46347)
- 自動インクリメントカラムを含むKeyカラムに対して、自動インクリメントカラムを提供せずにカラム更新を行えるサポートが追加されました。[#44528](https://github.com/apache/doris/pull/44528)
- FE IDジェネレータ戦略が時間ベースのアプローチに切り替えられ、IDは10000から開始されなくなりました。[#44790](https://github.com/apache/doris/pull/44790)
- コンピューティング・ストレージ分離モードにおいて、Compactionのデフォルトstale rowsetリサイクル遅延が1800秒に短縮され、リサイクル間隔が短縮されました。これにより極端なシナリオで大規模クエリが失敗する可能性があり、必要に応じて調整可能です。[#45460](https://github.com/apache/doris/pull/45460)
- コンピューティング・ストレージ分離モードで`show cache hotspot`文が無効化され、システムテーブルへの直接アクセスが必要になりました。[#47332](https://github.com/apache/doris/pull/47332)
- システム作成の`admin`ユーザーの削除が禁止されました。[#44751](https://github.com/apache/doris/pull/44751)

## 改善

### ストレージ

- `max_match_interval`設定が小さいことによるRoutine Loadタスクの頻繁なタイムアウト問題が最適化されました。[#46292](https://github.com/apache/doris/pull/46292)
- 複数の圧縮ファイルをインポートする際のBroker Loadパフォーマンスが改善されました。[#43975](https://github.com/apache/doris/pull/43975)
- Stream Loadパフォーマンスを向上させるため、`webserver_num_workers`のデフォルト値が増加されました。[#46593](https://github.com/apache/doris/pull/46593)
- BEノードスケーリング時のRoutine Loadインポートタスクの負荷不均衡問題が最適化されました。[#44798](https://github.com/apache/doris/pull/44798)
- タイムアウトがクエリに影響しないよう、Routine Loadスレッドプールの使用が改善されました。[#45039](https://github.com/apache/doris/pull/45039)

### コンピューティング・ストレージ分離

- Meta-serviceの安定性と可観測性が強化されました。[#44036](https://github.com/apache/doris/pull/44036), [#45617](https://github.com/apache/doris/pull/45617), [#45255](https://github.com/apache/doris/pull/45255), [#45068](https://github.com/apache/doris/pull/45068)
- 早期削除戦略の追加、ロック時間の削減、クエリパフォーマンスの向上により、File Cacheが最適化されました。[#47473](https://github.com/apache/doris/pull/47473), [#45678](https://github.com/apache/doris/pull/45678), [#47472](https://github.com/apache/doris/pull/47472)
- 安定性を向上させるため、File Cacheの初期化チェックとキュー遷移が改善されました。[#44004](https://github.com/apache/doris/pull/44004), [#44429](https://github.com/apache/doris/pull/44429), [#45057](https://github.com/apache/doris/pull/45057), [#47229](https://github.com/apache/doris/pull/47229)
- HDFSデータリサイクルの速度が向上しました。[#46393](https://github.com/apache/doris/pull/46393)
- 超高頻度インポート時のFEによるコンピュートグループ取得のパフォーマンス問題が最適化されました。[#47203](https://github.com/apache/doris/pull/47203)
- リアルタイム高同時実行インポートの安定性を向上させるため、コンピューティング・ストレージ分離における主キーテーブルのインポート関連パラメータが改善されました。[#47295](https://github.com/apache/doris/pull/47295), [#46750](https://github.com/apache/doris/pull/46750), [#46365](https://github.com/apache/doris/pull/46365)

### レイクハウス

- JSON形式のHiveテーブル読み取りがサポートされました。[#43469](https://github.com/apache/doris/pull/46393)

  - 詳細については、ドキュメントを参照してください：[Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#json)

- CSV形式のUTF-8エンコーディングチェックをスキップするセッション変数`enable_text_validate_utf8`が導入されました。[#45537](https://github.com/apache/doris/pull/45537)

  - 詳細については、ドキュメントを参照してください：[Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#character-set)

- Hudiバージョンが0.15に更新され、Hudiテーブルのクエリ計画パフォーマンスが最適化されました。
- MaxComputeパーティションテーブルの読み取りパフォーマンスが改善されました。[#45148](https://github.com/apache/doris/pull/45148)
- 高フィルタレート下でのParquetファイル遅延実体化のパフォーマンスが最適化されました。[#46183](https://github.com/apache/doris/pull/46183)
- 複雑なParquetタイプの遅延実体化がサポートされました。[#44098](https://github.com/apache/doris/pull/44098)
- ORCタイプの述語プッシュダウンロジックが最適化され、インデックスフィルタリング用のより多くの述語条件がサポートされました。[#43255](https://github.com/apache/doris/pull/43255)

### 非同期マテリアライズドビュー

- より多くの集約ロールアップ書き換えシナリオがサポートされました。[#44412](https://github.com/apache/doris/pull/44412)

### クエリオプティマイザ

- パーティションプルーニングパフォーマンスが改善されました。[#46261](https://github.com/apache/doris/pull/46261)
- データ特性に基づいて`group by`キーを除去するルールが追加されました。[#43391](https://github.com/apache/doris/pull/43391)
- ターゲットテーブルサイズに基づいてRuntime Filtersの待機時間が適応的に調整されるようになりました。[#42640](https://github.com/apache/doris/pull/42640)
- より多くのシナリオに適合するよう、joinにおける集約のプッシュダウン機能が改善されました。[#43856](https://github.com/apache/doris/pull/43856), [#43380](https://github.com/apache/doris/pull/43380)
- より多くのシナリオに適合するよう、集約のLimitプッシュダウンが改善されました。[#44042](https://github.com/apache/doris/pull/44042)

### その他

- FE、BE、MSプロセスの起動スクリプトが最適化され、より明確な出力が提供されるようになりました。[#45610](https://github.com/apache/doris/pull/45610), [#45490](https://github.com/apache/doris/pull/45490), [#45883](https://github.com/apache/doris/pull/45883)
- `show tables`におけるテーブル名の大文字小文字区別がMySQLの動作と一致するようになりました。[#46030](https://github.com/apache/doris/pull/46030)
- `show index`で任意のターゲットテーブルタイプがサポートされるようになりました。[#45861](https://github.com/apache/doris/pull/45861)
- `information_schema.columns`でデフォルト値の表示がサポートされました。[#44849](https://github.com/apache/doris/pull/44849)
- `information_schema.views`でビュー定義の表示がサポートされました。[#45857](https://github.com/apache/doris/pull/45857)
- MySQLプロトコル`COM_RESET_CONNECTION`コマンドがサポートされました。[#44747](https://github.com/apache/doris/pull/44747)

## バグ修正

### ストレージ

- 集約テーブルモデルのインポート処理中の潜在的なメモリエラーが修正されました。[#46997](https://github.com/apache/doris/pull/46997)
- コンピューティング・ストレージ分離モードでのFEマスターノード再起動時のRoutine Loadオフセット損失問題が解決されました。[#46566](https://github.com/apache/doris/pull/46566)
- コンピューティング・ストレージモードでのバッチインポートシナリオにおけるFE Observerノードのメモリリークが修正されました。[#47244](https://github.com/apache/doris/pull/47244)
- Order Data CompactionでのFull Compaction時のCumulative Pointロールバック問題が解決されました。[#44359](https://github.com/apache/doris/pull/44359)
- Delete操作がTablet Compactionスケジューリングを一時的に妨げる問題が修正されました。[#43466](https://github.com/apache/doris/pull/43466)
- マルチコンピューティングクラスタシナリオでのSchema Change後の不正なTablet状態が解決されました。[#45821](https://github.com/apache/doris/pull/45821)
- `sequence_type`を持つ主キーテーブルでColumn Rename Schema Changeを実行する際の潜在的なNPEエラーが修正されました。[#46906](https://github.com/apache/doris/pull/46906)
- **データ正確性**：DELETE SIGNカラムを含む部分カラム更新をインポートする際の主キーテーブルの正確性問題が修正されました。[#46194](https://github.com/apache/doris/pull/46194)
- 主キーテーブルのPublishタスクが継続的にスタックした際のFEの潜在的なメモリリークが解決されました。[#44846](https://github.com/apache/doris/pull/44846)

### コンピューティング・ストレージ分離

- File Cacheサイズがテーブルデータサイズを超える問題が修正されました。[#46561](https://github.com/apache/doris/pull/46561), [#46390](https://github.com/apache/doris/pull/46390)
- データアップロード時の5MB境界でのアップロード失敗が解決されました。[#47333](https://github.com/apache/doris/pull/47333)
- Storage Vaultの複数の`alter`操作に対してより多くのパラメータチェックを追加し、堅牢性が強化されました。[#45155](https://github.com/apache/doris/pull/45155), [#45156](https://github.com/apache/doris/pull/45156), [#46625](https://github.com/apache/doris/pull/46625), [#47078](https://github.com/apache/doris/pull/47078), [#45685](https://github.com/apache/doris/pull/45685), [#46779](https://github.com/apache/doris/pull/46779)
- 不適切なStorage Vault設定によるデータリサイクル失敗または低速リサイクル問題が解決されました。[#46798](https://github.com/apache/doris/pull/46798), [#47536](https://github.com/apache/doris/pull/47536), [#47475](https://github.com/apache/doris/pull/47475), [#47324](https://github.com/apache/doris/pull/47324), [#45072](https://github.com/apache/doris/pull/45072)
- データリサイクルが停止し、適時にリサイクルされない問題が修正されました。[#45760](https://github.com/apache/doris/pull/45760)
- コンピューティング・ストレージ分離モードでのMTTM-230エラーの不正な再試行が解決されました。[#47370](https://github.com/apache/doris/pull/47370), [#47326](https://github.com/apache/doris/pull/47326)
- コンピューティング・ストレージ分離モードでのBE廃止時にGroup Commit WALが完全に再生されない問題が修正されました。[#47187](https://github.com/apache/doris/pull/47187)
- Tablet Metaが2GBを超えるとMSが利用不可能になる問題が解決されました。[#44780](https://github.com/apache/doris/pull/44780)
- **データ正確性**：コンピューティング・ストレージ分離モードでの主キーテーブルにおける2つの重複Key問題が修正されました。[#46039](https://github.com/apache/doris/pull/46039), [#44975](https://github.com/apache/doris/pull/44975)
- 高頻度リアルタイムインポート時の大きなDelete Bitmapによる主キーテーブルでのBase Compactionの継続的失敗問題が解決されました。[#46969](https://github.com/apache/doris/pull/46969)
- 堅牢性を強化するため、コンピューティング・ストレージ分離モードでの主キーテーブルにおけるSchema Changeの不正な再試行ロジックが修正されました。[#46748](https://github.com/apache/doris/pull/46748)

### レイクハウス

#### Hive

- SparkによってビューされたHiveビューがクエリできない問題が修正されました。[#43553](https://github.com/apache/doris/pull/43553)
- 特定のHive Transactionテーブルが正しく読み取れない問題が解決されました。[#45753](https://github.com/apache/doris/pull/45753)
- パーティションに特殊文字を含むHiveテーブルでパーティションプルーニングが失敗する問題が修正されました。[#42906](https://github.com/apache/doris/pull/42906)

#### Iceberg

- Kerberos認証環境でIcebergテーブルを作成できない問題が修正されました。[#43445](https://github.com/apache/doris/pull/43445)
- dangling deletesを含むIcebergテーブルで`count(*)`クエリが不正確である問題が解決されました。[#44039](https://github.com/apache/doris/pull/44039)
- Icebergテーブルでカラム名の不一致によりクエリエラーが発生する問題が修正されました。[#44470](https://github.com/apache/doris/pull/44470)
- パーティション変更後にIcebergテーブルが読み取れない問題が解決されました。[#45367](https://github.com/apache/doris/pull/45367)

#### Paimon

- Paimon カタログがAlibaba Cloud OSS-HDFSにアクセスできない問題が修正されました。[#42585](https://github.com/apache/doris/pull/42585)

#### Hudi

- 特定のシナリオでHudiテーブルのパーティションプルーニングが失敗する問題が修正されました。[#44669](https://github.com/apache/doris/pull/44669)

#### JDBC

- 大文字小文字を区別しないテーブル名を有効にした後、JDBC カタログを使用してテーブルを取得できない問題が修正されました。

#### MaxCompute

- 特定のシナリオでMaxComputeテーブルのパーティションプルーニングが失敗する問題が修正されました。[#44508](https://github.com/apache/doris/pull/44508)

#### その他

- エクスポートタスクがFEでメモリリークを引き起こす問題が修正されました。[#44019](https://github.com/apache/doris/pull/44019)
- HTTPSプロトコル経由でS3オブジェクトストレージにアクセスできない問題が解決されました。[#44242](https://github.com/apache/doris/pull/44242)
- Kerberos認証チケットが自動更新できない問題が修正されました。[#44916](https://github.com/apache/doris/pull/44916)
- Hadoop Block圧縮形式ファイルの読み取りが失敗する問題が解決されました。[#45289](https://github.com/apache/doris/pull/45289)
- ORC形式データのクエリ時に、潜在的な結果エラーを回避するため、CHARタイプの述語がプッシュダウンされないようになりました。[#45484](https://github.com/apache/doris/pull/45484)

### 非同期マテリアライズドビュー

- 極端なシナリオでトランスペアレントクエリ書き換えが計画または結果エラーを引き起こす問題が修正されました。[#44575](https://github.com/apache/doris/pull/44575), [#45744](https://github.com/apache/doris/pull/45744)
- 極端なシナリオでの非同期マテリアライズドビュースケジューリング時に複数のビルドタスクが生成される問題が解決されました。[#46020](https://github.com/apache/doris/pull/46020), [#46280](https://github.com/apache/doris/pull/46280)

### クエリオプティマイザ

- 一部の式書き換えが不正な式を生成する問題が修正されました。[#44770](https://github.com/apache/doris/pull/44770), [#44920](https://github.com/apache/doris/pull/44920), [#45922](https://github.com/apache/doris/pull/45922), [#45596](https://github.com/apache/doris/pull/45596)
- SQL Cacheの時折の不正な結果が解決されました。[#44782](https://github.com/apache/doris/pull/44782), [#44631](https://github.com/apache/doris/pull/44631), [#46443](https://github.com/apache/doris/pull/46443), [#47266](https://github.com/apache/doris/pull/47266)
- 一部のシナリオで集約演算子のlimitプッシュダウンが不正な結果を生成する問題が修正されました。[#45369](https://github.com/apache/doris/pull/45369)
- 一部のシナリオで遅延実体化最適化が不正な実行計画を生成する問題が解決されました。[#45693](https://github.com/apache/doris/pull/45693), [#46551](https://github.com/apache/doris/pull/46551)

### クエリ実行

- 特殊文字で正規表現と`like`関数が不正な結果を生成する問題が修正されました。[#44547](https://github.com/apache/doris/pull/44547)
- データベース切り替え時にSQL Cacheの結果が不正になる問題が解決されました。[#44782](https://github.com/apache/doris/pull/44782)
- Arrow Flight関連の一連の問題が修正されました。[#45023](https://github.com/apache/doris/pull/45023), [#43929](https://github.com/apache/doris/pull/43929)
- 一部のケースでHashJoinのHashテーブルが4GBを超えた際に結果が不正になる問題が解決されました。[#46461](https://github.com/apache/doris/pull/46461)
- 中国語文字での`convert_to`関数のオーバーフロー問題が修正されました。[#46405](https://github.com/apache/doris/pull/46405)
- 極端なシナリオで`group by`をLimitと組み合わせて使用した際に結果が不正になる問題が解決されました。[#47844](https://github.com/apache/doris/pull/47844)
- 特定のシステムテーブルにアクセスする際に結果が不正になる問題が修正されました。[#47498](https://github.com/apache/doris/pull/47498)
- `percentile`関数がシステムクラッシュを引き起こす問題が解決されました。[#47068](https://github.com/apache/doris/pull/47068)
- Limit付き単一テーブルクエリのパフォーマンス劣化問題が修正されました。[#46090](https://github.com/apache/doris/pull/46090)
- `StDistanceSphere`と`StAngleSphere`関数がシステムクラッシュを引き起こす問題が解決されました。[#45508](https://github.com/apache/doris/pull/45508)
- `map_agg`結果が不正である問題が修正されました。[#40454](https://github.com/apache/doris/pull/40454)

### 半構造化データ管理

#### BloomFilter Index

- BloomFilter Indexの大きなパラメータによる例外が修正されました。[#45780](https://github.com/apache/doris/pull/45780)
- BloomFilter Index書き込み時の高メモリ使用量問題が解決されました。[#45833](https://github.com/apache/doris/pull/45833)
- カラムが削除された際にBloomFilter Indexが正しく削除されない問題が修正されました。[#44361](https://github.com/apache/doris/pull/44361), [#43378](https://github.com/apache/doris/pull/43378)

#### Inverted Index

- 転置インデックス構築時の時折のクラッシュが修正されました。[#43246](https://github.com/apache/doris/pull/43246)
- 転置インデックスマージ時に出現回数がゼロの単語が容量を占有する問題が解決されました。[#43113](https://github.com/apache/doris/pull/43113)
- Index Size統計での異常に大きな値が防止されました。[#46549](https://github.com/apache/doris/pull/46549)
- VARIANTタイプフィールドの転置インデックス問題が修正されました。[#43375](https://github.com/apache/doris/pull/43375)
- キャッシュヒット率を向上させるため、転置インデックスのローカルキャッシュ局所性が最適化されました。[#46518](https://github.com/apache/doris/pull/46518)
- 転置インデックスのリモートストレージ読み取りのため、クエリプロファイルにメトリクス`NumInvertedIndexRemoteIOTotal`が追加されました。[#45675](https://github.com/apache/doris/pull/45675), [#44863](https://github.com/apache/doris/pull/44863)

#### その他

- 特殊なNULLデータでの`ipv6_cidr_to_range`関数のクラッシュ問題が修正されました。[#44700](https://github.com/apache/doris/pull/44700)

### 権限

- `CREATE_PRIV`の付与時に、対応するリソースの存在確認が行われなくなりました。[#45125](https://github.com/apache/doris/pull/45125)
- 極端なシナリオで、参照テーブルの権限不足により権限付きビューのクエリが失敗する問題が修正されました。[#44621](https://github.com/apache/doris/pull/44621)
- `use db`の権限チェックが内部および外部カタログを区別しない問題が解決されました。[#45720](https://github.com/apache/doris/pull/45720)
