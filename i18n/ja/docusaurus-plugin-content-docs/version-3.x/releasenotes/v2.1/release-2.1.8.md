---
{
  "title": "リリース 2.1.8",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.8 が 2025年1月24日に正式リリースされました。"
}
---
コミュニティの皆様、**Apache Dorisバージョン2.1.8が2025年1月24日に正式リリースされました。**このバージョンでは、Lakehouse、非同期マテリアライズドビュー、クエリオプティマイザーと実行エンジン、ストレージ管理など、複数の主要領域において継続的なアップグレードと機能強化を導入しています。

- [Quick Download](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.8-rc01)

## 動作変更

- External Catalogを通じて大文字小文字を区別しないテーブル名を持つデータソース（Hiveなど）をクエリする際、以前のバージョンでは任意の大文字小文字でテーブル名をクエリできましたが、バージョン2.1.8では、Doris独自のテーブル名大文字小文字区別ポリシーが厳密に適用されます。
- BEプロセス内のulimit値検証チェックをスキップするための環境変数`SKIP_CHECK_ULIMIT`を追加しました。これはDockerクイックスタートシナリオのアプリケーションでのみ利用可能です。[#45267](https://github.com/apache/doris/pull/45267)
- ホットコールド分離下でのクエリに対するレプリカアフィニティの選択を制御する`enable_cooldown_replica_affinity`セッション変数を追加しました。
- FEに、dbタブレット数が極めて多い場合のバックアップおよび復元操作中のFEのOOM問題を解決するための設定項目`restore_job_compressed_serialization`と`backup_job_compressed_serialization`を追加しました。デフォルトでは、これらの設定は無効になっており、一度有効にするとダウングレードできません。

## 新機能

- Arrow flightプロトコルが負荷分散デバイスを通じたBEへのアクセスをサポートしました。[#43281](https://github.com/apache/doris/pull/43281)
- ラムダ式が外部カラムのキャプチャをサポートしました（#45186）。[#45186](https://github.com/apache/doris/pull/45186)

## 改善

### Lakehouse

- Hudiバージョンを0.15に更新しました。そして、HudiテーブルのクエリプランニングパフォーマンスをOptimizeしました。
- MaxComputeパーティションテーブルの読み取りパフォーマンスをOptimizeしました。[#45148](https://github.com/apache/doris/pull/45148)
- CSV形式でのUTF8エンコード検出を無視できるセッション変数`enable_text_validate_utf8`をサポートしました。[#45537](https://github.com/apache/doris/pull/45537)
- 高フィルタリング率条件下でのParquetファイルlazy materializationのパフォーマンスをOptimizeしました。[#46183](https://github.com/apache/doris/pull/46183)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューに存在しないパーティションを手動でリフレッシュすることをサポートしました[#45290](https://github.com/apache/doris/pull/45290)。
- 透明リライトプランニングのパフォーマンスをOptimizeしました[#44786](https://github.com/apache/doris/pull/44786)。

### クエリオプティマイザー

- ランタイムフィルターの適応能力を向上させました[#42640](https://github.com/apache/doris/pull/42640)。
- `max/min`集約関数カラムのフィルター条件から元のカラムフィルター条件を生成する機能を追加しました[#39252](https://github.com/apache/doris/pull/39252)
- join述語から単一サイドフィルター条件を抽出する機能を追加しました[#38479](https://github.com/apache/doris/pull/38479)。
- set演算子における述語導出機能をOptimizeして、フィルター述語をより良く生成できるようにしました[#39450](https://github.com/apache/doris/pull/39450)。
- 統計情報収集と使用の例外処理機能をOptimizeして、収集例外が発生した際の予期しない実行プランの生成を避けるようにしました。[#43009](https://github.com/apache/doris/pull/43009) [#43776](https://github.com/apache/doris/pull/43776) [#43865](https://github.com/apache/doris/pull/43865) [#42104](https://github.com/apache/doris/pull/42104) [#42399](https://github.com/apache/doris/pull/42399) [#41729](https://github.com/apache/doris/pull/41729)

### クエリ実行エンジン

- `limit`を含むクエリの実行をOptimizeして、より高速に終了し、不要なデータスキャンを避けるようにしました[#44255](https://github.com/apache/doris/pull/44255)。

### ストレージ管理

- CCRがより包括的な操作（`rename table`、`rename column`、`modify comment`、`drop view`、`drop rollup`など）をサポートしました。
- broker loadインポートの進捗の精度と、複数の圧縮ファイルをインポートする際のパフォーマンスを向上させました。
- routine loadタイムアウト戦略とスレッドプールの使用を改善して、routine loadタイムアウト失敗やクエリへの影響を防ぐようにしました。

### その他

- Dockerクイックスタートイメージが環境パラメータを設定せずに起動することをサポートしました。`start_be.sh`スクリプトとswap、`max_map_count`、ulimit関連の検証チェック、およびBEプロセス内の検証をスキップするための環境変数`SKIP_CHECK_ULIMIT`を追加しました。これはDockerクイックスタートシナリオのアプリケーションにのみ適用されます。[#45269](https://github.com/apache/doris/pull/45269)
- カスタムグループフィルタリング用の新しいLDAP設定項目`ldap_group_filter`を追加しました。[#43292](https://github.com/apache/doris/pull/43292)
- rangerを使用する際のパフォーマンスをOptimizeしました。[#41207](https://github.com/apache/doris/pull/41207)
- 監査ログにおける`scan bytes`の不正確な統計を修正しました。[#45167](https://github.com/apache/doris/pull/45167)
- `COLUMNS`システムテーブルでカラムのデフォルト値が正しく表示されるようになりました。[#44849](https://github.com/apache/doris/pull/44849)
- `VIEWS`システムテーブルでビューの定義が正しく表示されるようになりました。[#45857](https://github.com/apache/doris/pull/45857)
- `admin`ユーザーが削除できないようになりました。[#44751](https://github.com/apache/doris/pull/44751)

## バグ修正

### Lakehouse

#### Hive

- Sparkで作成されたHiveビューをクエリできない問題を修正しました。[#43553](https://github.com/apache/doris/pull/43553)
- 一部のHive Transactionテーブルを正しく読み取れない問題を修正しました。[#45753](https://github.com/apache/doris/pull/45753)
- Hiveテーブルパーティションに特殊文字が含まれている場合のパーティションプルーニングが正しく動作しない問題を修正しました。[#42906](https://github.com/apache/doris/pull/42906)

#### Iceberg

- Kerberos認証環境でIcebergテーブルを作成できない問題を修正しました。[#43445](https://github.com/apache/doris/pull/43445)
- 場合によってはIcebergテーブルにdangling deletesがある場合の`count(*)`クエリが不正確になる問題を修正しました。[#44039](https://github.com/apache/doris/pull/44039)
- 場合によってはIcebergテーブルでのカラム名の不一致によるクエリエラーの問題を修正しました。[#44470](https://github.com/apache/doris/pull/44470)
- 場合によってはIcebergテーブルのパーティションが変更された際にIcebergテーブルを読み取れない問題を修正しました。[#45367](https://github.com/apache/doris/pull/45367)

#### Paimon

- Paimon CatalogがAlibaba Cloud OSS-HDFSにアクセスできない問題を修正しました。[#42585](https://github.com/apache/doris/pull/42585)

#### Hudi

- 場合によってはHudiテーブルでパーティションプルーニングが効かない問題を修正しました。[#44669](https://github.com/apache/doris/pull/44669)

#### JDBC

- 場合によっては大文字小文字を区別しないテーブル名機能を有効にした後、JDBC Catalogを使用してテーブルを取得できない問題を修正しました。

#### MaxCompute

- 場合によってはMaxComputeテーブルでパーティションプルーニングが効かない問題を修正しました[#44508](https://github.com/apache/doris/pull/44508)。

#### その他

- 場合によってはEXPORTタスクによるFEメモリリークの問題を修正しました。[#44019](https://github.com/apache/doris/pull/44019)
- 場合によってはhttpsプロトコルを使用してS3オブジェクトストレージにアクセスできない問題を修正しました[#44242](https://github.com/apache/doris/pull/44242)。
- 場合によってはKerberos認証チケットの自動更新ができない問題を修正しました[#44916](https://github.com/apache/doris/pull/44916)
- 場合によってはHadoop Block圧縮形式ファイルを読み取る際のエラーの問題を修正しました。[#45289](https://github.com/apache/doris/pull/45289)
- ORC形式データをクエリする際、結果エラーを避けるためにCHAR型述語をプッシュダウンしないようにしました。[#45484](https://github.com/apache/doris/pull/45484)

### 非同期マテリアライズドビュー

- マテリアライズドビュー定義にCTEがある場合にリフレッシュできない問題を修正しました[#44857](https://github.com/apache/doris/pull/44857)。
- ベーステーブルにカラムが追加された場合に非同期マテリアライズドビューが透明リライトにヒットしない問題を修正しました。[#44867](https://github.com/apache/doris/pull/44867)
- クエリ内の異なる位置に同じフィルター述語が含まれている場合に透明リライトが失敗する問題を修正しました。[#44575](https://github.com/apache/doris/pull/44575)
- フィルター述語やjoin述語でカラムエイリアスが使用されている場合に透明リライトが実行できない問題を修正しました。[#44779](https://github.com/apache/doris/pull/44779)

### 転置インデックス

- 転置インデックスコンパクションの異常処理の問題を修正しました。[#45773](https://github.com/apache/doris/pull/45773)
- ロック待機タイムアウトによる転置インデックス構築失敗の問題を修正しました。[#43589](https://github.com/apache/doris/pull/43589)
- 異常な状況での転置インデックス書き込みクラッシュの問題を修正しました。[#46075](https://github.com/apache/doris/pull/46075)
- 特殊パラメータでの`match`関数のnullポインタ問題を修正しました。[#45774](https://github.com/apache/doris/pull/45774)
- variant転置インデックスに関する問題を修正し、variantでのindex v1形式の使用を無効にしました[#43971](https://github.com/apache/doris/pull/43971) [#45179](https://github.com/apache/doris/pull/45179/) 
- ngram bloomfilterインデックスで`gram_size = 65535`を設定した際のクラッシュ問題を修正しました[#43654](https://github.com/apache/doris/pull/43654)
- bloomfilterインデックスでのDATEとDATETIMEの計算が正しくない問題を修正しました[#43622](https://github.com/apache/doris/pull/43622)
- カラムを削除してもbloomfilterインデックスが自動削除されない問題を修正しました[#44478](https://github.com/apache/doris/pull/44478)
- bloomfilterインデックス書き込み時のメモリフットプリントを削減しました[#46047](https://github.com/apache/doris/pull/46047)

### 半構造化データ 

- メモリ使用量をOptimizeし、`variant`データ型のメモリ消費を削減しました[#43349](https://github.com/apache/doris/pull/43349) [#44585](https://github.com/apache/doris/pull/44585) [#45734](https://github.com/apache/doris/pull/45734)
- `variant`スキーマコピーのパフォーマンスをOptimizeしました。[#45731](https://github.com/apache/doris/pull/45731)
- タブレットキーを自動推論する際に`variant`をキーとして使用しないようにしました。[#44736](https://github.com/apache/doris/pull/44736)
- `variant`を`NOT NULL`から`NULL`に変更する問題を修正しました[#45734](https://github.com/apache/doris/pull/45734)
- ラムダ関数の型推論が正しくない問題を修正しました。[#45798](https://github.com/apache/doris/pull/45798)
- `ipv6_cidr_to_range`関数の境界条件でのcoredump問題を修正しました[#46252](https://github.com/apache/doris/pull/46252)

### クエリオプティマイザー

- テーブル読み取りロックの相互排他によって引き起こされる潜在的なデッドロック問題を修正し、ロック使用ロジックをOptimizeしました[#45045](https://github.com/apache/doris/pull/45045) [#43376](https://github.com/apache/doris/pull/43376) [#44164](https://github.com/apache/doris/pull/44164) [#44967](https://github.com/apache/doris/pull/44967) [#45995](https://github.com/apache/doris/pull/45995)。
- SQL Cache機能が定数畳み込みを誤って使用し、時間形式を含む関数を使用する際に正しくない結果になる問題を修正しました。[#44631](https://github.com/apache/doris/pull/44631)
- エッジケースでの比較式の最適化が正しくなく、正しくない結果をもたらす可能性がある問題を修正しました。[#44054](https://github.com/apache/doris/pull/44054) [#44725](https://github.com/apache/doris/pull/44725) [#44922](https://github.com/apache/doris/pull/44922) [#45735](https://github.com/apache/doris/pull/45735) [#45868](https://github.com/apache/doris/pull/45868)
- 高並行ポイントクエリの監査ログが正しくない問題を修正しました[ #43345 ](https://github.com/apache/doris/pull/43345)[#44588](https://github.com/apache/doris/pull/44588)
- 高並行ポイントクエリで例外が発生した後の継続的なエラー報告の問題を修正しました[#44582](https://github.com/apache/doris/pull/44582)
- 一部のフィールドで準備済みステートメントが正しくない問題を修正しました。[#45732 ](https://github.com/apache/doris/pull/45732)

### クエリ実行エンジン

- 特殊文字に対する正規表現と`like`関数の結果が正しくない問題を修正しました。[#44547](https://github.com/apache/doris/pull/44547)
- データベース切り替え時にSQL Cacheが正しくない結果になる可能性がある問題を修正しました。[#44782](https://github.com/apache/doris/pull/44782)
- `cut_ipv6`関数の結果が正しくない問題を修正しました。[#43921](https://github.com/apache/doris/pull/43921)
- 数値型からbool型へのキャストの問題を修正しました。[#46275](https://github.com/apache/doris/pull/46275)
- arrow flightに関する一連の問題を修正しました。[#45661](https://github.com/apache/doris/pull/45661) [#45023](https://github.com/apache/doris/pull/45023) [#43960](https://github.com/apache/doris/pull/43960) [#43929](https://github.com/apache/doris/pull/43929) 
- hash joinのハッシュテーブルが4Gを超える場合に、場合によっては結果が正しくない問題を修正しました。[#46461](https://github.com/apache/doris/pull/46461/files)
- `convert_to`関数で中国語文字のオーバーフロー問題を修正しました。[#46505](https://github.com/apache/doris/pull/46405)

### ストレージ管理

- 高並行DDLがFE起動失敗を引き起こす可能性がある問題を修正しました。
- 自動増分カラムで重複値が発生する可能性がある問題を修正しました。
- 拡張中にroutine loadが新しく拡張されたBEを使用できない問題を修正しました。

### 権限管理

- Rangerを認証プラグインとして使用する際のRangerサービスへの頻繁なアクセスの問題を修正しました[#45645](https://github.com/apache/doris/pull/45645)。

### その他

- BE側で`enable_jvm_monitor=true`を有効にした際の潜在的なメモリリーク問題を修正しました[#44311](https://github.com/apache/doris/pull/44311)。
