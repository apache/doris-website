---
{
  "title": "リリース 2.1.8",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.8 が 2025年1月24日に正式リリースされました。"
}
---
コミュニティの皆様、**Apache Doris バージョン 2.1.8 が 2025年1月24日に正式にリリースされました。**このバージョンでは、Lakehouse、非同期マテリアライズドビュー、クエリオプティマイザと実行エンジン、ストレージ管理など、いくつかの主要領域において継続的なアップグレードと機能拡張を導入しています。

- [Quick Download](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.8-rc01)

## 動作変更

- BEプロセス内でのulimit値検証チェックをスキップするための環境変数`SKIP_CHECK_ULIMIT`を追加。これはDockerクイックスタートシナリオのアプリケーションでのみ利用可能です。[#45267](https://github.com/apache/doris/pull/45267)
- 冷温分離でのクエリにおけるレプリカアフィニティの選択を制御するセッション変数`enable_cooldown_replica_affinity`を追加。
- FEで、dbタブレット数が極めて大きい場合のバックアップと復元操作中のFEのOOM問題を解決するための設定`restore_job_compressed_serialization`と`backup_job_compressed_serialization`を追加。デフォルトでは、これらの設定は無効化されており、有効化すると、ダウングレードできません。

## 新機能

- Arrow flightプロトコルが、ロードバランシングデバイスを通じたBEへのアクセスをサポート。[#43281](https://github.com/apache/doris/pull/43281)
- lambda式が外部カラムのキャプチャをサポート（#45186）。[#45186](https://github.com/apache/doris/pull/45186)

## 改善

### Lakehouse

- Hudiバージョンを0.15に更新。Hudiテーブルのクエリプランニングパフォーマンスを最適化。
- MaxComputeパーティションテーブルの読み取りパフォーマンスを最適化。[#45148](https://github.com/apache/doris/pull/45148)
- CSV形式でのUTF8エンコーディング検出を無視できるセッション変数`enable_text_validate_utf8`をサポート。[#45537](https://github.com/apache/doris/pull/45537)
- 高フィルタリング率条件下でのParquetファイルレイジーマテリアライゼーションのパフォーマンスを最適化。[#46183](https://github.com/apache/doris/pull/46183)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューに存在しないパーティションの手動リフレッシュをサポート[#45290](https://github.com/apache/doris/pull/45290)。
- 透過的リライトプランニングのパフォーマンスを最適化[#44786](https://github.com/apache/doris/pull/44786)。

### クエリオプティマイザ

- ランタイムフィルタの適応能力を向上[#42640](https://github.com/apache/doris/pull/42640)。
- `max/min`集約関数カラムのフィルタ条件から元のカラムフィルタ条件を生成する機能を追加[#39252](https://github.com/apache/doris/pull/39252)
- 結合述語から単一サイドフィルタ条件を抽出する機能を追加[#38479](https://github.com/apache/doris/pull/38479)。
- 集合演算子での述語派生機能を最適化し、フィルタ述語をより適切に生成[#39450](https://github.com/apache/doris/pull/39450)。
- 統計情報収集と使用の例外処理能力を最適化し、収集例外発生時の予期しない実行プラン生成を回避。[#43009](https://github.com/apache/doris/pull/43009) [#43776](https://github.com/apache/doris/pull/43776) [#43865](https://github.com/apache/doris/pull/43865) [#42104](https://github.com/apache/doris/pull/42104) [#42399](https://github.com/apache/doris/pull/42399) [#41729](https://github.com/apache/doris/pull/41729)

### クエリ実行エンジン

- `limit`を含むクエリの実行を最適化し、より迅速に終了し、不要なデータスキャンを回避[#44255](https://github.com/apache/doris/pull/44255)。

### ストレージ管理

- CCRが`rename table`、`rename column`、`modify comment`、`drop view`、`drop rollup`などのより包括的な操作をサポート。
- broker loadインポートの進行状況の精度と、複数の圧縮ファイルをインポートする際のパフォーマンスを向上。
- routine loadのタイムアウト戦略とスレッドプール使用を改善し、routine loadタイムアウト障害とクエリへの影響を防止。

### その他

- Dockerクイックスタートイメージが、環境パラメータを設定せずに起動をサポート。BEプロセス内での`start_be.sh`スクリプトとswap、`max_map_count`、ulimit関連検証チェックをスキップする環境変数`SKIP_CHECK_ULIMIT`を追加。これはDockerクイックスタートシナリオのアプリケーションにのみ適用されます。[#45269](https://github.com/apache/doris/pull/45269)
- カスタムグループフィルタリング用の新しいLDAP設定`ldap_group_filter`を追加。[#43292](https://github.com/apache/doris/pull/43292)
- ranger使用時のパフォーマンスを最適化。[#41207](https://github.com/apache/doris/pull/41207)
- 監査ログの`scan bytes`の不正確な統計を修正。[#45167](https://github.com/apache/doris/pull/45167)
- `COLUMNS`システムテーブルでカラムのデフォルト値が正しく表示されるようになりました。[#44849](https://github.com/apache/doris/pull/44849)
- `VIEWS`システムテーブルでビューの定義が正しく表示されるようになりました。[#45857](https://github.com/apache/doris/pull/45857)
- `admin`ユーザーが削除できなくなりました。[#44751](https://github.com/apache/doris/pull/44751)

## バグ修正

### Lakehouse

#### Hive

- Sparkによって作成されたHiveビューをクエリできない問題を修正。[#43553](https://github.com/apache/doris/pull/43553)
- 一部のHive Transactionテーブルを正しく読み取れない問題を修正。[#45753](https://github.com/apache/doris/pull/45753)
- Hiveテーブルパーティションに特殊文字が含まれている場合のパーティションプルーニングが正しくない問題を修正。[#42906](https://github.com/apache/doris/pull/42906)

#### Iceberg

- Kerberos認証環境でIcebergテーブルを作成できない問題を修正。[#43445](https://github.com/apache/doris/pull/43445)
- 一部のケースでIcebergテーブルにdangling deletesがある場合の`count(*)`クエリが不正確な問題を修正。[#44039](https://github.com/apache/doris/pull/44039)
- 一部のケースでIcebergテーブルでのカラム名不一致によるクエリエラーの問題を修正。[#44470](https://github.com/apache/doris/pull/44470)
- 一部のケースでパーティションが変更されたIcebergテーブルを読み取れない問題を修正。[#45367](https://github.com/apache/doris/pull/45367)

#### Paimon

- Paimon CatalogがAlibaba Cloud OSS-HDFSにアクセスできない問題を修正。[#42585](https://github.com/apache/doris/pull/42585)

#### Hudi

- 一部のケースでHudiテーブルのパーティションプルーニングが効果的でない問題を修正。[#44669](https://github.com/apache/doris/pull/44669)

#### JDBC

- 一部のケースで大文字小文字を区別しないテーブル名機能を有効にした後、JDBC Catalogを使用してテーブルを取得できない問題を修正。

#### MaxCompute

- 一部のケースでMaxComputeテーブルのパーティションプルーニングが効果的でない問題を修正[#44508](https://github.com/apache/doris/pull/44508)。

#### その他

- 一部のケースでEXPORTタスクによるFEメモリリークの問題を修正。[#44019](https://github.com/apache/doris/pull/44019)
- 一部のケースでhttpsプロトコルを使用してS3オブジェクトストレージにアクセスできない問題を修正[#44242](https://github.com/apache/doris/pull/44242)。
- 一部のケースでKerberos認証チケットが自動リフレッシュされない問題を修正[#44916](https://github.com/apache/doris/pull/44916)
- 一部のケースでHadoop Block圧縮形式ファイル読み取り時のエラーの問題を修正。[#45289](https://github.com/apache/doris/pull/45289)
- ORC形式データのクエリ時に、結果エラーの可能性を回避するため、CHAR型述語のプッシュダウンを停止。[#45484](https://github.com/apache/doris/pull/45484)

### 非同期マテリアライズドビュー

- マテリアライズドビュー定義にCTEがある場合にリフレッシュできない問題を修正[#44857](https://github.com/apache/doris/pull/44857)。
- ベーステーブルにカラムが追加された場合に、非同期マテリアライズドビューが透過的リライトにヒットしない問題を修正。[#44867](https://github.com/apache/doris/pull/44867)
- クエリ内の異なる位置に同じフィルタ述語が含まれている場合に透過的リライトが失敗する問題を修正。[#44575](https://github.com/apache/doris/pull/44575)
- フィルタ述語や結合述語でカラムエイリアスが使用されている場合に透過的リライトが実行されない問題を修正。[#44779](https://github.com/apache/doris/pull/44779)

### 転置インデックス

- 転置インデックスcompactionの異常処理の問題を修正。[#45773](https://github.com/apache/doris/pull/45773)
- ロック待機タイムアウトによる転置インデックス構築失敗の問題を修正。[#43589](https://github.com/apache/doris/pull/43589)
- 異常状況での転置インデックス書き込みクラッシュの問題を修正。[#46075](https://github.com/apache/doris/pull/46075)
- 特殊パラメータでの`match`関数のnullポインタ問題を修正。[#45774](https://github.com/apache/doris/pull/45774)
- variant転置インデックス関連の問題を修正し、variantでのインデックスv1形式の使用を無効化[#43971](https://github.com/apache/doris/pull/43971) [#45179](https://github.com/apache/doris/pull/45179/)
- ngram bloomfilterインデックスで`gram_size = 65535`を設定した場合のクラッシュ問題を修正[#43654](https://github.com/apache/doris/pull/43654)
- bloomfilterインデックスでのDATEとDATETIMEの計算が正しくない問題を修正[#43622](https://github.com/apache/doris/pull/43622)
- カラム削除時にbloomfilterインデックスが自動削除されない問題を修正[#44478](https://github.com/apache/doris/pull/44478)
- bloomfilterインデックス書き込み時のメモリ使用量を削減[#46047](https://github.com/apache/doris/pull/46047)

### 半構造化データ

- メモリ使用量を最適化し、`variant`データ型のメモリ消費を削減[#43349](https://github.com/apache/doris/pull/43349) [#44585](https://github.com/apache/doris/pull/44585) [#45734](https://github.com/apache/doris/pull/45734)
- `variant`スキーマコピーのパフォーマンスを最適化。[#45731](https://github.com/apache/doris/pull/45731)
- タブレットキーを自動推論する際に`variant`をキーとして使用しない。[#44736](https://github.com/apache/doris/pull/44736)
- `variant`を`NOT NULL`から`NULL`に変更する問題を修正[#45734](https://github.com/apache/doris/pull/45734)
- lambda関数の型推論が正しくない問題を修正。[#45798](https://github.com/apache/doris/pull/45798)
- `ipv6_cidr_to_range`関数の境界条件でのcoredump問題を修正[#46252](https://github.com/apache/doris/pull/46252)

### クエリオプティマイザ

- テーブル読み取りロックの相互排他による潜在的なデッドロック問題を修正し、ロック使用ロジックを最適化[#45045](https://github.com/apache/doris/pull/45045) [#43376](https://github.com/apache/doris/pull/43376) [#44164](https://github.com/apache/doris/pull/44164) [#44967](https://github.com/apache/doris/pull/44967) [#45995](https://github.com/apache/doris/pull/45995)。
- SQL Cache機能が定数畳み込みを誤って使用し、時刻形式を含む関数使用時に不正な結果が生じる問題を修正。[#44631](https://github.com/apache/doris/pull/44631)
- エッジケースでの比較式の最適化が正しくない問題を修正（不正な結果につながる可能性）。[#44054](https://github.com/apache/doris/pull/44054) [#44725](https://github.com/apache/doris/pull/44725) [#44922](https://github.com/apache/doris/pull/44922) [#45735](https://github.com/apache/doris/pull/45735) [#45868](https://github.com/apache/doris/pull/45868)
- 高並行ポイントクエリでの監査ログが正しくない問題を修正[#43345](https://github.com/apache/doris/pull/43345)[#44588](https://github.com/apache/doris/pull/44588)
- 高並行ポイントクエリで例外発生後の継続的エラー報告の問題を修正[#44582](https://github.com/apache/doris/pull/44582)
- 一部のフィールドでのプリペアドステートメントが正しくない問題を修正。[#45732](https://github.com/apache/doris/pull/45732)

### クエリ実行エンジン

- 特殊文字での正規表現と`like`関数の結果が正しくない問題を修正。[#44547](https://github.com/apache/doris/pull/44547)
- データベース切り替え時にSQL Cacheが不正な結果を返す可能性がある問題を修正。[#44782](https://github.com/apache/doris/pull/44782)
- `cut_ipv6`関数の結果が正しくない問題を修正。[#43921](https://github.com/apache/doris/pull/43921)
- 数値型からbool型へのキャストの問題を修正。[#46275](https://github.com/apache/doris/pull/46275)
- arrow flightに関連する一連の問題を修正。[#45661](https://github.com/apache/doris/pull/45661) [#45023](https://github.com/apache/doris/pull/45023) [#43960](https://github.com/apache/doris/pull/43960) [#43929](https://github.com/apache/doris/pull/43929)
- hash joinのハッシュテーブルが4Gを超える場合の一部のケースでの結果が正しくない問題を修正。[#46461](https://github.com/apache/doris/pull/46461/files)
- 中国語文字での`convert_to`関数のオーバーフロー問題を修正。[#46505](https://github.com/apache/doris/pull/46405)

### ストレージ管理

- 高並行DDLによりFE起動失敗を引き起こす可能性がある問題を修正。
- 自動インクリメントカラムで重複値が発生する可能性がある問題を修正。
- 拡張時にroutine loadが新しく拡張されたBEを使用できない問題を修正。

### 権限管理

- Rangerを認証プラグインとして使用する際のRangerサービスへの頻繁アクセスの問題を修正[#45645](https://github.com/apache/doris/pull/45645)。

### その他

- BE側で`enable_jvm_monitor=true`が有効化されている場合の潜在的なメモリリーク問題を修正[#44311](https://github.com/apache/doris/pull/44311)。
