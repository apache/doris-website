---
{
  "title": "リリース 2.1.8",
  "language": "ja",
  "description": "コミュニティの皆様、Apache Doris バージョン 2.1.8 が 2025年1月24日に正式にリリースされました。"
}
---
コミュニティの皆様、**Apache Doris バージョン 2.1.8 が 2025 年 1 月 24 日に正式リリースされました。** このバージョンでは、Lakehouse、非同期マテリアライズドビュー、クエリオプティマイザーと実行エンジン、ストレージ管理など、複数の主要領域において継続的なアップグレードと機能強化が導入されています。

- [クイックダウンロード](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.8-rc01)

## 動作変更

- External Catalog を通じて大文字小文字を区別しないテーブル名を持つデータソース（Hive など）をクエリする際、以前のバージョンでは任意の大文字小文字でテーブル名をクエリできましたが、バージョン 2.1.8 では Doris 独自のテーブル名大文字小文字区別ポリシーが厳密に適用されます。
- BE プロセス内の ulimit 値検証チェックをスキップするための環境変数 `SKIP_CHECK_ULIMIT` を追加しました。これは Docker クイックスタートシナリオのアプリケーションでのみ利用可能です。[#45267](https://github.com/apache/doris/pull/45267)
- ホットコールド分離下でのクエリに対するレプリカアフィニティの選択を制御するセッション変数 `enable_cooldown_replica_affinity` を追加しました。
- FE に設定 `restore_job_compressed_serialization` と `backup_job_compressed_serialization` を追加し、db タブレット数が極めて多い場合のバックアップおよびリストア操作中の FE の OOM 問題を解決しました。デフォルトではこれらの設定は無効で、一度有効にするとダウングレードできません。

## 新機能

- Arrow flight プロトコルがロードバランシングデバイス経由での BE へのアクセスをサポートしました。[#43281](https://github.com/apache/doris/pull/43281)
- lambda 式が外部カラムのキャプチャをサポートしました（#45186）。[#45186](https://github.com/apache/doris/pull/45186)

## 改善

### Lakehouse

- Hudi バージョンを 0.15 にアップデートしました。また、Hudi テーブルのクエリ計画パフォーマンスを最適化しました。
- MaxCompute パーティションテーブルの読み取りパフォーマンスを最適化しました。[#45148](https://github.com/apache/doris/pull/45148)
- CSV 形式での UTF8 エンコーディング検出を無視できるセッション変数 `enable_text_validate_utf8` をサポートしました。[#45537](https://github.com/apache/doris/pull/45537)
- 高フィルタリング率条件下での Parquet ファイル遅延マテリアライゼーションのパフォーマンスを最適化しました。[#46183](https://github.com/apache/doris/pull/46183)

### 非同期マテリアライズドビュー

- 非同期マテリアライズドビューに存在しないパーティションを手動でリフレッシュすることをサポートしました [#45290](https://github.com/apache/doris/pull/45290)。
- 透過的リライト計画のパフォーマンスを最適化しました [#44786](https://github.com/apache/doris/pull/44786)。

### クエリオプティマイザー

- ランタイムフィルタの適応能力を向上しました [#42640](https://github.com/apache/doris/pull/42640)。
- `max/min` 集約関数カラムのフィルタ条件から元のカラムフィルタ条件を生成する機能を追加しました [#39252](https://github.com/apache/doris/pull/39252)
- join 述語から単側フィルタ条件を抽出する機能を追加しました [#38479](https://github.com/apache/doris/pull/38479)。
- より良いフィルタ述語を生成するため、集合演算子での述語導出能力を最適化しました [#39450](https://github.com/apache/doris/pull/39450)。
- 統計情報収集と使用の例外処理能力を最適化し、収集例外が発生した際の予期しない実行計画の生成を回避しました。[#43009](https://github.com/apache/doris/pull/43009) [#43776](https://github.com/apache/doris/pull/43776) [#43865](https://github.com/apache/doris/pull/43865) [#42104](https://github.com/apache/doris/pull/42104) [#42399](https://github.com/apache/doris/pull/42399) [#41729](https://github.com/apache/doris/pull/41729)

### クエリ実行エンジン

- `limit` を含むクエリの実行を最適化し、より早く終了し不要なデータスキャンを回避するようにしました [#44255](https://github.com/apache/doris/pull/44255)。

### ストレージ管理

- CCR がより包括的な操作（`rename table`、`rename column`、`modify comment`、`drop view`、`drop rollup` など）をサポートしました。
- broker load インポート進捗の精度と複数の圧縮ファイルをインポートする際のパフォーマンスを向上しました。
- routine load のタイムアウト戦略とスレッドプール使用を改善し、routine load のタイムアウト失敗やクエリへの影響を防ぎます。

### その他

- Docker クイックスタートイメージが環境パラメータを設定せずに起動することをサポートしました。環境変数 `SKIP_CHECK_ULIMIT` を追加し、`start_be.sh` スクリプトと BE プロセス内の swap、`max_map_count`、ulimit 関連の検証チェックをスキップできます。これは Docker クイックスタートシナリオのアプリケーションにのみ適用されます。[#45269](https://github.com/apache/doris/pull/45269)
- カスタムグループフィルタリング用の新しい LDAP 設定 `ldap_group_filter` を追加しました。[#43292](https://github.com/apache/doris/pull/43292)
- ranger 使用時のパフォーマンスを最適化しました。[#41207](https://github.com/apache/doris/pull/41207)
- 監査ログの `scan bytes` の不正確な統計を修正しました。[#45167](https://github.com/apache/doris/pull/45167)
- カラムのデフォルト値が `COLUMNS` システムテーブルで正しく表示されるようになりました。[#44849](https://github.com/apache/doris/pull/44849)
- ビューの定義が `VIEWS` システムテーブルで正しく表示されるようになりました。[#45857](https://github.com/apache/doris/pull/45857)
- `admin` ユーザーを削除できないようになりました。[#44751](https://github.com/apache/doris/pull/44751)

## バグ修正

### Lakehouse

#### Hive

- Spark で作成された Hive ビューをクエリできない問題を修正しました。[#43553](https://github.com/apache/doris/pull/43553)
- 一部の Hive Transaction テーブルを正しく読み取れない問題を修正しました。[#45753](https://github.com/apache/doris/pull/45753)
- Hive テーブルパーティションに特殊文字が含まれている場合の不正なパーティションプルーニングの問題を修正しました。[#42906](https://github.com/apache/doris/pull/42906)

#### Iceberg

- Kerberos 認証環境で Iceberg テーブルを作成できない問題を修正しました。[#43445](https://github.com/apache/doris/pull/43445)
- Iceberg テーブルに dangling delete がある場合の `count(*)` クエリの不正確さを修正しました。[#44039](https://github.com/apache/doris/pull/44039)
- 一部のケースで Iceberg テーブルのカラム名不一致によるクエリエラーの問題を修正しました。[#44470](https://github.com/apache/doris/pull/44470)
- 一部のケースで Iceberg テーブルのパーティションが変更された際に読み取れない問題を修正しました。[#45367](https://github.com/apache/doris/pull/45367)

#### Paimon

- Paimon Catalog が Alibaba Cloud OSS-HDFS にアクセスできない問題を修正しました。[#42585](https://github.com/apache/doris/pull/42585)

#### Hudi

- 一部のケースで Hudi テーブルのパーティションプルーニングが効かない問題を修正しました。[#44669](https://github.com/apache/doris/pull/44669)

#### JDBC

- 一部のケースで大文字小文字を区別しないテーブル名機能を有効にした後、JDBC Catalog でテーブルを取得できない問題を修正しました。

#### MaxCompute

- 一部のケースで MaxCompute テーブルのパーティションプルーニングが効かない問題を修正しました[#44508](https://github.com/apache/doris/pull/44508)。

#### その他

- 一部のケースで EXPORT タスクが原因の FE メモリリークの問題を修正しました。[#44019](https://github.com/apache/doris/pull/44019)
- 一部のケースで https プロトコルを使用して S3 オブジェクトストレージにアクセスできない問題を修正しました [#44242](https://github.com/apache/doris/pull/44242)。
- 一部のケースで Kerberos 認証チケットが自動的にリフレッシュされない問題を修正しました [#44916](https://github.com/apache/doris/pull/44916)
- 一部のケースで Hadoop Block 圧縮フォーマットファイル読み取り時のエラーを修正しました。[#45289](https://github.com/apache/doris/pull/45289)
- ORC 形式データをクエリする際、結果エラーの可能性を避けるため CHAR 型述語をプッシュダウンしないようにしました。[#45484](https://github.com/apache/doris/pull/45484)

### 非同期マテリアライズドビュー

- マテリアライズドビュー定義に CTE がある場合にリフレッシュできない問題を修正しました [#44857](https://github.com/apache/doris/pull/44857)。
- ベーステーブルにカラムが追加された際、非同期マテリアライズドビューが透過的リライトにヒットしない問題を修正しました。[#44867](https://github.com/apache/doris/pull/44867)
- クエリ内の異なる位置に同じフィルタ述語が含まれている場合の透過的リライト失敗の問題を修正しました。[#44575](https://github.com/apache/doris/pull/44575)
- フィルタ述語や join 述語でカラムエイリアスが使用されている場合に透過的リライトができない問題を修正しました。[#44779](https://github.com/apache/doris/pull/44779)

### 転置インデックス

- 転置インデックス compaction の異常処理の問題を修正しました。[#45773](https://github.com/apache/doris/pull/45773)
- ロック待機タイムアウトによる転置インデックス構築失敗の問題を修正しました。[#43589](https://github.com/apache/doris/pull/43589)
- 異常状況での転置インデックス書き込みクラッシュの問題を修正しました。[#46075](https://github.com/apache/doris/pull/46075)
- 特殊パラメータでの `match` 関数のヌルポインタ問題を修正しました。[#45774](https://github.com/apache/doris/pull/45774)
- variant 転置インデックス関連の問題を修正し、variant でのインデックス v1 フォーマットの使用を無効にしました [#43971](https://github.com/apache/doris/pull/43971) [#45179](https://github.com/apache/doris/pull/45179/) 
- ngram bloomfilter インデックスで `gram_size = 65535` を設定した際のクラッシュの問題を修正しました [#43654](https://github.com/apache/doris/pull/43654)
- bloomfilter インデックスでの DATE と DATETIME の不正な計算の問題を修正しました [#43622](https://github.com/apache/doris/pull/43622)
- カラムドロップ時に bloomfilter インデックスが自動的にドロップされない問題を修正しました [#44478](https://github.com/apache/doris/pull/44478)
- bloomfilter インデックス書き込み時のメモリ使用量を削減しました [#46047](https://github.com/apache/doris/pull/46047)

### 半構造化データ

- メモリ使用量を最適化し、`variant` データ型のメモリ消費を削減しました [#43349](https://github.com/apache/doris/pull/43349) [#44585](https://github.com/apache/doris/pull/44585) [#45734](https://github.com/apache/doris/pull/45734)
- `variant` スキーマコピーのパフォーマンスを最適化しました。[#45731](https://github.com/apache/doris/pull/45731)
- タブレットキーを自動推論する際に `variant` をキーとして使用しないようにしました。[#44736](https://github.com/apache/doris/pull/44736)
- `variant` を `NOT NULL` から `NULL` に変更する問題を修正しました [#45734](https://github.com/apache/doris/pull/45734)
- lambda 関数の不正な型推論の問題を修正しました。[#45798](https://github.com/apache/doris/pull/45798)
- `ipv6_cidr_to_range` 関数の境界条件での coredump 問題を修正しました [#46252](https://github.com/apache/doris/pull/46252)

### クエリオプティマイザー

- テーブル読み取りロックの相互排他による潜在的デッドロック問題を修正し、ロック使用ロジックを最適化しました [#45045](https://github.com/apache/doris/pull/45045) [#43376](https://github.com/apache/doris/pull/43376) [#44164](https://github.com/apache/doris/pull/44164) [#44967](https://github.com/apache/doris/pull/44967) [#45995](https://github.com/apache/doris/pull/45995)。
- SQL Cache 機能が定数畳み込みを不正に使用し、時間フォーマットを含む関数使用時に不正な結果をもたらす問題を修正しました。[#44631](https://github.com/apache/doris/pull/44631)
- エッジケースでの比較式の不正最適化により不正な結果をもたらす可能性がある問題を修正しました。[#44054](https://github.com/apache/doris/pull/44054) [#44725](https://github.com/apache/doris/pull/44725) [#44922](https://github.com/apache/doris/pull/44922) [#45735](https://github.com/apache/doris/pull/45735) [#45868](https://github.com/apache/doris/pull/45868)
- 高並行性ポイントクエリの不正な監査ログの問題を修正しました [ #43345 ](https://github.com/apache/doris/pull/43345)[#44588](https://github.com/apache/doris/pull/44588)
- 高並行性ポイントクエリで例外発生後の継続的エラー報告の問題を修正しました [#44582](https://github.com/apache/doris/pull/44582)
- 一部のフィールドで prepared statement が不正になる問題を修正しました。[#45732 ](https://github.com/apache/doris/pull/45732)

### クエリ実行エンジン

- 特殊文字での正規表現と `like` 関数の不正な結果の問題を修正しました。[#44547](https://github.com/apache/doris/pull/44547)
- データベース切り替え時に SQL Cache が不正な結果をもたらす可能性がある問題を修正しました。[#44782](https://github.com/apache/doris/pull/44782)
- `cut_ipv6` 関数の不正な結果の問題を修正しました。[#43921](https://github.com/apache/doris/pull/43921)
- 数値型から bool 型へのキャストの問題を修正しました。[#46275](https://github.com/apache/doris/pull/46275)
- arrow flight 関連の一連の問題を修正しました。[#45661](https://github.com/apache/doris/pull/45661) [#45023](https://github.com/apache/doris/pull/45023) [#43960](https://github.com/apache/doris/pull/43960) [#43929](https://github.com/apache/doris/pull/43929) 
- hash join のハッシュテーブルが 4G を超えた場合の一部ケースでの不正な結果の問題を修正しました。[#46461](https://github.com/apache/doris/pull/46461/files)
- `convert_to` 関数での中国語文字のオーバーフロー問題を修正しました。[#46505](https://github.com/apache/doris/pull/46405)

### ストレージ管理

- 高並行性 DDL が FE 起動失敗を引き起こす可能性がある問題を修正しました。
- 自動増分カラムで重複値が発生する可能性がある問題を修正しました。
- 拡張中に routine load が新しく拡張された BE を使用できない問題を修正しました。

### 権限管理

- Ranger を認証プラグインとして使用する際の Ranger サービスへの頻繁なアクセスの問題を修正しました [#45645](https://github.com/apache/doris/pull/45645)。

### その他

- BE 側で `enable_jvm_monitor=true` を有効にした際の潜在的メモリリーク問題を修正しました [#44311](https://github.com/apache/doris/pull/44311)。
