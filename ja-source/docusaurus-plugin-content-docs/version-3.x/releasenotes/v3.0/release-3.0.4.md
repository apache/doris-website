---
{
  "title": "リリース 3.0.4",
  "language": "ja",
  "description": "親愛なるコミュニティメンバーの皆様、Apache Doris 3.0.4バージョンが2025年2月2日に正式にリリースされました。"
}
---
コミュニティメンバーの皆様、Apache Doris 3.0.4 バージョンが2025年2月2日に正式リリースされました。このバージョンでは、システムのパフォーマンスと安定性がさらに向上しています。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- Auditログにて、`drop table`および`drop database`文に対して`force`フラグが保持されるようになりました。[#43227](https://github.com/apache/doris/pull/43227) 

- Parquet/ORC形式にデータをエクスポートする際、`bitmap`、`quantile_state`、`hll`タイプはBinary形式でエクスポートされます。また、`jsonb`および`variant`タイプのエクスポートサポートが追加され、これらは`string`としてエクスポートされます。[#44041](https://github.com/apache/doris/pull/44041) 

  - 詳細については、ドキュメントを参照してください: [Export 概要 - Apache Doris](https://doris.apache.org/docs/3.0/data-operate/export/export-overview)

- External カタログ経由で大文字小文字を区別しないテーブル名を持つデータソース（Hiveなど）をクエリする際、以前のバージョンでは任意の大文字小文字でテーブル名をクエリできましたが、バージョン3.0.4では、Doris独自のテーブル名大文字小文字区別ポリシーが厳密に適用されます。
- Hudi JNI ScannerがSpark APIからHadoop APIに置き換えられ、互換性が向上しました。ユーザーはセッション変数`set hudi_jni_scanner=spark/hadoop`を設定することで切り替えることができます。[#44396](https://github.com/apache/doris/pull/44396) 
- Colocateテーブルでの`auto bucket`の使用が禁止されました。[#44396](https://github.com/apache/doris/pull/44396) 
- カタログにPaimonキャッシュが追加され、リアルタイムデータクエリが排除されました。[#44911 ](https://github.com/apache/doris/pull/44911)
- Broker Loadでの大規模データインポートのパフォーマンス向上のため、`max_broker_concurrency`のデフォルト値が増加されました。[#44929](https://github.com/apache/doris/pull/44929) 
- Auto パーティションパーティションの`storage medium`のデフォルト値が、システムデフォルト値を使用する代わりに、現在のテーブルの`storage medium`の属性値に変更されました。[#45955](https://github.com/apache/doris/pull/45955) 
- Keyカラムに対するSchema Change実行中の列更新が禁止されました。[#46347](https://github.com/apache/doris/pull/46347) 
- 自動増分列を含むKeyカラムに対して、自動増分列を提供せずに列更新を許可するサポートが追加されました。[#44528](https://github.com/apache/doris/pull/44528) 
- FE ID生成戦略が時間ベースのアプローチに切り替えられ、IDは10000から開始されなくなりました。[#44790](https://github.com/apache/doris/pull/44790) 
- コンピューティング・ストレージ分離モードにおいて、Compactionのデフォルトのstale rowsetリサイクル遅延が1800秒に短縮され、リサイクル間隔が短縮されました。これにより極端なシナリオで大きなクエリが失敗する可能性があり、必要に応じて調整が可能です。[#45460](https://github.com/apache/doris/pull/45460) 
- `show cache hotspot`文がコンピューティング・ストレージ分離モードで無効化され、システムテーブルへの直接アクセスが必要になりました。[#47332](https://github.com/apache/doris/pull/47332) 
- システムが作成した`admin`ユーザーの削除が禁止されました。[#44751](https://github.com/apache/doris/pull/44751) 

## 改善

### ストレージ

- 小さな`max_match_interval`設定によりRoutine Loadタスクが頻繁にタイムアウトする問題を最適化しました。[#46292](https://github.com/apache/doris/pull/46292) 
- 複数の圧縮ファイルをインポートする際のBroker Loadのパフォーマンスを改善しました。[#43975](https://github.com/apache/doris/pull/43975) 
- Stream Loadのパフォーマンス向上のため、`webserver_num_workers`のデフォルト値を増加しました。[#46593](https://github.com/apache/doris/pull/46593) 
- BEノードスケーリング時のRoutine Loadインポートタスクの負荷不均衡問題を最適化しました。[#44798](https://github.com/apache/doris/pull/44798) 
- Routine Loadスレッドプールの使用を改善し、タイムアウトがクエリに影響することを防ぎました。[#45039](https://github.com/apache/doris/pull/45039) 

### コンピューティング・ストレージ分離

- Meta-serviceの安定性と可観測性を向上させました。[#44036](https://github.com/apache/doris/pull/44036), [#45617](https://github.com/apache/doris/pull/45617), [#45255](https://github.com/apache/doris/pull/45255), [#45068](https://github.com/apache/doris/pull/45068) 
- 早期退避戦略の追加、ロック時間の短縮、クエリパフォーマンスの向上により、File Cacheを最適化しました。[#47473](https://github.com/apache/doris/pull/47473), [#45678](https://github.com/apache/doris/pull/45678), [#47472](https://github.com/apache/doris/pull/47472) 
- 安定性向上のため、File Cacheの初期化チェックとキュー遷移を改善しました。[#44004](https://github.com/apache/doris/pull/44004), [#44429](https://github.com/apache/doris/pull/44429), [#45057](https://github.com/apache/doris/pull/45057), [#47229](https://github.com/apache/doris/pull/47229) 
- HDFSデータリサイクルの速度を向上させました。[#46393](https://github.com/apache/doris/pull/46393) 
- 超高頻度インポート時のFEがcompute groupを取得する際のパフォーマンス問題を最適化しました。[#47203](https://github.com/apache/doris/pull/47203) 
- コンピューティング・ストレージ分離におけるprimary keyテーブルのインポート関連パラメータを複数改善し、リアルタイム高並行インポートの安定性を向上させました。[#47295](https://github.com/apache/doris/pull/47295), [#46750](https://github.com/apache/doris/pull/46750), [#46365](https://github.com/apache/doris/pull/46365) 

### レイクハウス

- JSON形式のHiveテーブルの読み取りをサポートしました。[#43469](https://github.com/apache/doris/pull/46393) 

  - 詳細については、ドキュメントを参照してください: [Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#json)

- CSV形式のUTF-8エンコーディングチェックをスキップするセッション変数`enable_text_validate_utf8`を導入しました。[#45537](https://github.com/apache/doris/pull/45537) 

  - 詳細については、ドキュメントを参照してください: [Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#character-set)

- Hudiバージョンを0.15に更新し、Hudiテーブルのクエリ計画パフォーマンスを最適化しました。
- MaxComputeパーティションテーブルの読み取りパフォーマンスを改善しました。[#45148](https://github.com/apache/doris/pull/45148) 
- 高フィルタ率でのParquetファイル遅延マテリアライゼーションのパフォーマンスを最適化しました。[#46183](https://github.com/apache/doris/pull/46183) 
- 複雑なParquetタイプの遅延マテリアライゼーションをサポートしました。[#44098](https://github.com/apache/doris/pull/44098) 
- ORCタイプの述語プッシュダウンロジックを最適化し、インデックスフィルタリングのためのより多くの述語条件をサポートしました。[#43255](https://github.com/apache/doris/pull/43255) 

### 非同期マテリアライズドビュー

- 集約ロールアップ書き換えのより多くのシナリオをサポートしました。[#44412](https://github.com/apache/doris/pull/44412) 

### クエリオプティマイザ

- パーティションプルーニングパフォーマンスを改善しました。[#46261](https://github.com/apache/doris/pull/46261) 
- データ特性に基づいて`group by`キーを排除するルールを追加しました。[#43391](https://github.com/apache/doris/pull/43391) 
- ターゲットテーブルサイズに基づいてRuntime Filtersの待機時間を適応的に調整しました。[#42640](https://github.com/apache/doris/pull/42640) 
- より多くのシナリオに適合するよう、結合での集約プッシュダウン機能を改善しました。[#43856](https://github.com/apache/doris/pull/43856), [#43380](https://github.com/apache/doris/pull/43380) 
- より多くのシナリオに適合するよう、集約のLimitプッシュダウンを改善しました。[#44042](https://github.com/apache/doris/pull/44042) 

### その他

- FE、BE、MSプロセスの起動スクリプトを最適化し、より明確な出力を提供しました。[#45610](https://github.com/apache/doris/pull/45610), [#45490](https://github.com/apache/doris/pull/45490), [#45883](https://github.com/apache/doris/pull/45883) 
- `show tables`のテーブル名の大文字小文字の区別がMySQLの動作と一致するようになりました。[#46030](https://github.com/apache/doris/pull/46030) 
- `show index`が任意のターゲットテーブルタイプをサポートするようになりました。[#45861](https://github.com/apache/doris/pull/45861) 
- `information_schema.columns`がデフォルト値の表示をサポートするようになりました。[#44849](https://github.com/apache/doris/pull/44849) 
- `information_schema.views`がビュー定義の表示をサポートするようになりました。[#45857](https://github.com/apache/doris/pull/45857) 
- MySQLプロトコル`COM_RESET_CONNECTION`コマンドをサポートしました。[#44747](https://github.com/apache/doris/pull/44747) 

## バグ修正

### ストレージ

- 集約テーブルモデルのインポートプロセス中の潜在的なメモリエラーを修正しました。[#46997](https://github.com/apache/doris/pull/46997) 
- コンピューティング・ストレージ分離モードでのFEマスターノード再起動時のRoutine Loadオフセット損失問題を解決しました。[#46566](https://github.com/apache/doris/pull/46566) 
- コンピューティング・ストレージモードでのバッチインポートシナリオにおけるFE Observerノードのメモリリークを修正しました。[#47244](https://github.com/apache/doris/pull/47244) 
- Order Data CompactionでのFull Compaction中のCumulative Pointロールバック問題を解決しました。[#44359](https://github.com/apache/doris/pull/44359) 
- Delete操作がTablet Compactionスケジューリングを一時的に妨げる問題を修正しました。[#43466](https://github.com/apache/doris/pull/43466) 
- マルチコンピューティングクラスターシナリオでのSchema Change後の不正なTablet状態を解決しました。[#45821](https://github.com/apache/doris/pull/45821) 
- `sequence_type`を持つprimary keyテーブルでColumn Rename Schema Changeを実行する際の潜在的なNPEエラーを修正しました。[#46906](https://github.com/apache/doris/pull/46906) 
- **データ正確性**: DELETE SIGN列を含む部分列更新をインポートする際のprimary keyテーブルの正確性問題を修正しました。[#46194](https://github.com/apache/doris/pull/46194) 
- primary keyテーブルのPublishタスクが継続的にスタックした際のFEの潜在的なメモリリークを解決しました。[#44846](https://github.com/apache/doris/pull/44846) 

### コンピューティング・ストレージ分離

- File Cacheサイズがテーブルデータサイズを超える問題を修正しました。[#46561](https://github.com/apache/doris/pull/46561), [#46390](https://github.com/apache/doris/pull/46390) 
- データアップロード時の5MB境界でのアップロード失敗を解決しました。[#47333](https://github.com/apache/doris/pull/47333) 
- Storage Vaultでの複数の`alter`操作に対するパラメータチェックを追加し、堅牢性を向上させました。[#45155](https://github.com/apache/doris/pull/45155), [#45156](https://github.com/apache/doris/pull/45156), [#46625](https://github.com/apache/doris/pull/46625), [#47078](https://github.com/apache/doris/pull/47078), [#45685](https://github.com/apache/doris/pull/45685), [#46779](https://github.com/apache/doris/pull/46779) 
- 不適切なStorage Vault設定によるデータリサイクル失敗または低速リサイクル問題を解決しました。[#46798](https://github.com/apache/doris/pull/46798), [#47536](https://github.com/apache/doris/pull/47536), [#47475](https://github.com/apache/doris/pull/47475), [#47324](https://github.com/apache/doris/pull/47324), [#45072](https://github.com/apache/doris/pull/45072) 
- データリサイクルが停止し、適時にリサイクルされない問題を修正しました。[#45760](https://github.com/apache/doris/pull/45760) 
- コンピューティング・ストレージ分離モードでのMTTM-230エラーの不正な再試行を解決しました。[#47370](https://github.com/apache/doris/pull/47370), [#47326](https://github.com/apache/doris/pull/47326) 
- コンピューティング・ストレージ分離モードでのBE廃止時にGroup Commit WALが完全に再生されない問題を修正しました。[#47187](https://github.com/apache/doris/pull/47187) 
- Tablet Metaが2GBを超えるとMSが利用不可になる問題を解決しました。[#44780](https://github.com/apache/doris/pull/44780) 
- **データ正確性**: コンピューティング・ストレージ分離モードでのprimary keyテーブルの2つの重複Key問題を修正しました。[#46039](https://github.com/apache/doris/pull/46039), [#44975](https://github.com/apache/doris/pull/44975) 
- 高頻度リアルタイムインポート中のprimary keyテーブルで大きなDelete Bitmapが原因でBase Compactionが継続的に失敗する問題を解決しました。[#46969](https://github.com/apache/doris/pull/46969) 
- コンピューティング・ストレージ分離モードでのprimary keyテーブルのSchema Changeの不正な再試行ロジックを修正し、堅牢性を向上させました。[#46748](https://github.com/apache/doris/pull/46748) 

### レイクハウス

#### Hive

- Sparkによって作成されたHiveビューがクエリできない問題を修正しました。[#43553](https://github.com/apache/doris/pull/43553) 
- 特定のHive Transactionテーブルが正しく読み取れない問題を解決しました。[#45753](https://github.com/apache/doris/pull/45753) 
- パーティションに特殊文字を含むHiveテーブルでパーティションプルーニングが失敗する問題を修正しました。[#42906](https://github.com/apache/doris/pull/42906) 

#### Iceberg

- Kerberos認証環境でIcebergテーブルが作成できない問題を修正しました。[#43445](https://github.com/apache/doris/pull/43445) 
- dangling deleteを持つIcebergテーブルで`count(*)`クエリが不正確になる問題を解決しました。[#44039](https://github.com/apache/doris/pull/44039) 
- Icebergテーブルでの列名不一致によるクエリエラーを修正しました。[#44470](https://github.com/apache/doris/pull/44470) 
- パーティション変更後にIcebergテーブルが読み取れない問題を解決しました。[#45367](https://github.com/apache/doris/pull/45367) 

#### Paimon

- Paimon カタログがAlibaba Cloud OSS-HDFSにアクセスできない問題を修正しました。[#42585](https://github.com/apache/doris/pull/42585) 

#### Hudi

- 特定のシナリオでHudiテーブルのパーティションプルーニングが失敗する問題を修正しました。[#44669](https://github.com/apache/doris/pull/44669) 

#### JDBC

- 大文字小文字を区別しないテーブル名を有効にした後、JDBC カタログを使用してテーブルが取得できない問題を修正しました。

#### MaxCompute

- 特定のシナリオでMaxComputeテーブルのパーティションプルーニングが失敗する問題を修正しました。[#44508](https://github.com/apache/doris/pull/44508) 

#### その他

- エクスポートタスクがFEでメモリリークを引き起こす問題を修正しました。[#44019](https://github.com/apache/doris/pull/44019) 
- HTTPSプロトコル経由でS3オブジェクトストレージにアクセスできない問題を解決しました。[#44242](https://github.com/apache/doris/pull/44242) 
- Kerberos認証チケットが自動更新されない問題を修正しました。[#44916](https://github.com/apache/doris/pull/44916) 
- Hadoop Block圧縮形式ファイルの読み取りが失敗する問題を解決しました。[#45289](https://github.com/apache/doris/pull/45289) 
- ORC形式データをクエリする際、潜在的な結果エラーを回避するため、CHARタイプの述語はプッシュダウンされなくなりました。[#45484](https://github.com/apache/doris/pull/45484) 

### 非同期マテリアライズドビュー

- 極端なシナリオで透過的クエリ書き換えが計画または結果エラーを引き起こす問題を修正しました。[#44575](https://github.com/apache/doris/pull/44575), [#45744](https://github.com/apache/doris/pull/45744) 
- 極端なシナリオで非同期マテリアライズドビューのスケジューリング中に複数のビルドタスクが生成される問題を解決しました。[#46020](https://github.com/apache/doris/pull/46020), [#46280](https://github.com/apache/doris/pull/46280) 

### クエリオプティマイザ

- 一部の式書き換えが不正な式を生成する問題を修正しました。[#44770](https://github.com/apache/doris/pull/44770), [#44920](https://github.com/apache/doris/pull/44920), [#45922](https://github.com/apache/doris/pull/45922), [#45596](https://github.com/apache/doris/pull/45596) 
- SQL Cacheから時折不正な結果が返される問題を解決しました。[#44782](https://github.com/apache/doris/pull/44782), [#44631](https://github.com/apache/doris/pull/44631), [#46443](https://github.com/apache/doris/pull/46443), [#47266](https://github.com/apache/doris/pull/47266) 
- 一部のシナリオで集約オペレータのlimitプッシュダウンが不正な結果を生成する問題を修正しました。[#45369](https://github.com/apache/doris/pull/45369) 
- 一部のシナリオで遅延マテリアライゼーション最適化が不正な実行計画を生成する問題を解決しました。[#45693](https://github.com/apache/doris/pull/45693), [#46551](https://github.com/apache/doris/pull/46551) 

### クエリ実行

- 特殊文字で正規表現と`like`関数が不正な結果を生成する問題を修正しました。[#44547](https://github.com/apache/doris/pull/44547) 
- データベース切り替え時にSQL Cache結果が不正になる問題を解決しました。[#44782](https://github.com/apache/doris/pull/44782) 
- Arrow Flight関連の一連の問題を修正しました。[#45023](https://github.com/apache/doris/pull/45023), [#43929](https://github.com/apache/doris/pull/43929) 
- 一部のケースでHashJoinのHashテーブルが4GBを超える際に結果が不正になる問題を解決しました。[#46461](https://github.com/apache/doris/pull/46461) 
- 中国語文字での`convert_to`関数のオーバーフロー問題を修正しました。[#46405](https://github.com/apache/doris/pull/46405) 
- `group by`とLimitを使用する極端なシナリオで結果が不正になる問題を解決しました。[#47844](https://github.com/apache/doris/pull/47844) 
- 特定のシステムテーブルにアクセスする際に結果が不正になる問題を修正しました。[#47498](https://github.com/apache/doris/pull/47498) 
- `percentile`関数がシステムクラッシュを引き起こす問題を解決しました。[#47068](https://github.com/apache/doris/pull/47068) 
- Limitのあるシングルテーブルクエリのパフォーマンス劣化問題を修正しました。[#46090](https://github.com/apache/doris/pull/46090) 
- `StDistanceSphere`および`StAngleSphere`関数がシステムクラッシュを引き起こす問題を解決しました。[#45508](https://github.com/apache/doris/pull/45508) 
- `map_agg`の結果が不正な問題を修正しました。[#40454](https://github.com/apache/doris/pull/40454) 

### 半構造化データ管理

#### BloomFilter Index

- BloomFilter Indexの大きなパラメータによる例外を修正しました。[#45780](https://github.com/apache/doris/pull/45780) 
- BloomFilter Index書き込み時の高メモリ使用量問題を解決しました。[#45833](https://github.com/apache/doris/pull/45833) 
- 列が削除された際にBloomFilter Indexが正しく削除されない問題を修正しました。[#44361](https://github.com/apache/doris/pull/44361), [#43378](https://github.com/apache/doris/pull/43378) 

#### Inverted Index

- インバーテッドインデックス構築時の時折発生するクラッシュを修正しました。[#43246](https://github.com/apache/doris/pull/43246) 
- インバーテッドインデックスマージ時にゼロ出現回数の単語が容量を占有する問題を解決しました。[#43113](https://github.com/apache/doris/pull/43113) 
- Index Size統計での異常な大きな値を防止しました。[#46549](https://github.com/apache/doris/pull/46549) 
- VARIANTタイプフィールドのインバーテッドインデックス問題を修正しました。[#43375](https://github.com/apache/doris/pull/43375) 
- インバーテッドインデックスのローカルキャッシュの局所性を最適化し、キャッシュヒット率を向上させました。[#46518](https://github.com/apache/doris/pull/46518) 
- インバーテッドインデックスのリモートストレージ読み取りのため、クエリプロファイルにメトリック`NumInvertedIndexRemoteIOTotal`を追加しました。[#45675](https://github.com/apache/doris/pull/45675), [#44863](https://github.com/apache/doris/pull/44863)

#### その他

- 特殊なNULLデータでの`ipv6_cidr_to_range`関数のクラッシュ問題を修正しました。[#44700](https://github.com/apache/doris/pull/44700) 

### 権限

- `CREATE_PRIV`を付与する際に、対応するリソースの存在がチェックされなくなりました。[#45125](https://github.com/apache/doris/pull/45125) 
- 極端なシナリオで権限を持つビューのクエリが参照テーブルの権限不足により失敗する問題を修正しました。[#44621](https://github.com/apache/doris/pull/44621) 
- `use db`の権限チェックで内部および外部カタログが区別されない問題を解決しました。[#45720](https://github.com/apache/doris/pull/45720)
