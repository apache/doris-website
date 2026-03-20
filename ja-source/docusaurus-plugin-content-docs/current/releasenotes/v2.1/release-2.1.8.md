---
{
  "title": "リリース 2.1.8",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.8 が2025年1月24日に正式リリースされました。"
}
---
コミュニティの皆様へ、**Apache Doris バージョン 2.1.8 が2025年1月24日に正式リリースされました。** このバージョンでは、レイクハウス、非同期マテリアライズドビュー、クエリオプティマイザーと実行エンジン、ストレージ管理など、いくつかの主要領域において継続的なアップグレードと機能強化が導入されています。

- [Quick Download](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.8-rc01)

## 動作変更

- BEプロセス内でulimit値検証チェックをスキップするための環境変数 `SKIP_CHECK_ULIMIT` を追加しました。これはDockerクイックスタートシナリオのアプリケーションでのみ利用可能です。[#45267](https://github.com/apache/doris/pull/45267)
- ホット・コールド分離でのクエリにおけるレプリカアフィニティの選択を制御するためのセッション変数 `enable_cooldown_replica_affinity` を追加しました。
- FEにおいて、dbタブレット数が極端に多い場合のバックアップとリストア操作中のFEのOOM問題を解決するため、設定項目 `restore_job_compressed_serialization` と `backup_job_compressed_serialization` を追加しました。デフォルトではこれらの設定は無効になっており、一度有効にするとダウングレードできません。

## 新機能

- Arrow flightプロトコルが負荷分散デバイス経由でのBEアクセスをサポートしました。[#43281](https://github.com/apache/doris/pull/43281)
- lambda式が外部カラムのキャプチャをサポートしました（#45186）。[#45186](https://github.com/apache/doris/pull/45186)

## 改善

### レイクハウス

- Hudiバージョンを0.15にアップデートしました。そして、Hudiテーブルのクエリプランニング性能を最適化しました。
- MaxComputeパーティションテーブルの読み込み性能を最適化しました。[#45148](https://github.com/apache/doris/pull/45148)
- CSV形式でのUTF8エンコーディング検出を無視できるセッション変数 `enable_text_validate_utf8` をサポートしました。[#45537](https://github.com/apache/doris/pull/45537)
- 高フィルタリング率条件下でのParquetファイルレイジー実体化の性能を最適化しました。[#46183](https://github.com/apache/doris/pull/46183)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューに存在しないパーティションの手動リフレッシュをサポートしました[#45290](https://github.com/apache/doris/pull/45290)。
- 透過的リライトプランニングの性能を最適化しました[#44786](https://github.com/apache/doris/pull/44786)。

### クエリオプティマイザー

- ランタイムフィルターの適応能力を改善しました[#42640](https://github.com/apache/doris/pull/42640)。
- `max/min`集約関数カラムのフィルター条件から元カラムのフィルター条件を生成する機能を追加しました[#39252](https://github.com/apache/doris/pull/39252)
- 結合述語から単側フィルター条件を抽出する機能を追加しました[#38479](https://github.com/apache/doris/pull/38479)。
- 集合演算子での述語導出能力を最適化し、より良いフィルター述語を生成できるようにしました[#39450](https://github.com/apache/doris/pull/39450)。
- 統計情報収集と使用の例外処理能力を最適化し、収集例外発生時に予期しない実行プランの生成を回避しました。[#43009](https://github.com/apache/doris/pull/43009) [#43776](https://github.com/apache/doris/pull/43776) [#43865](https://github.com/apache/doris/pull/43865) [#42104](https://github.com/apache/doris/pull/42104) [#42399](https://github.com/apache/doris/pull/42399) [#41729](https://github.com/apache/doris/pull/41729)

### クエリ実行エンジン

- `limit`を含むクエリの実行を最適化し、より早く終了し不要なデータスキャンを回避しました[#44255](https://github.com/apache/doris/pull/44255)。

### ストレージ管理

- CCRがより包括的な操作をサポートしました。`rename table`、`rename column`、`modify comment`、`drop view`、`drop rollup`等。
- broker loadインポート進行状況の精度と複数の圧縮ファイルインポート時の性能を向上させました。
- routine loadタイムアウト戦略とスレッドプール使用を改善し、routine loadタイムアウト失敗とクエリへの影響を防止しました。

### その他

- Dockerクイックスタートイメージが環境パラメータを設定せずに起動をサポートしました。環境変数 `SKIP_CHECK_ULIMIT` を追加し、`start_be.sh`スクリプトとBEプロセス内のswap、`max_map_count`、ulimit関連の検証チェックをスキップしました。これはDockerクイックスタートシナリオのアプリケーションにのみ適用されます。[#45269](https://github.com/apache/doris/pull/45269)
- カスタムグループフィルタリング用の新しいLDAP設定 `ldap_group_filter` を追加しました。[#43292](https://github.com/apache/doris/pull/43292)
- ranger使用時の性能を最適化しました。[#41207](https://github.com/apache/doris/pull/41207)
- 監査ログの `scan bytes` の不正確な統計を修正しました。[#45167](https://github.com/apache/doris/pull/45167)
- カラムのデフォルト値が `COLUMNS` システムテーブルで正しく表示されるようになりました。[#44849](https://github.com/apache/doris/pull/44849)
- ビューの定義が `VIEWS` システムテーブルで正しく表示されるようになりました。[#45857](https://github.com/apache/doris/pull/45857)
- `admin` ユーザーが削除できなくなりました。[#44751](https://github.com/apache/doris/pull/44751)

## バグ修正

### レイクハウス

#### Hive

- Sparkで作成されたHiveビューをクエリできない問題を修正しました。[#43553](https://github.com/apache/doris/pull/43553)
- 一部のHive Transactionテーブルを正しく読み取れない問題を修正しました。[#45753](https://github.com/apache/doris/pull/45753)
- Hiveテーブルパーティションに特殊文字が含まれている場合の不正なパーティション剪定問題を修正しました。[#42906](https://github.com/apache/doris/pull/42906)

#### Iceberg

- Kerberos認証環境でIcebergテーブルを作成できない問題を修正しました。[#43445](https://github.com/apache/doris/pull/43445)
- 一部の場合でIcebergテーブルにdangling deletesがある際の不正確な `count(*)` クエリ問題を修正しました。[#44039](https://github.com/apache/doris/pull/44039)
- 一部の場合でIcebergテーブルのカラム名不一致によるクエリエラー問題を修正しました。[#44470](https://github.com/apache/doris/pull/44470)
- 一部の場合でパーティションが変更されたIcebergテーブルを読み取れない問題を修正しました。[#45367](https://github.com/apache/doris/pull/45367)

#### Paimon

- Paimon カタログがAlibaba Cloud OSS-HDFSにアクセスできない問題を修正しました。[#42585](https://github.com/apache/doris/pull/42585)

#### Hudi

- 一部の場合でHudiテーブルのパーティション剪定が無効になる問題を修正しました。[#44669](https://github.com/apache/doris/pull/44669)

#### JDBC

- 一部の場合で大文字小文字を区別しないテーブル名機能有効後にJDBC カタログを使用してテーブルを取得できない問題を修正しました。

#### MaxCompute

- 一部の場合でMaxComputeテーブルのパーティション剪定が無効になる問題を修正しました[#44508](https://github.com/apache/doris/pull/44508)。

#### その他

- 一部の場合でEXPORTタスクによるFEメモリリーク問題を修正しました。[#44019](https://github.com/apache/doris/pull/44019)
- 一部の場合でhttpsプロトコルを使用してS3オブジェクトストレージにアクセスできない問題を修正しました[#44242](https://github.com/apache/doris/pull/44242)。
- 一部の場合でKerberos認証チケットが自動的にリフレッシュできない問題を修正しました[#44916](https://github.com/apache/doris/pull/44916)
- 一部の場合でHadoop Block圧縮形式ファイル読み取りエラー問題を修正しました。[#45289](https://github.com/apache/doris/pull/45289)
- ORC形式データクエリ時に、結果エラーの可能性を回避するためCHAR型述語をプッシュダウンしないようにしました。[#45484](https://github.com/apache/doris/pull/45484)

### 非同期マテリアライズドビュー

- マテリアライズドビュー定義にCTEがある場合のリフレッシュ不可問題を修正しました[#44857](https://github.com/apache/doris/pull/44857)。
- ベーステーブルにカラムが追加された際に、非同期マテリアライズドビューが透過的リライトにヒットしない問題を修正しました。[#44867](https://github.com/apache/doris/pull/44867)
- クエリの異なる位置に同じフィルター述語が含まれる場合の透過的リライト失敗問題を修正しました。[#44575](https://github.com/apache/doris/pull/44575)
- フィルター述語や結合述語でカラムエイリアスが使用される場合に透過的リライトが実行できない問題を修正しました。[#44779](https://github.com/apache/doris/pull/44779)

### 転置インデックス

- 転置インデックスコンパクションの異常処理問題を修正しました。[#45773](https://github.com/apache/doris/pull/45773)
- ロック待機タイムアウトによる転置インデックス構築失敗問題を修正しました。[#43589](https://github.com/apache/doris/pull/43589)
- 異常状況での転置インデックス書き込みクラッシュ問題を修正しました。[#46075](https://github.com/apache/doris/pull/46075)
- 特殊パラメータでの `match` 関数のヌルポインタ問題を修正しました。[#45774](https://github.com/apache/doris/pull/45774)
- variant転置インデックス関連問題を修正し、variantでのインデックスv1形式使用を無効化しました[#43971](https://github.com/apache/doris/pull/43971) [#45179](https://github.com/apache/doris/pull/45179/)
- ngram bloomfilterインデックスで `gram_size = 65535` 設定時のクラッシュ問題を修正しました[#43654](https://github.com/apache/doris/pull/43654)
- bloomfilterインデックスでのDATEとDATETIMEの不正な計算問題を修正しました[#43622](https://github.com/apache/doris/pull/43622)
- カラム削除時にbloomfilterインデックスが自動削除されない問題を修正しました[#44478](https://github.com/apache/doris/pull/44478)
- bloomfilterインデックス書き込み時のメモリ使用量を削減しました[#46047](https://github.com/apache/doris/pull/46047)

### 半構造化データ

- メモリ使用量を最適化し、`variant` データ型のメモリ消費を削減しました[#43349](https://github.com/apache/doris/pull/43349) [#44585](https://github.com/apache/doris/pull/44585) [#45734](https://github.com/apache/doris/pull/45734)
- `variant` スキーマコピーの性能を最適化しました。[#45731](https://github.com/apache/doris/pull/45731)
- タブレットキー自動推論時に `variant` をキーとして使用しないようにしました。[#44736](https://github.com/apache/doris/pull/44736)
- `variant` を `NOT NULL` から `NULL` に変更する問題を修正しました[#45734](https://github.com/apache/doris/pull/45734)
- lambda関数の不正な型推論問題を修正しました。[#45798](https://github.com/apache/doris/pull/45798)
- `ipv6_cidr_to_range` 関数の境界条件でのcoredump問題を修正しました[#46252](https://github.com/apache/doris/pull/46252)

### クエリオプティマイザー

- テーブル読み取りロックの相互排他による潜在的なデッドロック問題を修正し、ロック使用ロジックを最適化しました[#45045](https://github.com/apache/doris/pull/45045) [#43376](https://github.com/apache/doris/pull/43376) [#44164](https://github.com/apache/doris/pull/44164) [#44967](https://github.com/apache/doris/pull/44967) [#45995](https://github.com/apache/doris/pull/45995)。
- SQL Cache機能が定数畳み込みを不正に使用し、時刻形式を含む関数使用時に不正な結果を生じる問題を修正しました。[#44631](https://github.com/apache/doris/pull/44631)
- エッジケースでの比較式の不正な最適化により不正な結果が生じる可能性がある問題を修正しました。[#44054](https://github.com/apache/doris/pull/44054) [#44725](https://github.com/apache/doris/pull/44725) [#44922](https://github.com/apache/doris/pull/44922) [#45735](https://github.com/apache/doris/pull/45735) [#45868](https://github.com/apache/doris/pull/45868)
- 高並行ポイントクエリの不正な監査ログ問題を修正しました[ #43345 ](https://github.com/apache/doris/pull/43345)[#44588](https://github.com/apache/doris/pull/44588)
- 高並行ポイントクエリで例外発生後の継続的エラー報告問題を修正しました[#44582](https://github.com/apache/doris/pull/44582)
- 一部のフィールドの不正なプリペアドステートメント問題を修正しました。[#45732 ](https://github.com/apache/doris/pull/45732)

### クエリ実行エンジン

- 正規表現と `like` 関数の特殊文字に対する不正な結果問題を修正しました。[#44547](https://github.com/apache/doris/pull/44547)
- データベース切り替え時にSQL Cacheが不正な結果を持つ可能性がある問題を修正しました。[#44782](https://github.com/apache/doris/pull/44782)
- `cut_ipv6` 関数の不正な結果問題を修正しました。[#43921](https://github.com/apache/doris/pull/43921)
- 数値型からbool型へのキャスト問題を修正しました。[#46275](https://github.com/apache/doris/pull/46275)
- arrow flight関連の一連の問題を修正しました。[#45661](https://github.com/apache/doris/pull/45661) [#45023](https://github.com/apache/doris/pull/45023) [#43960](https://github.com/apache/doris/pull/43960) [#43929](https://github.com/apache/doris/pull/43929)
- hash joinのハッシュテーブルが4Gを超える一部の場合での不正な結果問題を修正しました。[#46461](https://github.com/apache/doris/pull/46461/files)
- `convert_to` 関数の中国語文字に対するオーバーフロー問題を修正しました。[#46505](https://github.com/apache/doris/pull/46405)

### ストレージ管理

- 高並行DDLがFE起動失敗を引き起こす可能性がある問題を修正しました。
- 自動増分カラムが重複値を持つ可能性がある問題を修正しました。
- 拡張中にroutine loadが新しく拡張されたBEを使用できない問題を修正しました。

### 権限管理

- Rangerを認証プラグインとして使用する際のRangerサービスへの頻繁なアクセス問題を修正しました[#45645](https://github.com/apache/doris/pull/45645)。

### その他

- BE側で `enable_jvm_monitor=true` 有効時の潜在的メモリリーク問題を修正しました[#44311](https://github.com/apache/doris/pull/44311)。
